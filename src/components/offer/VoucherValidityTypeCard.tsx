/**
 * VoucherValidityTypeCard: the voucher-only, parent-level control that picks the
 * offer's DEFAULT validity TYPE - either a purchase-anchored "limit" (e.g. valid
 * 5 years from purchase) or an absolute "from-until" window. It applies to every
 * variant unless a variant overrides it in its VariantBuilder, mirroring the
 * shared redemption-text pattern. The actual date/limit VALUE is entered per
 * inventory unit (voucher-validity-dating), not here. Controlled by the parent;
 * reuses existing form tokens.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import FieldTooltip from '../FieldTooltip';

interface VoucherValidityTypeCardProps {
  /** The offer default validity type. */
  value: 'limit' | 'from_until';
  setValue: (v: 'limit' | 'from_until') => void;
  isSubmitting?: boolean;
}

/** Renders the parent-level validity-type chooser. */
export default function VoucherValidityTypeCard({
  value, setValue, isSubmitting = false,
}: VoucherValidityTypeCardProps) {
  const { t } = useLanguage();
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
      <h2 className="mb-1 flex items-center gap-1.5 text-base font-semibold text-slate-800 dark:text-white">
        {t('co_validityTypeCardTitle')}
        <FieldTooltip fieldKey="validityType" />
      </h2>
      <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">{t('co_validityTypeCardHint')}</p>
      <div className="inline-flex gap-1 rounded-lg border border-slate-200 p-0.5 dark:border-slate-700" role="group" aria-label={t('co_validityTypeCardTitle')}>
        {([
          { v: 'limit', label: t('co_validityTypeLimit') },
          { v: 'from_until', label: t('co_validityTypeFromUntil') },
        ] as const).map((opt) => (
          <button
            key={opt.v} type="button" disabled={isSubmitting}
            onClick={() => setValue(opt.v)}
            aria-pressed={value === opt.v}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${value === opt.v ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </section>
  );
}
