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
import { toast } from 'sonner';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  listVariantUnits, bulkUpdateUnitValidity, deleteVariantUnit, addVariantInventory,
  type InventoryUnitView, type UnitDateFilter, type OfferInventoryInput,
} from '../../lib/api';
import VoucherInventoryModal from './VoucherInventoryModal';
import InventoryValidityEditor from './InventoryValidityEditor';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import UnitRow from './VariantInventoryRow';
import { ChevronIcon } from './inventoryIcons';
import { SEARCH_DEBOUNCE_MS } from './inventoryConstants';

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

const PAGE_SIZE = 10;
const inputCls = 'rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const thCls = 'p-2 text-start text-xs font-semibold text-slate-500 dark:text-slate-400';
const pageBtnCls = 'min-w-[2rem] rounded-lg border border-slate-200 px-2.5 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700';

/**
 * Build a compact, gap-aware page list for the pager: always shows the first and
 * last page plus the current page and its immediate neighbours; collapses the
 * rest into 'gap' markers. Keeps the control width bounded for large datasets.
 * Inputs: current page (1-based), last page. Output: ordered list of page numbers
 * interleaved with 'gap' sentinels.
 */
function buildPageList(current: number, last: number): (number | 'gap')[] {
  const out: (number | 'gap')[] = [];
  for (let p = 1; p <= last; p++) {
    if (p === 1 || p === last || (p >= current - 1 && p <= current + 1)) out.push(p);
    else if (out[out.length - 1] !== 'gap') out.push('gap');
  }
  return out;
}

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
  // The codeId pending delete-confirmation (null = modal closed) + in-flight flag.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Debounce the search box so typing does not spam the server.
  useEffect(() => { const id = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS); return () => clearTimeout(id); }, [searchInput]);
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

  // Row delete just opens the shared confirm modal; the request runs on confirm.
  const onDelete = (codeId: string) => setConfirmDeleteId(codeId);
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleteBusy(true);
    try {
      await deleteVariantUnit(offerId, variantId, confirmDeleteId);
      toast.success(t('im_toastDeleted'));
      setConfirmDeleteId(null);
      refresh();
    } catch {
      setError(t('im_loadError'));
    } finally {
      setDeleteBusy(false);
    }
  };

  /** The kind already in use (locks the add-batch popup to one kind). */
  const lockedKind = units[0]?.kind ?? null;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isRtl = language === 'he';

  // Pagination pieces kept as elements so the footer can order them per language.
  // The pager is pinned to the inline-right of the footer in BOTH languages; its
  // internal page order and arrow glyphs mirror via the pager's own `dir`, so in
  // Hebrew page 1 sits on the right and the chevrons flip to point the RTL way.
  const pageSummary = (
    <span className="text-xs text-slate-400 dark:text-slate-500" dir="ltr">
      {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} / {total}
    </span>
  );
  const pager = (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex items-center gap-1">
      <button type="button" aria-label={t('im_pagePrev')} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
        className={`${pageBtnCls} inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800`}><ChevronIcon dir={isRtl ? 'right' : 'left'} /></button>
      {buildPageList(page, lastPage).map((p, i) =>
        p === 'gap'
          ? <span key={`gap-${i}`} className="px-1 text-slate-400 dark:text-slate-500">&hellip;</span>
          : <button key={p} type="button" aria-current={p === page ? 'page' : undefined} onClick={() => setPage(p)}
              className={p === page
                ? `${pageBtnCls} border-primary bg-primary font-semibold text-white`
                : `${pageBtnCls} text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800`}>{p}</button>
      )}
      <button type="button" aria-label={t('im_pageNext')} disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
        className={`${pageBtnCls} inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800`}><ChevronIcon dir={isRtl ? 'left' : 'right'} /></button>
    </div>
  );

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
        {/* Created / Updated date ranges - direction follows the active language. */}
        <div className="flex flex-wrap items-end gap-3 px-5 pt-2" dir={language === 'he' ? 'rtl' : 'ltr'}>
          <label className="flex flex-col gap-0.5 text-start text-[11px] text-slate-500 dark:text-slate-400">{t('im_filterCreated')} {t('im_filterFrom')}
            <input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className={inputCls} /></label>
          <label className="flex flex-col gap-0.5 text-start text-[11px] text-slate-500 dark:text-slate-400">{t('im_filterCreated')} {t('im_filterTo')}
            <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className={inputCls} /></label>
          <label className="flex flex-col gap-0.5 text-start text-[11px] text-slate-500 dark:text-slate-400">{t('im_filterUpdated')} {t('im_filterFrom')}
            <input type="date" value={updatedFrom} onChange={(e) => setUpdatedFrom(e.target.value)} className={inputCls} /></label>
          <label className="flex flex-col gap-0.5 text-start text-[11px] text-slate-500 dark:text-slate-400">{t('im_filterUpdated')} {t('im_filterTo')}
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

        {/* Footer: paging (10 per page). justify-between keeps the summary on the
            inline-left and the pager on the inline-right in both languages; the
            per-language child order makes that hold under RTL too. */}
        {lastPage > 1 && (
          <div dir={isRtl ? 'rtl' : 'ltr'} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-sm dark:border-slate-800">
            {isRtl ? <>{pager}{pageSummary}</> : <>{pageSummary}{pager}</>}
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

      {/* Shared delete-confirm modal (replaces the native window.confirm). */}
      {confirmDeleteId && (
        <ConfirmDeleteModal
          title={t('im_deleteTitle')}
          message={t('im_deleteConfirm')}
          confirmLabel={t('im_delete')}
          cancelLabel={t('im_cancel')}
          isDeleting={deleteBusy}
          onConfirm={() => void confirmDelete()}
          onCancel={() => { if (!deleteBusy) setConfirmDeleteId(null); }}
        />
      )}
    </div>,
    document.body,
  );
}
