/**
 * InventoryValidityEditor: the inline validity editor shared by the inventory
 * modals (staged authoring + live management, single + bulk). A type toggle
 * (limit / from-until) defaulting to the unit's current type - or the offer
 * default for a window-less / bulk target - plus the value control; on save it
 * emits ONLY the active type's fields (clearing the other so a unit stays one
 * type). Shows the sub-5-year legal advisory for a short from-until window.
 * `onSave` may be async; the editor shows a busy state while it resolves.
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';

/** Validity-only patch: only the active type's fields are set, the other nulled. */
export type ValidityPatch = {
  validityValue?: number | null;
  validityUnit?: 'days' | 'months' | 'years' | null;
  validFrom?: string | null;
  validUntil?: string | null;
};

const inputCls = 'rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const FIVE_YEARS_MS = 5 * 365.25 * 24 * 60 * 60 * 1000;

interface Props {
  defaultType: 'limit' | 'from_until';
  /** The target's current validity (null/empty for a bulk re-stamp or new unit). */
  unit?: ValidityPatch | null;
  onSave: (patch: ValidityPatch) => void | Promise<void>;
  onCancel: () => void;
}

export default function InventoryValidityEditor({ defaultType, unit, onSave, onCancel }: Props) {
  const { t, language } = useLanguage();
  // Value/date controls follow the active language: right-aligned + RTL order in
  // Hebrew (unit dropdown opens its options to the right), left/LTR in English.
  const dir = language === 'he' ? 'rtl' : 'ltr';
  const inferred: 'limit' | 'from_until' = unit?.validFrom != null ? 'from_until' : unit?.validityValue != null ? 'limit' : defaultType;
  const [vType, setVType] = useState<'limit' | 'from_until'>(inferred);
  const [val, setVal] = useState(unit?.validityValue != null ? String(unit.validityValue) : '5');
  const [u, setU] = useState<'days' | 'months' | 'years'>(unit?.validityUnit ?? 'years');
  const [from, setFrom] = useState(unit?.validFrom ? unit.validFrom.slice(0, 10) : '');
  const [until, setUntil] = useState(unit?.validUntil ? unit.validUntil.slice(0, 10) : '');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showAdvisory = vType === 'from_until' && !!from && !!until
    && new Date(until).getTime() >= new Date(from).getTime()
    && (new Date(until).getTime() - new Date(from).getTime()) < FIVE_YEARS_MS;

  const run = async (patch: ValidityPatch) => {
    setBusy(true);
    try { await onSave(patch); } catch { setErr(t('im_loadError')); } finally { setBusy(false); }
  };
  const save = () => {
    setErr(null);
    if (vType === 'limit') {
      const n = Number(val);
      if (!val.trim() || !Number.isInteger(n) || n <= 0) { setErr(t('vi_errBatchValidity')); return; }
      void run({ validityValue: n, validityUnit: u, validFrom: null, validUntil: null });
    } else {
      if (!from || !until) { setErr(t('vi_errBatchValidity')); return; }
      if (new Date(until).getTime() < new Date(from).getTime()) { setErr(t('vi_errBatchRange')); return; }
      void run({ validFrom: from, validUntil: until, validityValue: null, validityUnit: null });
    }
  };

  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
      <div className="mb-2 inline-flex gap-1 rounded-lg border border-slate-200 p-0.5 dark:border-slate-700" role="group">
        {([{ v: 'limit', label: t('co_validityTypeLimit') }, { v: 'from_until', label: t('co_validityTypeFromUntil') }] as const).map((opt) => (
          <button key={opt.v} type="button" onClick={() => setVType(opt.v)} aria-pressed={vType === opt.v}
            className={cn('rounded-md px-3 py-1 text-xs font-medium transition-colors', vType === opt.v ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}>
            {opt.label}
          </button>
        ))}
      </div>
      {vType === 'limit' ? (
        <div className="flex gap-2" dir={dir}>
          <input type="number" min="1" step="1" value={val} onChange={(e) => setVal(e.target.value)} className={cn(inputCls, 'w-20')} />
          <select value={u} onChange={(e) => setU(e.target.value as 'days' | 'months' | 'years')} className={inputCls}>
            <option value="days">{t('co_validityUnitDays')}</option>
            <option value="months">{t('co_validityUnitMonths')}</option>
            <option value="years">{t('co_validityUnitYears')}</option>
          </select>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2" dir={dir}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          <input type="date" value={until} min={from || undefined} onChange={(e) => setUntil(e.target.value)} className={inputCls} />
        </div>
      )}
      {showAdvisory && <p className="mt-2 rounded-md bg-amber-50 dark:bg-amber-900/20 p-2 text-xs text-amber-700 dark:text-amber-400">{t('vi_legalAdvisory')}</p>}
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60">{t('im_save')}</button>
        <button type="button" onClick={onCancel} disabled={busy} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">{t('im_cancel')}</button>
      </div>
    </div>
  );
}
