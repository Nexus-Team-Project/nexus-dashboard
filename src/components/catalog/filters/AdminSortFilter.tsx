/**
 * Admin filter: sort mode selector.
 *
 * Renders a single `<select>` with the five sort modes the backend
 * accepts. Default ('newest') matches the legacy server behaviour
 * (createdAt desc), so emitting it is harmless if a user picks it
 * explicitly - the URL just omits the param.
 */
import { useLanguage } from '../../../i18n/LanguageContext';
import type { CatalogFilters } from '../catalogFilters';

interface AdminSortFilterProps {
  value: CatalogFilters['sort'];
  onChange: (next: CatalogFilters['sort']) => void;
}

/** Sort filter section for the admin catalog filter panel. */
export function AdminSortFilter({ value, onChange }: AdminSortFilterProps) {
  const { t } = useLanguage();
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('bp_filterSortLabel')}
      </legend>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CatalogFilters['sort'])}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="newest">{t('mc_filtersSortNewest')}</option>
        <option value="price_asc">{t('mc_filtersSortPriceAsc')}</option>
        <option value="price_desc">{t('mc_filtersSortPriceDesc')}</option>
        <option value="expiry_soon">{t('mc_filtersSortExpirySoon')}</option>
        <option value="expiry_far">{t('mc_filtersSortExpiryFar')}</option>
      </select>
    </fieldset>
  );
}
