/**
 * RedemptionScopeToggle: a single control that decides whether a voucher's
 * redemption terms (תנאי מימוש) AND method (אופן מימוש) are authored once on the
 * parent ("Same for all variants") or per variant ("Different per variant").
 * The two fields always move together - there is no way to split them.
 *
 * Voucher-only. Controlled by the parent via a `'shared' | 'per_variant'` value.
 * Styling reuses the existing segmented-control tokens (see VoucherStackToggle);
 * no new design language.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';

/** Where redemption terms + method live. */
export type RedemptionScope = 'shared' | 'per_variant';

interface RedemptionScopeToggleProps {
  /** Current scope. */
  value: RedemptionScope;
  /** Called with the new scope when the user switches. */
  onChange: (next: RedemptionScope) => void;
  /** Disables the control while the parent form is submitting. */
  disabled?: boolean;
}

/**
 * Renders the shared "Same for all / Different per variant" segmented control.
 * Input: value, onChange, disabled. Output: a labeled two-button control.
 */
export default function RedemptionScopeToggle({ value, onChange, disabled = false }: RedemptionScopeToggleProps) {
  const { t } = useLanguage();

  const options: { key: RedemptionScope; label: string }[] = [
    { key: 'shared', label: t('co_redemptionScopeShared') },
    { key: 'per_variant', label: t('co_redemptionScopePerVariant') },
  ];

  return (
    <div className="mb-4">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
        {t('co_redemptionScopeLabel')}
      </span>
      <div className="inline-flex gap-2" role="group" aria-label={t('co_redemptionScopeLabel')}>
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
                'rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
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
      <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{t('co_redemptionScopeHint')}</p>
    </div>
  );
}
