/**
 * StagedInventoryModal: the authoring (Create/Edit) inventory surface for ONE
 * voucher variant. It mirrors the live VariantInventoryManagerModal but operates
 * purely IN MEMORY - nothing is written to the backend here; the staged units are
 * persisted only when the offer is published/saved (voucher-validity-dating). Every
 * row carries an "unsaved" badge. Adding a batch reuses VoucherInventoryModal; a
 * unit's date can be edited or the unit removed, all in memory. One kind only
 * (the add-batch popup is locked to the kind already staged).
 *
 * z-[200], body-scroll-lock, RTL-aware. Controlled by the parent (VariantsManager).
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import { type OfferInventoryInput, type InventoryUnitView, listVariantUnits } from '../../lib/api';
import { type StagedUnit, type StagedEdit, batchToStagedUnits } from '../../pages/voucherVariantDraft';
import VoucherInventoryModal from './VoucherInventoryModal';

interface Props {
  variantLabel: string;
  validityType: 'limit' | 'from_until';
  units: StagedUnit[];
  onChange: (units: StagedUnit[]) => void;
  /** Staged edits to already-saved units (keyed by codeId); applied on publish/save. */
  edits: StagedEdit[];
  onEditsChange: (edits: StagedEdit[]) => void;
  onClose: () => void;
  /**
   * When editing a persisted variant, the offer + variant ids let the modal load
   * the variant's ALREADY-SAVED units for READ-ONLY reference (one lazy GET on
   * open). Editing/deleting saved codes is done on Benefits Partnerships (live);
   * here only new batches are staged. Omitted on Create (nothing saved yet).
   */
  offerId?: string;
  variantId?: string;
}

/** First-page size for the read-only "already saved" reference list. */
const SAVED_PAGE_SIZE = 50;

const inputCls = 'rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white';

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

export default function StagedInventoryModal({ variantLabel, validityType, units, onChange, edits, onEditsChange, onClose, offerId, variantId }: Props) {
  const { t, language } = useLanguage();
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingSaved, setEditingSaved] = useState<string | null>(null);
  // Already-saved units (read-only reference), lazily loaded once when editing a
  // persisted variant. One GET; first page only - the full list is managed on
  // Benefits Partnerships.
  const [saved, setSaved] = useState<InventoryUnitView[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);

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

  // One kind per variant: lock the add-batch popup to the kind already in use
  // (saved units take precedence, then anything staged).
  const lockedKind = saved[0]?.kind ?? units[0]?.kind ?? null;
  const addBatch = (inv: OfferInventoryInput) => { onChange([...units, ...batchToStagedUnits(inv)]); setShowAddBatch(false); };
  const removeUnit = (id: string) => onChange(units.filter((u) => u.localId !== id));
  const editUnit = (id: string, patch: Partial<StagedUnit>) => { onChange(units.map((u) => (u.localId === id ? { ...u, ...patch } : u))); setEditing(null); };
  /** Upsert a staged edit for a saved unit (keyed by codeId). */
  const editSaved = (codeId: string, patch: Partial<StagedEdit>) => {
    const next = edits.filter((e) => e.codeId !== codeId);
    next.push({ codeId, validityValue: null, validityUnit: null, validFrom: null, validUntil: null, ...patch });
    onEditsChange(next);
    setEditingSaved(null);
  };
  /** The staged-edit override for a saved unit, if any. */
  const editFor = (codeId: string) => edits.find((e) => e.codeId === codeId);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog" aria-modal="true" aria-label={t('im_title')} dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-card-dark">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('im_title')} · {variantLabel}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{units.length} {t('im_total')} · {t('im_stagedHint')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('im_cancel')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">&#x2715;</button>
        </div>

        <div className="flex items-center justify-end px-5 pt-4">
          <button type="button" onClick={() => setShowAddBatch(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:opacity-90">{t('im_addBatch')}</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Already-saved units (read-only reference). Manage these on Benefits Partnerships. */}
          {saved.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t('im_savedBadge')} ({savedTotal})
              </p>
              <table className="w-full text-sm">
                <tbody>
                  {saved.map((u) => {
                    const ed = editFor(u.codeId);
                    const shown = ed ?? u; // staged edit overrides the saved validity in the display
                    return (
                      <tr key={u.codeId} className="border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <td className="p-2 font-mono text-xs" dir="ltr">{u.value}</td>
                        <td className="p-2" dir="ltr">{validityText(shown, t)}</td>
                        <td className="p-2">
                          {ed
                            ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t('im_unsavedBadge')}</span>
                            : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{t('im_savedBadge')}</span>}
                        </td>
                        <td className="p-2 text-end">
                          <button type="button" onClick={() => setEditingSaved(u.codeId)} className="text-xs font-medium text-primary hover:underline">{t('im_editDate')}</button>
                          {ed && <button type="button" onClick={() => onEditsChange(edits.filter((e) => e.codeId !== u.codeId))} className="ms-2 text-xs font-medium text-slate-400 hover:underline">{t('im_cancel')}</button>}
                        </td>
                        {editingSaved === u.codeId && (
                          <td colSpan={4} className="p-0">
                            <div className="p-3">
                              <StagedUnitEditor validityType={validityType} unit={shown} onCancel={() => setEditingSaved(null)} onSave={(patch) => editSaved(u.codeId, patch)} />
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {savedTotal > saved.length && (
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{t('im_savedMoreOnBenefits').replace('{n}', String(savedTotal - saved.length))}</p>
              )}
            </div>
          )}

          {units.length === 0 ? (
            saved.length === 0 ? <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">{t('im_empty')}</p> : null
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="p-2 text-start">{t('im_colValue')}</th>
                  <th className="p-2 text-start">{t('im_colValidity')}</th>
                  <th className="p-2 text-start">{t('im_colStatus')}</th>
                  <th className="p-2 text-end">{t('im_colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.localId} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-2 font-mono text-xs text-slate-700 dark:text-slate-200" dir="ltr">{u.value}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-300" dir="ltr">{validityText(u, t)}</td>
                    <td className="p-2">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t('im_unsavedBadge')}</span>
                    </td>
                    <td className="p-2 text-end">
                      <button type="button" onClick={() => setEditing(u.localId)} className="text-xs font-medium text-primary hover:underline">{t('im_editDate')}</button>
                      <button type="button" onClick={() => removeUnit(u.localId)} className="ms-2 text-xs font-medium text-red-500 hover:underline">{t('im_delete')}</button>
                    </td>
                    {editing === u.localId && (
                      <td colSpan={4} className="p-0">
                        <div className="p-3">
                          <StagedUnitEditor validityType={validityType} unit={u} onCancel={() => setEditing(null)} onSave={(patch) => editUnit(u.localId, patch)} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddBatch && (
        <VoucherInventoryModal
          validityType={validityType}
          lockedKind={lockedKind}
          onConfirm={addBatch}
          onSkip={() => setShowAddBatch(false)}
          onCancel={() => setShowAddBatch(false)}
        />
      )}
    </div>,
    document.body,
  );
}

/** Validity-only patch produced by the inline editor (only the active type's fields). */
type ValidityPatch = { validityValue?: number | null; validityUnit?: 'days' | 'months' | 'years' | null; validFrom?: string | null; validUntil?: string | null };

/** Inline validity editor for a single staged unit or saved-unit edit (in-memory). */
function StagedUnitEditor({ validityType, unit, onSave, onCancel }: {
  validityType: 'limit' | 'from_until';
  unit: ValidityPatch;
  onSave: (patch: ValidityPatch) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [val, setVal] = useState(unit.validityValue != null ? String(unit.validityValue) : '5');
  const [u, setU] = useState<'days' | 'months' | 'years'>(unit.validityUnit ?? 'years');
  const [from, setFrom] = useState(unit.validFrom ? unit.validFrom.slice(0, 10) : '');
  const [until, setUntil] = useState(unit.validUntil ? unit.validUntil.slice(0, 10) : '');
  const [err, setErr] = useState<string | null>(null);

  const save = () => {
    setErr(null);
    if (validityType === 'limit') {
      const n = Number(val);
      if (!val.trim() || !Number.isInteger(n) || n <= 0) { setErr(t('vi_errBatchValidity')); return; }
      // Only the active type's fields, so the dormant set is preserved (lossless).
      onSave({ validityValue: n, validityUnit: u });
    } else {
      if (!from || !until) { setErr(t('vi_errBatchValidity')); return; }
      if (new Date(until).getTime() < new Date(from).getTime()) { setErr(t('vi_errBatchRange')); return; }
      onSave({ validFrom: from, validUntil: until });
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
        <button type="button" onClick={save} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:opacity-90">{t('im_save')}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">{t('im_cancel')}</button>
      </div>
    </div>
  );
}
