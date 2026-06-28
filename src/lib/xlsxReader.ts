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
    workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  } catch {
    throw new Error('Could not read the Excel file. It may be corrupted or not a real .xlsx file.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
  if (!sheet) {
    throw new Error('The Excel file has no sheets.');
  }

  // header: 1 yields an array-of-arrays; raw: false applies each cell's number
  // format so date cells become readable strings; defval keeps column alignment.
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  });

  if (matrix.length === 0) {
    throw new Error('The Excel file is empty.');
  }

  const headers = (matrix[0] ?? [])
    .map((h) => String(h ?? '').trim())
    .filter((h) => h.length > 0);
  if (headers.length === 0) {
    throw new Error('The first row of the Excel file has no column headers.');
  }

  const dataRows = matrix.slice(1, MAX_ROWS + 1);
  const rows: Record<string, string>[] = dataRows.map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = String(cells[idx] ?? '').trim();
    });
    return row;
  });

  return { headers, rows };
}
