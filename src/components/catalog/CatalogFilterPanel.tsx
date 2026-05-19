/**
 * CatalogFilterPanel - inline side aside for filtering the Benefits & Partnerships catalog.
 *
 * Mirrors the Transactions / Users filter panel pattern exactly:
 * - Plain `<aside>` rendered as a sibling of the table content inside a
 *   `flex flex-col lg:flex-row gap-8` container.
 * - NO portal, NO backdrop, NO body-scroll lock, NO Escape handler.
 * - The page reflows: cards/table shrink, the aside docks to the inline-end side.
 * - On mobile (< lg) the aside stacks above the table at full width.
 *
 * Filter shape is owned by the parent page. This component is a pure controlled view
 * that composes small per-field widgets from `./filters/`. Adding a new field means
 * adding one widget file there, NOT growing this file.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import type { CatalogItem } from '../../lib/api';
import {
  countActiveCatalogFilters,
  type CatalogFilters,
} from './catalogFilters';
import { ChipButton } from './filters/ChipButton';
import { AdminOfferTypeFilter } from './filters/AdminOfferTypeFilter';
import { AdminPriceRangeFilter } from './filters/AdminPriceRangeFilter';
import { AdminDateBoundaryFilter } from './filters/AdminDateBoundaryFilter';
import { AdminTagFilter } from './filters/AdminTagFilter';
import { AdminInStockToggleFilter } from './filters/AdminInStockToggleFilter';
import { AdminSortFilter } from './filters/AdminSortFilter';

// ─── Public contract ──────────────────────────────────────────────────────────
//
// CatalogFilters + EMPTY_CATALOG_FILTERS + countActiveCatalogFilters live in
// the sibling `catalogFilters.ts` module so this file stays component-only
// (Vite Fast Refresh requires that).

interface CategoryOption {
  value: string;
  label: string;
}

interface CatalogFilterPanelProps {
  /** Whether the panel is visible. */
  isOpen: boolean;
  /** Called when the user closes the panel via X, Escape, or backdrop click. */
  onClose: () => void;
  /** Current filter values - controlled from the parent page. */
  filters: CatalogFilters;
  /** Called whenever any field changes. */
  onChange: (next: CatalogFilters) => void;
  /** Resets all filter fields to EMPTY_CATALOG_FILTERS. */
  onClear: () => void;
  /** Category options sourced from the page (label is already localized). */
  categoryOptions: CategoryOption[];
  /** Number of catalog items matched by the current filters - shown in the footer. */
  resultsCount: number;
  /** Visible catalog items on the current page - used by AdminTagFilter to derive its chip set. */
  items: CatalogItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Filter panel for the catalog page.
 *
 * Renders nothing when isOpen is false.
 */
const CatalogFilterPanel = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onClear,
  categoryOptions,
  resultsCount,
  items,
}: CatalogFilterPanelProps) => {
  const { t } = useLanguage();

  // Inline aside - no portal, no scroll lock, no Escape listener. The page's
  // flex container takes care of layout when this returns null.
  if (!isOpen) return null;

  // ─── Per-field handlers (kept tiny so render block stays readable) ──────────

  const setSearch = (v: string) => onChange({ ...filters, search: v });
  const setCategory = (v: string) => onChange({ ...filters, category: v });
  const setApproval = (v: CatalogFilters['approvalStatus']) =>
    onChange({ ...filters, approvalStatus: v });
  const setAdoption = (v: CatalogFilters['adoptionStatus']) =>
    onChange({ ...filters, adoptionStatus: v });

  // Approval-status chip options. Empty value means "All".
  const approvalOptions: Array<{ value: CatalogFilters['approvalStatus']; label: string }> = [
    { value: '', label: t('bp_filterAll') },
    { value: 'active', label: t('bp_filterApprovalActive') },
    { value: 'pending_approval', label: t('bp_filterApprovalPending') },
    { value: 'denied', label: t('bp_filterApprovalDenied') },
    { value: 'expired', label: t('bp_filterApprovalExpired') },
  ];

  // Adoption-status chip options. Empty value means "All".
  const adoptionOptions: Array<{ value: CatalogFilters['adoptionStatus']; label: string }> = [
    { value: '', label: t('bp_filterAll') },
    { value: 'adopted', label: t('bp_filterAdoptionAdopted') },
    { value: 'not_adopted', label: t('bp_filterAdoptionNotAdopted') },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <aside
      aria-label={t('bp_filterPanelTitle')}
      className="w-full lg:w-[380px] animate-in slide-in-from-right"
    >
      <div className="flex max-h-[calc(100vh-8rem)] flex-col bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 sticky top-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('bp_filterPanelTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('bp_filterClose')}
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Search */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('bp_filterSearchLabel')}
            </legend>
            <div className="relative">
              <span className="material-icons absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 !text-[18px]" aria-hidden="true">
                search
              </span>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('bp_filterSearchPlaceholder')}
                className="w-full rounded-md border border-slate-200 bg-white ps-10 pe-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </fieldset>

          {/* Sort */}
          <AdminSortFilter
            value={filters.sort}
            onChange={(sort) => onChange({ ...filters, sort })}
          />

          {/* Category */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('bp_filterCategoryLabel')}
            </legend>
            <div className="flex flex-wrap gap-2">
              <ChipButton
                isActive={filters.category === ''}
                onClick={() => setCategory('')}
                label={t('bp_filterAll')}
              />
              {categoryOptions.map((opt) => (
                <ChipButton
                  key={opt.value}
                  isActive={filters.category === opt.value}
                  onClick={() => setCategory(opt.value)}
                  label={opt.label}
                />
              ))}
            </div>
          </fieldset>

          {/* Offer type */}
          <AdminOfferTypeFilter
            value={filters.offerTypes}
            onChange={(offerTypes) => onChange({ ...filters, offerTypes })}
          />

          {/* Approval status */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('bp_filterApprovalLabel')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {approvalOptions.map((opt) => (
                <ChipButton
                  key={opt.value || 'all'}
                  isActive={filters.approvalStatus === opt.value}
                  onClick={() => setApproval(opt.value)}
                  label={opt.label}
                />
              ))}
            </div>
          </fieldset>

          {/* Adoption status */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('bp_filterAdoptionLabel')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {adoptionOptions.map((opt) => (
                <ChipButton
                  key={opt.value || 'all'}
                  isActive={filters.adoptionStatus === opt.value}
                  onClick={() => setAdoption(opt.value)}
                  label={opt.label}
                />
              ))}
            </div>
          </fieldset>

          {/* Price range */}
          <AdminPriceRangeFilter
            min={filters.priceMin}
            max={filters.priceMax}
            onChange={({ min, max }) => onChange({ ...filters, priceMin: min, priceMax: max })}
          />

          {/* Valid from */}
          <AdminDateBoundaryFilter
            labelKey="bp_filterValidFromAfter"
            value={filters.validFromAfter}
            onChange={(validFromAfter) => onChange({ ...filters, validFromAfter })}
          />

          {/* Valid until */}
          <AdminDateBoundaryFilter
            labelKey="bp_filterValidUntilBefore"
            value={filters.validUntilBefore}
            onChange={(validUntilBefore) => onChange({ ...filters, validUntilBefore })}
          />

          {/* Tags */}
          <AdminTagFilter
            value={filters.tags}
            onChange={(tags) => onChange({ ...filters, tags })}
            items={items}
          />

          {/* In-stock toggle */}
          <AdminInStockToggleFilter
            value={filters.inStockOnly}
            onChange={(inStockOnly) => onChange({ ...filters, inStockOnly })}
          />
        </div>

        {/* Footer - sticky results count + Clear button */}
        <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {resultsCount} {t('bp_filterResultsCount')}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-[#635bff] hover:underline disabled:opacity-50"
            disabled={countActiveCatalogFilters(filters) === 0}
          >
            {t('bp_filterClearAll')}
          </button>
        </footer>
      </div>
    </aside>
  );
};

export default CatalogFilterPanel;
