/**
 * EditOffer page: full-page editor for an existing offer. Mirrors `CreateOffer`
 * via `OfferFormLayout`, pre-filled from `getOfferDetails`. For vouchers the offer
 * is a PARENT with one or more VARIANTS (price/validity/stackable/SKU/tags +
 * inventory per variant, edited via VariantsManager); global fields stay on the
 * parent and a shared toggle controls redemption-terms/method placement.
 * Non-voucher types are unchanged. Visibility is hidden (immutable after
 * creation); denied offers re-enter pending_approval on save. Backend enforces
 * ownership + voucher pricing lock on PATCH.
 * Route: /benefits-partnerships/edit-offer/:offerId
 */
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getOfferDetails, updateOfferApi, addVariantInventory, bulkUpdateUnitValidity,
  type CatalogItem,
} from '../lib/api';
import CreateOfferDetailsSection from './CreateOfferDetailsSection';
import CreateOfferRedemptionSection from './CreateOfferRedemptionSection';
import OfferFormLayout from '../components/offer/OfferFormLayout';
import OfferImageGallery, { type GalleryItem } from '../components/offer/OfferImageGallery';
import { getImageCrop, type ImageCrop } from '../lib/cloudinaryImage';
import OfferTypeField from '../components/offer/OfferTypeField';
import VoucherBackgroundField, { type BgMode } from '../components/offer/VoucherBackgroundField';
import VariantsManager from '../components/offer/VariantsManager';
import VoucherRedemptionScopeCard from '../components/offer/VoucherRedemptionScopeCard';
import { OfferFormSkeleton, OfferFormErrorState } from '../components/offer/OfferFormStates';
import { type DraftVariant, variantToDraft, draftToPayload, stagedUnitsToBatches, stagedEditsToBulk } from './voucherVariantDraft';
import { computePublishBlockers, submitDateRangeError } from './createOfferFormData';
import { localizedApiError } from '../lib/apiError';

const EditOffer = () => {
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId: string }>();
  const { me } = useAuth();
  const { t, language } = useLanguage();

  const isPlatformAdmin = me?.authorization?.isPlatformAdmin === true;
  const canManageSupply = me?.authorization?.canManageSupply === true;

  const [offer, setOffer] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('food_beverage');
  const [executionType, setExecutionType] = useState('voucher');
  const [marketPrice, setMarketPrice] = useState('');
  const [stockLimit, setStockLimit] = useState('');
  const [faceValue, setFaceValue] = useState('');
  const [nexusCost, setNexusCost] = useState('');
  const [sku, setSku] = useState('');
  const [implementationLink, setImplementationLink] = useState('');
  const [implementationInstructions, setImplementationInstructions] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [voucherStackable, setVoucherStackable] = useState<'' | 'yes' | 'no'>('');
  const [bgMode, setBgMode] = useState<BgMode>('image');
  const [voucherBackgroundColor, setVoucherBackgroundColor] = useState('');
  const [terms, setTerms] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Voucher variant state.
  const [variants, setVariants] = useState<DraftVariant[]>([]);
  const [variantEditing, setVariantEditing] = useState(false);

  // ─── Load offer detail ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!offerId) return;
      try {
        setLoading(true);
        const detail = await getOfferDetails(offerId);
        if (cancelled) return;
        if (!detail) { setLoadError(t('of_loadNotFound')); return; }
        setOffer(detail);
        setTitle(detail.title ?? '');
        setDescription(detail.description ?? '');
        setCategory(detail.category ?? 'food_beverage');
        setExecutionType(detail.executionType ?? 'voucher');
        setMarketPrice(detail.market_price ? String(detail.market_price) : '');
        setStockLimit(detail.stockLimit != null ? String(detail.stockLimit) : '');
        setFaceValue(detail.face_value ? String(detail.face_value) : '');
        setNexusCost(detail.nexus_cost ? String(detail.nexus_cost) : '');
        setSku(detail.sku ?? '');
        setImplementationLink(detail.implementationLink ?? '');
        setImplementationInstructions(detail.implementationInstructions ?? '');
        setValidFrom(detail.validFrom ? detail.validFrom.slice(0, 10) : '');
        setValidUntil(detail.validUntil ? detail.validUntil.slice(0, 10) : '');
        setVoucherStackable(detail.voucherStackable === true ? 'yes' : detail.voucherStackable === false ? 'no' : '');
        setTerms(detail.terms ?? '');
        setTags(detail.tags ?? []);
        // Map stored variants into editable drafts (one default variant for
        // migrated/legacy vouchers). Inventory is appended via the popup per variant.
        // Pass the parent shared terms/method so a variant whose (read-filled) text
        // equals the shared text loads as "inherited", not as a custom override.
        setVariants((detail.variants ?? []).map((v) => variantToDraft(v, detail.terms, detail.implementationInstructions)));
        // Background: a color-mode voucher stores the default placeholder as its
        // imageUrl, so when a color is set we treat it as color mode with an EMPTY
        // gallery (the placeholder is not a real chosen image). This both shows the
        // saved color on load and stops Save from re-persisting the placeholder
        // and dropping the color (the bug where the card reverted to the default).
        const hasColor = (detail.executionType ?? 'voucher') === 'voucher' && !!detail.voucherBackgroundColor;
        const urls = hasColor
          ? []
          : ((detail.imageUrls && detail.imageUrls.length > 0)
              ? detail.imageUrls
              : (detail.imageUrl ? [detail.imageUrl] : []));
        setGallery(urls.map((u) => ({ kind: 'existing' as const, url: u, crop: getImageCrop(detail.imageCrops, u) })));
        setVoucherBackgroundColor(detail.voucherBackgroundColor ?? '');
        setBgMode(hasColor ? 'color' : 'image');
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : t('of_loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [offerId, t]);

  const coverUrl = useMemo(() => {
    const first = gallery[0];
    if (!first) return undefined;
    return first.kind === 'existing' ? first.url : first.previewUrl;
  }, [gallery]);

  const defaultBrandColor = me?.context?.tenantBrandColor ?? '#635bff';
  const isVoucher = executionType === 'voucher';
  // Deal pricing (sale price + face value) is platform-admin-only for ecosystem
  // offers, but a tenant_only offer is sold solely to the owning tenant's members,
  // so its catalog managers (canManageSupply) may edit those fields. Mirrors the
  // backend canEditDealPricing gate (which also re-checks ownership server-side).
  const pricingLocked = !(isPlatformAdmin || (offer?.visibility === 'tenant_only' && canManageSupply));
  const coverColor = isVoucher && bgMode === 'color' && !coverUrl
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


  // Single source of truth for "can publish": same hard-blocker helper as Create.
  // Drives both the button's disabled state and the on-click guard.
  const publishBlockers = computePublishBlockers(
    { title, category, marketPrice, executionType, variants, variantEditing },
    t,
    language,
  );

  /** Builds the PATCH FormData and saves, then appends any staged per-variant inventory. */
  const finalizeSave = async () => {
    if (!offerId) return;
    setIsSubmitting(true);
    setError(null);
    let saved = false;
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('executionType', executionType);
      if (marketPrice && Number(marketPrice) > 0) fd.append('market_price', marketPrice);
      if (isVoucher) {
        const perVariant = variants.some((d) => d.customRedemption);
        fd.append('redemptionScope', perVariant ? 'per_variant' : 'shared');
        fd.append('variants', JSON.stringify(variants.map((d) => draftToPayload(d))));
        fd.append('voucherBackgroundColor', bgMode === 'color' && voucherBackgroundColor ? voucherBackgroundColor : '');
        // Shared redemption text always lives on the parent; per-variant overrides
        // travel inside each variant payload.
        fd.append('terms', terms.trim());
        fd.append('implementationInstructions', implementationInstructions.trim());
      } else {
        fd.append('stockLimit', stockLimit && Number(stockLimit) > 0 ? stockLimit : '');
        fd.append('implementationLink', implementationLink.trim());
        fd.append('implementationInstructions', implementationInstructions.trim());
        fd.append('validFrom', validFrom || '');
        fd.append('validUntil', validUntil || '');
        fd.append('terms', terms.trim());
        fd.append('tags', JSON.stringify(tags));
      }
      // Originals stay put; crops travel as metadata. Kept crops are keyed by
      // URL (re-cropping an existing image only changes this, never re-uploads);
      // new-file crops align to the images[] append order.
      const keptExisting = gallery.filter((g): g is GalleryItem & { kind: 'existing' } => g.kind === 'existing');
      fd.append('keptImageUrls', JSON.stringify(keptExisting.map((g) => g.url)));
      fd.append('keptImageCrops', JSON.stringify(keptExisting.map((g) => ({ url: g.url, crop: g.crop ?? null }))));
      const newCrops: (ImageCrop | null)[] = [];
      gallery.forEach((g) => {
        if (g.kind === 'new') { fd.append('images', g.file); newCrops.push(g.crop ?? null); }
      });
      fd.append('newImageCrops', JSON.stringify(newCrops));

      const updated = await updateOfferApi(offerId, fd);
      saved = true;
      // Apply any newly staged inventory to each variant (matched by order).
      let units = 0; let invError: string | null = null;
      if (isVoucher) {
        const created = updated.variants ?? [];
        for (let i = 0; i < variants.length; i++) {
          const variantId = created[i]?.variantId;
          if (!variantId) continue;
          for (const batch of stagedUnitsToBatches(variants[i].stagedUnits)) {
            try { const r = await addVariantInventory(offerId, variantId, batch); units += r.created; }
            catch (e) { if (!invError) invError = localizedApiError(e, language); }
          }
          // Apply staged edits to already-saved units, one bulk request per distinct validity.
          for (const grp of stagedEditsToBulk(variants[i].stagedEdits)) {
            try { await bulkUpdateUnitValidity(offerId, variantId, grp.codeIds, grp.validity); }
            catch (e) { if (!invError) invError = localizedApiError(e, language); }
          }
        }
      }
      if (invError) toast.error(`${t('co_toastInventoryFailedSave')}: ${invError}`);
      else if (units > 0) toast.success(`${t('co_toastSaved')} · ${units} ${t('co_toastUnits')}`);
      else toast.success(t('co_toastSaved'));
      navigate('/benefits-partnerships');
    } catch (err: unknown) {
      if (saved) { toast.error(t('co_toastInventoryFailedSave')); navigate('/benefits-partnerships'); }
      else { setError(localizedApiError(err, language, t('co_errPublish'))); }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    if (!offerId) return;
    if (publishBlockers.length > 0) return; // button is disabled; defensive
    const dateErr = submitDateRangeError({ executionType, validFrom, validUntil }, language);
    if (dateErr) { setError(dateErr); return; }
    setError(null);
    void finalizeSave();
  };

  if (loading) return <OfferFormSkeleton />;
  if (loadError) return <OfferFormErrorState message={loadError} onBack={() => navigate('/benefits-partnerships')} />;

  const leftColumn = (
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
        pricingLocked={pricingLocked}
        hidePricing={isVoucher}
      />
      {isVoucher ? (
        <>
          <VoucherRedemptionScopeCard
            terms={terms} setTerms={setTerms}
            method={implementationInstructions} setMethod={setImplementationInstructions}
            isSubmitting={isSubmitting}
          />
          <VariantsManager
            variants={variants} setVariants={setVariants}
            sharedTerms={terms} sharedMethod={implementationInstructions}
            onEditingChange={setVariantEditing}
            offerId={offerId}
            pricingLocked={pricingLocked}
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
  );

  return (
    <OfferFormLayout
      title={t('of_pageTitleEdit')}
      businessName={me?.context?.tenantName ?? undefined}
      coverUrl={coverUrl}
      coverColor={coverColor}
      saveLabel={offer?.approval_status === 'denied' ? t('of_saveResubmit') : t('of_saveUpdate')}
      cancelLabel={t('of_cancel')}
      onSave={handleSave}
      onCancel={() => navigate('/benefits-partnerships')}
      isSubmitting={isSubmitting}
      saveDisabled={publishBlockers.length > 0}
      saveHint={publishBlockers[0]}
      error={error}
      denialReason={offer?.approval_status === 'denied' ? (offer?.denial_reason ?? null) : null}
      leftColumn={leftColumn}
      rightColumn={null}
    />
  );
};

export default EditOffer;
