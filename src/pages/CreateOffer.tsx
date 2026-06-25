/**
 * CreateOffer page (`/supply/create`): full-bleed form (`OfferFormLayout`) for
 * publishing a new catalog offer. For vouchers the offer is a PARENT with one or
 * more VARIANTS: global fields (title, image/color, description, category) stay on
 * the parent, while price/validity/stackable/SKU/tags + redeemable inventory are
 * authored per variant (VariantsManager). A single shared toggle controls whether
 * redemption terms/method are shared or per variant. Non-voucher types are
 * unchanged. Field rendering is delegated to section components to stay under 350
 * lines. Vouchers also get a Manual | CSV mode toggle (`VoucherCsvBulk`).
 * Guards: tenant-admin || platform-admin + service active.
 */
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { createOfferApi, addVariantInventory, OFFER_CATEGORIES } from '../lib/api';
import CreateOfferDetailsSection from './CreateOfferDetailsSection';
import CreateOfferRedemptionSection from './CreateOfferRedemptionSection';
import OfferFormLayout from '../components/offer/OfferFormLayout';
import OfferImageGallery, { type GalleryItem } from '../components/offer/OfferImageGallery';
import OfferTypeField from '../components/offer/OfferTypeField';
import VoucherBackgroundField, { type BgMode } from '../components/offer/VoucherBackgroundField';
import OfferVisibilityCard from '../components/offer/OfferVisibilityCard';
import VariantsManager from '../components/offer/VariantsManager';
import VoucherRedemptionScopeCard from '../components/offer/VoucherRedemptionScopeCard';
import VoucherValidityTypeCard from '../components/offer/VoucherValidityTypeCard';
import PublishConfirmModal from '../components/offer/PublishConfirmModal';
import CreationModeTabs, { type CreateMode } from '../components/offer/CreationModeTabs';
import VoucherCsvBulk from '../components/offer/VoucherCsvBulk';
import { type DraftVariant, stagedUnitsToBatches } from './voucherVariantDraft';
import { buildCreateOfferFormData, computePublishBlockers, submitDateRangeError, type CreateOfferValues } from './createOfferFormData';

/** Visibility options for a platform offer. */
type OfferVisibility = 'ecosystem' | 'tenant_only';

const CreateOffer = () => {
  const navigate = useNavigate();
  const { me } = useAuth();
  const { t, language } = useLanguage();

  const isPlatformAdmin = me?.isPlatformAdmin === true || me?.authorization?.isPlatformAdmin === true;
  const catalogServiceActive = me?.authorization?.catalogServiceActive === true;
  const businessSetupComplete = me?.authorization?.businessSetupComplete === true;

  // ─── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(OFFER_CATEGORIES[0].value);
  const [executionType, setExecutionType] = useState('voucher');
  const [marketPrice, setMarketPrice] = useState('');
  const [stockLimit, setStockLimit] = useState('');
  // Voucher pricing/SKU now live per variant; kept only to satisfy the shared
  // CreateOfferDetailsSection props (unused for vouchers via hidePricing).
  const [faceValue, setFaceValue] = useState('');
  const [nexusCost, setNexusCost] = useState('');
  const [sku, setSku] = useState('');
  const [visibility, setVisibility] = useState<OfferVisibility>('ecosystem');
  const [implementationLink, setImplementationLink] = useState('');
  const [implementationInstructions, setImplementationInstructions] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  // Voucher-only flat fields retained for the non-voucher redemption section props.
  const [voucherStackable, setVoucherStackable] = useState<'' | 'yes' | 'no'>('');
  const [bgMode, setBgMode] = useState<BgMode>('image');
  const [voucherBackgroundColor, setVoucherBackgroundColor] = useState('');
  const [terms, setTerms] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Voucher variants: at least one is required to publish. `variantEditing` is
  // true while a variant draft is open (blocks publish until saved/cancelled).
  const [variants, setVariants] = useState<DraftVariant[]>([]);
  // Voucher validity TYPE default for the offer; per-unit VALUE is set at inventory time.
  const [defaultValidityType, setDefaultValidityType] = useState<'limit' | 'from_until'>('limit');
  const [variantEditing, setVariantEditing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [mode, setMode] = useState<CreateMode>('manual');

  useEffect(() => {
    if (me && !businessSetupComplete && !isPlatformAdmin) setVisibility('tenant_only');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const coverUrl = useMemo(() => {
    const first = gallery[0];
    if (!first) return undefined;
    return first.kind === 'existing' ? first.url : first.previewUrl;
  }, [gallery]);

  const defaultBrandColor = me?.context?.tenantBrandColor ?? '#635bff';
  const coverColor = executionType === 'voucher' && bgMode === 'color' && !coverUrl
    ? (voucherBackgroundColor || defaultBrandColor)
    : undefined;

  const handleExecutionTypeChange = (next: string) => {
    setExecutionType(next);
    if (next === 'voucher') {
      setGallery((prev) => {
        if (prev.length <= 1) return prev;
        prev.slice(1).forEach((it) => { if (it.kind === 'new') URL.revokeObjectURL(it.previewUrl); });
        return prev.slice(0, 1);
      });
    }
  };

  const formValues = (): CreateOfferValues => ({
    title, description, category, marketPrice, visibility, isPlatformAdmin,
    executionType, stockLimit, faceValue, nexusCost, gallery, implementationLink,
    implementationInstructions,
    voucherStackable, bgMode, voucherBackgroundColor, sku, validFrom, validUntil,
    terms, tags, variants, defaultValidityType,
  });

  const isVoucher = executionType === 'voucher';
  const isCsv = isVoucher && mode === 'csv';
  // Single source of truth for "can publish": these hard blockers drive BOTH the
  // button's disabled state and the on-click guard, so they can never diverge.
  // The first blocker is shown as the button tooltip + inline hint.
  const publishBlockers = computePublishBlockers(
    { title, marketPrice, executionType, variants, variantEditing, defaultValidityType },
    t,
  );

  /** Creates the offer, then applies each variant's staged inventory to its
   *  server variantId (matched by order), and navigates back. */
  const finalizePublish = async () => {
    setIsSubmitting(true);
    setError(null);
    let offerCreated = false;
    try {
      const offer = await createOfferApi(buildCreateOfferFormData(formValues()));
      offerCreated = true;
      const created = offer.variants ?? [];
      let units = 0;
      let invError: string | null = null;
      for (let i = 0; i < variants.length; i++) {
        const variantId = created[i]?.variantId;
        if (!variantId) continue;
        // Group this variant's staged units into batches (one per kind+validity) and apply each.
        for (const batch of stagedUnitsToBatches(variants[i].stagedUnits)) {
          try { const r = await addVariantInventory(offer.offerId, variantId, batch); units += r.created; }
          catch (e) { if (!invError) invError = e instanceof Error ? e.message : String(e); }
        }
      }
      if (invError) toast.error(`${t('co_toastInventoryFailed')}: ${invError}`);
      else if (units > 0) toast.success(`${t('co_toastPublished')} · ${units} ${t('co_toastUnits')}`);
      else toast.success(t('co_toastPublished'));
      navigate('/benefits-partnerships');
    } catch (err: unknown) {
      if (offerCreated) { toast.error(t('co_toastInventoryFailed')); navigate('/benefits-partnerships'); }
      else { setError(err instanceof Error ? err.message : t('co_errPublish')); setShowPublishConfirm(false); }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    if (publishBlockers.length > 0) return; // button is disabled; defensive
    const dateErr = submitDateRangeError({ executionType, validFrom, validUntil }, language);
    if (dateErr) { setError(dateErr); return; }
    setError(null);
    if (executionType === 'voucher') {
      setShowPublishConfirm(true);
      return;
    }
    void finalizePublish();
  };

  if (!isPlatformAdmin && !catalogServiceActive) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('co_serviceInactiveTitle')}</h2>
          <p className="text-sm text-slate-600 mb-6">{t('co_serviceInactiveBody')}</p>
          <button
            type="button"
            onClick={() => navigate('/benefits-partnerships')}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            {t('co_serviceInactiveBtn')}
          </button>
        </div>
      </div>
    );
  }

  const leftColumn = (
    <>
      {isVoucher && <CreationModeTabs mode={mode} onChange={setMode} disabled={isSubmitting} />}
      {isCsv ? (
        <VoucherCsvBulk />
      ) : (
      <>
      <OfferTypeField value={executionType} onChange={handleExecutionTypeChange} disabled={isSubmitting} />
      {isVoucher ? (
        <VoucherBackgroundField
          mode={bgMode} setMode={setBgMode}
          gallery={gallery} setGallery={setGallery}
          color={voucherBackgroundColor} setColor={setVoucherBackgroundColor}
          defaultColor={defaultBrandColor}
          disabled={isSubmitting}
        />
      ) : (
        <OfferImageGallery value={gallery} onChange={setGallery} maxImages={6} disabled={isSubmitting} />
      )}
      <CreateOfferDetailsSection
        title={title} setTitle={setTitle}
        description={description} setDescription={setDescription}
        category={category} setCategory={setCategory}
        executionType={executionType}
        marketPrice={marketPrice} setMarketPrice={setMarketPrice}
        stockLimit={stockLimit} setStockLimit={setStockLimit}
        faceValue={faceValue} setFaceValue={setFaceValue}
        nexusCost={nexusCost} setNexusCost={setNexusCost}
        sku={sku} setSku={setSku}
        isSubmitting={isSubmitting}
        hidePricing={isVoucher}
      />
      {isVoucher ? (
        <>
          <VoucherValidityTypeCard
            value={defaultValidityType} setValue={setDefaultValidityType}
            isSubmitting={isSubmitting}
          />
          <VoucherRedemptionScopeCard
            terms={terms} setTerms={setTerms}
            method={implementationInstructions} setMethod={setImplementationInstructions}
            isSubmitting={isSubmitting}
          />
          <VariantsManager
            variants={variants} setVariants={setVariants}
            sharedTerms={terms} sharedMethod={implementationInstructions}
            defaultValidityType={defaultValidityType}
            onEditingChange={setVariantEditing}
            isSubmitting={isSubmitting}
          />
        </>
      ) : (
        <CreateOfferRedemptionSection
          implementationLink={implementationLink} setImplementationLink={setImplementationLink}
          implementationInstructions={implementationInstructions} setImplementationInstructions={setImplementationInstructions}
          validFrom={validFrom} setValidFrom={setValidFrom}
          validUntil={validUntil} setValidUntil={setValidUntil}
          executionType={executionType}
          voucherStackable={voucherStackable} setVoucherStackable={setVoucherStackable}
          terms={terms} setTerms={setTerms}
          tagInput={tagInput} setTagInput={setTagInput}
          tags={tags} setTags={setTags}
          isSubmitting={isSubmitting}
        />
      )}
      </>
      )}
    </>
  );

  const rightColumn = isCsv ? null : (
    <OfferVisibilityCard
      isPlatformAdmin={isPlatformAdmin}
      businessSetupComplete={businessSetupComplete}
      visibility={visibility}
      setVisibility={setVisibility}
      isSubmitting={isSubmitting}
    />
  );

  return (
    <>
      <OfferFormLayout
        title={t('of_pageTitleCreate')}
        businessName={me?.context?.tenantName ?? undefined}
        coverUrl={coverUrl}
        coverColor={coverColor}
        saveLabel={t('of_saveCreate')}
        cancelLabel={t('of_cancel')}
        onSave={handleSave}
        onCancel={() => navigate('/benefits-partnerships')}
        isSubmitting={isSubmitting}
        hideSave={isCsv}
        saveDisabled={publishBlockers.length > 0}
        saveHint={publishBlockers[0]}
        error={error}
        leftColumn={leftColumn}
        rightColumn={rightColumn}
      />
      {showPublishConfirm && (
        <PublishConfirmModal
          summary={`${variants.length} ${t('co_variantsCountLabel')}`}
          busy={isSubmitting}
          onConfirm={() => { void finalizePublish(); }}
          onCancel={() => setShowPublishConfirm(false)}
        />
      )}
    </>
  );
};

export default CreateOffer;
