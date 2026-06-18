/**
 * VoucherStackToggle: the mandatory "combine with other promotions / כפל מבצעים"
 * choice for voucher offers. It is a deliberate Yes/No with NO default — the
 * parent form blocks submit until the supplier picks one, and the backend
 * rejects a voucher created/updated without it.
 *
 * Controlled by the parent via a `'' | 'yes' | 'no'` value (empty = not yet
 * chosen). Rendered only for vouchers. Styling reuses existing form tokens;
 * no new design language.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import FieldTooltip from '../FieldTooltip';

/** Tri-state form value: empty string means the supplier has not chosen yet. */
export type StackChoice = '' | 'yes' | 'no';

interface VoucherStackToggleProps {
  /** Current choice ('' = unselected, blocks submit). */
  value: StackChoice;
  /** Called with the new choice when the user picks Yes or No. */
  onChange: (next: StackChoice) => void;
  /** Disables both buttons while the parent form is submitting. */
  disabled?: boolean;
}

/**
 * Renders the combine-with-promotions Yes/No segmented control.
 *
 * Input: value (current choice), onChange, disabled.
 * Output: a labeled, tooltipped two-button control with no preselection.
 */
export default function VoucherStackToggle({ value, onChange, disabled = false }: VoucherStackToggleProps) {
  const { t } = useLanguage();

  const options: { key: 'yes' | 'no'; label: string }[] = [
    { key: 'yes', label: t('co_voucherStackableYes') },
    { key: 'no', label: t('co_voucherStackableNo') },
  ];

  return (
    <div className="mb-4">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
        {t('co_fieldVoucherStackable')} <span className="text-red-500 ms-0.5" aria-hidden="true">*</span>
        <FieldTooltip fieldKey="voucherStackable" />
      </span>
      <div className="inline-flex gap-2" role="group" aria-label={t('co_fieldVoucherStackable')}>
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(opt.key)}
              className={cn(
                'min-w-[5rem] rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                active
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
