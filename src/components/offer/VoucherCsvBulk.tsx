/**
 * VoucherCsvBulk: the CSV bulk-upload content for creating many vouchers.
 *
 * Renders INSIDE OfferFormLayout's left column (below the persistent page
 * header + Manual|CSV toggle), so only the content swaps when switching modes.
 * Flow: download template → upload .csv (parsed client-side) → preview table
 * with per-row ✓/error validation → publish valid rows → per-row result summary.
 * Validation mirrors the backend (`lib/voucherCsv`); the backend re-validates
 * and is the source of truth. One row = one voucher.
 */
import { useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { parseCsv } from '../../lib/csvParser';
import {
  VOUCHER_CSV_REQUIRED, validateVoucherRow, backgroundHint, inventoryHint, buildTemplateCsv,
} from '../../lib/voucherCsv';
import { bulkCreateVouchers, type BulkVoucherResult } from '../../lib/api';

interface ValidatedRow {
  index: number;
  row: Record<string, string>;
  errors: string[];
}

export default function VoucherCsvBulk() {
  const { t, language } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<BulkVoucherResult | null>(null);

  const validated: ValidatedRow[] = useMemo(
    () => rows.map((row, index) => ({ index, row, errors: validateVoucherRow(row) })),
    [rows],
  );
  const validRows = useMemo(() => validated.filter((v) => v.errors.length === 0), [validated]);

  const downloadTemplate = () => {
    const blob = new Blob([buildTemplateCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voucher-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    const parsed = parseCsv(await file.text());
    const missing = VOUCHER_CSV_REQUIRED.filter((h) => !parsed.headers.includes(h));
    if (missing.length > 0) {
      setHeaderError(`${t('vb_headerMissing')}: ${missing.join(', ')}`);
      setRows([]);
      return;
    }
    setHeaderError(null);
    setRows(parsed.rows);
  };

  const handlePublish = async () => {
    if (validRows.length === 0) return;
    setPublishing(true);
    try {
      setResult(await bulkCreateVouchers(validRows.map((v) => v.row)));
    } catch {
      setResult({ results: [], created: 0, failed: validRows.length });
    } finally {
      setPublishing(false);
    }
  };

  const bg = { image: t('vb_bgImage'), color: t('vb_bgColor'), tenant: t('vb_bgTenant') } as const;
  const cardCls = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-card-dark';

  return (
    <>
      {/* Upload card */}
      <section className={`${cardCls} p-5`}>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{t('vb_emptyHint')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadTemplate}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {t('vb_downloadTemplate')}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={publishing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {t('vb_chooseFile')}
          </button>
          {fileName && <span className="text-sm text-slate-500 dark:text-slate-400" dir="ltr">{fileName}</span>}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }}
          />
        </div>
        {headerError && <p className="mt-3 text-sm text-red-600">{headerError}</p>}
      </section>

      {/* Result summary */}
      {result && (
        <section className={`${cardCls} p-5`}>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            <span className="text-emerald-600">{result.created} {t('vb_created')}</span>
            {result.failed > 0 && <span className="text-red-600"> · {result.failed} {t('vb_failed')}</span>}
          </p>
          {result.results.filter((r) => r.status === 'failed').length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-red-600">
              {result.results.filter((r) => r.status === 'failed').map((r) => (
                <li key={r.index}>#{(validRows[r.index]?.index ?? r.index) + 1}: {r.error}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Preview table */}
      {rows.length > 0 && !result && (
        <section className={`${cardCls} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-violet-50 dark:bg-violet-950/30 text-slate-600 dark:text-slate-300">
                <tr>
                  {['#', t('vb_colTitle'), t('vb_colPrice'), t('vb_colCombinable'), t('vb_colVisibility'), t('vb_colBackground'), t('vb_colInventory'), t('vb_colStatus')].map((h) => (
                    <th key={h} className="px-3 py-2 text-start font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validated.map((v) => {
                  const ok = v.errors.length === 0;
                  return (
                    <tr key={v.index} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 text-slate-400" dir="ltr">{v.index + 1}</td>
                      <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{v.row.title || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap" dir="ltr">{v.row.face_value || '—'} / {v.row.nexus_cost || '—'}</td>
                      <td className="px-3 py-2">{v.row.combinable || '—'}</td>
                      <td className="px-3 py-2">{v.row.visibility || 'tenant_only'}</td>
                      <td className="px-3 py-2">{bg[backgroundHint(v.row)]}</td>
                      <td className="px-3 py-2 whitespace-nowrap" dir="ltr">{inventoryHint(v.row)}</td>
                      <td className="px-3 py-2">
                        {ok ? (
                          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{t('vb_valid')}</span>
                        ) : (
                          <span className="text-xs text-red-600" title={v.errors.join('; ')}>{t('vb_invalid')}: {v.errors[0]}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {validRows.length} / {validated.length} {language === 'he' ? 'תקינות' : 'valid'}
            </span>
            <button
              type="button"
              onClick={() => { void handlePublish(); }}
              disabled={publishing || validRows.length === 0}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {publishing ? t('vb_publishing') : `${t('vb_publish')} (${validRows.length})`}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
