/**
 * Admin filter: single date boundary (e.g. validFromAfter or validUntilBefore).
 *
 * The backend contract takes only one bound per side, so each
 * boundary is rendered as a single date input rather than a range.
 * Reused for both start-date and expiry inputs by passing a
 * different `labelKey`.
 */
import { useLanguage } from '../../../i18n/LanguageContext';

/**
 * i18n keys this widget is allowed to render. Narrowed to a literal
 * union so the translation function's strict signature is satisfied
 * without casting at the call site.
 */
type DateBoundaryLabelKey = 'bp_filterValidFromAfter' | 'bp_filterValidUntilBefore';

interface AdminDateBoundaryFilterProps {
  /** i18n key for the legend label. One of the two allowed boundary labels. */
  labelKey: DateBoundaryLabelKey;
  value: string;
  onChange: (next: string) => void;
}

/** Date boundary filter section. One date input + a localized legend. */
export function AdminDateBoundaryFilter({ labelKey, value, onChange }: AdminDateBoundaryFilterProps) {
  const { t } = useLanguage();

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t(labelKey)}
      </legend>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t(labelKey)}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </fieldset>
  );
}
