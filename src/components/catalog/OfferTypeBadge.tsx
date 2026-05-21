/**
 * OfferTypeBadge: small pill that renders the offer execution type in a
 * type-specific colour with an inline SVG icon and a bilingual label.
 *
 * Used on the BenefitsPartnerships admin cards (featured + regular grids)
 * so the badge looks intentional instead of a generic indigo pill with an
 * emoji. Keeps the same EXECUTION_TYPE_LABELS source so legacy code that
 * still uses the emoji fallback continues to work.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { EXECUTION_TYPE_LABELS } from '../../lib/api';

export interface OfferTypeBadgeProps {
  /** Execution type string from the catalog item (e.g. 'voucher', 'coupon'). */
  executionType: string;
  /** Visual density. 'sm' for compact card overlays, 'md' for prominent slots. */
  size?: 'sm' | 'md';
  /** Optional extra Tailwind classes appended to the pill. */
  className?: string;
}

/** Theme tokens per execution type. Kept inline so the file stays single-purpose. */
const THEMES: Record<string, { ring: string; bg: string; text: string }> = {
  voucher:   { ring: 'ring-indigo-200',   bg: 'bg-indigo-50',   text: 'text-indigo-700' },
  coupon:    { ring: 'ring-emerald-200',  bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  gift_card: { ring: 'ring-rose-200',     bg: 'bg-rose-50',     text: 'text-rose-700' },
  product:   { ring: 'ring-amber-200',    bg: 'bg-amber-50',    text: 'text-amber-700' },
  service:   { ring: 'ring-sky-200',      bg: 'bg-sky-50',      text: 'text-sky-700' },
};

const FALLBACK_THEME = { ring: 'ring-slate-200', bg: 'bg-slate-50', text: 'text-slate-700' };

/**
 * Returns the inline SVG icon for a given execution type. Inline so the
 * component does not depend on any icon font (the project already drops
 * material-symbols-outlined in some places).
 */
function TypeIcon({ executionType, className }: { executionType: string; className: string }) {
  switch (executionType) {
    case 'voucher':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5a.75.75 0 01.75.75v2.25a2.25 2.25 0 100 4.5v2.25a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75v-2.25a2.25 2.25 0 100-4.5V7.5a.75.75 0 01.75-.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.75v4.5" />
        </svg>
      );
    case 'coupon':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m-6 0h.008v.008H9V8.25zm6 6h.008v.008H15v-.008z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.457c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.457c.356.132.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        </svg>
      );
    case 'gift_card':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case 'product':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case 'service':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      );
  }
}

/**
 * Renders the offer-type pill.
 *
 * Input: executionType string, optional size + className.
 * Output: a span with type-specific colour ring + icon + bilingual label.
 */
export default function OfferTypeBadge({
  executionType,
  size = 'sm',
  className,
}: OfferTypeBadgeProps) {
  const { language } = useLanguage();
  const meta = EXECUTION_TYPE_LABELS[executionType];
  if (!meta) return null;

  const theme = THEMES[executionType] ?? FALLBACK_THEME;
  const padding = size === 'md' ? 'px-3 py-1' : 'px-2.5 py-0.5';
  const textSize = size === 'md' ? 'text-xs' : 'text-[11px]';
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const label = language === 'he' ? meta.labelHe : meta.label;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1',
        padding,
        textSize,
        theme.bg,
        theme.text,
        theme.ring,
        className ?? '',
      ].join(' ')}
    >
      <TypeIcon executionType={executionType} className={iconSize} />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}
