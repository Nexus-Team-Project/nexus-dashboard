/**
 * StagedInventoryModal: the authoring (Create/Edit) inventory surface for ONE
 * voucher variant. It operates IN MEMORY - nothing is written to the backend
 * here; staged additions (`stagedUnits`) and edits to already-saved units
 * (`stagedEdits`, keyed by codeId) are persisted only on Publish/Save
 * (voucher-validity-dating). Already-saved units load read-only-by-default (one
 * lazy GET, first page) for reference and can be edited (staged). Rows are
 * multi-selectable for a bulk date change. One kind per variant (the add-batch
 * popup locks to the kind already in use).
 *
 * z-[200], body-scroll-lock, RTL-aware. Controlled by the parent (VariantsManager).
 */
import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { type OfferInventoryInput, type InventoryUnitView, listVariantUnits } from '../../lib/api';
import { type StagedUnit, type StagedEdit, batchToStagedUnits } from '../../pages/voucherVariantDraft';
import VoucherInventoryModal from './VoucherInventoryModal';
import InventoryValidityEditor, { type ValidityPatch } from './InventoryValidityEditor';
import { EditIcon, TrashIcon, UndoIcon } from './inventoryIcons';

interface Props {
  variantLabel: string;
  /** Offer-level validity type default (the initial type for new batches/edits). */
  defaultType: 'limit' | 'from_until';
  units: StagedUnit[];
  onChange: (units: StagedUnit[]) => void;
  /** Staged edits to already-saved units (keyed by codeId); applied on publish/save. */
  edits: StagedEdit[];
  onEditsChange: (edits: StagedEdit[]) => void;
  onClose: () => void;
  /** When editing a persisted variant, load its already-saved units for reference. */
  offerId?: string;
  variantId?: string;
}

const SAVED_PAGE_SIZE = 50;

/** Minimal validity shape shared by staged units and saved unit views. */
type ValidityShape = { validFrom?: string | null; validUntil?: string | null; validityValue?: number | null; validityUnit?: 'days' | 'months' | 'years' | null };

/** Short validity text for a unit (limit duration / window / not-yet-set). */
function validityText(u: ValidityShape, t: (k: 'co_validityUnitDays' | 'co_validityUnitMonths' | 'co_validityUnitYears' | 'im_noWindowYet') => string): string {
  if (u.validFrom && u.validUntil) return `⁦${u.validFrom.slice(0, 10)} - ${u.validUntil.slice(0, 10)}⁩`;
  if (u.validityValue && u.validityUnit) {
    const unit = u.validityUnit === 'days' ? t('co_validityUnitDays') : u.validityUnit === 'months' ? t('co_validityUnitMonths') : t('co_validityUnitYears');
    return `${u.validityValue} ${unit}`;
  }
  return t('im_noWindowYet');
}

const thCls = 'p-2 text-start text-xs font-semibold text-slate-500 dark:text-slate-400';

export default function StagedInventoryModal({ variantLabel, defaultType, units, onChange, edits, onEditsChange, onClose, offerId, variantId }: Props) {
  const { t, language } = useLanguage();
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);       // staged-unit localId
  const [editingSaved, setEditingSaved] = useState<string | null>(null); // saved-unit codeId
  const [bulkEditing, setBulkEditing] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set()); // keys: "s:<localId>" / "v:<codeId>"
  const [saved, setSaved] = useState<InventoryUnitView[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  useEffect(() => {
    if (!offerId || !variantId) return;
    let alive = true;
    void listVariantUnits(offerId, variantId, {}, 1, SAVED_PAGE_SIZE)
      .then((res) => { if (alive) { setSaved(res.units); setSavedTotal(res.total); } })
      .catch(() => { /* reference-only; ignore load errors */ });
    return () => { alive = false; };
  }, [offerId, variantId]);

  const q = search.trim().toLowerCase();
  const shownUnits = q ? units.filter((u) => u.value.toLowerCase().includes(q) || (u.code ?? '').toLowerCase().includes(q)) : units;
  const shownSaved = q ? saved.filter((u) => u.value.toLowerCase().includes(q) || (u.code ?? '').toLowerCase().includes(q)) : saved;

  const lockedKind = saved[0]?.kind ?? units[0]?.kind ?? null;
  const addBatch = (inv: OfferInventoryInput) => { onChange([...units, ...batchToStagedUnits(inv)]); setShowAddBatch(false); };
  const removeUnit = (id: string) => onChange(units.filter((u) => u.localId !== id));
  const editUnit = (id: string, patch: ValidityPatch) => { onChange(units.map((u) => (u.localId === id ? { ...u, ...patch } : u))); setEditing(null); };
  const editSaved = (codeId: string, patch: ValidityPatch) => { upsertEdits([codeId], patch); setEditingSaved(null); };
  const editFor = (codeId: string) => edits.find((e) => e.codeId === codeId);

  /** Upsert staged edits for the given saved codeIds with one validity. */
  function upsertEdits(codeIds: string[], patch: ValidityPatch) {
    const set = new Set(codeIds);
    const next = edits.filter((e) => !set.has(e.codeId));
    for (const codeId of codeIds) next.push({ codeId, validityValue: null, validityUnit: null, validFrom: null, validUntil: null, ...patch });
    onEditsChange(next);
  }

  const toggleSel = (key: string) => setSel((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  const allKeys = [...shownUnits.map((u) => `s:${u.localId}`), ...shownSaved.map((u) => `v:${u.codeId}`)];
  const allSelected = allKeys.length > 0 && allKeys.every((k) => sel.has(k));
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(allKeys));

  /** Apply one validity to every selected row (staged units + saved units). */
  const applyBulk = (patch: ValidityPatch) => {
    const stagedIds = [...sel].filter((k) => k.startsWith('s:')).map((k) => k.slice(2));
    const savedIds = [...sel].filter((k) => k.startsWith('v:')).map((k) => k.slice(2));
    if (stagedIds.length > 0) {
      const set = new Set(stagedIds);
      onChange(units.map((u) => (set.has(u.localId) ? { ...u, ...patch } : u)));
    }
    if (savedIds.length > 0) upsertEdits(savedIds, patch);
    setBulkEditing(false); setSel(new Set());
  };

  // Render the row checkbox inline (NOT as a component defined in render - that
  // would be a new component type each render and remount the whole table).
  const renderCheck = (k: string) => (
    <input type="checkbox" checked={sel.has(k)} onChange={() => toggleSel(k)}
      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
  );

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog" aria-modal="true" aria-label={t('im_title')} dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-card-dark">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('im_title')} · {variantLabel}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{units.length} {t('im_total')} · {t('im_stagedHint')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('im_cancel')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">&#x2715;</button>
        </div>

        {/* Toolbar: search + select-all + add batch */}
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('im_searchPlaceholder')}
            className="flex-1 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          {allKeys.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
              {t('im_selectAll')}
            </label>
          )}
          <button type="button" onClick={() => setShowAddBatch(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:opacity-90">{t('im_addBatch')}</button>
        </div>

        {/* Bulk-edit bar */}
        {sel.size > 0 && (
          <div className="mx-5 mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800/50">
            <span className="text-slate-600 dark:text-slate-300">{sel.size} {t('im_selected')}</span>
            <button type="button" onClick={() => setBulkEditing(true)} className="font-semibold text-primary hover:underline">{t('im_editSelected')}</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarGutter: 'stable' }}>
          {/* Already-saved units (load read-only; editable -> staged). */}
          {shownSaved.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('im_savedBadge')} ({savedTotal})</p>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="w-8 p-2" /><th className={thCls}>{t('im_colValue')}</th><th className={thCls}>{t('im_colValidity')}</th>
                    <th className={thCls}>{t('im_colStatus')}</th><th className={thCls}>{t('im_colCreated')}</th><th className={thCls}>{t('im_colUpdated')}</th>
                    <th className="p-2 text-end text-xs font-semibold text-slate-500 dark:text-slate-400">{t('im_colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shownSaved.map((u) => {
                    const ed = editFor(u.codeId);
                    const shown = ed ?? u;
                    return (
                      <Fragment key={u.codeId}>
                      <tr className="border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 align-top">
                        <td className="p-2">{renderCheck(`v:${u.codeId}`)}</td>
                        <td className="p-2 font-mono text-xs" dir="ltr">{u.value}</td>
                        <td className="p-2" dir="ltr">{validityText(shown, t)}</td>
                        <td className="p-2">
                          {ed
                            ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t('im_unsavedBadge')}</span>
                            : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{t('im_savedBadge')}</span>}
                        </td>
                        <td className="p-2 text-xs whitespace-nowrap" dir="ltr">{u.createdAt ? u.createdAt.slice(0, 10) : '-'}</td>
                        <td className="p-2 text-xs whitespace-nowrap" dir="ltr">{u.updatedAt ? u.updatedAt.slice(0, 10) : '-'}</td>
                        <td className="p-2 text-end whitespace-nowrap">
                          <button type="button" onClick={() => setEditingSaved(u.codeId)} aria-label={t('im_editDate')}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"><EditIcon /></button>
                          {ed && <button type="button" onClick={() => onEditsChange(edits.filter((e) => e.codeId !== u.codeId))} aria-label={t('im_cancel')}
                            className="ms-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><UndoIcon /></button>}
                        </td>
                      </tr>
                      {editingSaved === u.codeId && (
                        <tr><td colSpan={7} className="p-0"><div className="px-2 pb-3"><InventoryValidityEditor defaultType={defaultType} unit={shown} onCancel={() => setEditingSaved(null)} onSave={(patch) => editSaved(u.codeId, patch)} /></div></td></tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              {savedTotal > saved.length && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{t('im_savedMoreOnBenefits').replace('{n}', String(savedTotal - saved.length))}</p>}
            </div>
          )}

          {/* Staged additions (unsaved). */}
          {shownUnits.length === 0 ? (
            shownSaved.length === 0 ? <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">{t('im_empty')}</p> : null
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="w-8 p-2" /><th className={thCls}>{t('im_colValue')}</th><th className={thCls}>{t('im_colValidity')}</th>
                  <th className={thCls}>{t('im_colStatus')}</th>
                  <th className="p-2 text-end text-xs font-semibold text-slate-500 dark:text-slate-400">{t('im_colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {shownUnits.map((u) => (
                  <Fragment key={u.localId}>
                  <tr className="border-t border-slate-100 dark:border-slate-800 align-top">
                    <td className="p-2">{renderCheck(`s:${u.localId}`)}</td>
                    <td className="p-2 font-mono text-xs text-slate-700 dark:text-slate-200" dir="ltr">{u.value}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-300" dir="ltr">{validityText(u, t)}</td>
                    <td className="p-2"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t('im_unsavedBadge')}</span></td>
                    <td className="p-2 text-end whitespace-nowrap">
                      <button type="button" onClick={() => setEditing(u.localId)} aria-label={t('im_editDate')}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"><EditIcon /></button>
                      <button type="button" onClick={() => removeUnit(u.localId)} aria-label={t('im_delete')}
                        className="ms-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20"><TrashIcon /></button>
                    </td>
                  </tr>
                  {editing === u.localId && (
                    <tr><td colSpan={5} className="p-0"><div className="px-2 pb-3"><InventoryValidityEditor defaultType={defaultType} unit={u} onCancel={() => setEditing(null)} onSave={(patch) => editUnit(u.localId, patch)} /></div></td></tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddBatch && (
        <VoucherInventoryModal defaultType={defaultType} lockedKind={lockedKind} onConfirm={addBatch} onSkip={() => setShowAddBatch(false)} onCancel={() => setShowAddBatch(false)} />
      )}
      {bulkEditing && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-card-dark">
            <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{t('im_editSelected')} ({sel.size})</p>
            <InventoryValidityEditor defaultType={defaultType} unit={null} onCancel={() => setBulkEditing(false)} onSave={applyBulk} />
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
