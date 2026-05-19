/**
 * OfferModal: 2026-style offer detail modal for the member-facing benefits catalog.
 *
 * Design: dark glassmorphism panel with ambient purple/indigo gradient orbs,
 * hero image with gradient fade, perforated coupon tear-line divider, bold
 * price display, and a redemption section gated by catalogMode + canPurchase.
 *
 * Accessibility: focus trap (initial focus on close button), Escape-to-close,
 * role="dialog", aria-modal, scroll-lock on body while open.
 */
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { EXECUTION_TYPE_LABELS, OFFER_CATEGORIES } from '../../lib/api';
import type { CatalogItem } from '../../lib/api';
import OfferImageCarousel from './OfferImageCarousel';
import RichTextDisplay from '../RichTextDisplay';
import ImageLightbox from '../ImageLightbox';

// ─── Props ────────────────────────────────────────────────────────────────────

interface OfferModalProps {
  /** Full offer record from the member catalog API. */
  offer: CatalogItem;
  /** Catalog activation state for this tenant. Controls redeem button behaviour. */
  catalogMode: 'inactive' | 'sandbox' | 'live';
  /** True when the authenticated user holds a role that can purchase catalog offers. */
  canPurchase: boolean;
  /** Called when the modal should be dismissed (backdrop click, close button, Escape). */
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Human-readable labels for backend category enum values.
 * Mirrors OFFER_CATEGORIES in api.ts but keyed by value for O(1) lookup.
 */
const CATEGORY_LABELS: Record<string, string> = {
  food_beverage:   'Food & Beverage',
  fashion:         'Fashion',
  health_wellness: 'Health & Wellness',
  entertainment:   'Entertainment',
  travel:          'Travel',
  technology:      'Technology',
  education:       'Education',
  financial:       'Financial',
  home_living:     'Home & Living',
  other:           'Other',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Ambient gradient orbs rendered behind the modal panel.
 * Pure decoration; hidden from assistive technology via aria-hidden.
 */
function AmbientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent 70%)' }}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders an animated detail modal for a single catalog offer.
 *
 * Input:
 *   offer       - CatalogItem to display
 *   catalogMode - tenant's current activation state (inactive / sandbox / live)
 *   canPurchase - whether this user's role grants catalog purchase permission
 *   onClose     - dismiss callback
 *
 * Output: portal-style fixed overlay with the offer card.
 */
const OfferModal = ({ offer, catalogMode, canPurchase, onClose }: OfferModalProps) => {
  const { t, language } = useLanguage();
  const isLive = catalogMode === 'live';
  /** Only show the coupon tear-line and redemption section to eligible users. */
  const showRedeemSection = canPurchase;

  /** Ephemeral in-flight state for the mock "Redeem Now" button animation. */
  const [mockingRedeem, setMockingRedeem] = useState(false);
  /** Currently zoomed image URL, or null when the lightbox is closed. */
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  /** Ref for initial focus trap - close button is focused on mount. */
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus management + Escape listener + body scroll-lock.
  useEffect(() => {
    closeRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  /**
   * Simulates a redeem action with a 2-second processing state.
   * Replace with real PayMe checkout call when backend is wired up.
   */
  const handleMockRedeem = () => {
    setMockingRedeem(true);
    setTimeout(() => setMockingRedeem(false), 2000);
  };


  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={offer.title}
    >
      <AmbientOrbs />

      {/* ── Modal panel ─────────────────────────────────────────────── */}
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(15, 15, 25, 0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: 'offerSlideUp 0.3s ease-out',
        }}
      >
        {/* Close button - initial focus target for keyboard accessibility */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={t('om_closeLabel')}
        >
          &#x2715;
        </button>

        {/* ── Hero image carousel with bottom gradient fade ────────── */}
        <div className="relative h-52 w-full overflow-hidden">
          {(() => {
            // Prefer the multi-image gallery; fall back to legacy single
            // imageUrl so older offers (pre-gallery) keep rendering. Empty
            // gallery falls through to the gift emoji placeholder.
            const images = (offer.imageUrls && offer.imageUrls.length > 0)
              ? offer.imageUrls
              : (offer.imageUrl ? [offer.imageUrl] : []);
            if (images.length === 0) {
              return (
                <div
                  className="h-full w-full flex items-center justify-center text-6xl"
                  style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}
                >
                  🎁
                </div>
              );
            }
            return (
              <OfferImageCarousel
                images={images}
                alt={offer.title}
                onImageClick={(url) => setLightboxSrc(url)}
              />
            );
          })()}

          {/* Gradient that fades the image into the dark body. pointer-events-none
              so the carousel arrows + dots underneath stay clickable. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, transparent 40%, rgba(15,15,25,0.92) 100%)',
            }}
          />


          {/* Category chip - bottom-left of hero. Looked up against the
              shared OFFER_CATEGORIES list so the label follows the current
              language; falls back to the raw key when the offer carries a
              category not in the canonical list. */}
          <div className="absolute bottom-3 left-4">
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/80 backdrop-blur-sm">
              {(() => {
                const meta = OFFER_CATEGORIES.find((c) => c.value === offer.category);
                if (meta) return language === 'he' ? meta.labelHe : meta.label;
                return CATEGORY_LABELS[offer.category] ?? offer.category;
              })()}
            </span>
          </div>

          {/* Execution type badge - bottom-right of hero */}
          {offer.executionType && EXECUTION_TYPE_LABELS[offer.executionType] && (
            <div className="absolute bottom-3 right-4">
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/80 backdrop-blur-sm">
                {EXECUTION_TYPE_LABELS[offer.executionType].icon}{' '}
                {language === 'he' ? EXECUTION_TYPE_LABELS[offer.executionType].labelHe : EXECUTION_TYPE_LABELS[offer.executionType].label}
              </span>
            </div>
          )}
        </div>

        {/* ── Text body ─────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-xl font-bold text-white leading-tight">{offer.title}</h2>
          <RichTextDisplay
            html={offer.description}
            className="mt-2 text-sm text-white/70 leading-relaxed [&_*]:!text-white/70 [&_a]:!text-indigo-300"
          />

          {/* Price display. Voucher offers carry a member_price (what members
              actually pay); non-voucher offers carry market_price as the
              display reference. Only the selling price is shown - no
              original / strike-through reference. */}
          {(() => {
            const display = offer.market_price ?? offer.member_price ?? offer.face_value;
            if (display === undefined) return null;
            return (
              <div className="mt-5">
                <span className="text-4xl font-black text-white tracking-tight">
                  &#x20AA;{display}
                </span>
              </div>
            );
          })()}

          {/* Stock availability indicator - only shown when stock tracking is active */}
          {offer.stockLimit !== null && (
            <p className={`mt-2 text-sm font-medium ${(offer.stockAvailable ?? 0) <= 5 ? 'text-red-400' : 'text-white/50'}`}>
              {offer.isSoldOut
                ? t('om_soldOutIndicator')
                : offer.stockAvailable !== null && offer.stockAvailable <= 5
                  ? `⚠️ ${[t('om_stockOnly'), String(offer.stockAvailable), t('om_stockLeft')].filter(Boolean).join(' ')}`
                  : `${offer.stockAvailable} ${t('om_stockAvailable')}`}
            </p>
          )}
        </div>

        {/* ── Perforated coupon tear-line (visible only when user can redeem) ── */}
        {showRedeemSection && (
          <div className="mx-5 my-4 flex items-center">
            {/* Left notch */}
            <div className="h-4 w-4 -ml-9 rounded-full bg-black/60 shrink-0" />
            {/* Dashed line */}
            <div className="flex-1 border-t-2 border-dashed border-white/15 mx-1" />
            {/* Right notch */}
            <div className="h-4 w-4 -mr-9 rounded-full bg-black/60 shrink-0" />
          </div>
        )}

        {/* ── Redemption section ─────────────────────────────────────── */}
        {showRedeemSection ? (
          <div className="px-5 pb-6">
            <p className="mb-4 text-center text-xs text-white/40 uppercase tracking-widest">
              {t('om_redeemTitle')}
            </p>

            {isLive ? (
              // Live catalog: active redeem button wired to mock handler; disabled when sold out
              <button
                onClick={handleMockRedeem}
                disabled={mockingRedeem || offer.isSoldOut}
                className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                }}
              >
                {offer.isSoldOut ? t('om_soldOut') : mockingRedeem ? t('om_processing') : t('om_redeemNow')}
              </button>
            ) : (
              // Sandbox or inactive: show disabled "Coming Soon" state
              <button
                disabled
                className="w-full rounded-2xl py-4 text-base font-bold text-white/30 shadow-lg cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                aria-label={t('om_sandboxDisabledLabel')}
              >
                {t('om_comingSoon')}
              </button>
            )}

            <p className="mt-3 text-center text-xs text-white/30">
              {isLive ? t('om_secureCheckout') : t('om_sandboxMode')}
            </p>
          </div>
        ) : (
          // Admin / non-purchasing view: informational note only
          <div className="px-5 pb-6 pt-2">
            <p className="text-center text-xs text-white/30">
              {t('om_adminView')}
            </p>
          </div>
        )}
      </div>

      {/* Slide-up entry animation injected as a global keyframe */}
      <style>{`
        @keyframes offerSlideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Fullscreen lightbox. Rendered via portal inside ImageLightbox so it
          sits on top of the modal backdrop. Closes back to the modal, not the
          page, so the user keeps their place. */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={offer.title}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
};

export default OfferModal;
