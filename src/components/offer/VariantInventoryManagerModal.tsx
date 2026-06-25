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
import { Fragment, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  listVariantUnits, updateUnitValidity, bulkUpdateUnitValidity, deleteVariantUnit, addVariantInventory,
  type InventoryUnitView, type UnitDateFilter, type OfferInventoryInput,
} from '../../lib/api';
import VoucherInventoryModal from './VoucherInventoryModal';
import InventoryValidityEditor from './InventoryValidityEditor';
import { EditIcon, TrashIcon } from './inventoryIcons';

type ExpiringChoice = 'all' | '1m' | '3m' | '1y' | 'none';

interface Props {
  offerId: string;
  variantId: string;
  variantLabel: string;
  /** Offer-level validity type default (the initial type for new batches/edits). */
  defaultType: 'limit' | 'from_until';
  onClose: () => void;
  /** Called after any write so the parent can refresh its stock/counts. */
  onChanged?: () => void;
}

const PAGE_SIZE = 50;
const inputCls = 'rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const thCls = 'p-2 text-start text-xs font-semibold text-slate-500 dark:text-slate-400';

export default function VariantInventoryManagerModal({ offerId, variantId, variantLabel, defaultType, onClose, onChanged }: Props) {
  const { t, language } = useLanguage();
  const [units, setUnits] = useState<InventoryUnitView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [choice, setChoice] = useState<ExpiringChoice>('all');
  // Created/Updated ranges + debounced code search.
  const [createdFrom, setCreatedFrom] = useState(''); const [createdTo, setCreatedTo] = useState('');
  const [updatedFrom, setUpdatedFrom] = useState(''); const [updatedTo, setUpdatedTo] = useState('');
  const [searchInput, setSearchInput] = useState(''); const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Debounce the search box (300ms) so typing does not spam the server.
  useEffect(() => { const id = setTimeout(() => setSearch(searchInput), 300); return () => clearTimeout(id); }, [searchInput]);
  // Any filter change resets to page 1.
  useEffect(() => { setPage(1); }, [choice, createdFrom, createdTo, updatedFrom, updatedTo, search]);

  const filter: UnitDateFilter = {
    ...(choice === 'none' ? { noWindow: true } : choice !== 'all' ? { expiringWithin: choice } : {}),
    ...(createdFrom && { createdFrom }), ...(createdTo && { createdTo }),
    ...(updatedFrom && { updatedFrom }), ...(updatedTo && { updatedTo }),
    ...(search.trim() && { search: search.trim() }),
  };
  const filterKey = JSON.stringify(filter);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await listVariantUnits(offerId, variantId, JSON.parse(filterKey), page, PAGE_SIZE);
      setUnits(res.units); setTotal(res.total);
    } catch { setError(t('im_loadError')); } finally { setLoading(false); }
  }, [offerId, variantId, filterKey, page, t]);

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
    try { await deleteVariantUnit(offerId, variantId, codeId); toast.success(t('im_toastDeleted')); refresh(); }
    catch { setError(t('im_loadError')); }
  };

  /** The kind already in use (locks the add-batch popup to one kind). */
  const lockedKind = units[0]?.kind ?? null;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog" aria-modal="true" aria-label={t('im_title')} dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-card-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('im_title')} · {variantLabel}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{total} {t('im_total')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('im_cancel')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">&#x2715;</button>
        </div>

        {/* Toolbar: search + expiring dropdown + created/updated ranges + add batch */}
        <div className="flex flex-wrap items-end gap-3 px-5 pt-4">
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t('im_searchPlaceholder')}
            className="min-w-[150px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          <label className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {t('im_filterExpiringLabel')}
            <select value={choice} onChange={(e) => setChoice(e.target.value as ExpiringChoice)} className={inputCls}>
              <option value="all">{t('im_filterAll')}</option>
              <option value="1m">{t('im_filterExpiring1m')}</option>
              <option value="3m">{t('im_filterExpiring3m')}</option>
              <option value="1y">{t('im_filterExpiring1y')}</option>
              <option value="none">{t('im_filterNoWindow')}</option>
            </select>
          </label>
          <button type="button" onClick={() => setShowAddBatch(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:opacity-90">{t('im_addBatch')}</button>
        </div>
        {/* Created / Updated date ranges */}
        <div className="flex flex-wrap items-end gap-3 px-5 pt-2" dir="ltr">
          <label className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">{t('im_filterCreated')} {t('im_filterFrom')}
            <input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className={inputCls} /></label>
          <label className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">{t('im_filterCreated')} {t('im_filterTo')}
            <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className={inputCls} /></label>
          <label className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">{t('im_filterUpdated')} {t('im_filterFrom')}
            <input type="date" value={updatedFrom} onChange={(e) => setUpdatedFrom(e.target.value)} className={inputCls} /></label>
          <label className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">{t('im_filterUpdated')} {t('im_filterTo')}
            <input type="date" value={updatedTo} onChange={(e) => setUpdatedTo(e.target.value)} className={inputCls} /></label>
        </div>

        {/* Bulk re-stamp bar */}
        {selected.size > 0 && (
          <div className="mx-5 mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800/50">
            <span className="text-slate-600 dark:text-slate-300">{selected.size} {t('im_selected')}</span>
            <button type="button" onClick={() => setEditing('__bulk__')} className="font-semibold text-primary hover:underline">{t('im_editSelected')}</button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarGutter: 'stable' }}>
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
                <tr>
                  <th className="w-8 p-2" />
                  <th className={thCls}>{t('im_colValue')}</th>
                  <th className={thCls}>{t('im_colValidity')}</th>
                  <th className={thCls}>{t('im_colStatus')}</th>
                  <th className={thCls}>{t('im_colCreated')}</th>
                  <th className={thCls}>{t('im_colUpdated')}</th>
                  <th className="p-2 text-end text-xs font-semibold text-slate-500 dark:text-slate-400">{t('im_colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <UnitRow
                    key={u.codeId} unit={u} defaultType={defaultType}
                    selected={selected.has(u.codeId)}
                    onToggle={() => setSelected((s) => { const n = new Set(s); if (n.has(u.codeId)) n.delete(u.codeId); else n.add(u.codeId); return n; })}
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
          defaultType={defaultType}
          lockedKind={lockedKind}
          onConfirm={async (inv: OfferInventoryInput) => {
            try { const r = await addVariantInventory(offerId, variantId, inv); toast.success(t('im_toastAdded').replace('{n}', String(r.created))); setShowAddBatch(false); refresh(); }
            catch { setShowAddBatch(false); setError(t('im_loadError')); }
          }}
          onSkip={() => setShowAddBatch(false)}
          onCancel={() => setShowAddBatch(false)}
        />
      )}

      {/* Bulk re-stamp editor. */}
      {editing === '__bulk__' && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-card-dark">
            <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{t('im_editSelected')} ({selected.size})</p>
        <InventoryValidityEditor
          defaultType={defaultType} unit={null}
          onCancel={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              // One request for the whole selection (not one per unit).
              const res = await bulkUpdateUnitValidity(offerId, variantId, Array.from(selected), patch);
              toast.success(t('im_toastUpdated').replace('{n}', String(res.updated)));
              setEditing(null); setSelected(new Set()); refresh();
            } catch { setEditing(null); setError(t('im_loadError')); }
          }}
        />
          </div>
        </div>
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
  unit: InventoryUnitView; defaultType: 'limit' | 'from_until';
  selected: boolean; onToggle: () => void;
  editing: boolean; onEditStart: () => void; onEditCancel: () => void; onSaved: () => void;
  onDelete: () => void; offerId: string; variantId: string;
}

function UnitRow({ unit, defaultType, selected, onToggle, editing, onEditStart, onEditCancel, onSaved, onDelete, offerId, variantId }: UnitRowProps) {
  const { t } = useLanguage();
  const validityText = useUnitValidityText();
  const statusLabel = unit.status === 'available' ? t('im_statusAvailable') : unit.status === 'assigned' ? t('im_statusAssigned') : t('im_statusRedeemed');
  return (
    <Fragment>
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <td className="p-2"><input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" /></td>
      <td className="p-2 font-mono text-xs text-slate-700 dark:text-slate-200" dir="ltr">{unit.value}</td>
      <td className="p-2 text-slate-600 dark:text-slate-300" dir="ltr">{validityText(unit)}</td>
      <td className="p-2 text-slate-500 dark:text-slate-400">{statusLabel}</td>
      <td className="p-2 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap" dir="ltr">{unit.createdAt ? unit.createdAt.slice(0, 10) : '-'}</td>
      <td className="p-2 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap" dir="ltr">{unit.updatedAt ? unit.updatedAt.slice(0, 10) : '-'}</td>
      <td className="p-2 text-end whitespace-nowrap">
        <button type="button" onClick={onEditStart} aria-label={t('im_editDate')}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"><EditIcon /></button>
        <button type="button" onClick={onDelete} aria-label={t('im_delete')}
          className="ms-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20"><TrashIcon /></button>
      </td>
    </tr>
    {editing && (
      <tr><td colSpan={7} className="p-0"><div className="px-2 pb-3">
        <InventoryValidityEditor defaultType={defaultType} unit={unit} onCancel={onEditCancel}
          onSave={async (patch) => { await updateUnitValidity(offerId, variantId, unit.codeId, patch); toast.success(t('im_toastUpdated').replace('{n}', '1')); onSaved(); }} />
      </div></td></tr>
    )}
    </Fragment>
  );
}
