/**
 * Pure transform from parsed spreadsheet rows to voucher draft variants for the
 * XLSX import on /supply/create. One row = one barcoded inventory unit; rows are
 * grouped into variants by (Value, Sale Price, Allow Stackable Promotions), and
 * each variant carries one staged unit per row with its own normalized expiry.
 *
 * No React here so CreateOffer stays under the line cap and the logic is testable.
 * The grouping key is kept identical to `draftSignature` (no SKU/redemption is
 * imported) so two generated variants can never be mutual duplicates.
 */
import { type DraftVariant, type StackChoice, type StagedUnit, emptyDraftVariant } from './voucherVariantDraft';
import { resolveUnitWindow } from '../lib/voucherImportDates';

/** Which spreadsheet column header feeds each target field. Undefined = unmapped. */
export interface VoucherImportMapping {
  /** Header for Value (face_value). Required unless salePrice is mapped (coupling). */
  value?: string;
  /** Header for Sale Price (nexus_cost). Required unless value is mapped (coupling). */
  salePrice?: string;
  /** Header for Allow Stackable Promotions. Optional. */
  stackable?: string;
  /** Header for the per-unit Barcode value. Required. */
  barcode?: string;
  /** Header for the per-unit expiry date. Optional. */
  date?: string;
}

/**
 * Resolution of each distinct stackable free-text value to the binary choice,
 * keyed by the trimmed + lower-cased text (built by the value-matching step).
 */
export type StackableValueMap = Record<string, 'yes' | 'no'>;

/** Outcome of the transform: the variants plus counts and issues to surface. */
export interface VoucherImportOutcome {
  variants: DraftVariant[];
  /** Rows that produced a unit. */
  rowCount: number;
  /** Total staged units across all variants. */
  unitCount: number;
  /** Barcode values that appear more than once across the file (backend rejects dups). */
  duplicateBarcodes: string[];
  /** Rows dropped because a required cell (value/sale price/barcode) was missing or invalid. */
  skippedRows: number;
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
  const cleaned = raw.replace(/[^\d.\-]/g, '');
  if (cleaned === '') return NaN;
  return Number(cleaned);
}

/**
 * Collects the distinct, non-empty values of a column (trimmed; de-duplicated
 * case-insensitively, keeping the first-seen original text). Used by the
 * stackable value-matching step to know what the user must map to yes/no.
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

/** Accumulator for one variant group while scanning rows. */
interface Group {
  face: number;
  sale: number;
  /** Whether this group's effective stackable is "yes" (part of the group identity). */
  stackableBool: boolean;
  /** True only when at least one row in the group was explicitly resolved to "no". */
  anyExplicitNo: boolean;
  units: StagedUnit[];
}

/**
 * Transforms parsed rows into draft variants with staged barcoded inventory.
 *
 * Inputs:
 * - rows: header->cell maps from the XLSX reader.
 * - mapping: which column feeds each target field.
 * - valueMap: distinct stackable text -> yes/no (empty when stackable unmapped).
 * - importDate: today as `YYYY-MM-DD`; seeds each unit's validFrom and the 5-year fallback.
 *
 * Output: VoucherImportOutcome. Value/Sale Price coupling is applied (mapping one
 * fills both); a row missing a required value/price/barcode is skipped and counted.
 * The group key mirrors `draftSignature` (face, sale, stackable-as-yes) so unmapped
 * or blank stackable collapses into the same (Value, Sale Price) variant.
 */
export function rowsToDraftVariants(
  rows: Record<string, string>[],
  mapping: VoucherImportMapping,
  valueMap: StackableValueMap,
  importDate: string,
): VoucherImportOutcome {
  // Coupling: when only one of Value / Sale Price is mapped, both read that column.
  const valueCol = mapping.value ?? mapping.salePrice;
  const saleCol = mapping.salePrice ?? mapping.value;
  const barcodeCol = mapping.barcode;

  const groups = new Map<string, Group>();
  const barcodeCounts = new Map<string, number>();
  let rowCount = 0;
  let skippedRows = 0;

  for (const row of rows) {
    const face = parsePrice(valueCol ? row[valueCol] : undefined);
    const sale = parsePrice(saleCol ? row[saleCol] : undefined);
    const barcode = (barcodeCol ? row[barcodeCol] ?? '' : '').trim();

    // Required cells must be present and valid for the row to become a unit.
    if (!Number.isFinite(face) || face <= 0 || !Number.isFinite(sale) || sale <= 0 || barcode === '') {
      skippedRows += 1;
      continue;
    }

    const stk = resolveStackable(row, mapping, valueMap);
    const stackableBool = stk === 'yes';
    const key = JSON.stringify([face, sale, stackableBool]);

    let group = groups.get(key);
    if (!group) {
      group = { face, sale, stackableBool, anyExplicitNo: false, units: [] };
      groups.set(key, group);
    }
    if (stk === 'no') group.anyExplicitNo = true;

    const window = resolveUnitWindow(mapping.date ? row[mapping.date] : '', importDate);
    group.units.push({
      localId: nextImportUnitId(),
      kind: 'barcode',
      value: barcode,
      validityValue: null,
      validityUnit: null,
      validFrom: window.validFrom,
      validUntil: window.validUntil,
    });

    barcodeCounts.set(barcode, (barcodeCounts.get(barcode) ?? 0) + 1);
    rowCount += 1;
  }

  const variants: DraftVariant[] = [];
  let unitCount = 0;
  for (const group of groups.values()) {
    const draft = emptyDraftVariant();
    draft.faceValue = String(group.face);
    draft.nexusCost = String(group.sale);
    // yes -> 'yes'; otherwise 'no' if any row said no, else unset (mandatory choice later).
    draft.stackable = group.stackableBool ? 'yes' : group.anyExplicitNo ? 'no' : '';
    draft.stagedUnits = group.units;
    variants.push(draft);
    unitCount += group.units.length;
  }

  const duplicateBarcodes = [...barcodeCounts.entries()].filter(([, n]) => n > 1).map(([v]) => v);

  return { variants, rowCount, unitCount, duplicateBarcodes, skippedRows };
}
