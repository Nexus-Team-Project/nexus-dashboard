/**
 * EditOffer page: full-page editor for an existing NEXUS catalog offer.
 *
 * Mirrors `CreateOffer` visually via `OfferFormLayout` but pre-fills every
 * field from `getOfferDetails(offerId)`. Visibility is intentionally hidden —
 * it cannot be changed after creation (matches the prior EditOfferDrawer
 * behavior). Denied offers show a denial-reason banner above the grid and the
 * server auto-transitions the status back to pending_approval on save.
 *
 * Route: /benefits-partnerships/edit-offer/:offerId
 * Guards: route is mounted only when the user is authenticated. The backend
 *         enforces ownership (createdByTenantId match) on PATCH so a foreign
 *         offerId returns 404 even if the URL is hand-crafted.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { getOfferDetails, updateOfferApi, type CatalogItem } from '../lib/api';
import CreateOfferDetailsSection from './CreateOfferDetailsSection';
import CreateOfferRedemptionSection from './CreateOfferRedemptionSection';
import OfferFormLayout from '../components/offer/OfferFormLayout';
import OfferImageGallery, { type GalleryItem } from '../components/offer/OfferImageGallery';
import OfferTypeField from '../components/offer/OfferTypeField';
import VoucherBackgroundField, { type BgMode } from '../components/offer/VoucherBackgroundField';

/**
 * Renders the edit form for a single offer. The gallery merges existing
 * Cloudinary URLs (kind: 'existing') with any newly picked files (kind: 'new')
 * — the submit handler serialises them into multipart FormData so the backend
 * can reconcile the gallery in `supply.service.updateOffer`.
 */
const EditOffer = () => {
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId: string }>();
  const { me } = useAuth();
  const { t, language } = useLanguage();

  // Voucher pricing (face_value + nexus_cost) was agreed with Nexus and can
  // only be changed by a platform admin. The form disables the inputs and
  // the submit handler skips them when locked. Backend re-enforces the rule.
  const isPlatformAdmin = me?.authorization?.isPlatformAdmin === true;
  const pricingLocked = !isPlatformAdmin;

  const [offer, setOffer] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Form state (mirrors CreateOffer) ──────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('food_beverage');
  const [executionType, setExecutionType] = useState('voucher');
  const [marketPrice, setMarketPrice] = useState('');
  const [stockLimit, setStockLimit] = useState('');
  const [faceValue, setFaceValue] = useState('');
  const [nexusCost, setNexusCost] = useState('');
  const [implementationLink, setImplementationLink] = useState('');
  const [implementationInstructions, setImplementationInstructions] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  // Voucher-only purchase-anchored validity duration (empty value = never expires).
  const [voucherValidityValue, setVoucherValidityValue] = useState('');
  const [voucherValidityUnit, setVoucherValidityUnit] = useState('years');
  // Mandatory combine-with-promotions choice; legacy vouchers load as '' (must re-choose).
  const [voucherStackable, setVoucherStackable] = useState<'' | 'yes' | 'no'>('');
  // Voucher background mode + color (voucher-only).
  const [bgMode, setBgMode] = useState<BgMode>('image');
  const [voucherBackgroundColor, setVoucherBackgroundColor] = useState('');
  const [terms, setTerms] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setStockLimit(detail.stockLimit !== null && detail.stockLimit !== undefined ? String(detail.stockLimit) : '');
        setFaceValue(detail.face_value ? String(detail.face_value) : '');
        setNexusCost(detail.nexus_cost ? String(detail.nexus_cost) : '');
        setImplementationLink(detail.implementationLink ?? '');
        setImplementationInstructions(detail.implementationInstructions ?? '');
        setValidFrom(detail.validFrom ? detail.validFrom.slice(0, 10) : '');
        setValidUntil(detail.validUntil ? detail.validUntil.slice(0, 10) : '');
        // Legacy vouchers load with empty validity (treated as never-expires);
        // their stale validUntil is normalized to null on save by the backend.
        setVoucherValidityValue(
          detail.voucherValidityValue != null ? String(detail.voucherValidityValue) : '',
        );
        setVoucherValidityUnit(detail.voucherValidityUnit ?? 'years');
        setVoucherStackable(
          detail.voucherStackable === true ? 'yes' : detail.voucherStackable === false ? 'no' : '',
        );
        setTerms(detail.terms ?? '');
        setTags(detail.tags ?? []);
        const urls = (detail.imageUrls && detail.imageUrls.length > 0)
          ? detail.imageUrls
          : (detail.imageUrl ? [detail.imageUrl] : []);
        setGallery(urls.map((u) => ({ kind: 'existing' as const, url: u })));
        // Voucher background mode: image when there is a cover; else color when
        // a stored color exists; else default to image (empty -> tenant fallback).
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

  /** Seed/fallback color for the picker + hero when the voucher uses a color. */
  const defaultBrandColor = me?.context?.tenantBrandColor ?? '#635bff';
  /** Solid hero color when a voucher is in color mode with no image. */
  const coverColor = executionType === 'voucher' && bgMode === 'color' && !coverUrl
    ? (voucherBackgroundColor || defaultBrandColor)
    : undefined;

  /**
   * Wraps setExecutionType: switching TO voucher trims the gallery to its
   * single cover image and revokes any dropped new-file preview URLs.
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

  /**
   * Builds the FormData payload and PATCHes the offer. `keptImageUrls` is
   * always sent (even empty) so the backend reconciles the gallery against
   * the previous state and drops orphaned Cloudinary images.
   */
  const handleSubmit = async () => {
    if (!offerId) return;
    if (!title.trim()) { setError(t('co_errTitleRequired')); return; }
    if (validFrom && validUntil && new Date(validFrom) >= new Date(validUntil)) {
      setError(language === 'he' ? 'תאריך ההשקה חייב להיות לפני תאריך התפוגה' : 'Launch date must be before the expiry date');
      return;
    }
    if (executionType === 'voucher') {
      if (voucherValidityValue.trim() !== '') {
        const vv = Number(voucherValidityValue);
        if (!Number.isInteger(vv) || vv <= 0) {
          setError(language === 'he' ? 'מגבלת התוקף חייבת להיות מספר שלם חיובי' : 'Validity limit must be a positive whole number');
          return;
        }
      }
      if (voucherStackable === '') { setError(t('co_voucherStackableRequired')); return; }
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      // Note: category cannot currently change via PATCH (omitted intentionally).
      fd.append('executionType', executionType);
      if (marketPrice && Number(marketPrice) > 0) fd.append('market_price', marketPrice);
      // Stock limit is a non-voucher field only; vouchers never send it.
      if (executionType !== 'voucher') {
        fd.append('stockLimit', stockLimit && Number(stockLimit) > 0 ? stockLimit : '');
      }
      // Voucher pricing is locked for non-platform-admin callers. Skip the
      // fields entirely so the backend update payload doesn't try to change
      // them; the server also rejects the change defensively.
      if (executionType === 'voucher' && !pricingLocked) {
        if (faceValue) fd.append('face_value', faceValue);
        if (nexusCost) fd.append('nexus_cost', nexusCost);
      }
      fd.append('implementationLink', implementationLink.trim());
      fd.append('implementationInstructions', implementationInstructions.trim());
      if (executionType === 'voucher') {
        // Voucher: send the validity duration (empty -> backend clears it);
        // never send absolute dates. The backend also nulls validFrom/validUntil
        // for vouchers, normalizing any legacy values.
        const hasValidity = voucherValidityValue.trim() !== '';
        fd.append('voucherValidityValue', hasValidity ? voucherValidityValue.trim() : '');
        fd.append('voucherValidityUnit', hasValidity ? voucherValidityUnit : '');
        fd.append('voucherStackable', voucherStackable === 'yes' ? 'true' : 'false');
        // Color only in color mode; image mode sends '' so the backend clears any stored color.
        fd.append('voucherBackgroundColor', bgMode === 'color' && voucherBackgroundColor ? voucherBackgroundColor : '');
      } else {
        fd.append('validFrom', validFrom || '');
        fd.append('validUntil', validUntil || '');
      }
      fd.append('terms', terms.trim());
      fd.append('tags', JSON.stringify(tags));

      // Gallery reconciliation: kept URLs in current order, new files appended.
      const keptUrls = gallery.filter((g): g is GalleryItem & { kind: 'existing' } => g.kind === 'existing').map((g) => g.url);
      fd.append('keptImageUrls', JSON.stringify(keptUrls));
      gallery.forEach((g) => { if (g.kind === 'new') fd.append('images', g.file); });

      await updateOfferApi(offerId, fd);
      navigate('/benefits-partnerships');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('co_errPublish'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 animate-pulse">
        <div className="h-[250px] bg-slate-200" />
        <div className="px-4 sm:px-8 -mt-16 pb-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="h-64 rounded-2xl bg-white border border-slate-200" />
            <div className="h-80 rounded-2xl bg-white border border-slate-200" />
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="h-40 rounded-2xl bg-white border border-slate-200" />
            <div className="h-32 rounded-2xl bg-white border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
          <p className="text-sm text-red-700 mb-6">{loadError}</p>
          <button
            type="button"
            onClick={() => navigate('/benefits-partnerships')}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            {t('of_backToCatalog')}
          </button>
        </div>
      </div>
    );
  }

  const leftColumn = (
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
        isSubmitting={isSubmitting}
        pricingLocked={pricingLocked}
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
  );

  const rightColumn = null;

  return (
    <OfferFormLayout
      title={t('of_pageTitleEdit')}
      businessName={me?.context?.tenantName ?? undefined}
      coverUrl={coverUrl}
      coverColor={coverColor}
      saveLabel={offer?.approval_status === 'denied' ? t('of_saveResubmit') : t('of_saveUpdate')}
      cancelLabel={t('of_cancel')}
      onSave={() => { void handleSubmit(); }}
      onCancel={() => navigate('/benefits-partnerships')}
      isSubmitting={isSubmitting}
      error={error}
      denialReason={offer?.approval_status === 'denied' ? (offer?.denial_reason ?? null) : null}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
};

export default EditOffer;
