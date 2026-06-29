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

  // D-MMM-YYYY (e.g. 28-Apr-2026 / 8-Aug-2030), 2- or 4-digit year, sep - or space.
  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{2}|\d{4})$/);
  if (m) {
    const [, d, monName, y] = m;
    const mo = MONTHS[monName.slice(0, 3).toLowerCase()];
    const year = fullYear(y);
    if (mo && isRealDate(year, mo, +d)) return fmt(year, mo, +d);
    return null;
  }

  // US M/D/Y with an optional time component (e.g. 8/31/2030 12:00:00 AM), 2- or 4-digit year.
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s.*)?$/);
  if (m) {
    const [, mo, d, y] = m;
    const year = fullYear(y);
    return isRealDate(year, +mo, +d) ? fmt(year, +mo, +d) : null;
  }

  return null;
}

/** Expands a 2-digit year to 20YY; leaves a 4-digit year as-is. */
function fullYear(y: string): number {
  return y.length === 2 ? 2000 + Number(y) : Number(y);
}

/** A validity unit for the `limit` (duration-from-purchase) recipe. */
export type ValidityUnit = 'days' | 'months' | 'years';

/** A parsed duration: an amount plus its unit. */
export interface ParsedDuration {
  value: number;
  unit: ValidityUnit;
}

/** Maps a duration unit word (EN + HE, with single-letter aliases) to a ValidityUnit. */
function durationUnit(word: string | undefined): ValidityUnit {
  const w = (word ?? '').toLowerCase();
  if (/^d|day|days|יום|ימים/.test(w)) return 'days';
  if (/^mo|month|months|חודש|חודשים/.test(w)) return 'months';
  // 'm' alone is treated as months (minutes are not a voucher unit); default is years.
  if (w === 'm') return 'months';
  return 'years';
}

/**
 * Parses a duration cell into amount + unit, or null when there is no number.
 * Accepts "5", "5 years", "30 days", "12 months", "2y", "‎6 חודשים". A bare
 * number defaults to years (matching the manual form's 5-year default).
 */
export function parseDuration(raw: string | number | null | undefined): ParsedDuration | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d+)\s*([A-Za-z֐-׿]*)/);
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, unit: durationUnit(m[2]) };
}

/** Adds `years` to a `YYYY-MM-DD` string, clamping an invalid day (e.g. Feb 29) down. */
function addYears(ymd: string, years: number): string {
  const [y, mo, d] = ymd.split('-').map(Number);
  const targetYear = y + years;
  const lastDay = new Date(Date.UTC(targetYear, mo, 0)).getUTCDate();
  return fmt(targetYear, mo, Math.min(d, lastDay));
}

/** A unit's resolved validity: a from/until window (from_until) OR a limit recipe. */
export interface UnitValidity {
  validityValue: number | null;
  validityUnit: ValidityUnit | null;
  validFrom: string | null;
  validUntil: string | null;
}

/**
 * Resolves one imported row's validity from its Start / End / Duration cells.
 *
 * Rules (per the import spec):
 * - End date present -> `from_until` window [Start (or import date), End].
 * - else Duration present -> `limit` recipe (amount + unit).
 * - else when only a Start date is present -> `from_until` window [Start .. Start + 5 years].
 * - else -> `limit` of 5 years (the fixed lifespan fallback).
 * Per-row, so a single bad/blank cell never blocks the import.
 */
export function resolveUnitValidity(
  startRaw: string | number | null | undefined,
  endRaw: string | number | null | undefined,
  durationRaw: string | number | null | undefined,
  importDate: string,
): UnitValidity {
  const start = normalizeExpiry(startRaw);
  const end = normalizeExpiry(endRaw);
  if (end) {
    return { validityValue: null, validityUnit: null, validFrom: start ?? importDate, validUntil: end };
  }
  const dur = parseDuration(durationRaw);
  if (dur) {
    return { validityValue: dur.value, validityUnit: dur.unit, validFrom: null, validUntil: null };
  }
  // Only a start date (no end, no duration) -> a 5-year window from that start.
  if (start) {
    return { validityValue: null, validityUnit: null, validFrom: start, validUntil: addYears(start, 5) };
  }
  // Nothing mapped/usable -> fixed 5-year limit lifespan.
  return { validityValue: 5, validityUnit: 'years', validFrom: null, validUntil: null };
}
