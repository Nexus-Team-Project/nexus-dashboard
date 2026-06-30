/**
 * VariantsManager: the voucher variants area on the Create/Edit Offer page.
 * Owns the in-progress draft + the per-variant inventory popup; the parent owns
 * the saved `variants` array (it needs it to build the publish payload and to
 * apply each variant's inventory after the offer is created).
 *
 * Flow: "Create Variant" opens a VariantBuilder; "Save Variant" validates +
 * dedupes and upserts into the list; saved variants render in a VariantList with
 * Edit / Delete. Each variant stages its own inventory in memory (no backend
 * call here). Reports whether a draft is open via onEditingChange so the parent
 * can gate Publish until every saved variant has an inventory choice and no draft
 * is unsaved.
 */
import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import VariantBuilder from './VariantBuilder';
import VariantList from './VariantList';
import StagedInventoryModal from './StagedInventoryModal';
import {
  type DraftVariant, emptyDraftVariant, validateVariantDraft, isDuplicateVariant,
} from '../../pages/voucherVariantDraft';

interface VariantsManagerProps {
  variants: DraftVariant[];
  setVariants: React.Dispatch<React.SetStateAction<DraftVariant[]>>;
  /** Shared redemption terms/method - seed a variant's override when enabled. */
  sharedTerms: string;
  sharedMethod: string;
  /** Reports whether a draft is currently open (parent uses it to gate Publish). */
  onEditingChange?: (editing: boolean) => void;
  /** Offer id when editing an existing offer; lets the staged modal load a
   *  persisted variant's already-saved units for read-only reference. Omitted on Create. */
  offerId?: string;
  isSubmitting?: boolean;
}

/** Renders the Create-Variant button, the builder, the saved list, and the inventory popup. */
export default function VariantsManager({
  variants, setVariants, sharedTerms, sharedMethod, onEditingChange, offerId, isSubmitting = false,
}: VariantsManagerProps) {
  const { t, language } = useLanguage();
  const [draft, setDraft] = useState<DraftVariant | null>(null);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => { onEditingChange?.(draft !== null); }, [draft, onEditingChange]);

  /** Opens the staged inventory modal for the current draft variant. */
  const openInventory = () => { if (draft) setShowInventory(true); };

  const startCreate = () => { setBuilderError(null); setDraft(emptyDraftVariant()); };
  const startEdit = (localId: string) => {
    const found = variants.find((v) => v.localId === localId);
    if (found) { setBuilderError(null); setDraft({ ...found }); }
  };
  const deleteVariant = (localId: string) => setVariants((prev) => prev.filter((v) => v.localId !== localId));
  const patchDraft = (patch: Partial<DraftVariant>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const saveDraft = () => {
    if (!draft) return;
    const err = validateVariantDraft(draft, t, language);
    if (err) { setBuilderError(err); return; }
    if (isDuplicateVariant(draft, variants)) { setBuilderError(t('co_variantDuplicate')); return; }
    setVariants((prev) => {
      const idx = prev.findIndex((v) => v.localId === draft.localId);
      if (idx === -1) return [...prev, draft];
      const next = [...prev]; next[idx] = draft; return next;
    });
    setDraft(null);
    setBuilderError(null);
  };

  const cancelDraft = () => { setDraft(null); setBuilderError(null); };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('co_variantsSectionTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('co_variantsSectionHint')}</p>
        </div>
        {draft === null && (
          <button
            type="button" onClick={startCreate} disabled={isSubmitting}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            + {t('co_createVariant')}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {(() => {
          // An open draft that matches an existing variant is an inline edit: the
          // builder is rendered in place of that variant's row by VariantList.
          // A draft with no matching variant is a brand-new variant: render the
          // builder below the list.
          const editingExisting = draft !== null && variants.some((v) => v.localId === draft.localId);
          const builder = draft !== null && (
            <VariantBuilder
              draft={draft}
              onChange={patchDraft}
              sharedTerms={sharedTerms}
              sharedMethod={sharedMethod}
              onOpenInventory={() => { void openInventory(); }}
              onSave={saveDraft}
              onCancel={cancelDraft}
              error={builderError}
              isSubmitting={isSubmitting}
            />
          );
          return (
            <>
              <VariantList
                variants={variants}
                onEdit={startEdit}
                onDelete={deleteVariant}
                disabled={isSubmitting || draft !== null}
                editingLocalId={editingExisting ? draft!.localId : null}
                editorSlot={builder}
              />
              {!editingExisting && builder}
            </>
          );
        })()}

        {variants.length === 0 && draft === null && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
            {t('co_variantsEmpty')}
          </p>
        )}
      </div>

      {showInventory && draft !== null && (
        <StagedInventoryModal
          variantLabel={t('co_variantBuilderTitle')}
          defaultType="limit"
          units={draft.stagedUnits}
          onChange={(units) => patchDraft({ stagedUnits: units })}
          edits={draft.stagedEdits}
          onEditsChange={(edits) => patchDraft({ stagedEdits: edits })}
          onClose={() => setShowInventory(false)}
          offerId={offerId}
          variantId={draft.variantId}
        />
      )}
    </section>
  );
}
