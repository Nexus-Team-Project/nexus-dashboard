/**
 * CreateOfferDetailsSection: renders the "Offer Details" and "Pricing" cards
 * within the CreateOffer form. Extracted to keep CreateOffer.tsx under the
 * 350-line limit.
 *
 * All state lives in the parent (CreateOffer) and is passed down as controlled
 * props, so the parent remains the single source of truth for the form payload.
 */
import { useLanguage } from '../i18n/LanguageContext';
import { OFFER_CATEGORIES, EXECUTION_TYPE_LABELS } from '../lib/api';

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
  /** Execution/delivery type (e.g. voucher, link). */
  executionType: string;
  /** Setter for executionType. */
  setExecutionType: (v: string) => void;
  /** Supplier raw cost (string to allow empty state). */
  rawCost: string;
  /** Setter for rawCost. */
  setRawCost: (v: string) => void;
  /** Optional market price for display purposes. */
  marketPrice: string;
  /** Setter for marketPrice. */
  setMarketPrice: (v: string) => void;
  /** Optional stock limit cap (empty = unlimited). */
  stockLimit: string;
  /** Setter for stockLimit. */
  setStockLimit: (v: string) => void;
  /** Whether the parent form is submitting - disables all inputs. */
  isSubmitting: boolean;
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
  setExecutionType,
  rawCost,
  setRawCost,
  marketPrice,
  setMarketPrice,
  stockLimit,
  setStockLimit,
  isSubmitting,
}: DetailsSectionProps) => {
  const { t, language } = useLanguage();

  return (
    <>
      {/* Offer details card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
          {t('co_sectionOfferDetails')}
        </h2>

        {/* Title - required */}
        <div className="mb-4">
          <label
            htmlFor="offer-title"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('co_fieldTitle')} <span className="text-red-500" aria-hidden="true">*</span>
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
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('co_fieldDescription')}
          </label>
          <textarea
            id="offer-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('co_descriptionPlaceholder')}
            rows={4}
            disabled={isSubmitting}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label
            htmlFor="offer-category"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('co_fieldCategory')}
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

        {/* Execution type - how the offer is delivered to the member */}
        <div>
          <label
            htmlFor="offer-execution-type"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('co_fieldOfferType')} <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id="offer-execution-type"
            value={executionType}
            onChange={(e) => setExecutionType(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {Object.entries(EXECUTION_TYPE_LABELS).map(([value, { label, icon }]) => (
              <option key={value} value={value}>
                {icon} {label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t('co_offerTypeHint')}
          </p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-white">
          {t('co_sectionPricing')}
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          {t('co_pricingHint')}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Your cost - required */}
          <div>
            <label
              htmlFor="offer-raw-cost"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {t('co_fieldYourCost')} <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="offer-raw-cost"
              type="number"
              min="0.01"
              step="0.01"
              value={rawCost}
              onChange={(e) => setRawCost(e.target.value)}
              placeholder="0.00"
              required
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Market price - optional, shown to members as reference */}
          <div>
            <label
              htmlFor="offer-market-price"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {t('co_fieldMarketPrice')}{' '}
              <span className="font-normal text-slate-400">{t('co_optional')}</span>
            </label>
            <input
              id="offer-market-price"
              type="number"
              min="0.01"
              step="0.01"
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-slate-400">
              {t('co_marketPriceHint')}
            </p>
          </div>
        </div>

        {/* Stock limit - optional cap on total redemptions */}
        <div className="mt-4">
          <label
            htmlFor="offer-stock-limit"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('co_fieldStockLimit')}{' '}
            <span className="font-normal text-xs text-slate-400">
              {t('co_stockLimitHint')}
            </span>
          </label>
          <input
            id="offer-stock-limit"
            type="number"
            min="1"
            step="1"
            value={stockLimit}
            onChange={(e) => setStockLimit(e.target.value)}
            placeholder={t('co_stockLimitPlaceholder')}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </section>
    </>
  );
};

export default CreateOfferDetailsSection;
