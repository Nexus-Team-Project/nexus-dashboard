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
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { updateOfferApi, type CatalogItem } from '../lib/api';
import ImageCropModal from './ImageCropModal';
import { ImageSection, TagsInput } from './EditOfferDrawerHelpers';

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

  // ─── Image state ───────────────────────────────────────────────────────────

  /** Object URL for the image currently displayed in the preview. */
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(offer.imageUrl);
  /** Object URL passed to ImageCropModal; null when the modal is closed. */
  const [cropSrc, setCropSrc]       = useState<string | null>(null);
  /** The cropped File ready for upload; null until the user confirms a crop. */
  const [imageFile, setImageFile]   = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);

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
      {/* Backdrop - clicking it closes the drawer */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel - RTL, slides in from the left */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-full max-w-lg flex flex-col bg-white dark:bg-slate-900 shadow-2xl"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="עריכת הצעה"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">עריכת הצעה</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-icons text-slate-500 dark:text-slate-400">close</span>
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Image upload / replace */}
          <ImageSection previewUrl={previewUrl} onSelect={handleImageSelect} />

          {/* Title */}
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

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">תיאור</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={cn(inputCls, 'resize-none')}
              placeholder="תיאור קצר של ההצעה"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">קטגוריה</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Execution type */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">אופן מימוש</label>
            <select
              value={executionType}
              onChange={(e) => setExecutionType(e.target.value)}
              className={inputCls}
            >
              <option value="">בחר אופן מימוש</option>
              {EXECUTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Pricing row */}
          <div className="grid grid-cols-2 gap-4">
            {/* raw_cost intentionally blank to avoid unintended server overwrites */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">עלות חדשה</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rawCost}
                onChange={(e) => setRawCost(e.target.value)}
                className={inputCls}
                placeholder="ריק = ללא שינוי"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">מחיר שוק</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={marketPrice}
                onChange={(e) => setMarketPrice(e.target.value)}
                className={inputCls}
                placeholder="מחיר מקורי"
              />
            </div>
          </div>

          {/* Stock limit */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              מלאי מקסימלי
              <span className="text-slate-400 font-normal mr-1">(ריק = ללא הגבלה)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={stockLimit}
              onChange={(e) => setStockLimit(e.target.value)}
              className={inputCls}
              placeholder="כמות יחידות"
            />
          </div>

          {/* Implementation link */}
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

          {/* Implementation instructions */}
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

          {/* Terms */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">תנאים</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={3}
              className={cn(inputCls, 'resize-none')}
              placeholder="תנאים והגבלות"
            />
          </div>

          {/* Tags chip input */}
          <TagsInput tags={tags} onChange={setTags} />
        </div>

        {/* Footer - cancel + save */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex-1 bg-primary shadow-sm hover:opacity-90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && (
              <span className="material-icons text-base animate-spin">refresh</span>
            )}
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </button>
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
