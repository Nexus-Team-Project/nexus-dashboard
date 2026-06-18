/**
 * CreateOffer page: full-page form for publishing a new NEXUS catalog offer.
 *
 * Layout matches the EditBenefit mock — full-bleed hero banner + 12-col grid
 * with sidebar cards (see `OfferFormLayout`). Multi-image gallery (up to 6)
 * lives in the left column; visibility + helper info card live in the right.
 *
 * Route: /supply/create
 * Guards: isTenantAdmin || isPlatformAdmin (App.tsx) AND service active for
 *         tenant supply managers (this file).
 *
 * State is owned here; field-level rendering is delegated to the existing
 * `CreateOfferDetailsSection` and `CreateOfferRedemptionSection` to keep the
 * file under 350 lines.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { createOfferApi, OFFER_CATEGORIES } from '../lib/api';
import CreateOfferDetailsSection from './CreateOfferDetailsSection';
import CreateOfferRedemptionSection from './CreateOfferRedemptionSection';
import FieldTooltip from '../components/FieldTooltip';
import OfferFormLayout from '../components/offer/OfferFormLayout';
import OfferImageGallery, { type GalleryItem } from '../components/offer/OfferImageGallery';
import OfferTypeField from '../components/offer/OfferTypeField';
import VoucherBackgroundField, { type BgMode } from '../components/offer/VoucherBackgroundField';

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

  /**
   * Validates the form, builds multipart FormData (images[] + JSON fields),
   * POSTs to /api/v1/offers, and navigates back to the catalog on success.
   */
  const handleSubmit = async () => {
    if (!title.trim()) { setError(t('co_errTitleRequired')); return; }
    if (marketPrice && (isNaN(Number(marketPrice)) || Number(marketPrice) <= 0)) {
      setError(t('co_errMarketPrice')); return;
    }
    if (validFrom && validUntil && new Date(validFrom) >= new Date(validUntil)) {
      setError(language === 'he' ? 'תאריך ההשקה חייב להיות לפני תאריך התפוגה' : 'Launch date must be before the expiry date');
      return;
    }
    if (executionType === 'voucher') {
      const fv = Number(faceValue);
      const nc = Number(nexusCost);
      if (!faceValue || isNaN(fv) || fv <= 0) {
        setError(language === 'he' ? 'יש להזין שווי שובר תקין וחיובי' : 'Face value must be a positive number'); return;
      }
      if (!nexusCost || isNaN(nc) || nc <= 0 || nc >= fv) {
        setError(language === 'he' ? 'מחיר NEXUS חייב להיות חיובי ופחות מהשווי' : 'Nexus price must be positive and less than face value'); return;
      }
      // Validity is optional (empty = never expires); when set it must be a positive integer.
      if (voucherValidityValue.trim() !== '') {
        const vv = Number(voucherValidityValue);
        if (!Number.isInteger(vv) || vv <= 0) {
          setError(language === 'he' ? 'מגבלת התוקף חייבת להיות מספר שלם חיובי' : 'Validity limit must be a positive whole number'); return;
        }
      }
      // Combine-with-promotions is a mandatory, no-default choice.
      if (voucherStackable === '') { setError(t('co_voucherStackableRequired')); return; }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('category', category);
      if (marketPrice && Number(marketPrice) > 0) fd.append('market_price', marketPrice);
      fd.append('visibility', isPlatformAdmin ? 'ecosystem' : visibility);
      fd.append('executionType', executionType);
      // Stock limit is a non-voucher field only; vouchers never send it.
      if (executionType !== 'voucher' && stockLimit && Number(stockLimit) > 0) fd.append('stockLimit', stockLimit);
      if (executionType === 'voucher') {
        fd.append('face_value', faceValue);
        fd.append('nexus_cost', nexusCost);
      }
      // New files: append every blob under the same `images` field name.
      gallery.forEach((item) => {
        if (item.kind === 'new') fd.append('images', item.file);
      });
      if (implementationLink.trim()) fd.append('implementationLink', implementationLink.trim());
      if (implementationInstructions.trim()) fd.append('implementationInstructions', implementationInstructions.trim());
      if (executionType === 'voucher') {
        // Voucher: purchase-anchored validity duration, no absolute dates.
        if (voucherValidityValue.trim() !== '') {
          fd.append('voucherValidityValue', voucherValidityValue.trim());
          fd.append('voucherValidityUnit', voucherValidityUnit);
        }
        fd.append('voucherStackable', voucherStackable === 'yes' ? 'true' : 'false');
        // Background color only when in color mode (image mode leaves it unset).
        if (bgMode === 'color' && voucherBackgroundColor) {
          fd.append('voucherBackgroundColor', voucherBackgroundColor);
        }
      } else {
        if (validFrom) fd.append('validFrom', validFrom);
        if (validUntil) fd.append('validUntil', validUntil);
      }
      if (terms.trim()) fd.append('terms', terms.trim());
      if (tags.length > 0) fd.append('tags', JSON.stringify(tags));

      await createOfferApi(fd);
      navigate('/benefits-partnerships');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('co_errPublish'));
    } finally {
      setIsSubmitting(false);
    }
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

  const rightColumn = (
    <>
      {!isPlatformAdmin && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            {t('co_sectionVisibility')}
            <FieldTooltip fieldKey="visibility" />
          </h2>
          <fieldset>
            <legend className="sr-only">{t('co_visibilityLegend')}</legend>
            <div className="space-y-4">
              <label className={`flex items-start gap-3 ${!businessSetupComplete ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input
                  type="radio" name="visibility" value="ecosystem"
                  checked={visibility === 'ecosystem'}
                  onChange={() => businessSetupComplete && setVisibility('ecosystem')}
                  disabled={isSubmitting || !businessSetupComplete}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-700">{t('co_visAllTenants')}</span>
                  <span className="mt-0.5 block text-xs text-amber-600">
                    {businessSetupComplete
                      ? t('co_visEcosystemApproval')
                      : (language === 'he' ? 'יש להשלים הגדרת עסק כדי לפרסם לכל הפלטפורמה' : 'Complete business setup to publish to the full platform')}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio" name="visibility" value="tenant_only"
                  checked={visibility === 'tenant_only'}
                  onChange={() => setVisibility('tenant_only')}
                  disabled={isSubmitting}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-700">{t('co_visMyTenantOnly')}</span>
                  <span className="mt-0.5 block text-xs text-green-600">{t('co_visMyTenantNoApproval')}</span>
                </span>
              </label>
            </div>
          </fieldset>
        </section>
      )}
      {isPlatformAdmin && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
          {t('co_platformNote')}
        </section>
      )}
    </>
  );

  return (
    <OfferFormLayout
      title={t('of_pageTitleCreate')}
      businessName={me?.context?.tenantName ?? undefined}
      coverUrl={coverUrl}
      coverColor={coverColor}
      saveLabel={t('of_saveCreate')}
      cancelLabel={t('of_cancel')}
      onSave={() => { void handleSubmit(); }}
      onCancel={() => navigate('/benefits-partnerships')}
      isSubmitting={isSubmitting}
      error={error}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
};

export default CreateOffer;
