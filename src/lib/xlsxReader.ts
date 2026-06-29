/**
 * Client-side Excel (.xlsx / .xls) reader for the voucher bulk-import flow.
 *
 * Reads a user-selected workbook entirely in the browser (SheetJS) and returns
 * the same { headers, rows } shape as the CSV parser (`ParsedCsv`), so the
 * existing column-mapping UI can consume an Excel file without changes. Cells are
 * returned as display strings (date-formatted cells keep their shown text, e.g.
 * "8/31/2030 12:00:00 AM"); date cells with no number format fall back to their
 * raw serial, which the date normalizer (`voucherImportDates`) also handles.
 *
 * This is the only path in the app that reads real binary Excel: the CSV parser
 * (`csvParser.ts`) treats input as text and would yield garbage for a real xlsx.
 */
import * as XLSX from 'xlsx';
import type { ParsedCsv } from './csvParser';

/** Maximum data rows accepted, mirroring the CSV parser cap. */
const MAX_ROWS = 5_000;

/** File extensions accepted by the XLSX reader. */
const XLSX_EXTENSIONS = ['.xlsx', '.xls'];

/** True when the file name looks like an Excel workbook. */
export function isXlsxFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return XLSX_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/**
 * Reads an Excel file into a ParsedCsv-shaped result.
 *
 * Input: a File the user selected (expected `.xlsx`/`.xls`).
 * Output: a Promise of { headers, rows } - headers from the first non-empty row,
 *   rows as header->cell-string maps (up to MAX_ROWS), read from the first sheet.
 * Throws: a clear Error when the file is not an accepted Excel type, is empty,
 *   has no header row, or cannot be parsed (so the caller blocks before mapping).
 */
export async function readXlsx(file: File): Promise<ParsedCsv> {
  if (!isXlsxFile(file)) {
    throw new Error('Unsupported file type. Please upload an .xlsx or .xls file.');
  }

  let workbook: XLSX.WorkBook;
  try {
    const buffer = await file.arrayBuffer();
    // cellNF keeps each cell's number format so we can tell real date cells apart.
    workbook = XLSX.read(buffer, { type: 'array', cellNF: true });
  } catch {
    throw new Error('Could not read the Excel file. It may be corrupted or not a real .xlsx file.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
  if (!sheet) {
    throw new Error('The Excel file has no sheets.');
  }

  const ref = sheet['!ref'];
  if (!ref) {
    throw new Error('The Excel file is empty.');
  }
  const range = XLSX.utils.decode_range(ref);

  // Read one cell as a string. A real date cell (numeric with a date number-format)
  // is emitted as its Excel serial so `normalizeExpiry` converts it via the UTC epoch
  // - this avoids ambiguous displayed formats (e.g. 2-digit years like "1/15/27").
  // Every other cell keeps its formatted text, preserving e.g. leading-zero barcodes.
  const cellAt = (r: number, c: number): string => {
    const cell = sheet[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
    if (!cell || cell.v == null) return '';
    if (cell.t === 'n' && typeof cell.v === 'number' && cell.z && XLSX.SSF.is_date(String(cell.z))) {
      return String(cell.v);
    }
    return String(cell.w ?? cell.v).trim();
  };

  const headers: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const h = cellAt(range.s.r, c);
    if (h !== '') headers.push(h);
  }
  if (headers.length === 0) {
    throw new Error('The first row of the Excel file has no column headers.');
  }

  const rows: Record<string, string>[] = [];
  for (let r = range.s.r + 1; r <= range.e.r && rows.length < MAX_ROWS; r++) {
    const row: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((header, idx) => {
      const v = cellAt(r, range.s.c + idx);
      row[header] = v;
      if (v !== '') hasValue = true;
    });
    if (hasValue) rows.push(row); // skip fully-blank rows
  }

  return { headers, rows };
}
