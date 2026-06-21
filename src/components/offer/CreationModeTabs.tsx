/**
 * CreationModeTabs: the Manual | CSV-bulk segmented control shown on the Create
 * Offer page for vouchers. Presentational only — the parent owns the mode.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';

export type CreateMode = 'manual' | 'csv';

interface CreationModeTabsProps {
  mode: CreateMode;
  onChange: (m: CreateMode) => void;
  disabled?: boolean;
}

export default function CreationModeTabs({ mode, onChange, disabled = false }: CreationModeTabsProps) {
  const { t } = useLanguage();
  const tabs: { key: CreateMode; label: string }[] = [
    { key: 'manual', label: t('vb_modeManual') },
    { key: 'csv', label: t('vb_modeCsv') },
  ];
  return (
    <div
      className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-card-dark"
      role="tablist"
      aria-label={t('vb_modeManual')}
    >
      {tabs.map((tb) => {
        const active = mode === tb.key;
        return (
          <button
            key={tb.key}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(tb.key)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              active
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            {tb.label}
          </button>
        );
      })}
    </div>
  );
}
