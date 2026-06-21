/**
 * Voucher bulk-CSV schema + client-side validation.
 *
 * Defines the fixed CSV columns (one row = one voucher), a downloadable
 * template, and per-row validation that mirrors the backend rules so the
 * preview table can flag problems before publishing. The backend re-validates
 * every row — this is UX, not the security boundary.
 *
 * Inventory is barcodes XOR links (mutually exclusive). Image vs color: image
 * wins; the client only hints the resolved background (the real fetch + fallback
 * happen server-side), so a questionable imageUrl is NOT a row error here.
 */
import { OFFER_CATEGORIES } from './api';

/** Ordered CSV columns. Required first, then optional. */
export const VOUCHER_CSV_HEADERS = [
  'title', 'face_value', 'nexus_cost', 'combinable',
  'category', 'description', 'market_price', 'validityValue', 'validityUnit',
  'sku', 'tags', 'visibility', 'backgroundColor', 'imageUrl', 'barcodeQuantity', 'links',
] as const;

export type VoucherCsvHeader = typeof VOUCHER_CSV_HEADERS[number];

/** Columns that must be present + non-empty in every row. */
export const VOUCHER_CSV_REQUIRED: VoucherCsvHeader[] = ['title', 'face_value', 'nexus_cost', 'combinable'];

const VALIDITY_UNITS = ['days', 'months', 'years'];
const COMBINABLE_TRUE = ['yes', 'true', '1', 'y'];
const COMBINABLE_FALSE = ['no', 'false', '0', 'n'];
const SKU_RE = /^[A-Z0-9_-]{4,20}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const HTTP_RE = /^https?:\/\/\S+$/i;
const CATEGORY_VALUES = OFFER_CATEGORIES.map((c) => c.value) as string[];

/** Inventory cap mirrored from the backend (VOUCHER_INVENTORY_MAX). */
const INVENTORY_MAX = 10000;

/** Split a `;`-separated tags cell into trimmed, non-empty tags. */
export function parseTags(raw: string | undefined): string[] {
  return (raw ?? '').split(';').map((s) => s.trim()).filter(Boolean);
}

/** Split a `|`-separated links cell into trimmed, non-empty URLs. */
export function parseLinks(raw: string | undefined): string[] {
  return (raw ?? '').split('|').map((s) => s.trim()).filter(Boolean);
}

/** True when the cell is a non-empty positive integer string. */
function isPositiveInt(v: string): boolean {
  return /^\d+$/.test(v) && Number(v) > 0;
}

/** True when the cell parses to a positive finite number. */
function isPositiveNum(v: string): boolean {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}

/**
 * Validates one parsed CSV row against the voucher rules. Returns the list of
 * human-readable errors (empty = valid). Mirrors the backend; the backend is
 * still the source of truth.
 *
 * Input:  row - header→cell string map (cells already trimmed by the parser).
 * Output: string[] of error messages for this row.
 */
export function validateVoucherRow(row: Record<string, string>): string[] {
  const errors: string[] = [];
  const get = (k: VoucherCsvHeader) => (row[k] ?? '').trim();

  for (const req of VOUCHER_CSV_REQUIRED) {
    if (get(req) === '') errors.push(`${req} is required`);
  }

  const face = get('face_value');
  const nexus = get('nexus_cost');
  if (face && !isPositiveNum(face)) errors.push('face_value must be a positive number');
  if (nexus && !isPositiveNum(nexus)) errors.push('nexus_cost must be a positive number');
  if (face && nexus && isPositiveNum(face) && isPositiveNum(nexus) && Number(nexus) >= Number(face)) {
    errors.push('nexus_cost must be less than face_value');
  }

  const combinable = get('combinable').toLowerCase();
  if (combinable && ![...COMBINABLE_TRUE, ...COMBINABLE_FALSE].includes(combinable)) {
    errors.push('combinable must be yes or no');
  }

  const category = get('category');
  if (category && !CATEGORY_VALUES.includes(category)) errors.push(`unknown category: ${category}`);

  const market = get('market_price');
  if (market && !isPositiveNum(market)) errors.push('market_price must be a positive number');

  const vv = get('validityValue');
  const vu = get('validityUnit');
  if ((vv === '') !== (vu === '')) errors.push('validityValue and validityUnit must be set together');
  if (vv && !isPositiveInt(vv)) errors.push('validityValue must be a positive whole number');
  if (vu && !VALIDITY_UNITS.includes(vu)) errors.push('validityUnit must be days, months, or years');

  const sku = get('sku');
  if (sku && !SKU_RE.test(sku)) errors.push('sku must be 4–20 chars: A–Z, 0–9, -, _');

  const visibility = get('visibility');
  if (visibility && visibility !== 'tenant_only' && visibility !== 'ecosystem') {
    errors.push('visibility must be tenant_only or ecosystem');
  }

  const color = get('backgroundColor');
  if (color && !HEX_RE.test(color)) errors.push('backgroundColor must be a #rrggbb hex');

  // Inventory: barcodes XOR links. Both cells filled is the only hard error;
  // an empty/invalid cell is tolerated and simply yields no stock (the voucher
  // is created out of stock), so it is NOT a row error.
  if (get('barcodeQuantity') && get('links')) {
    errors.push('use barcodeQuantity OR links, not both');
  }

  return errors;
}

/** Preview hint for which background a row will resolve to (server decides for real). */
export function backgroundHint(row: Record<string, string>): 'image' | 'color' | 'tenant' {
  if (HTTP_RE.test((row.imageUrl ?? '').trim())) return 'image';
  if (HEX_RE.test((row.backgroundColor ?? '').trim())) return 'color';
  return 'tenant';
}

/** Preview hint for a row's inventory: a short label like "100 barcodes" / "3 links" / "—". */
export function inventoryHint(row: Record<string, string>): string {
  const qty = (row.barcodeQuantity ?? '').trim();
  // Reflect only VALID inventory (mirrors the backend); invalid/empty → "—" (no stock).
  if (qty && isPositiveInt(qty) && Number(qty) <= INVENTORY_MAX) return `${qty} barcodes`;
  const links = parseLinks(row.links);
  if (links.length > 0 && links.every((l) => HTTP_RE.test(l))) return `${links.length} links`;
  return '—';
}

/**
 * Builds a downloadable CSV template: the header row plus two example rows —
 * one using an image + barcodes, one using a background color + links.
 *
 * Output: CSV text (LF newlines) ready for a Blob download.
 */
export function buildTemplateCsv(): string {
  const example1: Record<VoucherCsvHeader, string> = {
    title: 'Spa Day Voucher', face_value: '200', nexus_cost: '150', combinable: 'yes',
    category: 'health_wellness', description: 'A relaxing spa day', market_price: '220',
    validityValue: '2', validityUnit: 'years', sku: 'SPA-2026', tags: 'spa;wellness',
    visibility: 'tenant_only', backgroundColor: '', imageUrl: 'https://example.com/spa.jpg',
    barcodeQuantity: '100', links: '',
  };
  const example2: Record<VoucherCsvHeader, string> = {
    title: 'Welcome Coupon', face_value: '50', nexus_cost: '30', combinable: 'no',
    category: 'other', description: '', market_price: '', validityValue: '', validityUnit: '',
    sku: '', tags: 'welcome', visibility: 'tenant_only', backgroundColor: '#635bff',
    imageUrl: '', barcodeQuantity: '', links: 'https://a.example/1|https://a.example/2',
  };
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const line = (r: Record<VoucherCsvHeader, string>) => VOUCHER_CSV_HEADERS.map((h) => esc(r[h])).join(',');
  return [VOUCHER_CSV_HEADERS.join(','), line(example1), line(example2)].join('\n');
}
