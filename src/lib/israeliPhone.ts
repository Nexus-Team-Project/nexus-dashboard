/**
 * Israeli phone number normalization helper (frontend mirror of the backend).
 * Accepts inputs with or without the +972 country code and with common
 * formatting characters, and returns the canonical local "05XXXXXXXX" form.
 *
 * Examples of accepted input -> normalized output:
 *   "0508465858"      -> "0508465858"
 *   "+972508465858"   -> "0508465858"
 *   "972-50-846-5858" -> "0508465858"
 *   "050 846 5858"    -> "0508465858"
 *
 * Anything that does not resolve to a 10-digit number starting with "05"
 * returns null.
 */

/**
 * Normalizes a raw phone string into the canonical Israeli mobile format.
 * Input: arbitrary user-supplied phone string (may be empty / undefined).
 * Output: canonical "05XXXXXXXX" string when valid, otherwise null.
 */
export function normalizeIsraeliPhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const compact = trimmed.replace(/[^\d+]/g, '');

  let local: string;
  if (compact.startsWith('+972')) {
    local = '0' + compact.slice(4);
  } else if (compact.startsWith('972')) {
    local = '0' + compact.slice(3);
  } else {
    local = compact;
  }

  if (!/^05\d{8}$/.test(local)) return null;
  return local;
}

/**
 * Boolean wrapper around normalizeIsraeliPhone for inline validation checks.
 * Input: raw phone string.
 * Output: true when the input can be normalized to a valid Israeli mobile.
 */
export function isIsraeliPhone(raw: string | undefined | null): boolean {
  return normalizeIsraeliPhone(raw) !== null;
}
