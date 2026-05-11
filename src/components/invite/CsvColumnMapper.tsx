/**
 * Step component shown after a CSV file is loaded.
 * Lets the user assign each CSV column to Email, Role, or Ignore.
 * Auto-detects likely mappings from column header names.
 * Resolves and previews import rows before the user confirms.
 */
import { useMemo, useState } from 'react';
import type { TenantRole } from '../../lib/api';
import { getTenantRoleLabel } from '../../lib/tenantRoles';
import type { ParsedCsv } from '../../lib/csvParser';

/** The field a CSV column can be mapped to. */
type CsvField = 'email' | 'role' | 'ignore';

/** A resolved import row ready to merge into the invite table. */
export interface ResolvedInviteRow {
  email: string;
  roles: TenantRole[];
}

export interface CsvColumnMapperProps {
  csv: ParsedCsv;
  language: 'he' | 'en';
  /** Called with the resolved rows after the user confirms the mapping. */
  onConfirm: (rows: ResolvedInviteRow[]) => void;
  /** Called when the user cancels without importing. */
  onCancel: () => void;
}

const COPY = {
  he: {
    title: 'מיפוי עמודות CSV',
    subtitle: 'בחר לאיזה שדה כל עמודה מתאימה.',
    colHeader: 'עמודת CSV',
    mapsTo: 'ממופה ל',
    fieldEmail: 'אימייל',
    fieldRole: 'תפקיד',
    fieldIgnore: 'התעלם',
    autoDetected: 'זוהה אוטומטית',
    previewTitle: 'תצוגה מקדימה',
    previewEmail: 'אימייל',
    previewRole: 'תפקיד',
    defaultRole: 'ברירת מחדל: Member',
    noEmailCol: 'יש למפות לפחות עמודה אחת לאימייל.',
    skipped: (n: number) => `${n} שורות דולגו – אימייל לא תקין`,
    cancel: 'ביטול',
    import: (n: number) => `ייבא ${n} שורות`,
  },
  en: {
    title: 'Map CSV columns',
    subtitle: 'Tell us what each column contains.',
    colHeader: 'CSV column',
    mapsTo: 'Maps to',
    fieldEmail: 'Email',
    fieldRole: 'Role',
    fieldIgnore: 'Ignore',
    autoDetected: 'Auto-detected',
    previewTitle: 'Preview',
    previewEmail: 'Email',
    previewRole: 'Role',
    defaultRole: 'Default: Member',
    noEmailCol: 'Map at least one column to Email.',
    skipped: (n: number) => `${n} row${n === 1 ? '' : 's'} skipped – invalid email`,
    cancel: 'Cancel',
    import: (n: number) => `Import ${n} row${n === 1 ? '' : 's'}`,
  },
} as const;

/** Rows shown in the preview table before confirming the import. */
const PREVIEW_LIMIT = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Guesses the best field mapping for a CSV column header name.
 * Handles both English and Hebrew header names.
 * Input: raw header string.
 * Output: 'email', 'role', or 'ignore'.
 */
function autoDetect(header: string): CsvField {
  const h = header.toLowerCase().trim();
  // English patterns
  if (/e[-_]?mail|mail address/.test(h)) return 'email';
  if (/\brole\b|permission|access/.test(h)) return 'role';
  // Hebrew patterns
  if (/אימייל|כתובת.?אימייל|מייל/.test(h)) return 'email';
  if (/תפקיד|הרשאה/.test(h)) return 'role';
  return 'ignore';
}

/**
 * Normalizes a free-text role value from a CSV cell to a known TenantRole.
 * Accepts English role names and Hebrew equivalents. Falls back to 'member'.
 * Input: raw cell string.
 * Output: TenantRole enum value.
 */
function normalizeRole(value: string): TenantRole {
  const v = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const map: Record<string, TenantRole> = {
    // English
    admin: 'admin', administrator: 'admin', manager: 'admin',
    finance: 'finance', financial: 'finance', accountant: 'finance',
    operator: 'operator', operations: 'operator', ops: 'operator',
    analyst: 'analyst', analytics: 'analyst', data_analyst: 'analyst',
    developer: 'developer', dev: 'developer', engineer: 'developer',
    supply_manager: 'supply_manager', supply: 'supply_manager', procurement: 'supply_manager',
    member: 'member', user: 'member', employee: 'member', staff: 'member',
    // Hebrew
    מנהל: 'admin', אדמין: 'admin',
    כספים: 'finance', פיננסי: 'finance',
    תפעול: 'operator',
    אנליסט: 'analyst', אנליטיקה: 'analyst',
    מפתח: 'developer',
    ניהול_ספקים: 'supply_manager', ספקים: 'supply_manager',
    חבר: 'member', עובד: 'member', משתמש: 'member',
  };
  return map[v] ?? 'member';
}

/**
 * Renders the CSV column mapping UI step.
 * Input: parsed CSV, language, and confirm/cancel callbacks.
 * Output: table of headers → field selectors, a live preview, and action buttons.
 */
export default function CsvColumnMapper({ csv, language, onConfirm, onCancel }: CsvColumnMapperProps) {
  const copy = COPY[language];

  // Mapping state: header name → assigned field. Initialized from auto-detection.
  const [mapping, setMapping] = useState<Record<string, CsvField>>(() =>
    Object.fromEntries(csv.headers.map((h) => [h, autoDetect(h)]))
  );

  // Track which headers were auto-detected to show a badge.
  const autoDetectedSet = useMemo(
    () => new Set(csv.headers.filter((h) => autoDetect(h) !== 'ignore')),
    [csv.headers],
  );

  /**
   * Resolves the current mapping against all CSV rows.
   * Deduplicates by email, skips invalid or empty emails, and defaults
   * role to 'member' when no role column is mapped or the cell is blank.
   */
  const { resolved, skipped } = useMemo(() => {
    const emailCols = csv.headers.filter((h) => mapping[h] === 'email');
    const roleCols = csv.headers.filter((h) => mapping[h] === 'role');
    const seen = new Set<string>();
    const resolved: ResolvedInviteRow[] = [];
    let skipped = 0;

    for (const row of csv.rows) {
      // First valid email across all mapped email columns wins.
      let email = '';
      for (const col of emailCols) {
        const v = (row[col] ?? '').trim().toLowerCase();
        if (EMAIL_RE.test(v)) {
          email = v;
          break;
        }
      }
      if (!email || seen.has(email)) {
        skipped++;
        continue;
      }
      seen.add(email);

      // Collect unique roles from all mapped role columns.
      const roleSet = new Set<TenantRole>();
      for (const col of roleCols) {
        const v = (row[col] ?? '').trim();
        if (v) roleSet.add(normalizeRole(v));
      }
      if (roleSet.size === 0) roleSet.add('member');

      resolved.push({ email, roles: Array.from(roleSet) });
    }

    return { resolved, skipped };
  }, [csv, mapping]);

  const emailMapped = csv.headers.some((h) => mapping[h] === 'email');
  const previewRows = resolved.slice(0, PREVIEW_LIMIT);
  const canImport = emailMapped && resolved.length > 0;

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-card-dark"
      aria-label={copy.title}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{copy.title}</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{copy.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <span className="material-icons text-xl">close</span>
        </button>
      </div>

      {/* Column mapping table */}
      <div className="overflow-x-auto px-5 py-4">
        <table className="w-full text-sm" role="table" aria-label="Column mapping">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th scope="col" className="pb-2.5 pe-8 text-start text-xs font-semibold uppercase tracking-wide text-slate-400">
                {copy.colHeader}
              </th>
              <th scope="col" className="pb-2.5 text-start text-xs font-semibold uppercase tracking-wide text-slate-400">
                {copy.mapsTo}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {csv.headers.map((header) => (
              <tr key={header}>
                <td className="py-3 pe-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{header}</span>
                    {autoDetectedSet.has(header) && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {copy.autoDetected}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <select
                    value={mapping[header]}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [header]: e.target.value as CsvField }))
                    }
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    aria-label={`Map column ${header}`}
                  >
                    <option value="email">{copy.fieldEmail}</option>
                    <option value="role">{copy.fieldRole}</option>
                    <option value="ignore">{copy.fieldIgnore}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live preview */}
      {emailMapped && previewRows.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {copy.previewTitle}
          </p>
          <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
            <table className="w-full text-sm" aria-label="Import preview">
              <thead className="bg-slate-50 dark:bg-slate-900/40">
                <tr>
                  <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-slate-500">
                    {copy.previewEmail}
                  </th>
                  <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-slate-500">
                    {copy.previewRole}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {previewRows.map((row) => (
                  <tr key={row.email} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                      {row.email}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {row.roles.map((r) => (
                          <span
                            key={r}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {getTenantRoleLabel(r, language)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {skipped > 0 && (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <span className="material-icons text-sm">warning_amber</span>
              {copy.skipped(skipped)}
            </p>
          )}
          {resolved.length > PREVIEW_LIMIT && (
            <p className="mt-1.5 text-xs text-slate-400">
              +{resolved.length - PREVIEW_LIMIT} more rows
            </p>
          )}
        </div>
      )}

      {/* Validation error when no email column is mapped */}
      {!emailMapped && (
        <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
          <span className="material-icons text-base">error_outline</span>
          {copy.noEmailCol}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {copy.cancel}
        </button>
        <button
          type="button"
          disabled={!canImport}
          onClick={() => onConfirm(resolved)}
          className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copy.import(resolved.length)}
        </button>
      </div>
    </section>
  );
}
