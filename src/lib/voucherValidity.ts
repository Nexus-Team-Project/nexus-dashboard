/**
 * Shared per-variant validity formatting.
 *
 * A voucher variant's validity is EITHER a purchase-anchored duration
 * (voucherValidityValue + Unit) OR an absolute date range (validFrom/validUntil).
 * This renders whichever mode the variant uses into a short, RTL-safe string:
 * "2 years" for duration, "01/01/2026 - 31/03/2026" for a date range, and "" when
 * the variant never expires. Used by the benefits-partnerships variant table and
 * the product-catalog OfferModal so both read the same.
 */
import type { TranslationKey } from '../i18n/translations';

/** Minimal variant shape needed to format validity (both modes). */
interface ValidityFields {
  voucherValidityValue?: number | null;
  voucherValidityUnit?: 'days' | 'months' | 'years' | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

const UNIT_KEYS = {
  days: 'co_validityUnitDays',
  months: 'co_validityUnitMonths',
  years: 'co_validityUnitYears',
} as const;

/** Formats an ISO date as dd/mm/yyyy in the active locale, or '' when unparseable. */
function fmtDate(iso: string | null | undefined, language: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d);
}

/**
 * Returns the variant's validity as display text.
 * Input: the variant's validity fields, the translator, and the active language.
 * Output: duration text, an LTR-isolated date range, or '' when never expiring.
 */
export function variantValidityText(
  v: ValidityFields,
  t: (key: TranslationKey) => string,
  language: string,
): string {
  if (v.validFrom || v.validUntil) {
    const from = fmtDate(v.validFrom, language);
    const until = fmtDate(v.validUntil, language);
    if (from && until) return `${String.fromCharCode(0x2066)}${from} - ${until}${String.fromCharCode(0x2069)}`; // LTR-isolated pair for RTL
    return from || until;
  }
  if (v.voucherValidityValue && v.voucherValidityUnit) {
    return `${v.voucherValidityValue} ${t(UNIT_KEYS[v.voucherValidityUnit])}`;
  }
  return '';
}
