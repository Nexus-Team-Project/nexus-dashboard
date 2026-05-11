/**
 * Pure client-side CSV parser with RFC 4180 compliance.
 * Handles quoted fields, embedded commas, multiline values, and CRLF/LF endings.
 * No external dependencies — safe to run in any browser context.
 */

/** Parsed result: headers from row 1 and data rows as header→value maps. */
export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

/** Maximum rows accepted to prevent browser memory issues. */
const MAX_ROWS = 5_000;

/**
 * Strips a UTF-8 BOM character that Excel often prepends to CSV exports.
 * Input: raw file text.
 * Output: text without leading BOM.
 */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Splits raw CSV text into logical lines, keeping embedded newlines inside
 * quoted fields joined to their parent line.
 * Input: full CSV text string.
 * Output: array of raw line strings (quoted fields may contain \n).
 */
function splitLines(text: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      // Escaped double-quote inside a quoted field ("") — keep as-is for parseRow.
      if (inQuote && text[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        inQuote = !inQuote;
        current += ch;
      }
    } else if (!inQuote && (ch === '\r' || ch === '\n')) {
      if (ch === '\r' && text[i + 1] === '\n') i++; // consume CRLF pair
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) lines.push(current);
  return lines;
}

/**
 * Parses one CSV line into an array of field values.
 * Handles RFC 4180 quoted fields: leading/trailing whitespace outside quotes
 * is trimmed; "" inside a quoted field becomes a literal double-quote.
 * Input: single CSV line string.
 * Output: ordered array of unescaped field strings.
 */
function parseRow(line: string): string[] {
  const fields: string[] = [];
  let i = 0;

  while (i <= line.length) {
    // Skip whitespace before the field value (outside quotes)
    while (i < line.length && line[i] === ' ') i++;

    if (line[i] === '"') {
      // Quoted field
      let value = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            value += '"';
            i += 2; // consume escaped quote pair
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          value += line[i++];
        }
      }
      fields.push(value);
      // Skip to next comma or end
      while (i < line.length && line[i] !== ',') i++;
      if (line[i] === ',') i++;
    } else {
      // Unquoted field — read until the next comma
      const end = line.indexOf(',', i);
      if (end === -1) {
        fields.push(line.slice(i).trim());
        break;
      }
      fields.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }

  return fields;
}

/**
 * Parses CSV file text into a structured result.
 * The first non-empty row is treated as the header row.
 * Accepts any line ending (CRLF, LF, CR) and strips UTF-8 BOM if present.
 * Input: raw CSV string from File.text().
 * Output: ParsedCsv with headers and up to MAX_ROWS data rows.
 */
export function parseCsv(text: string): ParsedCsv {
  const clean = stripBom(text);
  const lines = splitLines(clean).filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseRow(lines[0]).map((h) => h.trim()).filter(Boolean);
  if (headers.length === 0) return { headers: [], rows: [] };

  const dataLines = lines.slice(1, MAX_ROWS + 1);

  const rows: Record<string, string>[] = dataLines.map((line) => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? '').trim();
    });
    return row;
  });

  return { headers, rows };
}
