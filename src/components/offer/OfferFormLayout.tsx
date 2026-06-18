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
 * Generic organization placeholder used in the banner chip and as the banner
 * background when the offer has no cover image yet. Hosted on Cloudinary so
 * it survives without a third-party origin and matches the backend's
 * `defaultOfferImageUrl()` placeholder (same asset path).
 */
const DEFAULT_ORGANIZATION_IMAGE_URL =
  'https://res.cloudinary.com/dyqjvjdlq/image/upload/v1778753218/9c6425d4-63bb-48ef-9a95-f6c48911e8ee_mj6eqm.png';

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
  error,
  denialReason,
  leftColumn,
  rightColumn,
}: OfferFormLayoutProps) {
  const { t } = useLanguage();

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
          {/* Top bar: back button + breadcrumb + Cancel/Save */}
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

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium border border-white/40 text-white rounded-xl hover:bg-white/10 backdrop-blur-sm transition-colors disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSubmitting}
                className={cn(
                  'px-6 py-2 text-sm font-semibold bg-white text-slate-900 rounded-xl shadow-lg transition-opacity',
                  isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90',
                )}
              >
                {isSubmitting ? t('of_saving') : saveLabel}
              </button>
            </div>
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
          <div className={cn(
            'col-span-12 space-y-6',
            rightColumn ? 'lg:col-span-8' : 'lg:col-span-12',
          )}>{leftColumn}</div>
          {rightColumn && (
            <aside className="col-span-12 lg:col-span-4 space-y-6">{rightColumn}</aside>
          )}
        </div>
      </main>
    </div>
  );
}
