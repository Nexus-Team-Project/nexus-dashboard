/**
 * OfferTypeBadge: modern type label for catalog offers.
 *
 * Visual design choice (Linear/Vercel/Stripe inspired):
 *   - No outline pill. Instead a small filled rounded square holding a white
 *     SVG icon, followed by the localised label in regular text.
 *   - Each execution type gets its own gradient so the badge reads instantly
 *     by colour without leaning on emoji or generic indigo tints.
 *   - Bilingual via EXECUTION_TYPE_LABELS + useLanguage.
 *
 * Used by the BenefitsPartnerships admin cards.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { EXECUTION_TYPE_LABELS } from '../../lib/api';

export interface OfferTypeBadgeProps {
  /** Execution type string from the catalog item (e.g. 'voucher', 'coupon'). */
  executionType: string;
  /** Visual density. 'sm' for compact card overlays, 'md' for prominent slots. */
  size?: 'sm' | 'md';
  /** Optional extra Tailwind classes appended to the wrapper. */
  className?: string;
}

/**
 * Per-type icon-square theme. Gradient gives subtle depth without crossing
 * into skeuomorphic territory; ring matches the base hue at low opacity for
 * polish in both light and dark modes.
 */
const ICON_THEMES: Record<string, { gradient: string; ring: string }> = {
  voucher:   { gradient: 'bg-gradient-to-br from-indigo-500 to-violet-600',  ring: 'ring-indigo-500/20' },
  coupon:    { gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',   ring: 'ring-emerald-500/20' },
  gift_card: { gradient: 'bg-gradient-to-br from-rose-500 to-pink-600',      ring: 'ring-rose-500/20' },
  product:   { gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',   ring: 'ring-amber-500/20' },
  service:   { gradient: 'bg-gradient-to-br from-sky-500 to-blue-600',       ring: 'ring-sky-500/20' },
};

const FALLBACK_THEME = { gradient: 'bg-gradient-to-br from-slate-500 to-slate-700', ring: 'ring-slate-400/20' };

/**
 * Inline SVG icon for a given execution type, rendered in white over the
 * coloured square. Inline so the component does not depend on any icon font.
 */
function TypeIcon({ executionType, className }: { executionType: string; className: string }) {
  switch (executionType) {
    case 'voucher':
      // Ticket
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5a.75.75 0 01.75.75v2.25a2.25 2.25 0 100 4.5v2.25a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75v-2.25a2.25 2.25 0 100-4.5V7.5a.75.75 0 01.75-.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.75v4.5" />
        </svg>
      );
    case 'coupon':
      // Percent
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m-6 0h.008v.008H9V8.25zm6 6h.008v.008H15v-.008z" />
        </svg>
      );
    case 'gift_card':
      // Gift
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case 'product':
      // Box / cube
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      );
    case 'service':
      // Bolt
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    default:
      // Tag (fallback)
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      );
  }
}

/**
 * Renders the offer-type chip.
 *
 * Input: executionType string, optional size + className.
 * Output: an inline-flex element containing a coloured icon square + the
 * localised label as plain text. No outline pill.
 */
export default function OfferTypeBadge({
  executionType,
  size = 'sm',
  className,
}: OfferTypeBadgeProps) {
  const { language } = useLanguage();
  const meta = EXECUTION_TYPE_LABELS[executionType];
  if (!meta) return null;

  const theme = ICON_THEMES[executionType] ?? FALLBACK_THEME;
  const squareSize = size === 'md' ? 'w-7 h-7' : 'w-6 h-6';
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  const label = language === 'he' ? meta.labelHe : meta.label;

  return (
    <span
      className={['inline-flex items-center gap-2', className ?? ''].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'flex items-center justify-center rounded-md text-white shadow-sm ring-1',
          squareSize,
          theme.gradient,
          theme.ring,
        ].join(' ')}
      >
        <TypeIcon executionType={executionType} className={iconSize} />
      </span>
      <span className={['font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap', textSize].join(' ')}>
        {label}
      </span>
    </span>
  );
}
