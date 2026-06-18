/**
 * CreateOfferDetailsSection: renders the "Offer Details" and "Pricing" cards
 * within the CreateOffer form. Extracted to keep CreateOffer.tsx under the
 * 350-line limit.
 *
 * All state lives in the parent (CreateOffer) and is passed down as controlled
 * props, so the parent remains the single source of truth for the form payload.
 */
import { useLanguage } from '../i18n/LanguageContext';
import { OFFER_CATEGORIES } from '../lib/api';
import RichTextEditor from '../components/RichTextEditor';
import FieldTooltip from '../components/FieldTooltip';
import VoucherPricingSection from './CreateOfferVoucherPricing';

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * Props for the offer details + pricing section.
 * All values are controlled - they read from and write to parent state.
 */
interface DetailsSectionProps {
  /** Offer title (required). */
  title: string;
  /** Setter for title. */
  setTitle: (v: string) => void;
  /** Offer description. */
  description: string;
  /** Setter for description. */
  setDescription: (v: string) => void;
  /** Selected category value. */
  category: string;
  /** Setter for category. */
  setCategory: (v: string) => void;
  /** Execution/delivery type (e.g. voucher, link). Selected via OfferTypeField;
   *  here it only drives the voucher vs non-voucher pricing branch. */
  executionType: string;
  /** Optional market price for display purposes. */
  marketPrice: string;
  /** Setter for marketPrice. */
  setMarketPrice: (v: string) => void;
  /** Optional stock limit cap (empty = unlimited). */
  stockLimit: string;
  /** Setter for stockLimit. */
  setStockLimit: (v: string) => void;
  /** Voucher face value (required when executionType === 'voucher'). */
  faceValue: string;
  /** Setter for faceValue. */
  setFaceValue: (v: string) => void;
  /** Nexus wholesale cost (required when executionType === 'voucher'). */
  nexusCost: string;
  /** Setter for nexusCost. */
  setNexusCost: (v: string) => void;
  /** Optional voucher SKU / internal company code. */
  sku: string;
  /** Setter for sku. */
  setSku: (v: string) => void;
  /** Whether the parent form is submitting - disables all inputs. */
  isSubmitting: boolean;
  /**
   * Pass-through for VoucherPricingSection. When true, face_value + nexus_cost
   * become read-only and a help message tells the user to contact Nexus.
   * Used on the Edit page for non-platform-admin callers. Defaults to false.
   */
  pricingLocked?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Offer Details and Pricing cards for the CreateOffer form.
 *
 * Input: controlled props for all detail/pricing fields and their setters.
 * Output: renders two card sections - one for descriptive fields and one for
 *         cost/price/stock inputs.
 */
const CreateOfferDetailsSection = ({
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  executionType,
  marketPrice,
  setMarketPrice,
  stockLimit,
  setStockLimit,
  faceValue,
  setFaceValue,
  nexusCost,
  setNexusCost,
  sku,
  setSku,
  isSubmitting,
  pricingLocked = false,
}: DetailsSectionProps) => {
  const { t, language } = useLanguage();

  return (
    <>
      {/* Offer details card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
          {t('co_sectionOfferDetails')}
        </h2>

        {/* Offer type lives in its own card above the gallery (OfferTypeField),
            so it is the first decision on the form. */}

        {/* Title - required */}
        <div className="mb-4">
          <label
            htmlFor="offer-title"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('co_fieldTitle')} <span className="text-red-500 ms-0.5" aria-hidden="true">*</span>
            <FieldTooltip fieldKey="title" />
          </label>
          <input
            id="offer-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('co_titlePlaceholder')}
            required
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label
            htmlFor="offer-description"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('co_fieldDescription')}
            <FieldTooltip fieldKey="description" />
          </label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder={t('co_descriptionPlaceholder')}
            disabled={isSubmitting}
          />
        </div>

        {/* Category - last field in the details card. */}
        <div>
          <label
            htmlFor="offer-category"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('co_fieldCategory')}
            <FieldTooltip fieldKey="category" />
          </label>
          <select
            id="offer-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {OFFER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {language === 'he' ? cat.labelHe : cat.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Pricing card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
          {t('co_sectionPricing')}
        </h2>

        {executionType === 'voucher' ? (
          /* Voucher-specific pricing: face value, nexus cost, stock limit */
          <VoucherPricingSection
            faceValue={faceValue}
            setFaceValue={setFaceValue}
            nexusCost={nexusCost}
            setNexusCost={setNexusCost}
            sku={sku}
            setSku={setSku}
            isSubmitting={isSubmitting}
            pricingLocked={pricingLocked}
          />
        ) : (
          <>
            {/* Market price - optional, shown to members as reference */}
            <div>
              <label
                htmlFor="offer-market-price"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t('co_fieldMarketPrice')}{' '}
                <span className="font-normal text-slate-400 me-0.5">{t('co_optional')}</span>
                <FieldTooltip fieldKey="marketPrice" />
              </label>
              <input
                id="offer-market-price"
                type="number"
                min="0.01"
                step="0.01"
                value={marketPrice}
                onChange={(e) => setMarketPrice(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0.00"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Stock limit - optional cap on total redemptions */}
            <div className="mt-4">
              <label
                htmlFor="offer-stock-limit"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t('co_fieldStockLimit')}
                <span className="font-normal text-slate-400 ms-1.5">{t('co_optional')}</span>
                <FieldTooltip fieldKey="stockLimit" />
              </label>
              <input
                id="offer-stock-limit"
                type="number"
                min="1"
                step="1"
                value={stockLimit}
                onChange={(e) => setStockLimit(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder={t('co_stockLimitPlaceholder')}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </>
        )}
      </section>
    </>
  );
};

export default CreateOfferDetailsSection;
