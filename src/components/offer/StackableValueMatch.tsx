/**
 * Stackable value-matching step for the voucher XLSX import.
 *
 * When the spreadsheet's "combine with promotions" column is mapped, its values
 * are free text (e.g. "Stackable" / "Not stackable" / "1"). This screen lets the
 * admin map each distinct value to the binary choice yes/no. The caller only
 * shows this when there are 1-2 distinct values; more than two is a blocking
 * error raised earlier (a binary field cannot have three meanings).
 *
 * Visual language matches the column-mapping modal it sits inside.
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { StackableValueMap } from '../../pages/voucherXlsxImport';
import ImportScrollPanel from './ImportScrollPanel';

interface StackableValueMatchProps {
  /** Distinct, non-empty values found in the mapped stackable column. */
  values: string[];
  /** Back to the column-mapping screen. */
  onBack: () => void;
  /** Confirm with each value resolved to 'yes' | 'no' (keyed by lower-cased value). */
  onConfirm: (map: StackableValueMap) => void;
}

/** Heuristic first guess so the admin usually just confirms: "no"-ish text -> no. */
function guess(value: string): 'yes' | 'no' {
  return /\b(no|not|false|0|none|ללא|לא)\b/i.test(value) ? 'no' : 'yes';
}

/** Renders the value -> yes/no matcher. */
export default function StackableValueMatch({ values, onBack, onConfirm }: StackableValueMatchProps) {
  const { t } = useLanguage();
  const [choices, setChoices] = useState<Record<string, 'yes' | 'no'>>(() =>
    Object.fromEntries(values.map((v) => [v.toLowerCase(), guess(v)])),
  );

  const set = (value: string, choice: 'yes' | 'no') =>
    setChoices((prev) => ({ ...prev, [value.toLowerCase()]: choice }));

  const confirm = () => {
    const map: StackableValueMap = {};
    for (const v of values) map[v.toLowerCase()] = choices[v.toLowerCase()] ?? guess(v);
    onConfirm(map);
  };

  return (
    <ImportScrollPanel>
      <div className="flex items-center gap-2 text-slate-400 mb-10">
        <span className="material-icons text-lg">rule</span>
        <span className="text-xs font-medium uppercase tracking-wider">{t('vxi_matchEyebrow')}</span>
      </div>

      <h1 className="text-3xl font-semibold mb-2 tracking-tight">{t('vxi_matchTitle')}</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">{t('vxi_matchDesc')}</p>

      <div className="flex-1 space-y-4">
        {values.map((value) => {
          const current = choices[value.toLowerCase()];
          return (
            <div
              key={value}
              className="flex items-center justify-between gap-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4"
            >
              <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200" title={value}>
                {value}
              </span>
              <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                {(['yes', 'no'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set(value, opt)}
                    className={`px-5 py-2 text-sm font-semibold transition-colors ${
                      current === opt
                        ? opt === 'yes'
                          ? 'bg-primary text-white'
                          : 'bg-slate-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt === 'yes' ? t('vxi_yes') : t('vxi_no')}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2.5 font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          {t('cm_back')}
        </button>
        <button
          onClick={confirm}
          className="bg-primary text-white px-10 py-2.5 font-semibold rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
        >
          {t('vxi_addToForm')}
        </button>
      </div>
    </ImportScrollPanel>
  );
}
