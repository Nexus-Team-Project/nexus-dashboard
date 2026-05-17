/**
 * EditOfferDrawerVoucherPricing - voucher pricing sub-section for the EditOfferDrawer.
 * Renders face value, nexus cost (when the creator/admin has access), member price slider,
 * stock limit, and expiry date inputs for voucher offers.
 *
 * Extracted from EditOfferDrawer to keep that file under the 350-line limit.
 * All state is controlled from the parent drawer.
 */
import { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import FieldTooltip from './FieldTooltip';

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * Props for the DrawerVoucherPricing component.
 * All values are controlled - they read from and write to parent state.
 */
interface DrawerVoucherPricingProps {
  /** Voucher face value as string (form input). */
  faceValue: string;
  /** Setter for faceValue. */
  setFaceValue: (v: string) => void;
  /** Nexus cost (wholesale price) as string (form input). */
  nexusCost: string;
  /** Setter for nexusCost. */
  setNexusCost: (v: string) => void;
  /**
   * Whether to show the nexus cost field.
   * True only when the backend returned nexus_cost (creating tenant or platform admin).
   */
  showNexusCost: boolean;
  /** Member price set via slider; null until interacted with. */
  memberPrice: number | null;
  /** Setter for memberPrice. */
  setMemberPrice: (v: number | null) => void;
  /** Stock limit as string; empty string = unlimited. */
  stockLimit: string;
  /** Setter for stockLimit. */
  setStockLimit: (v: string) => void;
  /** Expiry date string (YYYY-MM-DD or empty). */
  validUntil: string;
  /** Setter for validUntil. */
  setValidUntil: (v: string) => void;
  /** Shared input CSS class from the parent drawer. */
  inputCls: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Voucher pricing fields for EditOfferDrawer: face value, optional nexus cost,
 * member price slider, stock limit, and expiry date.
 *
 * Input: controlled props for all voucher pricing fields, setters, and shared style.
 * Output: renders the pricing inputs inside the existing drawer pricing section.
 */
export default function DrawerVoucherPricing({
  faceValue,
  setFaceValue,
  nexusCost,
  setNexusCost,
  showNexusCost,
  memberPrice,
  setMemberPrice,
  stockLimit,
  setStockLimit,
  validUntil,
  setValidUntil,
  inputCls,
}: DrawerVoucherPricingProps) {
  const { language, t } = useLanguage();

  /** Parsed numeric values for slider computation. */
  const faceValueNum = parseFloat(faceValue);
  const nexusCostNum = parseFloat(nexusCost);

  /**
   * Whether both bounds are valid for the slider.
   * When nexusCost is not shown (adopting tenant), we cannot render the slider.
   */
  const sliderReady =
    showNexusCost &&
    !isNaN(faceValueNum) && faceValueNum > 0 &&
    !isNaN(nexusCostNum) && nexusCostNum > 0 &&
    nexusCostNum < faceValueNum;

  /**
   * Sync memberPrice into range when face value or nexus cost changes.
   * Resets to nexusCostNum when memberPrice falls outside the new range.
   */
  useEffect(() => {
    if (!sliderReady) return;
    if (memberPrice === null || memberPrice < nexusCostNum || memberPrice > faceValueNum) {
      setMemberPrice(nexusCostNum);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceValue, nexusCost]);

  const profit = sliderReady && memberPrice !== null ? memberPrice - nexusCostNum : 0;

  return (
    <div className="space-y-4">
      {/* Face Value */}
      <div className="space-y-1">
        <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('fi_faceValue_label')}
          <FieldTooltip fieldKey="faceValue" />
        </label>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none" aria-hidden="true">₪</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={faceValue}
            onChange={(e) => setFaceValue(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className={inputCls + ' pr-8'}
            placeholder="0.00"
            dir="ltr"
          />
        </div>
      </div>

      {/* Nexus Cost - only shown when the creating tenant or platform admin */}
      {showNexusCost && (
        <div className="space-y-1">
          <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('fi_nexusCost_label')}
            <FieldTooltip fieldKey="nexusCost" />
          </label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none" aria-hidden="true">₪</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={nexusCost}
              onChange={(e) => setNexusCost(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className={inputCls + ' pr-8'}
              placeholder="0.00"
              dir="ltr"
            />
          </div>
          {!isNaN(nexusCostNum) && !isNaN(faceValueNum) && nexusCostNum >= faceValueNum && faceValue !== '' && nexusCost !== '' && (
            <p className="text-xs text-red-500">
              {language === 'he' ? 'מחיר NEXUS חייב להיות נמוך מהשווי' : 'Nexus price must be less than face value'}
            </p>
          )}
        </div>
      )}

      {/* Member Price Slider - only when both bounds are valid and nexusCost is accessible */}
      {sliderReady && (
        <div className="space-y-1">
          <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('fi_memberPrice_label')}
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
            className="w-full accent-primary cursor-pointer"
            dir="ltr"
            aria-label={language === 'he' ? 'מחיר לחבר' : 'Member price'}
          />
          <div className="flex justify-between text-xs text-slate-400" dir="ltr">
            <span>₪{nexusCostNum.toFixed(0)}</span>
            <span>₪{faceValueNum.toFixed(0)}</span>
          </div>
          {/* Members pay + profit display */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'חברים משלמים:' : 'Members pay:'}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₪{(memberPrice ?? nexusCostNum).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
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

      {/* Stock Limit + Expiry Date in a grid - same layout as non-voucher offers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
            מלאי <FieldTooltip fieldKey="stockLimit" />
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={stockLimit}
            onChange={(e) => setStockLimit(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className={inputCls}
            placeholder="∞"
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
            תוקף <FieldTooltip fieldKey="validUntil" />
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className={inputCls}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}
