/**
 * OfferTypeField: the offer-type ("סוג הצעה / Offer type") selector, rendered
 * as the FIRST card on the Create/Edit Offer form — above the image gallery —
 * so the rest of the form (images, pricing, expiry) can adapt to the chosen
 * type (e.g. a voucher gets a single image + a purchase-anchored validity).
 *
 * Controlled by the parent: value + onChange. The parent's onChange may also
 * run side effects (e.g. trimming the gallery to one image when switching to
 * voucher). Styling reuses the existing form card + input tokens; no new design.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { EXECUTION_TYPE_LABELS } from '../../lib/api';
import FieldTooltip from '../FieldTooltip';

interface OfferTypeFieldProps {
  /** Currently selected execution type value. */
  value: string;
  /** Called with the new execution type when the user changes the select. */
  onChange: (next: string) => void;
  /** Disables the control while the parent form is submitting. */
  disabled?: boolean;
}

/**
 * Renders the offer-type selector card.
 *
 * Input: value (current executionType), onChange, disabled.
 * Output: a card with the bilingual label + a select listing every
 *         EXECUTION_TYPE_LABELS option.
 */
export default function OfferTypeField({ value, onChange, disabled = false }: OfferTypeFieldProps) {
  const { t, language } = useLanguage();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
      <label
        htmlFor="offer-execution-type"
        className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {t('co_fieldOfferType')} <span className="text-red-500 ms-0.5" aria-hidden="true">*</span>
        <FieldTooltip fieldKey="executionType" />
      </label>
      <select
        id="offer-execution-type"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {Object.entries(EXECUTION_TYPE_LABELS).map(([optValue, { label, labelHe, icon }]) => (
          <option key={optValue} value={optValue}>
            {icon} {language === 'he' ? labelHe : label}
          </option>
        ))}
      </select>
    </section>
  );
}
