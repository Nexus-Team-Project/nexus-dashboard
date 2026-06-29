/**
 * Pure transform from parsed spreadsheet rows to voucher draft variants for the
 * XLSX import on /supply/create. One row = one inventory unit; rows are grouped
 * into variants by their full variant signature, and each variant carries one
 * staged unit per row with its own resolved validity.
 *
 * No field is required in the mapping UI - the admin maps whatever columns the
 * file has and completes the rest in the form. Every "Create Variant" field is a
 * mapping target: price, SKU, stackable, tags, redemption terms/method, the
 * Start/End/Duration validity, and inventory as barcodes OR links.
 *
 * No React here so CreateOffer stays small and the logic is testable. The group
 * key is the real `draftSignature`, so two generated variants are never duplicates.
 */
import {
  type DraftVariant,
  type StackChoice,
  type StagedUnit,
  emptyDraftVariant,
  draftSignature,
} from './voucherVariantDraft';
import { resolveUnitValidity } from '../lib/voucherImportDates';

/** Which spreadsheet column header feeds each target field. All optional. */
export interface VoucherImportMapping {
  value?: string;
  salePrice?: string;
  sku?: string;
  stackable?: string;
  tags?: string;
  terms?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  barcode?: string;
  link?: string;
  /** Optional per-link code; only meaningful when `link` is mapped. */
  linkCode?: string;
}

/** Resolution of each distinct stackable free-text value, keyed by lower-cased text. */
export type StackableValueMap = Record<string, 'yes' | 'no'>;

/** Outcome of the transform: the variants plus counts and issues to surface. */
export interface VoucherImportOutcome {
  variants: DraftVariant[];
  rowCount: number;
  unitCount: number;
  /** Barcode values that appear more than once across the file (backend rejects dups). */
  duplicateBarcodes: string[];
  /** Rows with nothing usable (all mapped cells blank). */
  skippedRows: number;
  /** Units dropped because their variant already uses the other inventory kind. */
  conflictingKindRows: number;
}

/** Local-id counter for imported staged units (client-only React keys). */
let importUnitCounter = 0;
function nextImportUnitId(): string {
  importUnitCounter += 1;
  return `imp_${importUnitCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Parses a price cell, stripping currency/thousands separators. NaN when empty/invalid. */
function parsePrice(raw: string | undefined): number {
  if (raw == null) return NaN;
  const cleaned = raw.replace(/[^\d.-]/g, '');
  if (cleaned === '') return NaN;
  return Number(cleaned);
}

/** Splits a tags cell on comma/semicolon into trimmed, de-duplicated tags. */
function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(/[,;]/)) {
    const tag = part.trim();
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out;
}

/**
 * Collects the distinct, non-empty values of a column (trimmed; de-duplicated
 * case-insensitively, keeping the first-seen text). Drives the stackable matcher.
 */
export function collectColumnValues(rows: Record<string, string>[], header: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const v = (row[header] ?? '').trim();
    if (v === '') continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** Resolves one row's stackable choice from the mapping + value-match table. */
function resolveStackable(
  row: Record<string, string>,
  mapping: VoucherImportMapping,
  valueMap: StackableValueMap,
): StackChoice {
  if (!mapping.stackable) return '';
  const raw = (row[mapping.stackable] ?? '').trim();
  if (raw === '') return '';
  return valueMap[raw.toLowerCase()] ?? '';
}

/** Builds the variant-shaped fields for one row (no inventory unit yet). */
function rowToDraft(
  row: Record<string, string>,
  mapping: VoucherImportMapping,
  valueMap: StackableValueMap,
): DraftVariant {
  // Each price comes only from its own mapped column - no coupling/default. An
  // unmapped Value or Sale price stays empty for the admin to fill in the form.
  const face = parsePrice(mapping.value ? row[mapping.value] : undefined);
  const sale = parsePrice(mapping.salePrice ? row[mapping.salePrice] : undefined);

  const terms = mapping.terms ? (row[mapping.terms] ?? '').trim() : '';
  const method = mapping.method ? (row[mapping.method] ?? '').trim() : '';

  const draft = emptyDraftVariant();
  draft.faceValue = Number.isFinite(face) ? String(face) : '';
  draft.nexusCost = Number.isFinite(sale) ? String(sale) : '';
  draft.stackable = resolveStackable(row, mapping, valueMap);
  draft.sku = mapping.sku ? (row[mapping.sku] ?? '').trim().toUpperCase() : '';
  draft.tags = mapping.tags ? parseTags(row[mapping.tags]) : [];
  draft.customRedemption = terms !== '' || method !== '';
  draft.terms = terms;
  draft.implementationInstructions = method;
  return draft;
}

/** Builds one row's staged inventory unit (barcode preferred over link), or null. */
function rowToUnit(row: Record<string, string>, mapping: VoucherImportMapping): StagedUnit | null {
  const barcode = mapping.barcode ? (row[mapping.barcode] ?? '').trim() : '';
  const link = mapping.link ? (row[mapping.link] ?? '').trim() : '';
  const value = barcode || link;
  if (value === '') return null;
  const v = resolveUnitValidity(
    mapping.startDate ? row[mapping.startDate] : '',
    mapping.endDate ? row[mapping.endDate] : '',
    mapping.duration ? row[mapping.duration] : '',
    new Date().toISOString().slice(0, 10),
  );
  // A link may carry an optional code; barcodes never do.
  const code = !barcode && mapping.linkCode ? (row[mapping.linkCode] ?? '').trim() : '';
  return {
    localId: nextImportUnitId(),
    kind: barcode ? 'barcode' : 'link',
    value,
    ...(code ? { code } : {}),
    validityValue: v.validityValue,
    validityUnit: v.validityUnit,
    validFrom: v.validFrom,
    validUntil: v.validUntil,
  };
}

/** True when a draft carries no usable variant data and no inventory value. */
function isEmptyRow(draft: DraftVariant, unit: StagedUnit | null): boolean {
  return (
    !unit &&
    draft.faceValue === '' &&
    draft.nexusCost === '' &&
    draft.stackable === '' &&
    draft.sku === '' &&
    draft.tags.length === 0 &&
    draft.terms === '' &&
    draft.implementationInstructions === ''
  );
}

/**
 * Transforms parsed rows into draft variants with staged inventory.
 *
 * Inputs: parsed rows, the column mapping, the stackable value-match table (empty
 * when stackable is unmapped), and `importDate` is taken as today per unit. The
 * group key is `draftSignature`, so variants are never mutual duplicates; stackable
 * '' and 'no' collapse together (a group keeps 'no' if any row said no). Tags are
 * unioned across a group. A unit whose kind differs from its variant's existing
 * kind is dropped and counted (one kind per variant).
 */
export function rowsToDraftVariants(
  rows: Record<string, string>[],
  mapping: VoucherImportMapping,
  valueMap: StackableValueMap,
): VoucherImportOutcome {
  const groups = new Map<string, DraftVariant>();
  const barcodeCounts = new Map<string, number>();
  let rowCount = 0;
  let skippedRows = 0;
  let conflictingKindRows = 0;

  for (const row of rows) {
    const draft = rowToDraft(row, mapping, valueMap);
    const unit = rowToUnit(row, mapping);
    if (isEmptyRow(draft, unit)) { skippedRows += 1; continue; }
    rowCount += 1;

    const key = draftSignature(draft);
    let group = groups.get(key);
    if (!group) {
      groups.set(key, draft);
      group = draft;
    } else {
      // Same variant: keep an explicit "no" over an unset choice, union tags.
      if (group.stackable === '' && draft.stackable === 'no') group.stackable = 'no';
      for (const tag of draft.tags) if (!group.tags.includes(tag)) group.tags.push(tag);
    }

    if (unit) {
      const existingKind = group.stagedUnits[0]?.kind;
      if (existingKind && existingKind !== unit.kind) {
        conflictingKindRows += 1; // one kind per variant - drop the odd one out, surfaced as a warning
      } else {
        group.stagedUnits.push(unit);
        if (unit.kind === 'barcode') barcodeCounts.set(unit.value, (barcodeCounts.get(unit.value) ?? 0) + 1);
      }
    }
  }

  const variants = [...groups.values()];
  const unitCount = variants.reduce((n, v) => n + v.stagedUnits.length, 0);
  const duplicateBarcodes = [...barcodeCounts.entries()].filter(([, n]) => n > 1).map(([v]) => v);

  return { variants, rowCount, unitCount, duplicateBarcodes, skippedRows, conflictingKindRows };
}
