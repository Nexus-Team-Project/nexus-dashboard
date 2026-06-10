/**
 * CatalogTopBar - Transactions/Users-style top bar for the BenefitsPartnerships page.
 *
 * Structure (top to bottom):
 *   1. Tabs row (Cards | Table) with purple bottom-border indicator on the active tab.
 *   2. Toolbar row with:
 *      - Left group: expandable search icon + filter icon with active-count badge + results count.
 *      - Right group: Create Offer primary CTA (only when allowed).
 *
 * Search is implemented as a toggling icon -> input pattern (Transactions:1265-1308).
 * Filter button shows a numeric badge when activeFilterCount > 0.
 * All design tokens copied from Transactions/Users to keep the look-and-feel identical.
 */
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import FieldTooltip from '../FieldTooltip';

// ─── Public contract ──────────────────────────────────────────────────────────

interface CatalogTopBarProps {
  /** Active tab key. */
  activeTab: 'cards' | 'table';
  /** Called when the user picks a tab. */
  onTabChange: (tab: 'cards' | 'table') => void;
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
  /** True when the Create Offer CTA should be visible (catalog active OR platform admin). */
  showCreateOffer: boolean;
  /** Called when the user clicks Create Offer. */
  onCreateOffer: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CatalogTopBar = ({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  activeFilterCount,
  onOpenFilters,
  resultsCount,
  showCreateOffer,
  onCreateOffer,
}: CatalogTopBarProps) => {
  const { t } = useLanguage();
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

  return (
    <div className="space-y-3">
      {/* Tabs row. Each tab is a button + FieldTooltip pair grouped in a flex
          wrapper so clicking the tooltip icon does not change tabs. */}
      <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange('cards')}
            className={cn(tabBase, activeTab === 'cards' ? tabActive : tabInactive)}
            aria-pressed={activeTab === 'cards'}
          >
            {t('bp_tabCards')}
          </button>
          <FieldTooltip fieldKey="tabCards" placement="bottom" />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange('table')}
            className={cn(tabBase, activeTab === 'table' ? tabActive : tabInactive)}
            aria-pressed={activeTab === 'table'}
          >
            {t('bp_tabTable')}
          </button>
          <FieldTooltip fieldKey="tabTable" placement="bottom" />
        </div>
        {/* Eye-catching "how do I adopt an offer?" pill. Sits inline with the
            tabs (not at the opposite edge) and uses an amber lightbulb badge
            so admins notice the cards-then-table-toggle flow at a glance. */}
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

          {/* Results count - subdued */}
          <span className="ms-2 text-xs text-slate-400 dark:text-slate-500">
            {resultsCount} {t('bp_offersCount')}
          </span>
        </div>

        {/* Right group: primary CTA */}
        {showCreateOffer && (
          <button
            type="button"
            onClick={onCreateOffer}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {t('bp_createOffer')}
          </button>
        )}
      </div>
    </div>
  );
};

export default CatalogTopBar;
