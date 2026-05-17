/**
 * ProductCatalog page - shows the tenant admin which offers they have adopted
 * for their members. Allows removing adopted offers and navigating to the
 * platform catalog (BenefitsPartnerships) to add more.
 *
 * Route: /product-catalog
 * Access: tenant admin only (isTenantAdmin guard in App.tsx)
 * Data source: getPlatformOffers() filtered to isAdopted === true
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getPlatformOffers,
  excludeOffer,
  type CatalogItem,
  OFFER_CATEGORIES,
  EXECUTION_TYPE_LABELS,
} from '../lib/api';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

/** State shape for the remove confirmation prompt. */
interface ConfirmState {
  offerId: string;
  title: string;
}

// ----------------------------------------------------------------
// Skeleton card used while the API call is in-flight
// ----------------------------------------------------------------

/**
 * Renders an animated skeleton placeholder card.
 * Input: none.
 * Output: a pulsing grey card matching the real card dimensions.
 */
function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm"
      aria-hidden="true"
    >
      <div className="h-36 bg-slate-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
        <div className="mt-4 flex items-center justify-between">
          <div className="h-5 bg-slate-100 rounded w-16" />
          <div className="h-7 bg-slate-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Main page component
// ----------------------------------------------------------------

/**
 * ProductCatalog page component.
 * Loads the platform offer list and filters to only adopted offers.
 * Provides search + category filtering, and a remove flow with an
 * inline confirmation prompt to prevent accidental deletions.
 *
 * Input: none - data is fetched from the backend on mount.
 * Output: full-page grid of adopted offer cards with management actions.
 */
const ProductCatalog = () => {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();

  // All adopted offers fetched from the backend
  const [items, setItems] = useState<CatalogItem[]>([]);
  // True while the initial fetch or a reload is in-flight
  const [isLoading, setIsLoading] = useState(true);
  // Non-null error string if the fetch failed
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Selected category value ('all' = no filter)
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Text entered in the search box
  const [searchQuery, setSearchQuery] = useState('');
  // Tracks which offer is currently being removed (shows spinner)
  const [removingId, setRemovingId] = useState<string | null>(null);
  // When set, shows an inline confirmation prompt for that offer
  const [confirmRemove, setConfirmRemove] = useState<ConfirmState | null>(null);

  // ----------------------------------------------------------------
  // Data loading
  // ----------------------------------------------------------------

  /**
   * Fetches all platform offers and retains only adopted ones.
   * Sets isLoading while in-flight and records any error message.
   */
  const loadAdoptedOffers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const all = await getPlatformOffers();
      setItems(all.filter((offer) => offer.isAdopted));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load catalog';
      setFetchError(message);
      console.error('[ProductCatalog] Failed to load platform offers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdoptedOffers();
  }, [loadAdoptedOffers]);

  // ----------------------------------------------------------------
  // Remove flow
  // ----------------------------------------------------------------

  /**
   * Opens the inline confirmation prompt for an offer.
   * Input: offerId - the offer to confirm removal for; title - display name.
   */
  const requestRemove = (offerId: string, title: string) => {
    setConfirmRemove({ offerId, title });
  };

  /**
   * Cancels the pending remove confirmation.
   */
  const cancelRemove = () => {
    setConfirmRemove(null);
  };

  /**
   * Executes the exclusion API call for the confirmed offer and reloads the list.
   * Input: offerId - the offer to exclude from this tenant's catalog.
   * Output: void; reloads adopted offers on success.
   */
  const confirmAndRemove = async (offerId: string) => {
    setConfirmRemove(null);
    setRemovingId(offerId);
    try {
      await excludeOffer(offerId);
      await loadAdoptedOffers();
    } catch (err) {
      console.error('[ProductCatalog] Failed to remove offer:', offerId, err);
    } finally {
      setRemovingId(null);
    }
  };

  // ----------------------------------------------------------------
  // Filtering
  // ----------------------------------------------------------------

  /**
   * Applies category and text search filters to the loaded items.
   * Input: items, selectedCategory, searchQuery from component state.
   * Output: filtered subset of CatalogItem[].
   */
  const filtered = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ----------------------------------------------------------------
  // Render helpers
  // ----------------------------------------------------------------

  /**
   * Renders a single adopted offer card with pricing and a remove button.
   * Input: item - the CatalogItem to display.
   * Output: a card element.
   */
  const renderOfferCard = (item: CatalogItem) => {
    const isRemoving = removingId === item.offerId;
    const isPendingConfirm = confirmRemove?.offerId === item.offerId;

    return (
      <article
        key={item.offerId}
        className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
      >
        {/* Offer image */}
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-36 object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-36 bg-slate-100 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="material-symbols-rounded !text-[40px] text-slate-300">
              local_offer
            </span>
          </div>
        )}

        {/* Card body */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 flex-1">
              {item.title}
            </h3>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 capitalize whitespace-nowrap">
                {item.category.replace(/_/g, ' ')}
              </span>
              {/* Execution type badge - shown when a delivery mechanism is set */}
              {item.executionType && EXECUTION_TYPE_LABELS[item.executionType] && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs text-indigo-700 whitespace-nowrap">
                  {EXECUTION_TYPE_LABELS[item.executionType].icon}{' '}
                  {language === 'he' ? EXECUTION_TYPE_LABELS[item.executionType].labelHe : EXECUTION_TYPE_LABELS[item.executionType].label}
                </span>
              )}
              {/* Stock indicator - shown only when a stock limit is configured */}
              {item.stockLimit !== null && (
                <span className={`text-xs font-medium whitespace-nowrap ${(item.stockAvailable ?? 0) <= 5 ? 'text-red-600' : 'text-slate-500'}`}>
                  {item.stockAvailable === 0
                    ? t('pc_soldOut')
                    : `${item.stockAvailable} ${t('pc_stockLeft')}`}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 flex-1">
            {item.description}
          </p>

          {/* Pricing row */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              {item.market_price !== undefined && (
                <span className="text-base font-bold text-slate-950">
                  &#8362;{item.market_price}
                </span>
              )}
            </div>

            {/* Confirm / Remove button */}
            {isPendingConfirm ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 mr-1">{t('pc_removeQuestion')}</span>
                <button
                  onClick={() => void confirmAndRemove(item.offerId)}
                  className="bg-red-500 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-red-600 transition-colors"
                  aria-label={`Confirm removal of ${item.title}`}
                >
                  {t('pc_btnYes')}
                </button>
                <button
                  onClick={cancelRemove}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                  aria-label="Cancel removal"
                >
                  {t('pc_btnNo')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => requestRemove(item.offerId, item.title)}
                disabled={isRemoving}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 px-3 py-1 rounded text-xs font-medium transition-colors"
                aria-label={`Remove ${item.title} from catalog`}
              >
                {isRemoving ? (
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 inline-block" />
                    {t('pc_removing')}
                  </span>
                ) : (
                  t('pc_btnRemove')
                )}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  // ----------------------------------------------------------------
  // Page render
  // ----------------------------------------------------------------

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {t('pc_pageTitle')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLoading
              ? t('pc_subtitleLoading')
              : isRTL
                ? `${items.length} ${t('pc_subtitleActive')}`
                : `${items.length} offer${items.length !== 1 ? 's' : ''} ${t('pc_subtitleActive')}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/benefits-partnerships')}
          className="bg-primary shadow-sm hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
          aria-label={t('pc_btnAddFromCatalog')}
        >
          {t('pc_btnAddFromCatalog')}
        </button>
      </div>

      {/* Filters row */}
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="catalog-search">
          Search offers
        </label>
        <input
          id="catalog-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('pc_searchPlaceholder')}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        />

        <label className="sr-only" htmlFor="catalog-category">
          Filter by category
        </label>
        <select
          id="catalog-category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t('pc_allCategories')}</option>
          {OFFER_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content area */}
      {isLoading ? (
        /* Skeleton grid while loading */
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Loading offers"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : fetchError ? (
        /* Error state */
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-red-600">{fetchError}</p>
          <button
            onClick={() => void loadAdoptedOffers()}
            className="mt-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {t('pc_btnRetry')}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
          {items.length === 0 ? (
            <>
              <span
                className="material-symbols-rounded !text-[48px] text-slate-300 block mb-3"
                aria-hidden="true"
              >
                inventory_2
              </span>
              <p className="text-sm font-medium text-slate-700">
                {t('pc_emptyTitle')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t('pc_emptyHint')}
              </p>
              <button
                onClick={() => navigate('/benefits-partnerships')}
                className="mt-5 bg-primary shadow-sm hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
              >
                {t('pc_btnBrowseCatalog')}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-700">
                {t('pc_noSearchMatch')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t('pc_tryDifferent')}
              </p>
            </>
          )}
        </div>
      ) : (
        /* Offer grid */
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label={`${filtered.length} adopted offer${filtered.length !== 1 ? 's' : ''}`}
        >
          {filtered.map(renderOfferCard)}
        </div>
      )}
    </main>
  );
};

export default ProductCatalog;
