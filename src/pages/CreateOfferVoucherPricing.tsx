/**
 * CreateOfferVoucherPricing - voucher-specific pricing section for the CreateOffer form.
 * Replaces the standard market price field when executionType === 'voucher'.
 *
 * Renders three pricing inputs:
 *   1. Face Value (שווי) - nominal value of the voucher
 *   2. Nexus Price (מחיר מכירה לנקסוס) - wholesale cost NEXUS pays the supplier
 *   3. Member Price Slider - range slider from nexusCost to faceValue
 *
 * Additionally renders the Stock Limit field (moved from the standard pricing card).
 *
 * All state is controlled from the parent (CreateOffer / EditOfferDrawer).
 */
import { useEffect } from 'react';
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
  /** Member price (end-customer price); null until slider is interacted with. */
  memberPrice: number | null;
  /** Setter for memberPrice. */
  setMemberPrice: (v: number | null) => void;
  /** Stock limit as string (form input); empty = unlimited. */
  stockLimit: string;
  /** Setter for stockLimit. */
  setStockLimit: (v: string) => void;
  /** Whether the parent form is submitting - disables all inputs. */
  isSubmitting: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Voucher pricing section with face value, nexus cost, and member price slider.
 * Also renders the stock limit field below the pricing controls.
 *
 * Input: controlled props for all voucher pricing fields and their setters.
 * Output: renders three pricing inputs and the stock limit field inside a card body.
 */
const VoucherPricingSection = ({
  faceValue,
  setFaceValue,
  nexusCost,
  setNexusCost,
  memberPrice,
  setMemberPrice,
  stockLimit,
  setStockLimit,
  isSubmitting,
}: VoucherPricingSectionProps) => {
  const { t, language } = useLanguage();

  /** Parsed numeric values - NaN when the string is empty or invalid. */
  const faceValueNum = parseFloat(faceValue);
  const nexusCostNum = parseFloat(nexusCost);

  /**
   * Whether the slider can be rendered: both values are valid positive numbers
   * and nexusCost is strictly less than faceValue.
   */
  const sliderReady =
    !isNaN(faceValueNum) && faceValueNum > 0 &&
    !isNaN(nexusCostNum) && nexusCostNum > 0 &&
    nexusCostNum < faceValueNum;

  /**
   * Synchronize memberPrice when the slider bounds change.
   * If memberPrice is null or outside [nexusCostNum, faceValueNum], reset to nexusCostNum.
   * Runs whenever faceValue or nexusCost changes.
   */
  useEffect(() => {
    if (!sliderReady) {
      setMemberPrice(null);
      return;
    }
    if (memberPrice === null || memberPrice < nexusCostNum || memberPrice > faceValueNum) {
      setMemberPrice(nexusCostNum);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceValue, nexusCost]);

  /** Profit = member price minus nexus cost (what the supplier earns per voucher). */
  const profit = sliderReady && memberPrice !== null ? memberPrice - nexusCostNum : 0;

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

      {/* Member Price Slider - only rendered when bounds are valid */}
      {sliderReady && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('fi_memberPrice_label')}
            <span className="text-red-500 ms-0.5" aria-hidden="true">*</span>
            <FieldTooltip fieldKey="memberPrice" />
          </div>
          <input
            type="range"
            min={nexusCostNum}
            max={faceValueNum}
            step={1}
            value={memberPrice ?? nexusCostNum}
            onChange={(e) => setMemberPrice(Number(e.target.value))}
            onWheel={(e) => e.currentTarget.blur()}
            disabled={isSubmitting}
            className="w-full accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            dir="ltr"
            aria-label={language === 'he' ? 'מחיר לחבר' : 'Member price'}
          />
          {/* Slider bounds labels */}
          <div className="flex justify-between text-xs text-slate-400 mt-1" dir="ltr">
            <span>₪{nexusCostNum.toFixed(0)}</span>
            <span>₪{faceValueNum.toFixed(0)}</span>
          </div>
          {/* Display row: members pay + profit */}
          <div className="mt-2 flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'חברים משלמים:' : 'Members pay:'}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₪{(memberPrice ?? nexusCostNum).toFixed(0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'הרווח שלך:' : 'Your profit:'}
              </span>
              <span className={`font-semibold ${profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                ₪{profit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

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
