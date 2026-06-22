/**
 * CreateOffer page (`/supply/create`): full-bleed form (`OfferFormLayout`) for
 * publishing a new catalog offer; field rendering is delegated to section
 * components + helpers to stay under 350 lines. Vouchers get a Manual | CSV mode
 * toggle (`VoucherCsvBulk`). Guards: tenant-admin || platform-admin + service active.
 */
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { createOfferApi, addOfferInventory, OFFER_CATEGORIES, type OfferInventoryInput } from '../lib/api';
import CreateOfferDetailsSection from './CreateOfferDetailsSection';
import CreateOfferRedemptionSection from './CreateOfferRedemptionSection';
import OfferFormLayout from '../components/offer/OfferFormLayout';
import OfferImageGallery, { type GalleryItem } from '../components/offer/OfferImageGallery';
import OfferTypeField from '../components/offer/OfferTypeField';
import VoucherBackgroundField, { type BgMode } from '../components/offer/VoucherBackgroundField';
import OfferVisibilityCard from '../components/offer/OfferVisibilityCard';
import VoucherInventoryModal from '../components/offer/VoucherInventoryModal';
import VoucherInventorySection from '../components/offer/VoucherInventorySection';
import PublishConfirmModal from '../components/offer/PublishConfirmModal';
import CreationModeTabs, { type CreateMode } from '../components/offer/CreationModeTabs';
import VoucherCsvBulk from '../components/offer/VoucherCsvBulk';
import { buildCreateOfferFormData, validateCreateOffer, voucherInventorySummary, type CreateOfferValues } from './createOfferFormData';

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
  const [faceValue, setFaceValue] = useState('');
  const [nexusCost, setNexusCost] = useState('');
  // Optional voucher SKU / internal company code (voucher-only).
  const [sku, setSku] = useState('');
  const [visibility, setVisibility] = useState<OfferVisibility>('ecosystem');
  const [implementationLink, setImplementationLink] = useState('');
  const [implementationInstructions, setImplementationInstructions] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  // Voucher-only purchase-anchored validity duration. Unit defaults to 'years'
  // (matches the common "valid for N years" case); empty value = never expires.
  const [voucherValidityValue, setVoucherValidityValue] = useState('');
  const [voucherValidityUnit, setVoucherValidityUnit] = useState('years');
  // Mandatory combine-with-promotions choice ('' = not chosen, blocks submit). Voucher-only.
  const [voucherStackable, setVoucherStackable] = useState<'' | 'yes' | 'no'>('');
  // Voucher background: 'image' uses the gallery, 'color' uses a solid color. Voucher-only.
  const [bgMode, setBgMode] = useState<BgMode>('image');
  const [voucherBackgroundColor, setVoucherBackgroundColor] = useState('');
  const [terms, setTerms] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Voucher inventory: chosen via a dedicated button (not Publish), held in
  // memory until publish. `inventoryChoiceMade` distinguishes "skipped" from
  // "not chosen yet" (both have a null payload) so Publish can gate on it.
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [stagedInventory, setStagedInventory] = useState<OfferInventoryInput | null>(null);
  const [inventoryChoiceMade, setInventoryChoiceMade] = useState(false);
  // Publish opens an approve/cancel confirm dialog (where the real work happens).
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  // Manual single-offer form vs CSV bulk upload (voucher-only).
  const [mode, setMode] = useState<CreateMode>('manual');

  // Force tenant_only when business setup is not complete (UX only — backend
  // also enforces this gate, see offers.routes.ts ecosystem guard).
  useEffect(() => {
    if (me && !businessSetupComplete && !isPlatformAdmin) {
      setVisibility('tenant_only');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  /** Cover URL used for the banner. Prefers the first new file's preview, then existing. */
  const coverUrl = useMemo(() => {
    const first = gallery[0];
    if (!first) return undefined;
    return first.kind === 'existing' ? first.url : first.previewUrl;
  }, [gallery]);

  /** Seed/fallback color for the picker + hero when the voucher uses a color. */
  const defaultBrandColor = me?.context?.tenantBrandColor ?? '#635bff';
  /** Solid hero color when a voucher is in color mode with no image. */
  const coverColor = executionType === 'voucher' && bgMode === 'color' && !coverUrl
    ? (voucherBackgroundColor || defaultBrandColor)
    : undefined;

  /** setExecutionType wrapper: switching TO voucher trims the gallery to its
   *  single cover (index 0), revoking dropped new-file previews to avoid leaks. */
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

  /** Snapshot of the current form values, shared by validation + payload build. */
  const formValues = (): CreateOfferValues => ({
    title, description, category, marketPrice, visibility, isPlatformAdmin,
    executionType, stockLimit, faceValue, nexusCost, gallery, implementationLink,
    implementationInstructions, voucherValidityValue, voucherValidityUnit,
    voucherStackable, bgMode, voucherBackgroundColor, sku, validFrom, validUntil,
    terms, tags,
  });

  /** Validates the form; sets an error + returns false on the first failure. */
  const validate = (): boolean => {
    const err = validateCreateOffer(formValues(), t, language);
    if (err) { setError(err); return false; }
    return true;
  };

  const buildFormData = (): FormData => buildCreateOfferFormData(formValues());

  /**
   * Creates the offer, then applies `inventory` when provided, and navigates back.
   * This is where the real work happens — the choice was held in memory until now.
   */
  const finalizePublish = async (inventory: OfferInventoryInput | null) => {
    setIsSubmitting(true);
    setError(null);
    // Track whether the offer itself was created, so an inventory-step failure
    // (offer already published) shows a recoverable message instead of a generic error.
    let offerCreated = false;
    try {
      const offer = await createOfferApi(buildFormData());
      offerCreated = true;
      if (inventory) {
        const res = await addOfferInventory(offer.offerId, inventory);
        toast.success(`${t('co_toastPublished')} · ${res.created} ${t('co_toastUnits')}`);
      } else {
        toast.success(t('co_toastPublished'));
      }
      navigate('/benefits-partnerships');
    } catch (err: unknown) {
      if (offerCreated) {
        // Offer is published; only the inventory step failed — recoverable from Edit.
        toast.error(t('co_toastInventoryFailed'));
        navigate('/benefits-partnerships');
      } else {
        // Offer was never created — surface the error and close the confirm dialog.
        setError(err instanceof Error ? err.message : t('co_errPublish'));
        setShowPublishConfirm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Publish entry point. Vouchers require an inventory choice first (the button
   * is disabled until then) and then open the publish-confirm dialog; the actual
   * create+inventory happens on confirm. Non-vouchers publish directly.
   */
  const handleSave = () => {
    if (!validate()) return;
    setError(null);
    if (executionType === 'voucher') {
      if (!inventoryChoiceMade) return; // gated; defensive (button is disabled)
      setShowPublishConfirm(true);
      return;
    }
    void finalizePublish(null);
  };

  // Service-inactive gate retained from the previous version (defence-in-depth).
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

  // ─── Left + right columns ──────────────────────────────────────────────────

  // Voucher CSV bulk mode keeps the page header + mode toggle and only swaps the
  // content below (the manual form → the CSV upload/preview).
  const isCsv = executionType === 'voucher' && mode === 'csv';

  const leftColumn = (
    <>
      {executionType === 'voucher' && (
        <CreationModeTabs mode={mode} onChange={setMode} disabled={isSubmitting} />
      )}
      {isCsv ? (
        <VoucherCsvBulk />
      ) : (
      <>
      <OfferTypeField
        value={executionType}
        onChange={handleExecutionTypeChange}
        disabled={isSubmitting}
      />
      {executionType === 'voucher' ? (
        <VoucherBackgroundField
          mode={bgMode} setMode={setBgMode}
          gallery={gallery} setGallery={setGallery}
          color={voucherBackgroundColor} setColor={setVoucherBackgroundColor}
          defaultColor={defaultBrandColor}
          disabled={isSubmitting}
        />
      ) : (
        <OfferImageGallery
          value={gallery}
          onChange={setGallery}
          maxImages={6}
          disabled={isSubmitting}
        />
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
      />
      <CreateOfferRedemptionSection
        implementationLink={implementationLink} setImplementationLink={setImplementationLink}
        implementationInstructions={implementationInstructions} setImplementationInstructions={setImplementationInstructions}
        validFrom={validFrom} setValidFrom={setValidFrom}
        validUntil={validUntil} setValidUntil={setValidUntil}
        executionType={executionType}
        voucherValidityValue={voucherValidityValue} setVoucherValidityValue={setVoucherValidityValue}
        voucherValidityUnit={voucherValidityUnit} setVoucherValidityUnit={setVoucherValidityUnit}
        voucherStackable={voucherStackable} setVoucherStackable={setVoucherStackable}
        terms={terms} setTerms={setTerms}
        tagInput={tagInput} setTagInput={setTagInput}
        tags={tags} setTags={setTags}
        isSubmitting={isSubmitting}
      />
      {executionType === 'voucher' && (
        <VoucherInventorySection
          choiceMade={inventoryChoiceMade}
          summary={voucherInventorySummary(t, inventoryChoiceMade, stagedInventory)}
          onOpen={() => setShowInventoryModal(true)}
          disabled={isSubmitting}
        />
      )}
      </>
      )}
    </>
  );

  // No visibility sidebar in CSV mode — visibility is a per-row CSV column.
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
        saveDisabled={executionType === 'voucher' && !isCsv && !inventoryChoiceMade}
        saveHint={t('co_invRequiredHint')}
        error={error}
        leftColumn={leftColumn}
        rightColumn={rightColumn}
      />
      {showInventoryModal && (
        <VoucherInventoryModal
          busy={isSubmitting}
          initialBarcodes={stagedInventory?.kind === 'barcode' ? stagedInventory.values : undefined}
          initialLinks={stagedInventory?.kind === 'link' ? stagedInventory.links : undefined}
          onConfirm={(inventory) => { setStagedInventory(inventory); setInventoryChoiceMade(true); setShowInventoryModal(false); }}
          onSkip={() => { setStagedInventory(null); setInventoryChoiceMade(true); setShowInventoryModal(false); }}
          onCancel={() => setShowInventoryModal(false)}
        />
      )}
      {showPublishConfirm && (
        <PublishConfirmModal
          summary={voucherInventorySummary(t, inventoryChoiceMade, stagedInventory)}
          busy={isSubmitting}
          onConfirm={() => { void finalizePublish(stagedInventory); }}
          onCancel={() => setShowPublishConfirm(false)}
        />
      )}
    </>
  );
};

export default CreateOffer;
