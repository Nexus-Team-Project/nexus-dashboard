/**
 * MemberCatalog page: member-facing view of benefits adopted by the tenant.
 *
 * Shows a filterable, searchable grid of catalog offers available to the
 * authenticated member. Clicking a card opens the OfferModal which handles
 * the full redemption flow based on catalogMode and canPurchase flags.
 *
 * Access: rendered for both limited-role tenant members (shouldUseLimitedRoleDashboard)
 * and full tenant admins. Only visible when catalogMode !== 'inactive'.
 *
 * Route: /member-catalog
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { getMemberCatalog, type CatalogItem, type CatalogPage, type CatalogQuery, OFFER_CATEGORIES } from '../lib/api';
import OfferModal from '../components/catalog/OfferModal';
import ImageLightbox from '../components/ImageLightbox';
import RichTextDisplay from '../components/RichTextDisplay';
import Pagination from '../components/Pagination';
import { useCatalogList } from '../hooks/useCatalogList';

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Animated skeleton card shown while catalog items are loading.
 * Matches the shape of a real offer card to prevent layout shift.
 */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="w-full h-40 bg-slate-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
        <div className="mt-4 h-5 w-1/3 rounded bg-slate-100" />
      </div>
    </div>
  );
}

// ─── Offer card ───────────────────────────────────────────────────────────────

interface OfferCardProps {
  item: CatalogItem;
  /** Opens the offer detail modal. */
  onClick: () => void;
  /** Opens the full-screen image lightbox for the offer image. */
  onImageClick: (url: string) => void;
}

/**
 * Single offer card in the catalog grid.
 * Keyboard-accessible (Enter key triggers modal open).
 * Input: CatalogItem and a click/enter handler.
 * Output: styled card with image, title, category, price, and discount indicator.
 */
function OfferCard({ item, onClick, onImageClick }: OfferCardProps) {
  const { t } = useLanguage();

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      aria-label={`View offer: ${item.title}`}
    >
      {/* Offer image or placeholder - clicking the image opens the full-screen lightbox */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-40 object-cover cursor-zoom-in"
          onClick={(e) => { e.stopPropagation(); onImageClick(item.imageUrl!); }}
        />
      ) : (
        <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-slate-300 text-3xl">
          🎁
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Title row with category chip */}
        <div className="flex items-start gap-2 justify-between">
          <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 flex-1">
            {item.title}
          </h3>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 capitalize">
            {item.category.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Description */}
        <RichTextDisplay html={item.description} compact className="mt-1.5 text-xs text-slate-500 flex-1" />

        {/* Price row */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {item.market_price !== undefined && (
              <span className="text-lg font-bold text-slate-950">
                &#x20AA;{item.market_price}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400" aria-hidden>
            {t('mc_tapToView')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

/**
 * MemberCatalog page component.
 *
 * Fetches the tenant's adopted offers from GET /api/v1/offers/:tenantId.
 * Filters locally by category and free-text search for instant responsiveness.
 * Opens OfferModal when a card is clicked.
 *
 * Input: authenticated session from AuthContext (me.context.tenantId,
 *        me.authorization.catalogMode, me.authorization.canPurchaseCatalog).
 * Output: searchable, filterable offer grid with inline skeleton loading.
 */
const MemberCatalog = () => {
  const navigate = useNavigate();
  const { me } = useAuth();
  const { t } = useLanguage();

  /** Catalog activation mode - controls redeem button state in OfferModal.
   * Defaults to 'inactive' (safest fallback) when the server has not yet
   * set a mode - prevents accidental offer display before activation. */
  const catalogMode = me?.authorization.catalogMode ?? 'inactive';
  /** Whether this user's role grants catalog purchase permission. */
  const canPurchase = me?.authorization.canPurchaseCatalog === true;
  /** Tenant whose adopted offers to display. Derived from server session only. */
  const tenantId = me?.context.tenantId ?? '';

  // ── Local state ───────────────────────────────────────────────────
  const [selectedOffer, setSelectedOffer] = useState<CatalogItem | null>(null);
  /** URL of the image currently shown in the full-screen lightbox, or null when closed. */
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  /**
   * Bound fetcher for the member catalog API. The hook only refetches when its
   * dependencies change, so wrapping with useCallback keeps the reference stable
   * and avoids a noisy effect loop in development.
   */
  const fetcher = useCallback(
    (q: CatalogQuery): Promise<CatalogPage> => getMemberCatalog(tenantId, q),
    [tenantId],
  );

  /**
   * Server-paginated catalog state. Search + category filters go to the
   * backend; approval/adoption fields are ignored for member view.
   * Disabled-effectively when the catalog is inactive: tenantId stays empty
   * so the fetcher would return zero items - the inactive gate below shows
   * the friendly placeholder before we even hit that path.
   */
  const {
    filters,
    setFilters,
    page,
    setPage,
    items: filtered,
    pages: catalogPages,
    isLoading,
    error,
  } = useCatalogList({ fetcher });

  // Search and category use the same shared CatalogFilters. Map them through
  // small handlers so the inputs feel familiar while the hook owns the state.
  const searchQuery = filters.search;
  const selectedCategory = filters.category === '' ? 'all' : filters.category;
  const setSearchQuery = (v: string) => setFilters({ ...filters, search: v });
  const setSelectedCategory = (v: string) =>
    setFilters({ ...filters, category: v === 'all' ? '' : v });

  // ── Inactive gate ────────────────────────────────────────────────
  // Show a friendly placeholder when the Benefits Catalog has not yet
  // been activated by the tenant admin. All hooks run above this point
  // to satisfy React's rules of hooks.
  if (catalogMode === 'inactive') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <span className="material-symbols-rounded !text-[48px] text-slate-300 mb-4">hourglass_empty</span>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            {t('mc_inactiveTitle')}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm">
            {t('mc_inactiveBody')}
          </p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {t('mc_pageTitle')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('mc_subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {t('mc_btnBack')}
        </button>
      </div>

      {/* Sandbox preview mode banner - shown when catalog is active but workspace is not live */}
      {catalogMode === 'sandbox' && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="material-symbols-rounded !text-[20px] text-amber-600 shrink-0 mt-0.5">info</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">{t('mc_sandboxTitle')}</p>
            <p className="text-xs text-amber-700 mt-0.5">{t('mc_sandboxBody')}</p>
          </div>
        </div>
      )}

      {/* Search + category filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('mc_searchPlaceholder')}
          aria-label={t('mc_searchPlaceholder')}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t('mc_allCategories')}</option>
          {OFFER_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── States ──────────────────────────────────────────────────── */}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-slate-500 font-medium">
            {/* When any filter is active the empty state means "no match",
                otherwise the tenant simply has not adopted any offers yet. */}
            {searchQuery || filters.category
              ? t('mc_emptyNoMatch')
              : t('mc_emptyNoOffers')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <OfferCard
                key={item.offerId}
                item={item}
                onClick={() => setSelectedOffer(item)}
                onImageClick={(url) => setLightboxUrl(url)}
              />
            ))}
          </div>
          {catalogPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination page={page} pages={catalogPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Offer detail modal - mounted conditionally */}
      {selectedOffer !== null && (
        <OfferModal
          offer={selectedOffer}
          catalogMode={catalogMode}
          canPurchase={canPurchase}
          onClose={() => setSelectedOffer(null)}
        />
      )}

      {/* Full-screen image lightbox - rendered as a portal over the entire viewport */}
      {lightboxUrl && (
        <ImageLightbox
          src={lightboxUrl}
          alt="תצוגת הצעה"
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </div>
  );
};

export default MemberCatalog;
