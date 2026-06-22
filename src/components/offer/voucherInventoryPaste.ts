/**
 * Pure helpers for the voucher inventory popup: paste parsing + client-side
 * validation for barcode strings and link rows. Kept separate from the modal so
 * they are testable and the modal stays under the line limit.
 *
 * Paste formats:
 *   - Barcodes: items separated by commas / newlines / tabs → one per row.
 *   - Links:    one row per line; within a line the link and its optional code
 *               are separated by the first comma or whitespace (link first).
 *
 * The code charset MIRRORS the backend `VOUCHER_CODE_REGEX` (see
 * voucher-codes.models.ts); the backend re-validates and is the source of truth.
 */

/** Hard cap on inventory rows (mirrors backend VOUCHER_INVENTORY_MAX). */
export const INVENTORY_MAX = 10000;

/** Safe charset for an optional link code (mirrors backend VOUCHER_CODE_REGEX). */
export const VOUCHER_CODE_REGEX = /^[A-Za-z0-9._\-/:+]{1,128}$/;

/** A link inventory row: required URL + optional paired code. */
export interface LinkRow {
  url: string;
  code: string;
}

/** True when the string is an http(s) URL (blocks javascript:/data: etc.). */
export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** True when a code is empty (optional) or matches the safe charset. */
export function isSafeCode(code: string): boolean {
  const c = code.trim();
  return c === '' || VOUCHER_CODE_REGEX.test(c);
}

/**
 * Splits pasted barcode text into a de-duped list of trimmed values.
 * Separators: comma, newline, CR, tab.
 */
export function splitPastedBarcodes(text: string): string[] {
  return Array.from(
    new Set(text.split(/[,\n\r\t]+/).map((s) => s.trim()).filter(Boolean)),
  ).slice(0, INVENTORY_MAX);
}

/**
 * Parses pasted link text into `{ url, code }` rows — one row per line. Within a
 * line the link and optional code are separated by the FIRST comma or whitespace
 * run (link first, code is the remainder). Lines without a link are dropped;
 * rows are de-duplicated by url. Returns at most INVENTORY_MAX rows.
 */
export function parsePastedLinkRows(text: string): LinkRow[] {
  const out: LinkRow[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/[\n\r]+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(\S+?)[,\s]+(.*)$/);
    const url = (m ? m[1] : trimmed).trim();
    const code = (m ? m[2] : '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, code });
    if (out.length >= INVENTORY_MAX) break;
  }
  return out;
}

/** A few example lines shown/downloaded to teach the `link, code` format. */
export function buildLinkExample(): string {
  return [
    'https://example.com/redeem/1, SAVE-10',
    'https://example.com/redeem/2 WELCOME5',
    'https://example.com/redeem/3',
  ].join('\n');
}
