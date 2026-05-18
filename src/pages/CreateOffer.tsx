/**
 * CreateOffer page: allows tenant admins, supply managers, and platform admins
 * to publish a new offer to the NEXUS platform catalog.
 *
 * Images are uploaded to Cloudinary via the backend.
 *
 * Route: /supply/create
 * Guards: isTenantAdmin || isPlatformAdmin (enforced in App.tsx route).
 *
 * This file owns all form state and the submit handler.
 * The visual sections are split into helper components to respect the 350-line
 * file-size limit:
 *   - CreateOfferDetailsSection  - Offer Details + Pricing cards
 *   - CreateOfferRedemptionSection - Redemption Details card
 *   - CreateOfferImagePanel      - Image upload + error alert + action buttons
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { createOfferApi, OFFER_CATEGORIES } from '../lib/api';
import CreateOfferDetailsSection from './CreateOfferDetailsSection';
import CreateOfferRedemptionSection from './CreateOfferRedemptionSection';
import CreateOfferImagePanel from './CreateOfferImagePanel';
import FieldTooltip from '../components/FieldTooltip';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Visibility options for a platform offer. */
type OfferVisibility = 'ecosystem' | 'tenant_only';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Form page for creating a new supply catalog offer.
 * Requires the caller (App.tsx route guard) to ensure only users with
 * canManageSupply or isPlatformAdmin can reach this route.
 *
 * Input: none - reads auth context internally.
 * Output: calls createOfferApi with a multipart FormData payload, then
 *         navigates to /benefits-partnerships on success.
 */
const CreateOffer = () => {
  const navigate = useNavigate();
  const { me } = useAuth();
  const { t, language } = useLanguage();

  /** Platform admins always publish to the full ecosystem; the visibility
   *  toggle is hidden for them to prevent accidental scoping. */
  const isPlatformAdmin = me?.isPlatformAdmin === true || me?.authorization?.isPlatformAdmin === true;
  /** True when the tenant has activated the Benefits Catalog service. */
  const catalogServiceActive = me?.authorization?.catalogServiceActive === true;
  /** True when the tenant has submitted their business setup. Ecosystem visibility requires this. */
  const businessSetupComplete = me?.authorization?.businessSetupComplete === true;

  // ─── Offer details state ─────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(OFFER_CATEGORIES[0].value);
  /** Selected execution type - how the offer is delivered to the member. */
  const [executionType, setExecutionType] = useState('voucher');

  // ─── Pricing state ───────────────────────────────────────────────────────────
  const [marketPrice, setMarketPrice] = useState('');
  /** Optional stock limit; empty string means unlimited. */
  const [stockLimit, setStockLimit] = useState('');

  // ─── Voucher-specific pricing state (only used when executionType === 'voucher') ─
  /** Voucher face value: the nominal amount printed on the voucher. */
  const [faceValue, setFaceValue]     = useState('');
  /** Nexus cost: wholesale price NEXUS pays the supplier per voucher. */
  const [nexusCost, setNexusCost]     = useState('');
  /** Member price: what end customers pay; set via slider between nexusCost and faceValue. */
  const [memberPrice, setMemberPrice] = useState<number | null>(null);

  // ─── Visibility state ────────────────────────────────────────────────────────
  const [visibility, setVisibility] = useState<OfferVisibility>('ecosystem');

  // Once auth context loads, ensure ecosystem is not pre-selected when business setup is incomplete.
  useEffect(() => {
    if (me && !businessSetupComplete && !isPlatformAdmin) {
      setVisibility('tenant_only');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // ─── Image state ─────────────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ─── Redemption detail state ─────────────────────────────────────────────────
  /** URL where members can redeem or access the offer (optional). */
  const [implementationLink, setImplementationLink] = useState('');
  /** Step-by-step instructions shown to members after redemption (optional). */
  const [implementationInstructions, setImplementationInstructions] = useState('');
  /** ISO date string for when the offer first becomes visible to members (optional). */
  const [validFrom, setValidFrom] = useState('');
  /** ISO date string for when the offer expires (optional). */
  const [validUntil, setValidUntil] = useState('');
  /** Terms and conditions text shown to members (optional). */
  const [terms, setTerms] = useState('');
  /** Current tag text being typed in the tag input field. */
  const [tagInput, setTagInput] = useState('');
  /** List of tags attached to this offer; max 10. */
  const [tags, setTags] = useState<string[]>([]);

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Submit handler ──────────────────────────────────────────────────────────

  /**
   * Validates form fields, builds a multipart FormData payload, and calls the
   * backend to create the offer. On success, navigates to /benefits-partnerships.
   * Input: React form submit event.
   * Output: navigates on success; sets error state on failure.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(t('co_errTitleRequired'));
      return;
    }
    const mp = marketPrice ? Number(marketPrice) : null;
    if (marketPrice && (isNaN(mp as number) || (mp as number) <= 0)) {
      setError(t('co_errMarketPrice'));
      return;
    }
    // Client-side mirror of the backend validFrom < validUntil rule.
    // Backend still enforces it; this just gives faster feedback to the user.
    if (validFrom && validUntil && new Date(validFrom) >= new Date(validUntil)) {
      setError(language === 'he'
        ? 'תאריך ההשקה חייב להיות לפני תאריך התפוגה'
        : 'Launch date must be before the expiry date');
      return;
    }

    // Voucher-specific validation
    if (executionType === 'voucher') {
      const fv = Number(faceValue);
      const nc = Number(nexusCost);
      if (!faceValue || isNaN(fv) || fv <= 0) {
        setError(language === 'he' ? 'יש להזין שווי שובר תקין וחיובי' : 'Face value must be a positive number');
        return;
      }
      if (!nexusCost || isNaN(nc) || nc <= 0 || nc >= fv) {
        setError(language === 'he' ? 'מחיר NEXUS חייב להיות חיובי ופחות מהשווי' : 'Nexus price must be positive and less than face value');
        return;
      }
      if (memberPrice === null || memberPrice < nc || memberPrice > fv) {
        setError(language === 'he' ? 'מחיר החבר חייב להיות בין מחיר NEXUS לשווי' : 'Member price must be between Nexus price and face value');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('category', category);
      if (marketPrice && Number(marketPrice) > 0) fd.append('market_price', marketPrice);
      // Platform admins are always ecosystem; tenant supply managers can toggle.
      fd.append('visibility', isPlatformAdmin ? 'ecosystem' : visibility);
      fd.append('executionType', executionType);
      if (stockLimit && Number(stockLimit) > 0) fd.append('stockLimit', stockLimit);

      // Append voucher pricing fields when creating a voucher offer.
      if (executionType === 'voucher') {
        fd.append('face_value', faceValue);
        fd.append('nexus_cost', nexusCost);
        if (memberPrice !== null) fd.append('member_price', String(memberPrice));
      }

      if (imageFile) fd.append('image', imageFile);

      // Append optional redemption detail fields when provided.
      if (implementationLink.trim()) fd.append('implementationLink', implementationLink.trim());
      if (implementationInstructions.trim()) fd.append('implementationInstructions', implementationInstructions.trim());
      if (validFrom) fd.append('validFrom', validFrom);
      if (validUntil) fd.append('validUntil', validUntil);
      if (terms.trim()) fd.append('terms', terms.trim());
      if (tags.length > 0) fd.append('tags', JSON.stringify(tags));

      await createOfferApi(fd);
      navigate('/benefits-partnerships');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('co_errPublish');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Tenant admins who haven't activated the catalog service yet see an
  // activation prompt instead of the form. Platform admins bypass this.
  if (!isPlatformAdmin && !catalogServiceActive) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-12 text-center shadow-sm dark:border-amber-800/40 dark:bg-amber-900/10">
          <span className="material-symbols-rounded !text-[48px] text-amber-500 mb-4">lock</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t('co_serviceInactiveTitle')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
            {t('co_serviceInactiveBody')}
          </p>
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('co_pageTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('co_pageSubtitle')}
        </p>
      </div>

      <form onSubmit={(e) => { void handleSubmit(e); }} noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left column: main fields ────────────────────────────────────── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Offer Details + Pricing cards */}
            <CreateOfferDetailsSection
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              category={category}
              setCategory={setCategory}
              executionType={executionType}
              setExecutionType={setExecutionType}
              marketPrice={marketPrice}
              setMarketPrice={setMarketPrice}
              stockLimit={stockLimit}
              setStockLimit={setStockLimit}
              faceValue={faceValue}
              setFaceValue={setFaceValue}
              nexusCost={nexusCost}
              setNexusCost={setNexusCost}
              memberPrice={memberPrice}
              setMemberPrice={setMemberPrice}
              isSubmitting={isSubmitting}
            />

            {/* Redemption Details card */}
            <CreateOfferRedemptionSection
              implementationLink={implementationLink}
              setImplementationLink={setImplementationLink}
              implementationInstructions={implementationInstructions}
              setImplementationInstructions={setImplementationInstructions}
              validFrom={validFrom}
              setValidFrom={setValidFrom}
              validUntil={validUntil}
              setValidUntil={setValidUntil}
              terms={terms}
              setTerms={setTerms}
              tagInput={tagInput}
              setTagInput={setTagInput}
              tags={tags}
              setTags={setTags}
              isSubmitting={isSubmitting}
            />

            {/* Visibility card - hidden for platform admins */}
            {!isPlatformAdmin && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
                <h2 className="mb-4 flex items-center text-base font-semibold text-slate-800 dark:text-white">
                  {t('co_sectionVisibility')}
                  <FieldTooltip fieldKey="visibility" />
                </h2>

                <fieldset>
                  <legend className="sr-only">{t('co_visibilityLegend')}</legend>
                  <div className="space-y-4">
                    {/* Ecosystem - requires business setup + NEXUS platform admin approval */}
                    <label className={`flex items-start gap-3 ${!businessSetupComplete ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        name="visibility"
                        value="ecosystem"
                        checked={visibility === 'ecosystem'}
                        onChange={() => businessSetupComplete && setVisibility('ecosystem')}
                        disabled={isSubmitting || !businessSetupComplete}
                        className="mt-0.5 accent-primary disabled:cursor-not-allowed"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t('co_visAllTenants')}
                        </span>
                        {businessSetupComplete ? (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0" aria-hidden="true">
                              <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5V3.75Z" clipRule="evenodd"/>
                            </svg>
                            {t('co_visEcosystemApproval')}
                          </span>
                        ) : (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0" aria-hidden="true">
                              <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM6.75 5.25a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Zm.75 7a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd"/>
                            </svg>
                            {language === 'he' ? 'יש להשלים הגדרת עסק כדי לפרסם לכל הפלטפורמה' : 'Complete business setup to publish to the full platform'}
                          </span>
                        )}
                      </span>
                    </label>

                    {/* Tenant-only - published immediately, no approval needed */}
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="visibility"
                        value="tenant_only"
                        checked={visibility === 'tenant_only'}
                        onChange={() => setVisibility('tenant_only')}
                        disabled={isSubmitting}
                        className="mt-0.5 accent-primary"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t('co_visMyTenantOnly')}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          {/* Checkmark icon */}
                          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.844 4.574a.75.75 0 0 0-1.188-.918L7.227 9.073 5.28 7.127a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.124-.06l4-5.053Z" clipRule="evenodd"/>
                          </svg>
                          {t('co_visMyTenantNoApproval')}
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
              </section>
            )}

            {/* Platform admin visibility note - always ecosystem */}
            {isPlatformAdmin && (
              <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300">
                <span className="material-symbols-rounded !text-[18px]">public</span>
                <span>{t('co_platformNote')}</span>
              </div>
            )}
          </div>

          {/* ── Right column: image upload + error + action buttons ──────────── */}
          <CreateOfferImagePanel
            imageFile={imageFile}
            setImageFile={setImageFile}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            error={error}
            setError={setError}
            isSubmitting={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
};

export default CreateOffer;
