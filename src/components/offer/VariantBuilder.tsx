/**
 * VariantBuilder: the editor panel for a single voucher variant, opened by the
 * "Create Variant" action. Renders the per-variant fields (face/Nexus/member
 * price, purchase-anchored validity, combine-with-promotions, SKU, tags, an
 * inventory control, and - when redemption is per variant - the redemption terms
 * + method), plus Save / Cancel. Controlled: the parent (VariantsManager) owns
 * the draft and handles inventory staging, duplicate detection, and the list.
 *
 * Styling reuses the existing offer-form tokens; no new design language.
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import VoucherStackToggle from './VoucherStackToggle';
import { type DraftVariant, variantInventorySummary } from '../../pages/voucherVariantDraft';

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60';
const labelCls = 'mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300';

interface VariantBuilderProps {
  /** The draft being edited. */
  draft: DraftVariant;
  /** Patch the draft (parent merges). */
  onChange: (patch: Partial<DraftVariant>) => void;
  /** Whether redemption terms/method are authored here (per_variant scope). */
  perVariant: boolean;
  /** Open the inventory popup for this variant. */
  onOpenInventory: () => void;
  /** Save the variant (parent validates + dedupes). */
  onSave: () => void;
  /** Discard the in-progress variant. */
  onCancel: () => void;
  /** Inline error from the parent (validation / duplicate). */
  error?: string | null;
  /** Disable inputs while submitting. */
  isSubmitting?: boolean;
}

/** Renders the per-variant fields editor. */
export default function VariantBuilder({
  draft,
  onChange,
  perVariant,
  onOpenInventory,
  onSave,
  onCancel,
  error,
  isSubmitting = false,
}: VariantBuilderProps) {
  const { t } = useLanguage();
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const v = tagInput.trim();
    if (v && draft.tags.length < 10 && !draft.tags.includes(v)) {
      onChange({ tags: [...draft.tags, v] });
      setTagInput('');
    }
  };

  return (
    <section className="rounded-xl border border-primary/40 bg-primary/5 p-5 shadow-sm dark:border-primary/40 dark:bg-primary/10">
      <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">{t('co_variantBuilderTitle')}</h3>

      {/* Pricing: face value + Nexus price */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>
            {t('fi_faceValue_label')} <span className="text-red-500 ms-0.5" aria-hidden="true">*</span>
          </label>
          <input
            type="number" min="0.01" step="0.01" value={draft.faceValue}
            onChange={(e) => onChange({ faceValue: e.target.value })}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="0.00" disabled={isSubmitting} className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>
            {t('fi_nexusCost_label')} <span className="text-red-500 ms-0.5" aria-hidden="true">*</span>
          </label>
          <input
            type="number" min="0.01" step="0.01" value={draft.nexusCost}
            onChange={(e) => onChange({ nexusCost: e.target.value })}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="0.00" disabled={isSubmitting} className={inputCls}
          />
        </div>
      </div>

      {/* Optional member price */}
      <div className="mt-4">
        <label className={labelCls}>
          {t('co_fieldMemberPrice')} <span className="font-normal text-slate-400 me-0.5">{t('co_optional')}</span>
        </label>
        <input
          type="number" min="0.01" step="0.01" value={draft.memberPrice}
          onChange={(e) => onChange({ memberPrice: e.target.value })}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="0.00" disabled={isSubmitting} className={inputCls}
        />
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{t('co_variantMemberPriceHint')}</p>
      </div>

      {/* Purchase-anchored validity */}
      <div className="mt-4">
        <label className={labelCls}>
          {t('co_fieldVoucherValidity')} <span className="font-normal text-slate-400 me-0.5">{t('co_optional')}</span>
        </label>
        <div className="flex gap-2">
          <input
            type="number" min="1" step="1" value={draft.validityValue}
            onChange={(e) => onChange({ validityValue: e.target.value })}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder={t('co_voucherValidityPlaceholder')} disabled={isSubmitting}
            className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-60"
          />
          <select
            aria-label={t('co_fieldVoucherValidity')} value={draft.validityUnit}
            onChange={(e) => onChange({ validityUnit: e.target.value })}
            disabled={isSubmitting} className={`flex-1 ${inputCls}`}
          >
            <option value="days">{t('co_validityUnitDays')}</option>
            <option value="months">{t('co_validityUnitMonths')}</option>
            <option value="years">{t('co_validityUnitYears')}</option>
          </select>
        </div>
      </div>

      {/* Combine with promotions (mandatory) */}
      <div className="mt-4">
        <VoucherStackToggle value={draft.stackable} onChange={(v) => onChange({ stackable: v })} disabled={isSubmitting} />
      </div>

      {/* SKU */}
      <div>
        <label className={labelCls}>
          {t('co_fieldSku')} <span className="font-normal text-slate-400 me-0.5">{t('co_optional')}</span>
        </label>
        <input
          type="text" value={draft.sku}
          onChange={(e) => onChange({ sku: e.target.value.toUpperCase() })}
          placeholder="SUMMER-2026" disabled={isSubmitting} className={inputCls}
        />
      </div>

      {/* Per-variant redemption terms + method (only when scope is per_variant) */}
      {perVariant && (
        <>
          <div className="mt-4">
            <label className={labelCls}>{t('co_variantTermsLabel')}</label>
            <textarea
              value={draft.terms} onChange={(e) => onChange({ terms: e.target.value })}
              rows={3} disabled={isSubmitting} className={`resize-none ${inputCls}`}
            />
          </div>
          <div className="mt-4">
            <label className={labelCls}>{t('co_variantMethodLabel')}</label>
            <textarea
              value={draft.implementationInstructions}
              onChange={(e) => onChange({ implementationInstructions: e.target.value })}
              rows={3} disabled={isSubmitting} className={`resize-none ${inputCls}`}
            />
          </div>
        </>
      )}

      {/* Tags */}
      <div className="mt-4">
        <label className={labelCls}>
          {t('co_fieldTags')} <span className="font-normal text-slate-400 me-0.5">{t('co_optional')}</span>
        </label>
        <div className="mb-2 flex gap-2">
          <input
            type="text" value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            placeholder={t('co_tagsPlaceholder')} disabled={isSubmitting} className={`flex-1 ${inputCls}`}
          />
          <button
            type="button" onClick={addTag} disabled={isSubmitting}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
          >
            {t('co_addTag')}
          </button>
        </div>
        {draft.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {draft.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {tag}
                <button type="button" onClick={() => onChange({ tags: draft.tags.filter((tg) => tg !== tag) })} className="ml-0.5 text-slate-400 hover:text-red-500" aria-label={`Remove tag ${tag}`}>&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Inventory control (stages in memory, applied at publish) */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('co_invSectionTitle')}</p>
            <p className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t('co_invCurrentLabel')}</span>
              <span className={draft.inventoryChoiceMade ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-amber-600 dark:text-amber-400'}>
                {variantInventorySummary(t, draft)}
              </span>
            </p>
          </div>
          <button
            type="button" onClick={onOpenInventory} disabled={isSubmitting}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {draft.inventoryChoiceMade ? t('co_invEditBtn') : t('co_invOpenBtn')}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

      {/* Save / Cancel */}
      <div className="mt-4 flex gap-2">
        <button
          type="button" onClick={onSave} disabled={isSubmitting}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {t('co_saveVariant')}
        </button>
        <button
          type="button" onClick={onCancel} disabled={isSubmitting}
          className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
        >
          {t('co_cancelVariant')}
        </button>
      </div>
    </section>
  );
}
