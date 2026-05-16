/**
 * EditOfferDrawer - right-side slide-in drawer for editing all offer fields.
 * Opens from an "Edit" button on offer cards/table rows in BenefitsPartnerships.
 * Submits via updateOfferApi; supports image replacement through ImageCropModal.
 *
 * Props:
 *   offer    - the CatalogItem being edited (pre-fills all fields).
 *   onClose  - called when the drawer should be dismissed.
 *   onSaved  - async callback called after a successful save so the parent can
 *              reload the catalog list.
 *
 * Sub-components (ImageSection, TagsInput) live in EditOfferDrawerHelpers.tsx
 * to keep this file within the 350-line limit.
 */
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { updateOfferApi, type CatalogItem } from '../lib/api';
import ImageCropModal from './ImageCropModal';
import { ImageSection, TagsInput } from './EditOfferDrawerHelpers';
import RichTextEditor from './RichTextEditor';

// ─── Category options ────────────────────────────────────────────────────────

/**
 * All supported offer category values with their Hebrew display labels.
 * Defined locally to avoid TypeScript `as const` inference issues from api.ts.
 */
const CATEGORY_OPTIONS = [
  { value: 'food_beverage',   label: 'אוכל ומשקאות' },
  { value: 'fashion',         label: 'אופנה' },
  { value: 'health_wellness', label: 'בריאות ורווחה' },
  { value: 'entertainment',   label: 'בידור' },
  { value: 'travel',          label: 'טיסות ונופש' },
  { value: 'technology',      label: 'טכנולוגיה' },
  { value: 'education',       label: 'חינוך' },
  { value: 'financial',       label: 'פיננסי' },
  { value: 'home_living',     label: 'בית ומגורים' },
  { value: 'other',           label: 'אחר' },
];

// ─── Execution type options ──────────────────────────────────────────────────

const EXECUTION_OPTIONS = [
  { value: 'voucher',   label: 'שובר' },
  { value: 'coupon',    label: 'קוד קופון' },
  { value: 'gift_card', label: 'כרטיס מתנה' },
  { value: 'product',   label: 'מוצר' },
  { value: 'service',   label: 'שירות' },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface EditOfferDrawerProps {
  /** The catalog offer being edited - all form fields are pre-filled from it. */
  offer: CatalogItem;
  /** Called when the drawer should close (cancel or after save). */
  onClose: () => void;
  /**
   * Async callback invoked after a successful PATCH so the parent page
   * reloads its catalog list. Must return a Promise.
   */
  onSaved: () => Promise<void>;
}

// visibility is intentionally excluded from the edit drawer.
// Changing an offer's visibility (ecosystem vs tenant_only) after creation
// requires a deliberate decision and is handled separately.

// ─── Main drawer component ───────────────────────────────────────────────────

/**
 * Full-screen-overlay drawer that slides in from the left (RTL layout).
 * All fields are pre-filled from the offer prop.
 * raw_cost is intentionally shown empty - leaving it blank keeps the existing
 * server value; entering a new number replaces it.
 *
 * Input: EditOfferDrawerProps (offer, onClose, onSaved).
 * Output: renders a fixed backdrop + drawer panel + optional crop modal.
 */
export default function EditOfferDrawer({ offer, onClose, onSaved }: EditOfferDrawerProps) {
  // ─── Field state ───────────────────────────────────────────────────────────
  const [title, setTitle]                             = useState(offer.title);
  const [description, setDescription]                 = useState(offer.description);
  const [category, setCategory]                       = useState(offer.category);
  const [rawCost, setRawCost]                         = useState('');            // empty = keep existing
  const [marketPrice, setMarketPrice]                 = useState(
    offer.market_price !== undefined ? String(offer.market_price) : '',
  );
  const [stockLimit, setStockLimit]                   = useState(
    offer.stockLimit !== null && offer.stockLimit !== undefined ? String(offer.stockLimit) : '',
  );
  const [executionType, setExecutionType]             = useState(offer.executionType ?? '');
  const [implementationLink, setImplementationLink]   = useState(offer.implementationLink ?? '');
  const [implementationInstructions, setInstructions] = useState(offer.implementationInstructions ?? '');
  const [terms, setTerms]                             = useState(offer.terms ?? '');
  const [tags, setTags]                               = useState<string[]>(offer.tags ?? []);
  const [validUntil, setValidUntil]                   = useState(offer.validUntil ? offer.validUntil.slice(0, 10) : '');

  // ─── Image state ───────────────────────────────────────────────────────────

  /** Object URL for the image currently displayed in the preview. */
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(offer.imageUrl);
  /** Object URL passed to ImageCropModal; null when the modal is closed. */
  const [cropSrc, setCropSrc]       = useState<string | null>(null);
  /** The cropped File ready for upload; null until the user confirms a crop. */
  const [imageFile, setImageFile]   = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // ─── Escape key handler ─────────────────────────────────────────────────────

  /**
   * Closes the drawer when the Escape key is pressed.
   * Registered on mount and removed on unmount to avoid leaking the listener.
   */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    // Lock body scroll while modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // ─── Image selection handler ────────────────────────────────────────────────

  /**
   * Called when the user picks a file via ImageSection.
   * Creates an object URL and opens the crop modal.
   * Input: file - the raw File from the input element.
   */
  const handleImageSelect = useCallback((file: File) => {
    // Revoke previous blob URL to avoid memory leaks.
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setCropSrc(URL.createObjectURL(file));
  }, [previewUrl]);

  /**
   * Called when the user confirms the crop selection.
   * Converts the Blob to a named File, updates the preview, and closes the modal.
   * Input: blob - cropped image blob from ImageCropModal.
   */
  const handleCropConfirm = useCallback((blob: Blob) => {
    const file = new File([blob], 'offer-image.jpg', { type: 'image/jpeg' });
    setImageFile(file);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setCropSrc(null);
  }, []);

  const handleCropCancel = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }, [cropSrc]);

  // ─── Form submission ────────────────────────────────────────────────────────

  /**
   * Builds the PATCH payload and calls updateOfferApi.
   * Only sends raw_cost when the user typed a value (blank preserves existing).
   * Calls onSaved then onClose on success; shows error toast on failure.
   */
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('כותרת ההצעה היא שדה חובה.');
      return;
    }
    setIsSaving(true);
    try {
      await updateOfferApi(offer.offerId, {
        title: title.trim(),
        description: description.trim(),
        category,
        ...(rawCost !== '' && { raw_cost: Number(rawCost) }),
        ...(marketPrice !== '' && { market_price: Number(marketPrice) }),
        stockLimit: stockLimit !== '' ? Number(stockLimit) : null,
        validUntil: validUntil || null,
        executionType: executionType || undefined,
        implementationLink: implementationLink.trim() || null,
        implementationInstructions: implementationInstructions.trim(),
        terms: terms.trim(),
        tags,
        ...(imageFile && { imageFile }),
      });
      await onSaved();
      onClose();
    } catch (err) {
      console.error('[EditOfferDrawer] save failed:', err);
      toast.error('שמירה נכשלה. נסה שוב.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Shared input class ─────────────────────────────────────────────────────

  const inputCls =
    'w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition';

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered modal */}
      <div
        className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-16 pb-4"
      >
      <div
        className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="עריכת הצעה"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">עריכת הצעה</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">{offer.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>

        {/* Scrollable form body — dir="ltr" keeps scrollbar on the right in RTL layout */}
        <div className="flex-1 overflow-y-auto" dir="ltr"><div dir="rtl">

          {/* ── Image ──────────────────────────────────────────── */}
          <div className="px-6 pt-5 pb-4">
            <ImageSection previewUrl={previewUrl} onSelect={handleImageSelect} />
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6" />

          {/* ── Basic info ─────────────────────────────────────── */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">פרטי ההצעה</p>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                כותרת <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
                placeholder="כותרת ההצעה"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">תיאור</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="תיאור קצר של ההצעה"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">קטגוריה</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">אופן מימוש</label>
                <select value={executionType} onChange={(e) => setExecutionType(e.target.value)} className={inputCls}>
                  <option value="">בחר...</option>
                  {EXECUTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6" />

          {/* ── Pricing & stock ───────────────────────────────── */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">תמחור ומלאי</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  עלות חדשה
                  <span className="text-slate-400 font-normal text-xs mr-1">(ריק = ללא שינוי)</span>
                </label>
                <input type="number" min="0" step="0.01" value={rawCost} onChange={(e) => setRawCost(e.target.value)} className={inputCls} placeholder="₪" dir="ltr" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">מחיר שוק</label>
                <input type="number" min="0" step="0.01" value={marketPrice} onChange={(e) => setMarketPrice(e.target.value)} className={inputCls} placeholder="₪" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  מלאי
                  <span className="text-slate-400 font-normal text-xs mr-1">(ריק = ללא הגבלה)</span>
                </label>
                <input type="number" min="0" step="1" value={stockLimit} onChange={(e) => setStockLimit(e.target.value)} onWheel={(e) => e.currentTarget.blur()} className={inputCls} placeholder="∞" dir="ltr" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  תוקף
                  <span className="text-slate-400 font-normal text-xs mr-1">(ריק = ללא)</span>
                </label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} dir="ltr" />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6" />

          {/* ── Redemption ───────────────────────────────────── */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">מימוש</p>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">קישור מימוש</label>
              <input
                type="url"
                dir="ltr"
                value={implementationLink}
                onChange={(e) => setImplementationLink(e.target.value)}
                className={cn(inputCls, 'text-left placeholder:text-right')}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">הוראות מימוש</label>
              <textarea
                value={implementationInstructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className={cn(inputCls, 'resize-none')}
                placeholder="שלבים לקבלת ההטבה"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">תנאים</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                className={cn(inputCls, 'resize-none')}
                placeholder="תנאים והגבלות"
              />
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6" />

          {/* ── Tags ─────────────────────────────────────────── */}
          <div className="px-6 py-4 pb-8">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">תגיות</p>
            <TagsInput tags={tags} onChange={setTags} />
          </div>
        </div></div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex-1 bg-primary shadow-sm hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </div>

      </div>

      {/* Crop modal - rendered on top of the drawer when a new image is picked */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCrop={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
