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
