/**
 * Shared voucher validity-type labelling.
 *
 * Under the unit-level dating model (voucher-validity-dating) a voucher's validity
 * VALUE lives on each inventory unit, not the offer/variant - so the catalog and
 * admin surfaces no longer render a per-variant date here. They show the validity
 * TYPE instead: a purchase-anchored "limit" or an absolute "from-until" window.
 * The exact dates per code are viewed in the inventory-management surface.
 */
import type { TranslationKey } from '../i18n/translations';

/** A voucher validity type, or null when none is set (non-voucher / unmigrated). */
export type ValidityTypeValue = 'limit' | 'from_until' | null | undefined;

/** The validity-bearing fields of an inventory unit (subset of InventoryUnitView). */
export interface UnitValidityFields {
  validityValue?: number | null;
  validityUnit?: 'days' | 'months' | 'years' | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

/**
 * Formats one inventory unit's concrete validity for display: an absolute
 * "from - until" window (LRI/PDI wrapped so the date pair never reorders in
 * RTL) for a from_until unit, or "N <unit>" for a purchase-anchored limit unit.
 * Input: the unit's validity fields + the translator.
 * Output: the formatted string, or '' when neither window nor limit is set.
 */
export function formatUnitValidity(
  u: UnitValidityFields,
  t: (key: TranslationKey) => string,
): string {
  if (u.validFrom && u.validUntil) {
    const f = u.validFrom.slice(0, 10);
    const v = u.validUntil.slice(0, 10);
    return `⁦${f} - ${v}⁩`;
  }
  if (u.validityValue && u.validityUnit) {
    const unit = u.validityUnit === 'days'
      ? t('co_validityUnitDays')
      : u.validityUnit === 'months'
        ? t('co_validityUnitMonths')
        : t('co_validityUnitYears');
    return `${u.validityValue} ${unit}`;
  }
  return '';
}

/**
 * Returns a short localized label for a validity type, or '' when none is set.
 * Input: the effective validity type and the translator. Output: label text.
 */
export function validityTypeLabel(
  effType: ValidityTypeValue,
  t: (key: TranslationKey) => string,
): string {
  if (effType === 'limit') return t('co_validityTypeLimit');
  if (effType === 'from_until') return t('co_validityTypeFromUntil');
  return '';
}

/**
 * Formats an ISO date string (`YYYY-MM-DD...`) as `dd/mm/yy` for display, so the
 * only hyphen on screen is the separator between a from/until pair. Returns '-'
 * for an empty value. Display only - do not feed this to a date <input>.
 */
export function formatDmy(iso: string | null | undefined): string {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso.slice(0, 10);
  return `${d}/${m}/${y.slice(2)}`;
}
