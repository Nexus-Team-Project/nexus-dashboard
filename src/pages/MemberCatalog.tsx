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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMemberCatalog, type CatalogItem, OFFER_CATEGORIES } from '../lib/api';
import OfferModal from '../components/catalog/OfferModal';

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
  onClick: () => void;
}

/**
 * Single offer card in the catalog grid.
 * Keyboard-accessible (Enter key triggers modal open).
 * Input: CatalogItem and a click/enter handler.
 * Output: styled card with image, title, category, price, and discount indicator.
 */
function OfferCard({ item, onClick }: OfferCardProps) {
  const hasDiscount = item.market_price !== undefined && item.market_price > item.member_price;

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      aria-label={`View offer: ${item.title}`}
    >
      {/* Offer image or placeholder */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-40 object-cover"
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
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-3 flex-1">
          {item.description}
        </p>

        {/* Price row */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-950">
              &#x20AA;{item.member_price}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                &#x20AA;{item.market_price}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400" aria-hidden>
            Tap to view &rarr;
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

  /** Catalog activation mode - controls redeem button state in OfferModal. */
  const catalogMode = me?.authorization.catalogMode ?? 'sandbox';
  /** Whether this user's role grants catalog purchase permission. */
  const canPurchase = me?.authorization.canPurchaseCatalog === true;
  /** Tenant whose adopted offers to display. Derived from server session only. */
  const tenantId = me?.context.tenantId ?? '';

  // ── Local state ───────────────────────────────────────────────────
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOffer, setSelectedOffer] = useState<CatalogItem | null>(null);

  // ── Load catalog on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;

    setIsLoading(true);
    getMemberCatalog(tenantId)
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch(() => {
        setError('Could not load catalog. Please try again or contact your admin.');
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  // ── Client-side filtering ─────────────────────────────────────────
  const filtered = items.filter((i) => {
    const matchCat = selectedCategory === 'all' || i.category === selectedCategory;
    const matchSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Benefits Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Exclusive offers available to you
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Back
        </button>
      </div>

      {/* Search + category filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search offers..."
          aria-label="Search offers"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All categories</option>
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
            {items.length === 0
              ? 'No offers available yet. Check back later.'
              : 'No offers match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <OfferCard
              key={item.offerId}
              item={item}
              onClick={() => setSelectedOffer(item)}
            />
          ))}
        </div>
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
    </div>
  );
};

export default MemberCatalog;
