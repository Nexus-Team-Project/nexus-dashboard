/**
 * Voucher column-mapping screen for the XLSX import. Cloned from the contacts
 * `ColumnMapping` look (same modal shell, two-column grid, footer) but targets
 * the full voucher "Create Variant" field set. Nothing is required: the admin
 * maps whatever columns the file has and completes the rest in the form, so the
 * UI shows no mandatory/optional markers and never blocks on a missing field.
 * The one hard stop is a stackable column with more than two distinct values.
 *
 * It only maps columns -> fields; turning rows into variants is done by
 * `voucherXlsxImport`, and the stackable value-matching is a later step. Leaves
 * `/users` ColumnMapping untouched (clone, per the `RecipientColumnMapping` precedent).
 */
import { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { collectColumnValues, type VoucherImportMapping } from '../../pages/voucherXlsxImport';
import type { TranslationKey } from '../../i18n/translations';
import ImportScrollPanel from './ImportScrollPanel';

/** A voucher mapping target, or '' (ignore this column). */
type VoucherTarget = keyof VoucherImportMapping | '';

/** Target fields offered in each column's dropdown, in display order. No required flags. */
const FIELDS: { key: keyof VoucherImportMapping; labelKey: TranslationKey }[] = [
  { key: 'value', labelKey: 'vxi_fieldValue' },
  { key: 'salePrice', labelKey: 'vxi_fieldSalePrice' },
  { key: 'sku', labelKey: 'vxi_fieldSku' },
  { key: 'stackable', labelKey: 'vxi_fieldStackable' },
  { key: 'tags', labelKey: 'vxi_fieldTags' },
  { key: 'terms', labelKey: 'vxi_fieldTerms' },
  { key: 'method', labelKey: 'vxi_fieldMethod' },
  { key: 'startDate', labelKey: 'vxi_fieldStartDate' },
  { key: 'endDate', labelKey: 'vxi_fieldEndDate' },
  { key: 'duration', labelKey: 'vxi_fieldDuration' },
  { key: 'barcode', labelKey: 'vxi_fieldBarcode' },
  { key: 'link', labelKey: 'vxi_fieldLink' },
  { key: 'linkCode', labelKey: 'vxi_fieldLinkCode' },
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
  onBack: () => void;
  onNext: (mapping: VoucherImportMapping, stackableDistinct: string[]) => void;
}

// No auto-detection for now: every column starts unmapped and the admin maps it
// explicitly. (Header/content-based auto-mapping may be added later.)

/** First non-empty value of a column, for the example hint (single row). */
function sampleValues(rows: Record<string, string>[], header: string): string {
  return rows.map((r) => r[header]).find(Boolean) || '-';
}

/** Builds the field -> column mapping from the per-column rows. */
function toMapping(mapRows: MapRow[]): VoucherImportMapping {
  const colFor = (target: keyof VoucherImportMapping) => mapRows.find((r) => r.target === target)?.column;
  const mapping: VoucherImportMapping = {};
  for (const f of FIELDS) {
    const col = colFor(f.key);
    if (col) mapping[f.key] = col;
  }
  return mapping;
}

/** Renders the voucher column-mapping screen. */
export default function VoucherColumnMapping({ fileName, headers, rows, onBack, onNext }: VoucherColumnMappingProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const [mapRows, setMapRows] = useState<MapRow[]>(() =>
    headers.map((column) => ({ column, target: '', sample: sampleValues(rows, column) })),
  );

  const change = (index: number, target: VoucherTarget) =>
    setMapRows((prev) => prev.map((r, i) => (i === index ? { ...r, target } : r)));

  const mapping = useMemo(() => toMapping(mapRows), [mapRows]);
  const stackableDistinct = useMemo(
    () => (mapping.stackable ? collectColumnValues(rows, mapping.stackable) : []),
    [mapping.stackable, rows],
  );
  const stackTooMany = stackableDistinct.length > 2;
  const mappedCount = mapRows.filter((r) => r.target !== '').length;
  const linkMapped = mapRows.some((r) => r.target === 'link');

  // Link codes cannot outnumber links (a code with no link is invalid).
  const codesExceedLinks = useMemo(() => {
    if (!mapping.linkCode) return false;
    const nonEmpty = (col?: string) => (col ? rows.filter((r) => (r[col] ?? '').trim() !== '').length : 0);
    return nonEmpty(mapping.linkCode) > nonEmpty(mapping.link);
  }, [mapping.linkCode, mapping.link, rows]);

  const blocked = stackTooMany || codesExceedLinks;
  const proceed = () => {
    if (blocked) return;
    onNext(mapping, stackableDistinct);
  };

  return (
    <ImportScrollPanel>
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

      {codesExceedLinks && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
          <span className="material-icons text-base">error_outline</span>
          <span>{t('vxi_codesExceedLinks')}</span>
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
                    dir={isHe ? 'rtl' : 'ltr'}
                    className={`w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary py-3 transition-all cursor-pointer hover:shadow-md ${
                      isHe ? 'pl-10 pr-4 text-right' : 'pr-10 pl-4 text-left'
                    } ${
                      row.target ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 italic'
                    }`}
                    style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
                  >
                    <option value="">{t('cm_chooseColumn')}</option>
                    {FIELDS.map((f) => {
                      const claimedByOther = mapRows.some((m, i) => i !== index && m.target === f.key);
                      // Inventory is one kind per voucher. Barcode is one family; Link + Link codes
                      // are the other. Block the opposite family when it is mapped in another row
                      // (so this row can still switch within its choice). Link codes additionally
                      // require Link to be mapped somewhere - a code has no meaning without links.
                      const otherBarcode = mapRows.some((m, i) => i !== index && m.target === 'barcode');
                      const otherLinkFamily = mapRows.some((m, i) => i !== index && (m.target === 'link' || m.target === 'linkCode'));
                      const kindBlocked =
                        (f.key === 'barcode' && otherLinkFamily) ||
                        (f.key === 'link' && otherBarcode) ||
                        (f.key === 'linkCode' && (otherBarcode || !linkMapped));
                      return (
                        <option key={f.key} value={f.key} disabled={claimedByOther || kindBlocked}>
                          {t(f.labelKey)}{claimedByOther ? ' ✓' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <span className={`material-icons absolute ${isHe ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg`}>
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {mappedCount > 0 ? `${mappedCount} ${t('vxi_mappedCount')}` : t('vxi_mapHint')}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-6 py-2.5 font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            {t('cm_back')}
          </button>
          <button
            onClick={proceed}
            disabled={blocked}
            className="bg-primary text-white px-10 py-2.5 font-semibold rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('cm_next')}
          </button>
        </div>
      </div>
    </ImportScrollPanel>
  );
}
