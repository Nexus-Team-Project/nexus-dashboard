/**
 * Admin filter: hide sold-out offers toggle.
 *
 * When ON, the backend adds a stock-availability clause to the query
 * (stockLimit null OR stockUsed < stockLimit). When OFF (default),
 * sold-out offers stay visible.
 */
import { useLanguage } from '../../../i18n/LanguageContext';

interface AdminInStockToggleFilterProps {
  value: boolean;
  onChange: (next: boolean) => void;
}

/** In-stock toggle filter section. */
export function AdminInStockToggleFilter({ value, onChange }: AdminInStockToggleFilterProps) {
  const { t } = useLanguage();
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('bp_filterInStockLabel')}
      </legend>
      <label className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
        <span className="text-sm text-slate-700 dark:text-slate-200">
          {t('bp_filterInStockOnly')}
        </span>
        <span dir="ltr" className="relative inline-flex h-6 w-11 shrink-0 items-center">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
            aria-label={t('bp_filterInStockOnly')}
          />
          <span className="block h-full w-full rounded-full bg-slate-300 transition peer-checked:bg-[#635bff] dark:bg-slate-600" />
          <span className="absolute start-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
      </label>
    </fieldset>
  );
}
