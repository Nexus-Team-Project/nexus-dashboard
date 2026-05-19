/**
 * MemberCatalogFilters - glassmorphism filter trigger + sheet/panel.
 *
 * - Mobile: tapping the trigger opens a full-height bottom sheet that
 *   contains every filter control. Page scroll is locked while open.
 * - Desktop (sm+): tapping the trigger opens a wide dropdown panel
 *   anchored under the button.
 *
 * The component is fully controlled by its parent (MemberCatalog). It
 * owns local "draft" state while the panel is open and only commits to
 * the parent when the user presses "Apply".
 *
 * As of 2026-05-19, filtering is fully server-side: this component is a
 * pure controller that emits the shared `CatalogFilters` shape upward.
 * The legacy `applyFilters` client-side helper has been removed because
 * the backend now honours every filter and sort field across the entire
 * adopted catalog, not just the current 25-item page.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { OFFER_CATEGORIES, type CatalogItem } from '../../lib/api';
import {
  type CatalogFilters,
  EMPTY_CATALOG_FILTERS,
} from './catalogFilters';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the number of non-search/non-category filters that are active. */
function countAdvancedActive(f: CatalogFilters): number {
  let n = 0;
  if (f.offerTypes.length) n += 1;
  if (f.validFromAfter) n += 1;
  if (f.validUntilBefore) n += 1;
  if (f.priceMin !== null || f.priceMax !== null) n += 1;
  if (f.tags.length) n += 1;
  if (f.inStockOnly) n += 1;
  if (f.sort !== 'newest') n += 1;
  return n;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  /** All offers on the current visible result set; used to derive tag chips. */
  items: CatalogItem[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const OFFER_TYPE_OPTIONS: { value: string; he: string; en: string }[] = [
  { value: 'voucher',   he: 'שובר',         en: 'Voucher' },
  { value: 'coupon',    he: 'קופון',        en: 'Coupon' },
  { value: 'gift_card', he: 'כרטיס מתנה',   en: 'Gift card' },
  { value: 'product',   he: 'מוצר',         en: 'Product' },
  { value: 'service',   he: 'שירות',        en: 'Service' },
];

/** Standard input class so every form control matches. */
const INPUT_CLS =
  'h-10 w-full rounded-xl border border-slate-200 bg-white/85 px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20';

/**
 * Tiny info tooltip rendered inline next to a section title. Click or
 * focus toggles a small popover with a short, plain-language explanation
 * of the filter. Mobile-friendly (click to open / Escape or outside-click
 * to close).
 */
function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  /** 'down' = popover below the icon; 'up' = above. Decided on open
   *  by measuring available space so the tooltip never overflows the
   *  bottom of the panel. */
  const [placement, setPlacement] = useState<'down' | 'up'>('down');
  const wrapRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    // Decide placement: if the icon is in the lower 25% of the viewport
    // OR has less than ~120px below it, flip the tooltip upward.
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setPlacement(spaceBelow < 120 ? 'up' : 'down');
    }
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <span ref={wrapRef} className="relative inline-flex items-center align-middle leading-none">
      {/* SVG info icon - centers cleanly at any DPR and avoids the
          ascender/descender drift the text "i" character had inside a
          tiny circle. */}
      <button
        type="button"
        aria-label={text}
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-700"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="block"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-[210] w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-normal leading-relaxed text-slate-700 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.25)] ${
            placement === 'up' ? 'bottom-5' : 'top-5'
          }`}
          style={{ insetInlineStart: '-4px' }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

/** Reusable selectable chip used for offer-type and tag multiselects. */
function Chip({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
        active
          ? 'border-[#C9A24B] bg-[#C9A24B]/15 text-[#8A5A00] shadow-[inset_0_0_0_1px_rgba(201,162,75,0.4)]'
          : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const MemberCatalogFilters = ({ value, onChange, items }: Props) => {
  const { t, language, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  /** Local draft - committed to the parent only when "Apply" is pressed. */
  const [draft, setDraft] = useState<CatalogFilters>(value);
  /** Sync the draft back to incoming value whenever we (re-)open the panel. */
  useEffect(() => { if (open) setDraft(value); }, [open, value]);

  /** Refs needed once the panel is portaled to document.body. */
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Desktop-only anchor coords. The panel is now portaled to document.body
   * so it cannot use `absolute` relative to the trigger. We measure the
   * trigger on open and on viewport resize, then place the panel just
   * below it on its end-edge. Mobile ignores these values entirely
   * (`fixed inset-x-0 top-0 bottom-0` wins via the Tailwind base classes).
   */
  const [desktopAnchor, setDesktopAnchor] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      // Skip desktop anchoring under sm; the mobile sheet uses fixed inset-x-0.
      if (window.innerWidth < 640) {
        setDesktopAnchor({});
        return;
      }
      const trig = triggerRef.current;
      if (!trig) return;
      const rect = trig.getBoundingClientRect();
      const margin = 12;
      const gap = 10;
      const panelWidth = 420;
      const vh = window.innerHeight;
      // Horizontal: in RTL anchor the panel's start (end-edge) to the
      // trigger's left edge; in LTR to the trigger's right edge. Clamp
      // to the viewport with an 8px margin on the far side.
      let left = isRTL
        ? Math.max(margin, rect.left)
        : Math.max(margin, rect.right - panelWidth);
      left = Math.min(left, window.innerWidth - panelWidth - margin);

      // Vertical: prefer below the trigger. If the trigger sits low and
      // there isn't enough room below, flip above so the panel never
      // overflows the viewport bottom. maxHeight always fits the chosen
      // side so internal scroll handles any extra content.
      const spaceBelow = vh - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;
      const preferBelow = spaceBelow >= 320 || spaceBelow >= spaceAbove;
      const top = preferBelow ? rect.bottom + gap : Math.max(margin, rect.top - gap - Math.min(spaceAbove, 640));
      const maxHeight = Math.max(
        240,
        Math.min(640, preferBelow ? spaceBelow : spaceAbove),
      );
      setDesktopAnchor({ top, left, maxHeight });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, isRTL]);

  // Lock body scroll while the sheet is open on mobile.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Click-outside-to-close. The panel is portaled to document.body so
  // we have to check both the trigger wrapper and the portaled panel
  // before deciding a click was "outside".
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current && wrapRef.current.contains(target)) return;
      if (panelRef.current && panelRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  /** Unique tags across the current item list, capped so the chip row stays sane. */
  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => (i.tags ?? []).forEach((tag) => tag && set.add(tag)));
    return Array.from(set).sort().slice(0, 24);
  }, [items]);

  const activeCount = countAdvancedActive(value);
  const draftCount = countAdvancedActive(draft);

  const toggleArray = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };
  const handleReset = () => setDraft(EMPTY_CATALOG_FILTERS);

  /** Plain-language tooltips per filter, per language. Kept inline so
   *  copy lives next to the component it documents and stays easy to edit. */
  const tip = (he: string, en: string) => (language === 'he' ? he : en);
  const tipSort   = tip('סדר את ההטבות לפי מחיר או לפי תאריך הוספה.',          'Reorder offers by price or newest first.');
  const tipCat    = tip('סנן הטבות לפי תחום, למשל אופנה, אוכל, או נסיעות.',     'Filter offers by domain - fashion, food, travel and so on.');
  const tipType   = tip('סנן לפי האופן שמקבלים את ההטבה: שובר, קופון, מוצר וכו׳.', 'Filter by how the benefit is delivered - voucher, coupon, product, etc.');
  const tipPrice  = tip('הצג רק הטבות בטווח מחיר שתבחר בשקלים.',                 'Show only offers within a shekel price range.');
  const tipStart  = tip('הצג הטבות שזמינות החל מתאריך מסוים - בחר טווח התחלה.',  'Show offers available from a chosen start date - pick a range.');
  const tipExp    = tip('הצג הטבות שפג תוקפן בטווח התאריכים שתבחר.',            'Show offers expiring within the date range you pick.');
  const tipTags   = tip('סנן לפי תגיות שהוצמדו להטבה על ידי הספק.',              'Filter by tags the supplier attached to the offer.');
  const tipStock  = tip('הסתר הטבות שאזל מהן המלאי או הסתיים השימוש בהן.',       'Hide offers that are out of stock.');

  /** Tiny label rendered above each date input so the user knows which
   *  field is the start and which is the end of the range. */
  const fromLabel = t('mc_filtersFrom');
  const toLabel = t('mc_filtersTo');

  return (
    <div className="relative" ref={wrapRef}>
      {/* Trigger - glassmorphism */}
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="group relative inline-flex h-12 items-center gap-2 rounded-full border border-white/60 bg-white/55 px-4 text-sm font-semibold text-slate-700 shadow-[0_6px_22px_-12px_rgba(15,23,42,0.2)] backdrop-blur-xl transition hover:border-white hover:bg-white/80 sm:h-14 sm:px-5"
        style={{ WebkitBackdropFilter: 'blur(16px)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
        <span>{t('mc_filtersButton')}</span>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C9A24B] px-1.5 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && createPortal((
        <>
          {/* Backdrop only on mobile - full-sheet behaviour */}
          <div
            aria-hidden
            className="fixed inset-0 z-[200] bg-slate-950/40 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/*
            Rendered through a portal to document.body so the dialog
            escapes any ancestor stacking context (DashboardLayout sets
            isolation: isolate via border-highlight-card, and the page
            uses overflow-x-clip on its wrapper - both can confine
            position:fixed on mobile and hide the close button under
            the top chrome).
          */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('mc_filtersTitle')}
            dir={isRTL ? 'rtl' : 'ltr'}
            ref={panelRef}
            className={
              // Mobile: full-screen sheet from bottom. Desktop: a fixed
              // panel positioned just under the trigger via JS-computed
              // coordinates (set via style on mount + on resize).
              'fixed inset-x-0 bottom-0 top-0 z-[210] flex flex-col bg-white/95 shadow-2xl backdrop-blur-2xl '
              + 'sm:inset-auto sm:bottom-auto sm:flex '
              + 'sm:h-auto sm:max-h-[min(78vh,640px)] '
              + 'sm:w-[420px] sm:max-w-[92vw] sm:rounded-3xl sm:border sm:border-white/70 sm:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.3)]'
            }
            style={{ WebkitBackdropFilter: 'blur(24px)', ...desktopAnchor }}
          >
            {/* Header. paddingTop honours mobile safe-area-inset so the X
                button never hides under the OS status bar. */}
            <div
              className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100/70 px-5 py-4"
              style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
            >
              <p className="text-base font-bold tracking-tight text-slate-900">
                {t('mc_filtersTitle')}
                {draftCount > 0 && (
                  <span className="ms-2 text-xs font-medium text-slate-400">
                    {t('mc_filtersActive').replace('{n}', String(draftCount))}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label={t('mc_filtersClose')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div dir="ltr" className="flex-1 overflow-y-auto custom-scrollbar">
              <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-5 px-5 py-4">

                {/* Sort */}
                <FilterSection title={t('mc_filtersSortBy')} tooltip={tipSort}>
                  <select
                    value={draft.sort}
                    onChange={(e) => setDraft({ ...draft, sort: e.target.value as CatalogFilters['sort'] })}
                    className={INPUT_CLS}
                  >
                    <option value="newest">{t('mc_filtersSortNewest')}</option>
                    <option value="price_asc">{t('mc_filtersSortPriceAsc')}</option>
                    <option value="price_desc">{t('mc_filtersSortPriceDesc')}</option>
                    <option value="expiry_soon">{t('mc_filtersSortExpirySoon')}</option>
                    <option value="expiry_far">{t('mc_filtersSortExpiryFar')}</option>
                  </select>
                </FilterSection>

                {/* Category */}
                <FilterSection title={t('mc_filtersCategory')} tooltip={tipCat}>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    className={INPUT_CLS}
                  >
                    <option value="">{t('mc_filtersAllCategories')}</option>
                    {OFFER_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {language === 'he' ? c.labelHe : c.label}
                      </option>
                    ))}
                  </select>
                </FilterSection>

                {/* Offer types (chips) */}
                <FilterSection title={t('mc_filtersOfferType')} tooltip={tipType}>
                  <div className="flex flex-wrap gap-2">
                    {OFFER_TYPE_OPTIONS.map((o) => (
                      <Chip
                        key={o.value}
                        active={draft.offerTypes.includes(o.value)}
                        onClick={() => setDraft({ ...draft, offerTypes: toggleArray(draft.offerTypes, o.value) })}
                      >
                        {language === 'he' ? o.he : o.en}
                      </Chip>
                    ))}
                  </div>
                </FilterSection>

                {/* Price min/max */}
                <FilterSection title={t('mc_filtersPrice')} tooltip={tipPrice}>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={draft.priceMin ?? ''}
                      onChange={(e) => setDraft({ ...draft, priceMin: e.target.value === '' ? null : Number(e.target.value) })}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder={t('mc_filtersMin')}
                      aria-label={t('mc_filtersMin')}
                      className={INPUT_CLS}
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={draft.priceMax ?? ''}
                      onChange={(e) => setDraft({ ...draft, priceMax: e.target.value === '' ? null : Number(e.target.value) })}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder={t('mc_filtersMax')}
                      aria-label={t('mc_filtersMax')}
                      className={INPUT_CLS}
                    />
                  </div>
                </FilterSection>

                {/* Start date - server contract only supports a single
                    "valid from after" boundary, so this is one date input. */}
                <FilterSection title={t('mc_filtersStartDate')} tooltip={tipStart}>
                  <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    <span>{fromLabel}</span>
                    <input
                      type="date"
                      value={draft.validFromAfter}
                      onChange={(e) => setDraft({ ...draft, validFromAfter: e.target.value })}
                      aria-label={`${t('mc_filtersStartDate')} - ${fromLabel}`}
                      className={INPUT_CLS}
                    />
                  </label>
                </FilterSection>

                {/* Expiry - server contract only supports a single
                    "valid until before" boundary. */}
                <FilterSection title={t('mc_filtersExpiry')} tooltip={tipExp}>
                  <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    <span>{toLabel}</span>
                    <input
                      type="date"
                      value={draft.validUntilBefore}
                      onChange={(e) => setDraft({ ...draft, validUntilBefore: e.target.value })}
                      aria-label={`${t('mc_filtersExpiry')} - ${toLabel}`}
                      className={INPUT_CLS}
                    />
                  </label>
                </FilterSection>

                {/* Tags */}
                {allTags.length > 0 && (
                  <FilterSection title={t('mc_filtersTags')} tooltip={tipTags}>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <Chip
                          key={tag}
                          active={draft.tags.includes(tag)}
                          onClick={() => setDraft({ ...draft, tags: toggleArray(draft.tags, tag) })}
                        >
                          #{tag}
                        </Chip>
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* In stock only */}
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    {t('mc_filtersInStockOnly')}
                    <InfoTooltip text={tipStock} />
                  </span>
                  <span dir="ltr" className="relative inline-flex h-6 w-11 shrink-0 items-center">
                    <input
                      type="checkbox"
                      checked={draft.inStockOnly}
                      onChange={(e) => setDraft({ ...draft, inStockOnly: e.target.checked })}
                      className="peer sr-only"
                    />
                    <span className="block h-full w-full rounded-full bg-slate-300 transition peer-checked:bg-[#C9A24B]" />
                    <span className="absolute start-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                  </span>
                </label>

              </div>
            </div>

            {/* Sticky footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100/70 bg-white/80 px-5 py-3 backdrop-blur-xl">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900"
              >
                {t('mc_filtersReset')}
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="rounded-xl bg-[#C9A24B] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(201,162,75,0.6)] transition hover:bg-[#B58E3A]"
              >
                {t('mc_filtersApply')}
              </button>
            </div>
          </div>
        </>
      ), document.body)}
    </div>
  );
};

/** Section heading + body wrapper used inside the panel.
 *  When `tooltip` is provided, a tiny "i" button is rendered next to the
 *  title and opens a short explanation on click. */
function FilterSection({
  title, tooltip, children,
}: {
  title: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        <span>{title}</span>
        {tooltip && <InfoTooltip text={tooltip} />}
      </p>
      {children}
    </div>
  );
}

export default MemberCatalogFilters;
