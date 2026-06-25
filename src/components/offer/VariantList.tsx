/**
 * VariantList: shows the voucher variants saved so far on the Create/Edit Offer
 * page, before the final Publish. Each row summarizes the variant's price,
 * validity, combine-with-promotions, SKU, and staged inventory, with Edit and
 * Delete actions. Presentational; the parent (VariantsManager) owns the data.
 *
 * Styling reuses existing card/list tokens; no new design language.
 */
import { type ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { type DraftVariant, variantInventorySummary } from '../../pages/voucherVariantDraft';

interface VariantListProps {
  variants: DraftVariant[];
  onEdit: (localId: string) => void;
  onDelete: (localId: string) => void;
  disabled?: boolean;
  /**
   * localId of the variant currently being edited inline. When set, that
   * variant's summary row is replaced by `editorSlot` so the editor opens under
   * the clicked variant rather than at the bottom of the list. Null when no
   * existing variant is being edited (e.g. creating a brand-new variant).
   */
  editingLocalId?: string | null;
  /** The inline editor to render in place of the variant matching editingLocalId. */
  editorSlot?: ReactNode;
}

/** Renders the saved-variant list (nothing when empty). */
export default function VariantList({
  variants, onEdit, onDelete, disabled = false, editingLocalId = null, editorSlot = null,
}: VariantListProps) {
  const { t, language } = useLanguage();
  if (variants.length === 0) return null;

  // A variant only shows a validity TYPE when it overrides the offer default;
  // otherwise it inherits (shown as nothing here). The date VALUE is per unit.
  const overrideLabel = (o: DraftVariant['validityTypeOverride']) =>
    o === 'limit' ? t('co_validityTypeLimit') : o === 'from_until' ? t('co_validityTypeFromUntil') : '';

  return (
    <div className="space-y-2">
      {variants.map((v, i) => {
        // When this variant is the one being edited, swap its summary row for the
        // inline editor so it opens directly under (in place of) the clicked variant.
        if (editingLocalId !== null && v.localId === editingLocalId) {
          return <div key={v.localId}>{editorSlot}</div>;
        }
        // The Nexus price is the member-facing selling price (no separate member price).
        const price = v.nexusCost;
        return (
          <div
            key={v.localId}
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-card-dark"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('co_variantLabel')} {i + 1}
                {v.sku.trim() !== '' && (
                  <span className="ms-2 font-normal text-slate-400">· {v.sku.trim()}</span>
                )}
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{t('co_variantPriceLabel')}: ₪{price || '-'}</span>
                <span>{t('fi_faceValue_label')}: ₪{v.faceValue || '-'}</span>
                {v.validityTypeOverride !== '' && (
                  <span>{t('co_validityTypeOverrideLabel')}: {overrideLabel(v.validityTypeOverride)}</span>
                )}
                <span>
                  {t('co_fieldVoucherStackable')}: {v.stackable === 'yes' ? t('co_voucherStackableYes') : v.stackable === 'no' ? t('co_voucherStackableNo') : '-'}
                </span>
                <span>{language === 'he' ? 'מלאי' : 'Inventory'}: {variantInventorySummary(t, v)}</span>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button" onClick={() => onEdit(v.localId)} disabled={disabled}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
              >
                {t('co_variantEdit')}
              </button>
              <button
                type="button" onClick={() => onDelete(v.localId)} disabled={disabled}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-400 disabled:opacity-50"
              >
                {t('co_variantDelete')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
