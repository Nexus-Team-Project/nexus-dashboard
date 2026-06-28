/**
 * Voucher column-mapping screen for the XLSX import. Cloned from the contacts
 * `ColumnMapping` look (same modal shell, two-column grid, footer) but targets
 * the voucher-variant fields: Value, Sale price, Barcode (required), plus
 * Allow-stackable and Expiry date (optional). Leaves `/users` ColumnMapping
 * untouched, following the existing `RecipientColumnMapping` clone precedent.
 *
 * It only maps columns -> fields and gates Next; turning rows into variants is
 * done by `voucherXlsxImport`, and the stackable value-matching is a later step.
 */
import { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { collectColumnValues, type VoucherImportMapping } from '../../pages/voucherXlsxImport';
import type { TranslationKey } from '../../i18n/translations';

/** A voucher mapping target, or '' (ignore this column). */
type VoucherTarget = 'value' | 'salePrice' | 'stackable' | 'barcode' | 'date' | '';

/** Target fields offered in each column's dropdown, in display order. */
const FIELDS: { key: Exclude<VoucherTarget, ''>; labelKey: TranslationKey; required: boolean }[] = [
  { key: 'value', labelKey: 'vxi_fieldValue', required: true },
  { key: 'salePrice', labelKey: 'vxi_fieldSalePrice', required: true },
  { key: 'barcode', labelKey: 'vxi_fieldBarcode', required: true },
  { key: 'stackable', labelKey: 'vxi_fieldStackable', required: false },
  { key: 'date', labelKey: 'vxi_fieldDate', required: false },
];

interface MapRow {
  column: string;
  target: VoucherTarget;
  sample: string;
}

interface VoucherColumnMappingProps {
  fileName?: string;
  headers: string[];
  rows: Record<string, string>[];
  /** Back to the upload step. */
  onBack: () => void;
  /** Proceed with the chosen mapping and the distinct values of the stackable column (if mapped). */
  onNext: (mapping: VoucherImportMapping, stackableDistinct: string[]) => void;
}

/** Auto-maps a header to a voucher field by name (EN + HE), or '' when unsure. */
function autoDetect(header: string): VoucherTarget {
  const h = header.toLowerCase().trim();
  if (/stack|combin|promo|כפל|מבצע/.test(h)) return 'stackable';
  if (/barcode|serial|voucher|ברקוד|שובר|קוד/.test(h)) return 'barcode';
  if (/date|expir|valid|until|תאריך|תוקף|פג/.test(h)) return 'date';
  if (/sale|sell|מכיר/.test(h)) return 'salePrice';
  if (/price|מחיר/.test(h)) return 'salePrice';
  if (/value|face|amount|שווי|ערך/.test(h)) return 'value';
  return '';
}

/** First two non-empty values of a column, for the example hint. */
function sampleValues(rows: Record<string, string>[], header: string): string {
  const vals = rows.map((r) => r[header]).filter(Boolean).slice(0, 2);
  return vals.join(', ') || '-';
}

/** Builds the field -> column mapping object from the per-column rows. */
function toMapping(mapRows: MapRow[]): VoucherImportMapping {
  const colFor = (target: VoucherTarget) => mapRows.find((r) => r.target === target)?.column;
  return {
    value: colFor('value'),
    salePrice: colFor('salePrice'),
    stackable: colFor('stackable'),
    barcode: colFor('barcode'),
    date: colFor('date'),
  };
}

/** Renders the voucher column-mapping screen. */
export default function VoucherColumnMapping({ fileName, headers, rows, onBack, onNext }: VoucherColumnMappingProps) {
  const { t } = useLanguage();
  const [mapRows, setMapRows] = useState<MapRow[]>(() =>
    headers.map((column) => ({ column, target: autoDetect(column), sample: sampleValues(rows, column) })),
  );

  const change = (index: number, target: VoucherTarget) =>
    setMapRows((prev) => prev.map((r, i) => (i === index ? { ...r, target } : r)));

  const mapping = useMemo(() => toMapping(mapRows), [mapRows]);
  const stackableDistinct = useMemo(
    () => (mapping.stackable ? collectColumnValues(rows, mapping.stackable) : []),
    [mapping.stackable, rows],
  );

  // Coupling: one of Value/Sale price is enough (the other mirrors it). Barcode is required.
  const priceMapped = !!mapping.value || !!mapping.salePrice;
  const barcodeMapped = !!mapping.barcode;
  const stackTooMany = stackableDistinct.length > 2;
  const canProceed = priceMapped && barcodeMapped && !stackTooMany;

  const proceed = () => {
    if (!canProceed) return;
    onNext(mapping, stackableDistinct);
  };

  return (
    <div className="flex-1 p-8 lg:p-12 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="material-icons text-lg">table_view</span>
          <span className="material-icons text-sm rtl:rotate-180">chevron_right</span>
          <span className="text-xs font-medium uppercase tracking-wider">{fileName ?? t('cm_importProcess')}</span>
        </div>
        <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">
          {t('vxi_step2')}
        </span>
      </div>

      <h1 className="text-3xl font-semibold mb-2 tracking-tight">{t('vxi_mapTitle')}</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">{t('vxi_mapDesc')}</p>

      {stackTooMany && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
          <span className="material-icons text-base">error_outline</span>
          <span>{t('vxi_stackTooMany')}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar ps-4 -ms-4">
        <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 px-2">
          <div className="text-start">{t('cm_excelColumns')}</div>
          <div className="text-start">{t('vxi_voucherFields')}</div>
        </div>

        <div className="space-y-4">
          {mapRows.map((row, index) => (
            <div
              key={row.column}
              className={`group flex items-center gap-6 p-4 rounded-xl border transition-all duration-200 ${
                row.target
                  ? 'border-slate-200 dark:border-slate-800 hover:border-primary/30 bg-white dark:bg-slate-900/50'
                  : 'border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/30 bg-white/40 dark:bg-transparent'
              }`}
            >
              <div className="flex-1 flex flex-col min-w-0">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{row.column}</span>
                <span className="text-xs text-slate-400 truncate">{t('cm_example')}: {row.sample}</span>
              </div>
              <span className="material-icons text-slate-300 dark:text-slate-600 rtl:rotate-180">arrow_back</span>
              <div className="flex-1">
                <div className="relative">
                  <select
                    value={row.target}
                    onChange={(e) => change(index, e.target.value as VoucherTarget)}
                    className={`w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary py-3 px-4 pe-10 transition-all cursor-pointer hover:shadow-md ${
                      row.target ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 italic'
                    }`}
                    style={{ appearance: 'none', backgroundImage: 'none' }}
                  >
                    <option value="">{t('cm_chooseColumn')}</option>
                    {FIELDS.map((f) => {
                      const claimedByOther = mapRows.some((m, i) => i !== index && m.target === f.key);
                      const label = `${t(f.labelKey)}${f.required ? ' *' : ` (${t('vxi_optional')})`}`;
                      return (
                        <option key={f.key} value={f.key} disabled={claimedByOther}>
                          {label}{claimedByOther ? ' ✓' : ''}
                        </option>
                      );
                    })}
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

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4">
        <div className="text-sm">
          {canProceed ? (
            <span className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <span className="material-icons text-lg">check_circle</span>
              {t('vxi_readyToReview')}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <span className="material-icons text-lg">warning_amber</span>
              {t('vxi_needRequired')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-6 py-2.5 font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            {t('cm_back')}
          </button>
          <button
            onClick={proceed}
            disabled={!canProceed}
            className="bg-primary text-white px-10 py-2.5 font-semibold rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('cm_next')}
          </button>
        </div>
      </div>
    </div>
  );
}
