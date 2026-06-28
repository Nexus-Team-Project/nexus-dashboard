/**
 * Pure date helpers for the voucher XLSX import.
 *
 * Excel files carry expiry dates in many shapes (US M/D/YYYY with a time,
 * D-MMM-YYYY, MM/DD/YYYY, or a raw Excel serial number). These helpers normalize
 * any of those to the `YYYY-MM-DD` string the inventory API/date inputs already
 * use, entirely client-side, so no backend or schema change is needed. A value
 * that cannot be parsed yields null, and the import then applies a 5-year
 * fallback (see `resolveUnitWindow`). All parsing is explicit (no locale-
 * dependent `new Date(string)`), so results are deterministic across browsers.
 */

/** Pads a 1-2 digit number to two characters. */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats Y/M/D integers as a `YYYY-MM-DD` string. */
function fmt(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** First-three-letter month-name lookup (case-insensitive), Jan=1..Dec=12. */
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * True when Y/M/D form a real calendar date (rejects month 13, day 31 of a
 * 30-day month, Feb 30, etc.). Used so a malformed cell falls to the fallback
 * rather than silently producing a wrong date.
 */
function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/** Excel's day-zero is 1899-12-30 (accounts for the 1900 leap-year bug). */
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
/** Upper bound on a plausible Excel serial (~year 9999) to avoid treating huge numbers as dates. */
const EXCEL_SERIAL_MAX = 2_958_465;

/**
 * Converts an Excel serial day-number to `YYYY-MM-DD`, or null when out of range.
 * Input: a positive integer-ish serial (fractional time part is ignored).
 */
function fromExcelSerial(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > EXCEL_SERIAL_MAX) return null;
  const ms = EXCEL_EPOCH_UTC + Math.floor(serial) * 86_400_000;
  const d = new Date(ms);
  return fmt(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Normalizes one raw Excel cell value to a `YYYY-MM-DD` expiry string.
 *
 * Input: the raw cell text (or number) from the mapped Date column.
 * Output: a `YYYY-MM-DD` string, or null when the value is empty or unparseable.
 * Supported: ISO `YYYY-MM-DD`(/`YYYY/MM/DD`), US `M/D/YYYY` (with optional time),
 *   `D-MMM-YYYY` (e.g. 28-Apr-2026), and Excel numeric serials.
 */
export function normalizeExpiry(raw: string | number | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '') return null;

  // Excel serial number (pure number, no separators).
  if (/^\d+(\.\d+)?$/.test(s)) {
    return fromExcelSerial(Number(s));
  }

  // ISO: YYYY-MM-DD or YYYY/MM/DD (optionally with a trailing time).
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    return isRealDate(+y, +mo, +d) ? fmt(+y, +mo, +d) : null;
  }

  // D-MMM-YYYY (e.g. 28-Apr-2026 / 8-Aug-2030), separators - or space.
  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})$/);
  if (m) {
    const [, d, monName, y] = m;
    const mo = MONTHS[monName.slice(0, 3).toLowerCase()];
    if (mo && isRealDate(+y, mo, +d)) return fmt(+y, mo, +d);
    return null;
  }

  // US M/D/YYYY with an optional time component (e.g. 8/31/2030 12:00:00 AM).
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s.*)?$/);
  if (m) {
    const [, mo, d, y] = m;
    return isRealDate(+y, +mo, +d) ? fmt(+y, +mo, +d) : null;
  }

  return null;
}

/** Adds `years` to a `YYYY-MM-DD` string, clamping an invalid day (e.g. Feb 29) down. */
function addYears(ymd: string, years: number): string {
  const [y, mo, d] = ymd.split('-').map(Number);
  const targetYear = y + years;
  // Clamp the day to the target month's length (handles Feb 29 -> Feb 28).
  const lastDay = new Date(Date.UTC(targetYear, mo, 0)).getUTCDate();
  return fmt(targetYear, mo, Math.min(d, lastDay));
}

/** A redeemable window for an imported unit (from_until type), as ISO date strings. */
export interface UnitWindow {
  validFrom: string;
  validUntil: string;
}

/**
 * Resolves one imported row's redeemable window.
 *
 * Input: the raw date cell and the import date (`YYYY-MM-DD`, e.g. today).
 * Output: { validFrom, validUntil } where validFrom is the import date and
 *   validUntil is the parsed expiry, or import-date + 5 years when the cell is
 *   missing/blank/unparseable. Per-row, so one bad cell never blocks the import.
 */
export function resolveUnitWindow(
  raw: string | number | null | undefined,
  importDate: string,
): UnitWindow {
  const parsed = normalizeExpiry(raw);
  return {
    validFrom: importDate,
    validUntil: parsed ?? addYears(importDate, 5),
  };
}
