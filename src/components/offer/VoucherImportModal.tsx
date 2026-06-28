/**
 * Voucher XLSX import modal. Orchestrates the three-step flow (upload -> map ->
 * match) inside the same modal shell as the contacts import, then hands the
 * generated draft variants back to the create form. Reads real Excel client-side
 * (`xlsxReader`), maps columns (`VoucherColumnMapping`), optionally matches the
 * stackable column's values to yes/no (`StackableValueMatch`), and groups rows
 * into variants (`voucherXlsxImport`). No backend call happens here.
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { readXlsx, isXlsxFile } from '../../lib/xlsxReader';
import type { ParsedCsv } from '../../lib/csvParser';
import {
  rowsToDraftVariants,
  type VoucherImportMapping,
  type VoucherImportOutcome,
} from '../../pages/voucherXlsxImport';
import VoucherColumnMapping from './VoucherColumnMapping';
import StackableValueMatch from './StackableValueMatch';

interface VoucherImportModalProps {
  onClose: () => void;
  /** Receives the grouped variants + counts once mapping (and matching) completes. */
  onImport: (outcome: VoucherImportOutcome) => void;
}

type Step = 'upload' | 'map' | 'match';

/** Today as YYYY-MM-DD, used as every imported unit's validFrom + the 5-year fallback base. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function VoucherImportModal({ onClose, onImport }: VoucherImportModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('upload');
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = useState<string>();
  const [mapping, setMapping] = useState<VoucherImportMapping>({});
  const [distinct, setDistinct] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!isXlsxFile(file)) { setError(t('vxi_readError')); return; }
    setReading(true);
    try {
      const result = await readXlsx(file);
      if (result.rows.length === 0) { setError(t('vxi_emptyFile')); return; }
      setParsed(result);
      setFileName(file.name);
      setStep('map');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('vxi_readError'));
    } finally {
      setReading(false);
    }
  };

  const finalize = (m: VoucherImportMapping, valueMap: Record<string, 'yes' | 'no'>) => {
    if (!parsed) return;
    onImport(rowsToDraftVariants(parsed.rows, m, valueMap, today()));
  };

  const onMapNext = (m: VoucherImportMapping, stackableDistinct: string[]) => {
    setMapping(m);
    setDistinct(stackableDistinct);
    if (stackableDistinct.length > 0) setStep('match');
    else finalize(m, {});
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-[200] overflow-hidden backdrop-blur-sm">
      <div className="h-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl bg-white dark:bg-slate-900 shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] animate-in fade-in zoom-in duration-300">

          {step === 'upload' && (
            <div className="flex-1 p-8 lg:p-12 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="material-icons text-lg">upload_file</span>
                  <span className="text-xs font-medium uppercase tracking-wider">{t('cm_importProcess')}</span>
                </div>
                <div className="flex items-center gap-6">
                  <button onClick={onClose} className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors">
                    <span className="material-icons text-base">close</span>
                    <span>{t('cm_close')}</span>
                  </button>
                  <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">{t('vxi_step1')}</span>
                </div>
              </div>

              <h1 className="text-3xl font-semibold mb-2 tracking-tight">{t('vxi_uploadTitle')}</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl">{t('vxi_uploadDesc')}</p>

              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFile(e.dataTransfer.files?.[0]); }}
                className={`block cursor-pointer rounded-xl border-2 border-dashed transition-all ${
                  dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-slate-300 dark:border-slate-700 hover:border-primary/50'
                }`}
              >
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />
                <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-6 text-primary border border-slate-200 dark:border-slate-700">
                    <span className="material-icons text-3xl">{reading ? 'hourglass_top' : 'upload_file'}</span>
                  </div>
                  <p className="text-lg text-slate-900 dark:text-white font-medium">
                    <span className="text-primary">{t('vxi_browse')}</span>{t('vxi_orDrag')}
                  </p>
                  <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">{t('vxi_fileTypes')}</p>
                </div>
              </label>

              {error && (
                <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
                  <span className="material-icons text-base">error_outline</span>
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {step === 'map' && parsed && (
            <VoucherColumnMapping
              fileName={fileName}
              headers={parsed.headers}
              rows={parsed.rows}
              onBack={() => { setParsed(null); setStep('upload'); }}
              onNext={onMapNext}
            />
          )}

          {step === 'match' && (
            <StackableValueMatch
              values={distinct}
              onBack={() => setStep('map')}
              onConfirm={(valueMap) => finalize(mapping, valueMap)}
            />
          )}

          {/* Right info panel - explains the one rule unique to this import: how rows become variants. */}
          <div className="hidden md:flex w-2/5 bg-slate-50 dark:bg-slate-900/40 items-center justify-center p-12 border-s border-slate-200 dark:border-slate-800">
            <div className="max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <span className="material-icons">qr_code_2</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('vxi_panelTitle')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('vxi_panelBody')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
