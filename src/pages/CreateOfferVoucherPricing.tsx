/**
 * CreateOfferVoucherPricing - voucher-specific pricing section for the
 * CreateOffer / EditOffer forms.
 *
 * Renders two pricing inputs plus stock limit:
 *   1. Face Value          - nominal value of the voucher
 *   2. Nexus Price         - wholesale cost NEXUS pays the supplier
 *   3. Stock Limit         - optional cap on issued vouchers
 *
 * The per-tenant member price is no longer chosen on this form. Each
 * adopting tenant sets it from the BenefitsPartnerships table view via
 * VoucherPricePopover. Backend seeds member_price = nexus_cost on create.
 */
import { useLanguage } from '../i18n/LanguageContext';
import FieldTooltip from '../components/FieldTooltip';

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * Props for the VoucherPricingSection component.
 * All values are controlled - they read from and write to parent state.
 */
interface VoucherPricingSectionProps {
  /** Voucher face value as string (form input). */
  faceValue: string;
  /** Setter for faceValue. */
  setFaceValue: (v: string) => void;
  /** Nexus cost (wholesale price) as string (form input). */
  nexusCost: string;
  /** Setter for nexusCost. */
  setNexusCost: (v: string) => void;
  /** Stock limit as string (form input); empty = unlimited. */
  stockLimit: string;
  /** Setter for stockLimit. */
  setStockLimit: (v: string) => void;
  /** Whether the parent form is submitting - disables all inputs. */
  isSubmitting: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Voucher pricing section with face value and nexus cost inputs.
 * Also renders the stock limit field below the pricing controls.
 *
 * Input: controlled props for all voucher pricing fields and their setters.
 * Output: renders the pricing inputs and the stock limit field inside a card body.
 */
const VoucherPricingSection = ({
  faceValue,
  setFaceValue,
  nexusCost,
  setNexusCost,
  stockLimit,
  setStockLimit,
  isSubmitting,
}: VoucherPricingSectionProps) => {
  const { t, language } = useLanguage();

  /** Parsed numeric values - NaN when the string is empty or invalid. */
  const faceValueNum = parseFloat(faceValue);
  const nexusCostNum = parseFloat(nexusCost);

  /** Shared input class - matches the existing CreateOffer form style. */
  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <>
      {/* Face Value */}
      <div className="mb-4">
        <label
          htmlFor="offer-face-value"
          className="mb-1.5 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {t('fi_faceValue_label')}
          <span className="text-red-500 ms-0.5" aria-hidden="true">*</span>
          <FieldTooltip fieldKey="faceValue" />
        </label>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none" aria-hidden="true">₪</span>
          <input
            id="offer-face-value"
            type="number"
            min="0.01"
            step="0.01"
            value={faceValue}
            onChange={(e) => setFaceValue(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="0.00"
            disabled={isSubmitting}
            dir="ltr"
            className={inputCls + ' pr-8'}
          />
        </div>
      </div>

      {/* Nexus Cost */}
      <div className="mb-4">
        <label
          htmlFor="offer-nexus-cost"
          className="mb-1.5 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {t('fi_nexusCost_label')}
          <span className="text-red-500 ms-0.5" aria-hidden="true">*</span>
          <FieldTooltip fieldKey="nexusCost" />
        </label>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none" aria-hidden="true">₪</span>
          <input
            id="offer-nexus-cost"
            type="number"
            min="0.01"
            step="0.01"
            value={nexusCost}
            onChange={(e) => setNexusCost(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="0.00"
            disabled={isSubmitting}
            dir="ltr"
            className={inputCls + ' pr-8'}
          />
        </div>
        {!isNaN(nexusCostNum) && !isNaN(faceValueNum) && nexusCostNum >= faceValueNum && faceValue !== '' && nexusCost !== '' && (
          <p className="mt-1 text-xs text-red-500">
            {language === 'he' ? 'מחיר NEXUS חייב להיות נמוך מהשווי' : 'Nexus price must be less than face value'}
          </p>
        )}
      </div>

      {/* Stock Limit - kept together with voucher pricing for logical grouping */}
      <div className="mt-4">
        <label
          htmlFor="offer-stock-limit"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {t('co_fieldStockLimit')}
          <span className="font-normal text-slate-400">{t('co_optional')}</span>
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
          className={inputCls}
        />
      </div>
    </>
  );
};

export default VoucherPricingSection;
