/**
 * MemberCatalog page: premium "Exclusive Benefits Club" marketplace.
 *
 * Renders a personalised, scrollable carousel of benefit cards adopted
 * by the tenant. All copy, names, badges, and accent colors are derived
 * from data - nothing is hard-coded.
 *
 * Access: tenant members and admins. Visible only when catalogMode !== 'inactive'.
 * Route: /member-catalog
 */
import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getMemberCatalog,
  type CatalogItem,
  type CatalogPage,
  type CatalogQuery,
  OFFER_CATEGORIES,
} from '../lib/api';
import OfferModal from '../components/catalog/OfferModal';
import ImageLightbox from '../components/ImageLightbox';
import RichTextDisplay from '../components/RichTextDisplay';
import Pagination from '../components/Pagination';
import MemberCatalogBackdrop from '../components/catalog/MemberCatalogBackdrop';
import { useCatalogList } from '../hooks/useCatalogList';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Reusable button accent palette. Each card picks a deterministic accent
 * by hashing its offerId so visuals stay stable across re-renders while
 * still feeling varied (deep blue / coral / teal / violet).
 */
const CARD_ACCENTS: { bg: string; hover: string }[] = [
  { bg: 'bg-[#1E3A8A]', hover: 'hover:bg-[#1E40AF]' },
  { bg: 'bg-[#F26B5E]', hover: 'hover:bg-[#E55A4C]' },
  { bg: 'bg-[#0F766E]', hover: 'hover:bg-[#115E59]' },
  { bg: 'bg-[#7C3AED]', hover: 'hover:bg-[#6D28D9]' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Stable index from a string id, used to pick a card accent color. */
function hashIndex(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

/** Localised label for an offer category. */
function categoryLabel(value: string, lang: 'he' | 'en'): string {
  const found = OFFER_CATEGORIES.find((c) => c.value === value);
  if (!found) return value.replace(/_/g, ' ');
  return lang === 'he' ? found.labelHe : found.label;
}

/**
 * Resolves the member-facing selling price for an offer.
 * - Vouchers carry `member_price` (what members pay).
 * - Other offer types fall back to `market_price`, then `face_value`.
 * Returns null when no price field is present.
 */
function displayPrice(item: CatalogItem): number | null {
  const v = item.market_price ?? item.member_price ?? item.face_value;
  return typeof v === 'number' ? v : null;
}

/**
 * Resolves the localised label for an offer's execution type. Returns null
 * when the value is unknown so the badge simply hides instead of leaking
 * a raw backend enum string. Takes the bound `t()` so the i18n key stays
 * a string literal and remains type-safe.
 */
function executionTypeLabel(
  value: string | undefined,
  t: (k: 'mc_typeVoucher' | 'mc_typeCoupon' | 'mc_typeGiftCard' | 'mc_typeProduct' | 'mc_typeService') => string,
): string | null {
  switch (value) {
    case 'voucher':   return t('mc_typeVoucher');
    case 'coupon':    return t('mc_typeCoupon');
    case 'gift_card': return t('mc_typeGiftCard');
    case 'product':   return t('mc_typeProduct');
    case 'service':   return t('mc_typeService');
    default:          return null;
  }
}

/**
 * Computes the integer number of days until an offer expires. Returns null
 * when the offer has no expiry, has already expired, or the date is
 * unparseable. Used to drive the "expires soon" warning badge - shown only
 * when the offer expires within two weeks.
 */
function daysUntilExpiry(validUntil: string | null | undefined): number | null {
  if (!validUntil) return null;
  const t = new Date(validUntil).getTime();
  if (Number.isNaN(t)) return null;
  const diff = t - Date.now();
  if (diff < 0) return null;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/** Skeleton card matching the real card shape. Prevents layout shift. */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]">
      <div className="h-44 w-full rounded-t-3xl bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-11 w-full rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

// ─── Benefit card ─────────────────────────────────────────────────────────────

interface BenefitCardProps {
  item: CatalogItem;
  language: 'he' | 'en';
  onClick: () => void;
  onImageClick: (url: string) => void;
}

/**
 * One benefit card. Image fills the top, capsule badge on the top corner,
 * bold dynamic discount headline, short subtitle, and a full-width CTA
 * button whose colour is derived from the offer id.
 */
function BenefitCard({ item, language, onClick, onImageClick }: BenefitCardProps) {
  const { t, isRTL } = useLanguage();
  const cover = item.imageUrls?.[0] ?? item.imageUrl;
  const accent = CARD_ACCENTS[hashIndex(item.offerId, CARD_ACCENTS.length)];
  const price = displayPrice(item);
  const categoryText = categoryLabel(item.category, language);
  const typeText = executionTypeLabel(item.executionType, t);
  const days = daysUntilExpiry(item.validUntil);
  const showExpiry = days !== null && days <= 14;
  const expiryText = days === null
    ? null
    : days <= 0
      ? t('mc_expiresToday')
      : t('mc_expiresInDays').replace('{n}', String(days));

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_10px_32px_-14px_rgba(15,23,42,0.2)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_22px_44px_-18px_rgba(15,23,42,0.3)] focus-within:ring-2 focus-within:ring-primary/40"
    >
      {/* Image fills the top - rounded top corners */}
      <button
        type="button"
        onClick={() => cover && onImageClick(cover)}
        className="relative block h-44 w-full overflow-hidden bg-slate-100 focus:outline-none"
        aria-label={item.title}
      >
        {cover ? (
          <img
            src={cover}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-slate-300">
            🎁
          </div>
        )}

        {/* Top badges: category + offer type (e.g. voucher / coupon). */}
        <div
          className="absolute top-3 flex max-w-[80%] flex-wrap items-center gap-1.5"
          style={isRTL ? { left: '0.75rem' } : { right: '0.75rem' }}
        >
          {categoryText && (
            <span className="inline-flex items-center rounded-full bg-slate-900/85 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-md">
              <span className="truncate">{categoryText}</span>
            </span>
          )}
          {typeText && (
            <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-800 backdrop-blur-md">
              <span className="truncate">{typeText}</span>
            </span>
          )}
        </div>

        {/* Expiry-soon warning: appears only when expiry is within two weeks.
            Bottom-opposite-corner so it never overlaps the category badges. */}
        {showExpiry && expiryText && (
          <span
            className="absolute bottom-3 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(245,158,11,0.55)] backdrop-blur-md"
            style={isRTL ? { right: '0.75rem' } : { left: '0.75rem' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {expiryText}
          </span>
        )}
      </button>

      {/* Text + CTA */}
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="min-w-0">
          {/* Real offer title */}
          <h3 className="text-[17px] font-bold leading-snug tracking-tight text-slate-900 line-clamp-2">
            {item.title}
          </h3>

          {/* Selling price only - no original/strike-through. */}
          {price !== null && (
            <div className="mt-2">
              <span className="text-[22px] font-extrabold tracking-tight text-slate-900">
                {'₪'}
                {price.toLocaleString()}
              </span>
            </div>
          )}

          {/* Real HTML description, compact and clamped */}
          <RichTextDisplay
            html={item.description}
            compact
            className="mt-2 text-[13px] leading-relaxed text-slate-500 line-clamp-2"
          />
        </div>

        <button
          type="button"
          onClick={onClick}
          className={`w-full rounded-xl ${accent.bg} ${accent.hover} px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-12px_rgba(15,23,42,0.5)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40`}
        >
          {t('mc_viewBenefit')}
        </button>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * MemberCatalog page component.
 *
 * Personalises the title with the signed-in user's first name and renders
 * the offer list as a horizontally-scrollable carousel. Search is
 * delegated to the shared catalog hook (server-side filtering).
 */
const MemberCatalog = () => {
  const { me } = useAuth();
  const { t, language, isRTL } = useLanguage();

  const catalogMode = me?.authorization.catalogMode ?? 'inactive';
  const canPurchase = me?.authorization.canPurchaseCatalog === true;
  const tenantId = me?.context.tenantId ?? '';

  /**
   * Modern font stack: Plus Jakarta Sans for English, Heebo for Hebrew.
   * Applied to the page root so all descendants inherit it without
   * touching the global Tailwind config.
   */
  const fontStack =
    language === 'he'
      ? "'Heebo', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      : "'Plus Jakarta Sans', 'Heebo', system-ui, -apple-system, sans-serif";

  const [selectedOffer, setSelectedOffer] = useState<CatalogItem | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetcher = useCallback(
    (q: CatalogQuery): Promise<CatalogPage> => getMemberCatalog(tenantId, q),
    [tenantId],
  );

  const {
    filters,
    setFilters,
    page,
    setPage,
    items,
    pages: totalPages,
    isLoading,
    error,
  } = useCatalogList({ fetcher });

  const searchQuery = filters.search;
  const setSearchQuery = (v: string) => setFilters({ ...filters, search: v });

  // ── Inactive gate ────────────────────────────────────────────────
  if (catalogMode === 'inactive') {
    return (
      <div className="min-h-screen bg-white" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: fontStack }}>
        <div className="mx-auto max-w-[1200px] px-4 pt-10 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)]">
            <span className="material-icons !text-[48px] text-slate-300 mb-4" aria-hidden>
              hourglass_empty
            </span>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t('mc_inactiveTitle')}</h2>
            <p className="text-sm text-slate-500 max-w-sm">{t('mc_inactiveBody')}</p>
          </div>
        </div>
      </div>
    );
  }

  const title = t('mc_clubTitle');

  /**
   * Renders the page title with the closing phrase ("הבלעדי שלך" in Hebrew,
   * "exclusive" in English) highlighted in gold and underlined with a
   * hand-drawn swoosh SVG instead of a flat text-decoration line.
   *
   * Returns a fragment so the surrounding <h1> tag can keep its styling.
   */
  const renderTitle = () => {
    const marker = language === 'he' ? 'הבלעדי שלך' : 'exclusive';
    const idx = title.indexOf(marker);
    if (idx === -1) return title;
    /**
     * Underline path:
     *  - A near-straight stroke under the phrase.
     *  - Curls upward into a small open loop at the end (the visual "end"
     *    of the word: right in LTR, left in RTL via scaleX(-1)).
     *
     * viewBox uses preserveAspectRatio="none" so the curve stretches with
     * the highlighted phrase's width while keeping the curl proportional.
     */
    return (
      <>
        {title.slice(0, idx)}
        <span className="relative inline-block whitespace-nowrap pb-3 text-[#C9A24B]">
          {marker}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-1 h-3 w-full"
            viewBox="0 0 100 12"
            preserveAspectRatio="none"
            style={isRTL ? { transform: 'scaleX(-1)' } : undefined}
          >
            <defs>
              <linearGradient id="mc-underline" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#C9A24B" stopOpacity="0.15" />
                <stop offset="30%"  stopColor="#C9A24B" stopOpacity="1" />
                <stop offset="80%"  stopColor="#A87A30" stopOpacity="1" />
                <stop offset="100%" stopColor="#A87A30" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M2 6 L 70 6 C 84 6, 93 7, 96 12"
              stroke="url(#mc-underline)"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {title.slice(idx + marker.length)}
      </>
    );
  };

  return (
    <div
      className="relative min-h-full overflow-x-clip"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: fontStack }}
    >
      {/* Premium "Digital Geometric Particle" backdrop:
          white base + faint architectural grid + clusters of shimmering
          gold/silver particles with subtle mouse-parallax. */}
      <MemberCatalogBackdrop />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-10">
        {/* Header block - centered, dynamic */}
        <header className="text-center">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[36px] lg:text-[44px]">
            {renderTitle()}
          </h1>
          <p className="mx-auto mt-3 max-w-[640px] text-[15px] leading-relaxed text-slate-500">
            {t('mc_clubCta')}
          </p>
        </header>

        {/* Sandbox notice (only when relevant) */}
        {catalogMode === 'sandbox' && (
          <div className="mx-auto mt-6 flex max-w-[760px] items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="material-icons !text-[20px] text-amber-600 mt-0.5" aria-hidden>info</span>
            <div className="text-start">
              <p className="text-sm font-semibold text-amber-900">{t('mc_sandboxTitle')}</p>
              <p className="text-xs text-amber-700">{t('mc_sandboxBody')}</p>
            </div>
          </div>
        )}

        {/* Wide rounded search */}
        <div className="mx-auto mt-6 max-w-[760px]">
          <label htmlFor="mc-search" className="sr-only">
            {t('mc_searchClubPlaceholder')}
          </label>
          <div className="group relative">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
              style={isRTL ? { right: '14px' } : { left: '14px' }}
            >
              <svg
                className="h-[18px] w-[18px] sm:h-5 sm:w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            {/* Mobile uses a tighter icon-padding (40px) and smaller text so
                the long bilingual placeholder is fully visible. From sm up
                we restore the roomier 52px padding + 15px text. */}
            <input
              id="mc-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('mc_searchClubPlaceholder')}
              aria-label={t('mc_searchClubPlaceholder')}
              className={`h-12 w-full min-w-0 rounded-full border border-slate-200 bg-white text-[13px] text-slate-900 placeholder:text-[13px] placeholder:text-slate-400 placeholder:overflow-ellipsis shadow-[0_6px_22px_-12px_rgba(15,23,42,0.2)] outline-none transition-all duration-200 focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12),0_10px_26px_-14px_rgba(99,102,241,0.4)] sm:h-14 sm:text-[15px] sm:placeholder:text-[15px] ${
                isRTL
                  ? 'pr-10 pl-4 sm:pr-[52px] sm:pl-5'
                  : 'pl-10 pr-4 sm:pl-[52px] sm:pr-5'
              }`}
            />
          </div>
        </div>

        {/* Responsive grid - mobile-first: 1 col, 2 from sm, 3 from lg */}
        <section className="mt-8 sm:mt-10" aria-label={t('mc_pageTitle')}>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="mx-auto max-w-[760px] rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="mx-auto max-w-[760px] rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)]">
              <p className="text-sm font-medium text-slate-500">
                {searchQuery ? t('mc_emptyNoMatch') : t('mc_emptyNoOffers')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {items.map((item) => (
                  <BenefitCard
                    key={item.offerId}
                    item={item}
                    language={language}
                    onClick={() => setSelectedOffer(item)}
                    onImageClick={(url) => setLightboxUrl(url)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center sm:mt-10">
                  <Pagination
                    page={page}
                    pages={totalPages}
                    onPageChange={setPage}
                    ariaLabel={t('mc_pageTitle')}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {selectedOffer !== null && (
        <OfferModal
          offer={selectedOffer}
          catalogMode={catalogMode}
          canPurchase={canPurchase}
          onClose={() => setSelectedOffer(null)}
        />
      )}

      {lightboxUrl && (
        <ImageLightbox src={lightboxUrl} alt={t('mc_pageTitle')} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
};

export default MemberCatalog;
