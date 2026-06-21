/**
 * CreateOffer page (`/supply/create`): full-bleed form (`OfferFormLayout`) for
 * publishing a new catalog offer. Field rendering is delegated to the section
 * components to keep this file under 350 lines. For vouchers, a Manual | CSV
 * mode toggle lets the admin bulk-upload via `VoucherCsvBulk` instead.
 * Guards: isTenantAdmin || isPlatformAdmin (App.tsx) + service active (here).
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
import CreationModeTabs, { type CreateMode } from '../components/offer/CreationModeTabs';
import VoucherCsvBulk from '../components/offer/VoucherCsvBulk';

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
  // For vouchers, Publish opens the inventory popup instead of submitting.
  const [showInventoryModal, setShowInventoryModal] = useState(false);
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

  /**
   * Wraps setExecutionType: when switching TO voucher, a voucher carries a
   * single card image, so trim the gallery to its cover (index 0) and revoke
   * any dropped new-file preview URLs to avoid blob leaks.
   */
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

  /** Runs all field validations; sets an error + returns false on the first failure. */
  const validate = (): boolean => {
    if (!title.trim()) { setError(t('co_errTitleRequired')); return false; }
    if (marketPrice && (isNaN(Number(marketPrice)) || Number(marketPrice) <= 0)) {
      setError(t('co_errMarketPrice')); return false;
    }
    if (validFrom && validUntil && new Date(validFrom) >= new Date(validUntil)) {
      setError(language === 'he' ? 'תאריך ההשקה חייב להיות לפני תאריך התפוגה' : 'Launch date must be before the expiry date');
      return false;
    }
    if (executionType === 'voucher') {
      const fv = Number(faceValue);
      const nc = Number(nexusCost);
      if (!faceValue || isNaN(fv) || fv <= 0) {
        setError(language === 'he' ? 'יש להזין שווי שובר תקין וחיובי' : 'Face value must be a positive number'); return false;
      }
      if (!nexusCost || isNaN(nc) || nc <= 0 || nc >= fv) {
        setError(language === 'he' ? 'מחיר NEXUS חייב להיות חיובי ופחות מהשווי' : 'Nexus price must be positive and less than face value'); return false;
      }
      if (voucherValidityValue.trim() !== '') {
        const vv = Number(voucherValidityValue);
        if (!Number.isInteger(vv) || vv <= 0) {
          setError(language === 'he' ? 'מגבלת התוקף חייבת להיות מספר שלם חיובי' : 'Validity limit must be a positive whole number'); return false;
        }
      }
      if (voucherStackable === '') { setError(t('co_voucherStackableRequired')); return false; }
      if (sku.trim() !== '' && !/^[A-Z0-9_-]{4,20}$/.test(sku.trim())) { setError(t('co_errSku')); return false; }
    }
    return true;
  };

  /** Builds the multipart FormData payload from the current form state. */
  const buildFormData = (): FormData => {
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    fd.append('category', category);
    if (marketPrice && Number(marketPrice) > 0) fd.append('market_price', marketPrice);
    fd.append('visibility', isPlatformAdmin ? 'ecosystem' : visibility);
    fd.append('executionType', executionType);
    if (executionType !== 'voucher' && stockLimit && Number(stockLimit) > 0) fd.append('stockLimit', stockLimit);
    if (executionType === 'voucher') {
      fd.append('face_value', faceValue);
      fd.append('nexus_cost', nexusCost);
    }
    gallery.forEach((item) => { if (item.kind === 'new') fd.append('images', item.file); });
    if (implementationLink.trim()) fd.append('implementationLink', implementationLink.trim());
    if (implementationInstructions.trim()) fd.append('implementationInstructions', implementationInstructions.trim());
    if (executionType === 'voucher') {
      if (voucherValidityValue.trim() !== '') {
        fd.append('voucherValidityValue', voucherValidityValue.trim());
        fd.append('voucherValidityUnit', voucherValidityUnit);
      }
      fd.append('voucherStackable', voucherStackable === 'yes' ? 'true' : 'false');
      if (bgMode === 'color' && voucherBackgroundColor) fd.append('voucherBackgroundColor', voucherBackgroundColor);
      if (sku.trim() !== '') fd.append('sku', sku.trim());
    } else {
      if (validFrom) fd.append('validFrom', validFrom);
      if (validUntil) fd.append('validUntil', validUntil);
    }
    if (terms.trim()) fd.append('terms', terms.trim());
    if (tags.length > 0) fd.append('tags', JSON.stringify(tags));
    return fd;
  };

  /**
   * Creates the offer, then (when `inventory` is provided) adds it to the new
   * offer, and navigates back to the catalog. Used by the inventory popup's
   * Insert (inventory) and Skip (null) actions, and directly for non-vouchers.
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
        setError(err instanceof Error ? err.message : t('co_errPublish'));
        setShowInventoryModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Save/Publish entry point: vouchers open the inventory popup; others publish now. */
  const handleSave = () => {
    if (!validate()) return;
    setError(null);
    if (executionType === 'voucher') { setShowInventoryModal(true); return; }
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
        error={error}
        leftColumn={leftColumn}
        rightColumn={rightColumn}
      />
      {showInventoryModal && (
        <VoucherInventoryModal
          busy={isSubmitting}
          onConfirm={(inventory) => { void finalizePublish(inventory); }}
          onSkip={() => { void finalizePublish(null); }}
          onCancel={() => setShowInventoryModal(false)}
        />
      )}
    </>
  );
};

export default CreateOffer;
