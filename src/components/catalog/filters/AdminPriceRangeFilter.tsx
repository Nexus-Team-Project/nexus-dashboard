/**
 * Admin filter: inclusive price range (min, max).
 *
 * Two number inputs that coerce empty to `null` (not '') because the
 * shared CatalogFilters shape uses `number | null` for these bounds.
 * Wheel events blur the input so mouse-wheel can't silently bump the
 * value when scrolling the panel.
 */
import { useLanguage } from '../../../i18n/LanguageContext';

interface AdminPriceRangeFilterProps {
  min: number | null;
  max: number | null;
  onChange: (next: { min: number | null; max: number | null }) => void;
}

/** Min/max price range filter section. */
export function AdminPriceRangeFilter({ min, max, onChange }: AdminPriceRangeFilterProps) {
  const { t } = useLanguage();

  const parse = (raw: string): number | null => (raw === '' ? null : Number(raw));

  const inputCls =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('bp_filterPriceLabel')}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={min ?? ''}
          onChange={(e) => onChange({ min: parse(e.target.value), max })}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder={t('bp_filterPriceMin')}
          aria-label={t('bp_filterPriceMin')}
          className={inputCls}
        />
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={max ?? ''}
          onChange={(e) => onChange({ min, max: parse(e.target.value) })}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder={t('bp_filterPriceMax')}
          aria-label={t('bp_filterPriceMax')}
          className={inputCls}
        />
      </div>
    </fieldset>
  );
}
