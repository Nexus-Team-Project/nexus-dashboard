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
  getOfferDetails, updateOfferApi, addVariantInventory, getVariantInventory,
  type CatalogItem,
} from '../lib/api';
import CreateOfferDetailsSection from './CreateOfferDetailsSection';
import CreateOfferRedemptionSection from './CreateOfferRedemptionSection';
import OfferFormLayout from '../components/offer/OfferFormLayout';
import OfferImageGallery, { type GalleryItem } from '../components/offer/OfferImageGallery';
import OfferTypeField from '../components/offer/OfferTypeField';
import VoucherBackgroundField, { type BgMode } from '../components/offer/VoucherBackgroundField';
import VariantsManager from '../components/offer/VariantsManager';
import VoucherRedemptionScopeCard from '../components/offer/VoucherRedemptionScopeCard';
import { type RedemptionScope } from '../components/offer/RedemptionScopeToggle';
import { OfferFormSkeleton, OfferFormErrorState } from '../components/offer/OfferFormStates';
import { type DraftVariant, variantToDraft, draftToPayload } from './voucherVariantDraft';

const EditOffer = () => {
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId: string }>();
  const { me } = useAuth();
  const { t, language } = useLanguage();

  const isPlatformAdmin = me?.authorization?.isPlatformAdmin === true;
  const pricingLocked = !isPlatformAdmin;

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
  const [voucherValidityValue, setVoucherValidityValue] = useState('');
  const [voucherValidityUnit, setVoucherValidityUnit] = useState('years');
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
  const [redemptionScope, setRedemptionScope] = useState<RedemptionScope>('shared');
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
        setVoucherValidityValue(detail.voucherValidityValue != null ? String(detail.voucherValidityValue) : '');
        setVoucherValidityUnit(detail.voucherValidityUnit ?? 'years');
        setVoucherStackable(detail.voucherStackable === true ? 'yes' : detail.voucherStackable === false ? 'no' : '');
        setTerms(detail.terms ?? '');
        setTags(detail.tags ?? []);
        setRedemptionScope(detail.redemptionScope === 'per_variant' ? 'per_variant' : 'shared');
        // Map stored variants into editable drafts (one default variant for
        // migrated/legacy vouchers). Inventory is appended via the popup per variant.
        setVariants((detail.variants ?? []).map(variantToDraft));
        const urls = (detail.imageUrls && detail.imageUrls.length > 0)
          ? detail.imageUrls
          : (detail.imageUrl ? [detail.imageUrl] : []);
        setGallery(urls.map((u) => ({ kind: 'existing' as const, url: u })));
        setVoucherBackgroundColor(detail.voucherBackgroundColor ?? '');
        setBgMode(urls.length > 0 ? 'image' : (detail.voucherBackgroundColor ? 'color' : 'image'));
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

  /** Edit-page inventory loader for the variants manager (existing links + kind). */
  const loadExistingInventory = async (variantId: string) => {
    if (!offerId) return { links: [], lockedKind: null as 'barcode' | 'link' | null };
    const inv = await getVariantInventory(offerId, variantId);
    return {
      links: inv.links,
      lockedKind: inv.counts.barcode > 0 ? 'barcode' : inv.counts.link > 0 ? 'link' : null,
    } as { links: string[]; lockedKind: 'barcode' | 'link' | null };
  };

  const validate = (): boolean => {
    if (!offerId) return false;
    if (!title.trim()) { setError(t('co_errTitleRequired')); return false; }
    if (!isVoucher && validFrom && validUntil && new Date(validFrom) >= new Date(validUntil)) {
      setError(language === 'he' ? 'תאריך ההשקה חייב להיות לפני תאריך התפוגה' : 'Launch date must be before the expiry date');
      return false;
    }
    if (isVoucher && (variants.length === 0 || variantEditing)) { setError(t('co_variantsRequired')); return false; }
    return true;
  };

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
        const perVariant = redemptionScope === 'per_variant';
        fd.append('redemptionScope', redemptionScope);
        fd.append('variants', JSON.stringify(variants.map((d) => draftToPayload(d, perVariant))));
        fd.append('voucherBackgroundColor', bgMode === 'color' && voucherBackgroundColor ? voucherBackgroundColor : '');
        fd.append('terms', perVariant ? '' : terms.trim());
        fd.append('implementationInstructions', perVariant ? '' : implementationInstructions.trim());
      } else {
        fd.append('stockLimit', stockLimit && Number(stockLimit) > 0 ? stockLimit : '');
        fd.append('implementationLink', implementationLink.trim());
        fd.append('implementationInstructions', implementationInstructions.trim());
        fd.append('validFrom', validFrom || '');
        fd.append('validUntil', validUntil || '');
        fd.append('terms', terms.trim());
        fd.append('tags', JSON.stringify(tags));
      }
      const keptUrls = gallery.filter((g): g is GalleryItem & { kind: 'existing' } => g.kind === 'existing').map((g) => g.url);
      fd.append('keptImageUrls', JSON.stringify(keptUrls));
      gallery.forEach((g) => { if (g.kind === 'new') fd.append('images', g.file); });

      const updated = await updateOfferApi(offerId, fd);
      saved = true;
      // Apply any newly staged inventory to each variant (matched by order).
      let units = 0; let invFailed = false;
      if (isVoucher) {
        const created = updated.variants ?? [];
        for (let i = 0; i < variants.length; i++) {
          const inv = variants[i].inventory;
          const variantId = created[i]?.variantId;
          if (inv && variantId) {
            try { const r = await addVariantInventory(offerId, variantId, inv); units += r.created; }
            catch { invFailed = true; }
          }
        }
      }
      if (invFailed) toast.error(t('co_toastInventoryFailedSave'));
      else if (units > 0) toast.success(`${t('co_toastSaved')} · ${units} ${t('co_toastUnits')}`);
      else toast.success(t('co_toastSaved'));
      navigate('/benefits-partnerships');
    } catch (err: unknown) {
      if (saved) { toast.error(t('co_toastInventoryFailedSave')); navigate('/benefits-partnerships'); }
      else { setError(err instanceof Error ? err.message : t('co_errPublish')); }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    if (!validate()) return;
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
            scope={redemptionScope} setScope={setRedemptionScope}
            terms={terms} setTerms={setTerms}
            method={implementationInstructions} setMethod={setImplementationInstructions}
            isSubmitting={isSubmitting}
          />
          <VariantsManager
            variants={variants} setVariants={setVariants}
            perVariant={redemptionScope === 'per_variant'}
            onEditingChange={setVariantEditing}
            loadExistingInventory={loadExistingInventory}
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
          voucherValidityValue={voucherValidityValue} setVoucherValidityValue={setVoucherValidityValue}
          voucherValidityUnit={voucherValidityUnit} setVoucherValidityUnit={setVoucherValidityUnit}
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
      saveDisabled={isVoucher && (variants.length === 0 || variantEditing)}
      saveHint={t('co_variantsRequired')}
      error={error}
      denialReason={offer?.approval_status === 'denied' ? (offer?.denial_reason ?? null) : null}
      leftColumn={leftColumn}
      rightColumn={null}
    />
  );
};

export default EditOffer;
