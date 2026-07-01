/**
 * CatalogTopBar - Transactions/Users-style top bar for the BenefitsPartnerships page.
 *
 * Structure (top to bottom):
 *   1. Offer-type tab strip (All | Voucher | Coupon | ...) with the purple
 *      bottom-border indicator on the active type. Drives the offerTypes filter
 *      (server-side) - the single source of truth shared with the filter panel.
 *   2. Toolbar row with:
 *      - Left group: expandable search icon + filter icon with active-count badge,
 *        the cards/table VIEW toggle (two icon buttons), and the results count.
 *
 * View type (cards/table) and offer type are independent. Search is a toggling
 * icon -> input pattern; the filter button shows a badge when activeFilterCount > 0.
 * All design tokens copied from Transactions/Users to keep the look-and-feel identical.
 */
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import FieldTooltip from '../FieldTooltip';
import { OFFER_TYPE_OPTIONS } from './catalogFilters';

// ─── Public contract ──────────────────────────────────────────────────────────

interface CatalogTopBarProps {
  /** Active view (cards/table). */
  activeTab: 'cards' | 'table';
  /** Called when the user switches the view via the icon toggle. */
  onTabChange: (tab: 'cards' | 'table') => void;
  /** Currently selected offer execution types (the offerTypes filter). Empty = All. */
  offerTypes: string[];
  /** Called when the user picks an offer-type tab. [] = All; [value] = one type. */
  onOfferTypeChange: (types: string[]) => void;
  /** Current free-text search value (controlled from the parent). */
  searchValue: string;
  /** Called whenever the search input changes. */
  onSearchChange: (next: string) => void;
  /** Number of filters currently active - drives the badge on the filter icon. */
  activeFilterCount: number;
  /** Called when the user clicks the filter icon. */
  onOpenFilters: () => void;
  /** Number of catalog items currently visible after filtering. */
  resultsCount: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CatalogTopBar = ({
  activeTab,
  onTabChange,
  offerTypes,
  onOfferTypeChange,
  searchValue,
  onSearchChange,
  activeFilterCount,
  onOpenFilters,
  resultsCount,
}: CatalogTopBarProps) => {
  const { t, language } = useLanguage();
  // Lazy initial state keeps the search expanded when the parent already has a
  // value at mount time (e.g. user typed in the filter panel first). Avoids an
  // effect-driven setState that would trigger a cascading render.
  const [isSearchOpen, setIsSearchOpen] = useState(() => searchValue !== '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the search input when it opens so the user can type immediately.
  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  // ─── Shared tab classes ─────────────────────────────────────────────────────
  // Copied verbatim from Transactions:983-1003 / Users:1920-1967.
  const tabBase = 'px-3 py-1.5 text-sm font-medium transition-all border-b-2 -mb-px';
  const tabActive = 'border-[#635bff] text-[#635bff]';
  const tabInactive =
    'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800';

  const iconButton =
    'w-8 h-8 rounded-md flex items-center justify-center transition-colors text-[#635bff] hover:bg-[#635bff]/10';
  // Active view icon reuses the filter icon's active treatment (purple fill).
  const iconButtonActive =
    'w-8 h-8 rounded-md flex items-center justify-center bg-[#635bff] text-white hover:opacity-90 transition-opacity';

  // Offer-type tab strip, sourced from the shared OFFER_TYPE_OPTIONS (+ an All
  // tab). The active tab is derived from the offerTypes filter so the strip and
  // the filter panel stay in sync from one source of truth: empty -> All; a
  // single type -> that tab; a multi-select (set via the panel) -> none active.
  const offerTypeTabs = [
    { value: '', label: t('bp_offerTypeAll') },
    ...OFFER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: language === 'he' ? o.he : o.en })),
  ];
  const activeType =
    offerTypes.length === 0 ? '' : offerTypes.length === 1 ? offerTypes[0] : '__multi__';

  return (
    <div className="space-y-3">
      {/* Offer-type tab strip - filters the catalog by execution type (server-side
          via the offerTypes filter). The purple bottom-border marks the active type. */}
      <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 border-b border-slate-200 dark:border-slate-700">
        {offerTypeTabs.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => onOfferTypeChange(tab.value === '' ? [] : [tab.value])}
            className={cn(tabBase, activeType === tab.value ? tabActive : tabInactive)}
            aria-pressed={activeType === tab.value}
          >
            {tab.label}
          </button>
        ))}
        {/* Eye-catching "how do I adopt an offer?" pill. Sits inline with the
            tabs (not at the opposite edge) and uses an amber lightbulb badge
            so admins notice the adoption flow at a glance. */}
        <div
          className={cn(
            'self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full',
            'bg-amber-50 border border-amber-300 text-amber-800 shadow-sm',
            'dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-200',
            'transition-shadow hover:shadow-md hover:border-amber-400',
          )}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
            <path fillRule="evenodd" d="M10 2a7 7 0 0 0-4.2 12.6c.42.3.62.7.71 1.1l.32 1.62c.13.66.7 1.14 1.37 1.14h3.6c.67 0 1.24-.48 1.37-1.14l.32-1.62c.09-.4.29-.8.71-1.1A7 7 0 0 0 10 2zM7 18.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold whitespace-nowrap">
            {t('fi_howToAdopt_label')}
          </span>
          <FieldTooltip fieldKey="howToAdopt" placement="bottom" />
        </div>
      </div>

      {/* Toolbar row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left group: search + filter + results count */}
        <div className="flex items-center gap-2">
          {/* Expandable search */}
          {isSearchOpen ? (
            <div className="relative">
              <span className="material-icons absolute start-2 top-1/2 -translate-y-1/2 text-slate-400 !text-[16px]" aria-hidden="true">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onBlur={() => { if (!searchValue) setIsSearchOpen(false); }}
                placeholder={t('bp_filterSearchPlaceholder')}
                aria-label={t('bp_searchAria')}
                className="w-52 ps-8 pe-8 py-1.5 bg-slate-100 dark:bg-slate-800 dark:text-white border-none rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => { onSearchChange(''); searchInputRef.current?.focus(); }}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label={t('bp_searchAria')}
              className={iconButton}
            >
              <span className="material-icons !text-[18px]" aria-hidden="true">search</span>
            </button>
          )}

          {/* Filter icon with badge */}
          <button
            type="button"
            onClick={onOpenFilters}
            aria-label={t('bp_filterAria')}
            className={cn(
              'relative',
              activeFilterCount > 0
                ? 'w-8 h-8 rounded-md flex items-center justify-center bg-[#635bff] text-white hover:opacity-90 transition-opacity'
                : iconButton,
            )}
          >
            <span className="material-icons !text-[18px]" aria-hidden="true">filter_list</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 bg-white text-[#635bff] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#635bff]">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Divider between filter controls and the view toggle. */}
          <span aria-hidden className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-700" />

          {/* View toggle - table / cards (table first, the default view). Active view
              uses the same purple-fill treatment as the active filter icon. */}
          <button
            type="button"
            onClick={() => onTabChange('table')}
            aria-label={t('bp_tabTable')}
            title={t('bp_tabTable')}
            aria-pressed={activeTab === 'table'}
            className={activeTab === 'table' ? iconButtonActive : iconButton}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]" aria-hidden="true">
              <path d="M3 4h14v2.5H3V4zm0 5.25h14v2.5H3v-2.5zM3 14.5h14V17H3v-2.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('cards')}
            aria-label={t('bp_tabCards')}
            title={t('bp_tabCards')}
            aria-pressed={activeTab === 'cards'}
            className={activeTab === 'cards' ? iconButtonActive : iconButton}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]" aria-hidden="true">
              <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
            </svg>
          </button>

          {/* Results count - subdued */}
          <span className="ms-2 text-xs text-slate-400 dark:text-slate-500">
            {resultsCount} {t('bp_offersCount')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CatalogTopBar;
