/**
 * CSV column-mapping modal for tenant contact imports.
 * Displays a two-column layout: CSV headers on the left mapped to Nexus
 * system fields on the right. Auto-detects common header names.
 * On confirm, calls the provided onImport callback with resolved rows.
 * Preserves the existing visual design (modal shell, column rows, right illustration).
 */
import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/** System fields a CSV column can be mapped to. */
type SystemField = 'Full Name' | 'Email Address' | 'Status' | 'Address' | '';

interface ColumnMappingRow {
  csvColumn: string;
  systemField: SystemField;
  sample: string;
  isMapped: boolean;
}

/** A resolved contact row after column mapping is confirmed. */
export interface ResolvedContactRow {
  email: string;
  displayName?: string;
  status?: string;
  address?: string;
}

export interface ColumnMappingProps {
  onClose: () => void;
  /** Called with resolved rows when the user confirms the mapping. */
  onImport: (rows: ResolvedContactRow[]) => void | Promise<void>;
  fileName?: string;
  /** Real CSV headers parsed from the uploaded file. */
  csvHeaders: string[];
  /** Real CSV data rows keyed by header name. */
  csvRows: Record<string, string>[];
}

const SYSTEM_FIELDS: SystemField[] = ['Full Name', 'Email Address', 'Status', 'Address', ''];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Auto-detects the best system field for a CSV header name.
 * Input: raw header string.
 * Output: best-matching system field, or '' (ignore).
 */
function autoDetect(header: string): SystemField {
  const h = header.toLowerCase().trim();
  if (/e[-_]?mail|mail address|כתובת.?אימייל|אימייל|מייל/.test(h)) return 'Email Address';
  if (/\bname\b|full.?name|שם|שם.?מלא/.test(h)) return 'Full Name';
  if (/\bstatus\b|סטטוס/.test(h)) return 'Status';
  if (/address|כתובת/.test(h)) return 'Address';
  return '';
}

/**
 * Returns the first two non-empty values of a column as a sample string.
 * Input: CSV rows and the header name.
 * Output: comma-separated sample or a placeholder.
 */
function sampleValues(rows: Record<string, string>[], header: string): string {
  const vals = rows.map((r) => r[header]).filter(Boolean).slice(0, 2);
  return vals.join(', ') || '—';
}

/**
 * Resolves mapped CSV rows into contact objects, skipping rows without a valid email.
 * Input: mapping state and raw CSV rows.
 * Output: validated contact rows ready for the API.
 */
function resolveRows(
  mappings: ColumnMappingRow[],
  csvRows: Record<string, string>[],
): { rows: ResolvedContactRow[]; skipped: number } {
  const emailCol = mappings.find((m) => m.systemField === 'Email Address')?.csvColumn;
  const nameCol = mappings.find((m) => m.systemField === 'Full Name')?.csvColumn;
  const statusCol = mappings.find((m) => m.systemField === 'Status')?.csvColumn;
  const addressCol = mappings.find((m) => m.systemField === 'Address')?.csvColumn;

  const seen = new Set<string>();
  const rows: ResolvedContactRow[] = [];
  let skipped = 0;

  for (const row of csvRows) {
    const email = emailCol ? (row[emailCol] ?? '').trim().toLowerCase() : '';
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) { skipped++; continue; }
    seen.add(email);
    rows.push({
      email,
      ...(nameCol && row[nameCol] ? { displayName: row[nameCol].trim() } : {}),
      ...(statusCol && row[statusCol] ? { status: row[statusCol].trim().toLowerCase() } : {}),
      ...(addressCol && row[addressCol] ? { address: row[addressCol].trim() } : {}),
    });
  }
  return { rows, skipped };
}

/**
 * Renders the CSV column-mapping modal.
 * Input: CSV headers + rows from the file, plus import and close callbacks.
 * Output: full-screen modal with column mapping UI and confirmation button.
 */
const ColumnMapping = ({ onClose, onImport, fileName, csvHeaders, csvRows }: ColumnMappingProps) => {
  const { t } = useLanguage();
  const [isImporting, setIsImporting] = useState(false);

  const [mappings, setMappings] = useState<ColumnMappingRow[]>(() =>
    csvHeaders.map((header) => {
      const field = autoDetect(header);
      return {
        csvColumn: header,
        systemField: field,
        sample: sampleValues(csvRows, header),
        isMapped: field !== '',
      };
    }),
  );

  const handleMappingChange = (index: number, value: SystemField) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, systemField: value, isMapped: value !== '' } : m)),
    );
  };

  const unmappedCount = mappings.filter((m) => !m.isMapped).length;
  const emailMapped = mappings.some((m) => m.systemField === 'Email Address');

  const { rows: previewRows, skipped } = useMemo(() => resolveRows(mappings, csvRows), [mappings, csvRows]);

  const handleConfirm = async () => {
    if (!emailMapped || previewRows.length === 0) return;
    setIsImporting(true);
    try {
      await onImport(previewRows);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 overflow-hidden backdrop-blur-sm">
      <div className="h-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl bg-white dark:bg-slate-900 shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] animate-in fade-in zoom-in duration-300">

          {/* Main Content */}
          <div className="flex-1 p-8 lg:p-12 flex flex-col relative overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-icons text-lg">table_view</span>
                <span className="material-icons text-sm rtl:rotate-180">chevron_left</span>
                <span className="text-xs font-medium uppercase tracking-wider">
                  {fileName ?? t('cm_importProcess')}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-icons text-base">close</span>
                  <span>{t('cm_close')}</span>
                </button>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">
                  {t('cm_step3of4')}
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-semibold mb-2 tracking-tight">{t('cm_columnMappingTitle')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">{t('cm_columnMappingDesc')}</p>

            {/* Skip email warning */}
            {!emailMapped && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
                <span className="material-icons text-base">error_outline</span>
                Map at least one column to Email Address before importing.
              </div>
            )}

            {/* Column Mappings */}
            <div className="flex-1 overflow-y-auto custom-scrollbar ps-4 -ms-4">
              <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 px-2">
                <div className="text-start">{t('cm_excelColumns')}</div>
                <div className="text-start">{t('cm_systemColumns')}</div>
              </div>

              <div className="space-y-4">
                {mappings.map((mapping, index) => (
                  <div
                    key={mapping.csvColumn}
                    className={`group flex items-center gap-6 p-4 rounded-xl border transition-all duration-200 ${
                      mapping.isMapped
                        ? 'border-slate-200 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/50 bg-white dark:bg-slate-900/50'
                        : 'border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/30 bg-white/40 dark:bg-transparent'
                    }`}
                  >
                    <div className="flex-1 flex flex-col">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {mapping.csvColumn}
                      </span>
                      <span className="text-xs text-slate-400">{t('cm_example')}: {mapping.sample}</span>
                    </div>
                    <span className="material-icons text-slate-300 dark:text-slate-600">arrow_back</span>
                    <div className="flex-1">
                      <div className="relative">
                        <select
                          value={mapping.systemField}
                          onChange={(e) => handleMappingChange(index, e.target.value as SystemField)}
                          className={`w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary py-3 px-4 pr-10 transition-all cursor-pointer hover:shadow-md ${
                            !mapping.isMapped ? 'text-slate-400 italic' : 'text-slate-900 dark:text-white font-medium'
                          }`}
                          style={{ appearance: 'none', backgroundImage: 'none' }}
                        >
                          <option value="">{t('cm_chooseColumn')}</option>
                          {SYSTEM_FIELDS.filter((f) => f !== '').map((field) => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                        <span className="material-icons absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex flex-col gap-1">
                {unmappedCount > 0 ? (
                  <div className="flex items-center text-amber-600 dark:text-amber-500 gap-2">
                    <span className="material-icons text-lg">warning_amber</span>
                    <span className="text-sm font-medium">
                      {unmappedCount} {t('cm_unmappedWarning')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600 dark:text-green-500 gap-2">
                    <span className="material-icons text-lg">check_circle</span>
                    <span className="text-sm font-medium">{t('cm_allMapped')}</span>
                  </div>
                )}
                {skipped > 0 && (
                  <span className="text-xs text-slate-400">{skipped} rows will be skipped (invalid email)</span>
                )}
                {emailMapped && previewRows.length > 0 && (
                  <span className="text-xs text-slate-500">{previewRows.length} contacts ready to import</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {t('cm_back')}
                </button>
                <button
                  onClick={() => void handleConfirm()}
                  disabled={!emailMapped || previewRows.length === 0 || isImporting}
                  className="bg-primary text-white px-10 py-2.5 font-semibold rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isImporting ? 'Importing...' : t('cm_next')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side — Visual Illustration (unchanged from original) */}
          <div className="hidden md:flex w-2/5 bg-slate-50 dark:bg-slate-900/40 items-center justify-center p-12 border-e border-slate-200 dark:border-slate-800">
            <div className="relative w-full max-w-sm flex flex-col items-center">
              <div className="w-full space-y-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 border border-slate-200 dark:border-slate-800 transform -rotate-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-[10px] text-white font-bold">X</div>
                    <div className="h-2 w-20 bg-slate-100 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      {[0,1,2,3].map((i) => <div key={i} className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded"></div>)}
                    </div>
                    <div className="h-1 bg-slate-50 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-1 bg-slate-50 dark:bg-slate-800 rounded w-3/4"></div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                    <span className="material-icons">south</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 border border-slate-200 dark:border-slate-800 transform rotate-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      <span className="material-icons text-xs">dashboard</span>
                    </div>
                    <div className="h-2 w-24 bg-slate-100 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    {['bg-green-400','bg-purple-400','bg-amber-400'].map((c) => (
                      <div key={c} className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${c} rounded-sm`}></div>
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-900 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-12 text-center">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">{t('cm_seamlessIntegration')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">{t('cm_autoMatchDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnMapping;
