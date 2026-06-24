/**
 * OfferFormLayout: shared full-page shell for the Create Offer and Edit Offer
 * pages. Owns the hero banner (cover image, breadcrumb, Save/Cancel buttons,
 * top-right business chip) and the 12-column main grid that hosts the left
 * card stack and the right sidebar cards.
 *
 * Visual reference: `image.png` at the repo root + `EditBenefit.tsx` mock.
 * Statistics card and "Edit with AI" button from the mock are intentionally
 * omitted — explicit product decision.
 *
 * The layout is full-bleed (no max-w-7xl). It is consumed inside the existing
 * DashboardLayout so it sits below the global navbar; the negative top margin
 * pulls the main grid up over the banner for the floating-card effect.
 */
import { type ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';

/**
 * Default offer placeholder shown in the banner background and thumbnail when
 * the offer has no cover image and no cover color yet.
 *
 * The cloud name comes from the public `VITE_CLOUDINARY_CLOUD_NAME` env var so
 * dev and prod each serve their own account's copy of the asset. Only the cloud
 * name is used - it is NOT a secret (it appears in every Cloudinary delivery
 * URL); the api key/secret stay backend-only. Falls back to the dev cloud when
 * the var is unset (local dev convenience). Version-less, so re-uploading the
 * asset swaps the image with no code change. Matches backend `defaultOfferImageUrl()`.
 */
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? 'dyqjvjdlq';
const DEFAULT_ORGANIZATION_IMAGE_URL =
  `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/nexus/defaults/offer-placeholder.png`;

interface OfferFormLayoutProps {
  /** Page title shown in the breadcrumb and inside the banner business chip. */
  title: string;
  /** Optional supplier/business name shown to the right of the cover thumbnail. */
  businessName?: string;
  /**
   * Cover image URL used for the blurred banner background and the top-right
   * thumbnail. Falls back to a generic gradient when undefined.
   */
  coverUrl?: string;
  /**
   * Optional solid cover color ("#rrggbb") used for the banner + thumbnail when
   * there is no `coverUrl` (e.g. a voucher whose background is a color). Ignored
   * when `coverUrl` is set. Falls back to the default image when both are unset.
   */
  coverColor?: string;
  /** Save button label. */
  saveLabel: string;
  /** Cancel button label. */
  cancelLabel: string;
  /** Submit handler — bound to the Save button. */
  onSave: () => void;
  /** Cancel handler — bound to Cancel button + back-arrow. */
  onCancel: () => void;
  /** Disables Save while a request is in flight. */
  isSubmitting?: boolean;
  /** Hide the hero Save button (e.g. CSV bulk mode publishes from its own UI). */
  hideSave?: boolean;
  /** Disables Save without an in-flight request (e.g. a required step not done). */
  saveDisabled?: boolean;
  /** Tooltip explaining why Save is disabled (shown on the button when saveDisabled). */
  saveHint?: string;
  /** Optional error string rendered as a sticky banner above the grid. */
  error?: string | null;
  /** Optional denial-reason banner (Edit page resubmit flow). */
  denialReason?: string | null;
  /** Left column content — main form cards. */
  leftColumn: ReactNode;
  /** Right column content — sidebar cards. */
  rightColumn: ReactNode;
}

/**
 * Renders the page chrome and slots the two column trees into the grid.
 * Inputs are described above. Output is the full page JSX.
 */
export default function OfferFormLayout({
  title,
  businessName,
  coverUrl,
  coverColor,
  saveLabel,
  cancelLabel,
  onSave,
  onCancel,
  isSubmitting = false,
  hideSave = false,
  saveDisabled = false,
  saveHint,
  error,
  denialReason,
  leftColumn,
  rightColumn,
}: OfferFormLayoutProps) {
  const { t } = useLanguage();

  // Cancel + Publish/Save group. Rendered identically in the hero top bar and in
  // the bottom action bar (same design in both places). The disabled reason shows
  // only as a hover tooltip on the Save button (no inline text).
  const actionButtons = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-5 py-2 text-sm font-medium border border-white/40 text-white rounded-xl hover:bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-60"
      >
        {cancelLabel}
      </button>
      {!hideSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={isSubmitting || saveDisabled}
          title={saveDisabled && saveHint ? saveHint : undefined}
          className={cn(
            'px-6 py-2 text-sm font-semibold bg-white text-slate-900 rounded-xl shadow-lg transition-opacity',
            isSubmitting || saveDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90',
          )}
        >
          {isSubmitting ? t('of_saving') : saveLabel}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <header className="relative h-[250px] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={
            coverUrl
              ? { backgroundImage: `url(${coverUrl})`, filter: 'blur(8px)', transform: 'scale(1.1)' }
              : coverColor
                ? { backgroundColor: coverColor }
                : { backgroundImage: `url(${DEFAULT_ORGANIZATION_IMAGE_URL})`, filter: 'blur(8px)', transform: 'scale(1.1)' }
          }
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-slate-900/70"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />

        <div className="relative h-full">
          {/* Top bar: back button + breadcrumb + Cancel/Publish (also duplicated
              at the bottom of the page). */}
          <div className="px-4 sm:px-8 py-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onCancel}
                aria-label={cancelLabel}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white rtl:rotate-180">
                  <path fillRule="evenodd" d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="flex items-center gap-2 text-sm text-white/90 min-w-0">
                <span className="truncate">{t('of_breadcrumbRoot')}</span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 rtl:rotate-180">
                  <path fillRule="evenodd" d="M7.22 14.78a.75.75 0 0 1 0-1.06L10.94 10 7.22 6.28a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-white truncate">{title}</span>
              </div>
            </div>
            {actionButtons}
          </div>

          {/* Business chip: pinned to the BOTTOM-end of the banner so it never
              collides with the top-bar's breadcrumb (which sits at the same
              logical-start side in RTL). `end-*` is direction-aware so the chip
              flips to the visual end of the banner in both RTL and LTR, mirroring
              the EditBenefit mock. */}
          <div className="absolute bottom-5 start-4 sm:start-8 hidden md:flex items-center gap-4 max-w-[360px]">
            <div className="min-w-0 text-start">
              <h1 className="text-xl lg:text-2xl font-bold text-white drop-shadow-lg truncate">
                {businessName ?? title}
              </h1>
              <p className="text-white/90 text-sm drop-shadow truncate">{title}</p>
            </div>
            <div className="w-16 h-16 lg:w-20 lg:h-20 shrink-0 bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white flex items-center justify-center">
              {!coverUrl && coverColor ? (
                <div aria-hidden className="w-full h-full" style={{ backgroundColor: coverColor }} />
              ) : (
                <img
                  src={coverUrl ?? DEFAULT_ORGANIZATION_IMAGE_URL}
                  alt=""
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Optional banners ──────────────────────────────────────────────── */}
      {denialReason && (
        <div className="px-4 sm:px-8 -mt-4 relative z-10">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <strong className="font-semibold">{t('of_denialReasonTitle')}: </strong>
            {denialReason}
          </div>
        </div>
      )}
      {error && (
        <div className="px-4 sm:px-8 mt-4 relative z-10">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <main className="relative px-4 sm:px-8 pt-6 pb-12">
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          <div className="col-span-12 space-y-6 lg:col-span-8">{leftColumn}</div>
          {/* Sidebar column: optional right-column cards plus, pinned to the bottom
              of the column, the Cancel + Publish action bar (`lg:mt-auto` pushes it
              down; the grid stretches this column to the form's height). Always
              rendered so the bar has a home even when a page passes no rightColumn
              (e.g. EditOffer). */}
          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {rightColumn}
            {/* Action bar: same Cancel + Publish/Save group as the hero. The buttons
                use the white-on-dark hero design, so the bar reuses the hero gradient
                tokens to keep that design legible. */}
            <div className="flex items-center justify-end rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-4 shadow-sm sm:px-6 lg:mt-auto">
              {actionButtons}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
