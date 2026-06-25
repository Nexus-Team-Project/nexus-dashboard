/**
 * VariantInventoryManagerModal: per-variant inventory management surface launched
 * from Benefits Partnerships (voucher-inventory-management). Lists a variant's
 * redeemable units (paged) with their value, validity and status; filters by date
 * (range removed for v1 simplicity - fixed expiring-soon choices + "no date yet");
 * adds a dated batch (reusing VoucherInventoryModal), edits a single unit's date
 * inline, bulk re-stamps a selection, and deletes a unit. All writes go through the
 * admin-gated inventory endpoints; the backend is the authoritative guard.
 *
 * z-[200], body-scroll-lock, RTL-aware. Presentational state only; no global state.
 */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import {
  listVariantUnits, updateUnitValidity, deleteVariantUnit, addVariantInventory,
  type InventoryUnitView, type UnitDateFilter, type OfferInventoryInput,
} from '../../lib/api';
import VoucherInventoryModal from './VoucherInventoryModal';

type ExpiringChoice = 'all' | '1m' | '3m' | '1y' | 'none';

interface Props {
  offerId: string;
  variantId: string;
  variantLabel: string;
  /** The variant's effective validity type, for the add-batch + edit controls. */
  validityType: 'limit' | 'from_until';
  onClose: () => void;
  /** Called after any write so the parent can refresh its stock/counts. */
  onChanged?: () => void;
}

const PAGE_SIZE = 50;
const inputCls = 'rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white';

/** Maps the filter choice to the API date filter. */
function toFilter(choice: ExpiringChoice): UnitDateFilter {
  if (choice === 'none') return { noWindow: true };
  if (choice === '1m' || choice === '3m' || choice === '1y') return { expiringWithin: choice };
  return {};
}

export default function VariantInventoryManagerModal({ offerId, variantId, variantLabel, validityType, onClose, onChanged }: Props) {
  const { t, language } = useLanguage();
  const [units, setUnits] = useState<InventoryUnitView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [choice, setChoice] = useState<ExpiringChoice>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await listVariantUnits(offerId, variantId, toFilter(choice), page, PAGE_SIZE);
      setUnits(res.units); setTotal(res.total);
    } catch { setError(t('im_loadError')); } finally { setLoading(false); }
  }, [offerId, variantId, choice, page, t]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const refresh = () => { void load(); onChanged?.(); };

  const onDelete = async (codeId: string) => {
    if (!window.confirm(t('im_deleteConfirm'))) return;
    try { await deleteVariantUnit(offerId, variantId, codeId); refresh(); }
    catch { setError(t('im_loadError')); }
  };

  /** The kind already in use (locks the add-batch popup to one kind). */
  const lockedKind = units[0]?.kind ?? null;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const lockedChoices: { v: ExpiringChoice; label: string }[] = [
    { v: 'all', label: t('im_filterAll') },
    { v: '1m', label: t('im_filterExpiring1m') },
    { v: '3m', label: t('im_filterExpiring3m') },
    { v: '1y', label: t('im_filterExpiring1y') },
    { v: 'none', label: t('im_filterNoWindow') },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog" aria-modal="true" aria-label={t('im_title')} dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-card-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('im_title')} · {variantLabel}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{total} {t('im_total')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('im_cancel')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">&#x2715;</button>
        </div>

        {/* Toolbar: filter + add batch */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
          <div className="flex flex-wrap items-center gap-1">
            <span className="me-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t('im_filterLabel')}:</span>
            {lockedChoices.map((c) => (
              <button key={c.v} type="button" onClick={() => { setChoice(c.v); setPage(1); }}
                aria-pressed={choice === c.v}
                className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  choice === c.v ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}>
                {c.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setShowAddBatch(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:opacity-90">
            {t('im_addBatch')}
          </button>
        </div>

        {/* Bulk re-stamp note */}
        {selected.size > 0 && (
          <div className="mx-5 mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800/50">
            <span className="text-slate-600 dark:text-slate-300">{selected.size}</span>
            <button type="button" onClick={() => setEditing('__bulk__')} className="font-semibold text-primary hover:underline">{t('im_editDate')}</button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : units.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">{t('im_empty')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="w-6 p-2"></th>
                  <th className="p-2 text-start">{t('im_colValue')}</th>
                  <th className="p-2 text-start">{t('im_colValidity')}</th>
                  <th className="p-2 text-start">{t('im_colStatus')}</th>
                  <th className="p-2 text-end">{t('im_colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <UnitRow
                    key={u.codeId} unit={u} validityType={validityType}
                    selected={selected.has(u.codeId)}
                    onToggle={() => setSelected((s) => { const n = new Set(s); n.has(u.codeId) ? n.delete(u.codeId) : n.add(u.codeId); return n; })}
                    editing={editing === u.codeId}
                    onEditStart={() => setEditing(u.codeId)}
                    onEditCancel={() => setEditing(null)}
                    onSaved={() => { setEditing(null); refresh(); }}
                    onDelete={() => void onDelete(u.codeId)}
                    offerId={offerId} variantId={variantId}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer: paging */}
        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-slate-100 p-4 text-sm dark:border-slate-800">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40 dark:border-slate-700">&lsaquo;</button>
            <span dir="ltr">{page} / {lastPage}</span>
            <button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40 dark:border-slate-700">&rsaquo;</button>
          </div>
        )}
      </div>

      {/* Add-batch popup (reuses the authoring inventory modal). */}
      {showAddBatch && (
        <VoucherInventoryModal
          validityType={validityType}
          lockedKind={lockedKind}
          onConfirm={async (inv: OfferInventoryInput) => {
            try { await addVariantInventory(offerId, variantId, inv); setShowAddBatch(false); refresh(); }
            catch { setShowAddBatch(false); setError(t('im_loadError')); }
          }}
          onSkip={() => setShowAddBatch(false)}
          onCancel={() => setShowAddBatch(false)}
        />
      )}

      {/* Bulk re-stamp editor. */}
      {editing === '__bulk__' && (
        <UnitDateEditor
          validityType={validityType} unit={null}
          onCancel={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              await Promise.all(Array.from(selected).map((id) => updateUnitValidity(offerId, variantId, id, patch)));
              setEditing(null); setSelected(new Set()); refresh();
            } catch { setEditing(null); setError(t('im_loadError')); }
          }}
        />
      )}
    </div>,
    document.body,
  );
}

// --- Row + inline editor (kept in-file; small + cohesive) ---------------------

/** Formats a unit's validity for display (limit duration / window / "set at purchase"). */
function useUnitValidityText() {
  const { t } = useLanguage();
  return (u: InventoryUnitView): string => {
    if (u.validFrom && u.validUntil) {
      const f = u.validFrom.slice(0, 10); const v = u.validUntil.slice(0, 10);
      return `⁦${f} - ${v}⁩`;
    }
    if (u.validityValue && u.validityUnit) {
      const unit = u.validityUnit === 'days' ? t('co_validityUnitDays') : u.validityUnit === 'months' ? t('co_validityUnitMonths') : t('co_validityUnitYears');
      return `${u.validityValue} ${unit}`;
    }
    return t('im_noWindowYet');
  };
}

interface UnitRowProps {
  unit: InventoryUnitView; validityType: 'limit' | 'from_until';
  selected: boolean; onToggle: () => void;
  editing: boolean; onEditStart: () => void; onEditCancel: () => void; onSaved: () => void;
  onDelete: () => void; offerId: string; variantId: string;
}

function UnitRow({ unit, validityType, selected, onToggle, editing, onEditStart, onEditCancel, onSaved, onDelete, offerId, variantId }: UnitRowProps) {
  const { t } = useLanguage();
  const validityText = useUnitValidityText();
  const statusLabel = unit.status === 'available' ? t('im_statusAvailable') : unit.status === 'assigned' ? t('im_statusAssigned') : t('im_statusRedeemed');
  return (
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <td className="p-2"><input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" /></td>
      <td className="p-2 font-mono text-xs text-slate-700 dark:text-slate-200" dir="ltr">{unit.value}</td>
      <td className="p-2 text-slate-600 dark:text-slate-300" dir="ltr">{validityText(unit)}</td>
      <td className="p-2 text-slate-500 dark:text-slate-400">{statusLabel}</td>
      <td className="p-2 text-end">
        <button type="button" onClick={onEditStart} className="text-xs font-medium text-primary hover:underline">{t('im_editDate')}</button>
        <button type="button" onClick={onDelete} className="ms-2 text-xs font-medium text-red-500 hover:underline">{t('im_delete')}</button>
      </td>
      {editing && (
        <td colSpan={5} className="p-0">
          <div className="p-3">
            <UnitDateEditor validityType={validityType} unit={unit} onCancel={onEditCancel}
              onSave={async (patch) => { await updateUnitValidity(offerId, variantId, unit.codeId, patch); onSaved(); }} />
          </div>
        </td>
      )}
    </tr>
  );
}

interface EditorProps {
  validityType: 'limit' | 'from_until';
  unit: InventoryUnitView | null;
  onSave: (patch: { validityValue?: number; validityUnit?: 'days' | 'months' | 'years'; validFrom?: string; validUntil?: string }) => Promise<void>;
  onCancel: () => void;
}

/** Inline validity editor for a single unit or a bulk selection (unit === null). */
function UnitDateEditor({ validityType, unit, onSave, onCancel }: EditorProps) {
  const { t } = useLanguage();
  const [val, setVal] = useState(unit?.validityValue != null ? String(unit.validityValue) : '5');
  const [u, setU] = useState<'days' | 'months' | 'years'>(unit?.validityUnit ?? 'years');
  const [from, setFrom] = useState(unit?.validFrom ? unit.validFrom.slice(0, 10) : '');
  const [until, setUntil] = useState(unit?.validUntil ? unit.validUntil.slice(0, 10) : '');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr(null);
    if (validityType === 'limit') {
      const n = Number(val);
      if (!val.trim() || !Number.isInteger(n) || n <= 0) { setErr(t('vi_errBatchValidity')); return; }
      setBusy(true); try { await onSave({ validityValue: n, validityUnit: u }); } catch { setErr(t('im_loadError')); } finally { setBusy(false); }
    } else {
      if (!from || !until) { setErr(t('vi_errBatchValidity')); return; }
      if (new Date(until).getTime() < new Date(from).getTime()) { setErr(t('vi_errBatchRange')); return; }
      setBusy(true); try { await onSave({ validFrom: from, validUntil: until }); } catch { setErr(t('im_loadError')); } finally { setBusy(false); }
    }
  };

  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
      {validityType === 'limit' ? (
        <div className="flex gap-2" dir="ltr">
          <input type="number" min="1" step="1" value={val} onChange={(e) => setVal(e.target.value)} className={cn(inputCls, 'w-20')} />
          <select value={u} onChange={(e) => setU(e.target.value as 'days' | 'months' | 'years')} className={inputCls}>
            <option value="days">{t('co_validityUnitDays')}</option>
            <option value="months">{t('co_validityUnitMonths')}</option>
            <option value="years">{t('co_validityUnitYears')}</option>
          </select>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2" dir="ltr">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          <input type="date" value={until} min={from || undefined} onChange={(e) => setUntil(e.target.value)} className={inputCls} />
        </div>
      )}
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => void save()} disabled={busy}
          className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60">{t('im_save')}</button>
        <button type="button" onClick={onCancel} disabled={busy}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">{t('im_cancel')}</button>
      </div>
    </div>
  );
}
