/**
 * CreateOfferVoucherPricing - voucher-specific pricing section for the
 * CreateOffer / EditOffer forms.
 *
 * Renders two pricing inputs:
 *   1. Face Value          - nominal value of the voucher
 *   2. Nexus Price         - wholesale cost NEXUS pays the supplier
 *
 * Vouchers no longer carry a supplier-facing stock-limit input (removed
 * 2026-06; the backend stockLimit field is retained, defaulting to unlimited).
 *
 * The per-tenant member price is no longer chosen on this form. Each
 * adopting tenant sets it from the BenefitsPartnerships table view via
 * VoucherPricePopover. Backend seeds member_price = nexus_cost on create.
 *
 * Pricing lock: face_value + nexus_cost are the prices Nexus and the supplier
 * agreed on. Once the offer exists, only a platform admin may change them. The
 * parent passes pricingLocked=true on the Edit page for non-platform-admin
 * callers; this component then disables both inputs and shows a help message
 * pointing the user to Nexus support. Stock limit stays editable.
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
  /** Optional voucher SKU / internal company code (form input). */
  sku: string;
  /** Setter for sku. */
  setSku: (v: string) => void;
  /** Whether the parent form is submitting - disables all inputs. */
  isSubmitting: boolean;
  /**
   * When true, face_value + nexus_cost are read-only. Used on the Edit page
   * for non-platform-admin callers because those prices were agreed with
   * Nexus and can only be changed by Nexus support. Stock limit stays
   * editable regardless. Defaults to false.
   */
  pricingLocked?: boolean;
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
  sku,
  setSku,
  isSubmitting,
  pricingLocked = false,
}: VoucherPricingSectionProps) => {
  const { t, language } = useLanguage();

  /** Parsed numeric values - NaN when the string is empty or invalid. */
  const faceValueNum = parseFloat(faceValue);
  const nexusCostNum = parseFloat(nexusCost);

  /** Inputs are read-only when locked OR when the parent form is submitting. */
  const pricingDisabled = isSubmitting || pricingLocked;

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
            disabled={pricingDisabled}
            readOnly={pricingLocked}
            aria-readonly={pricingLocked || undefined}
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
            disabled={pricingDisabled}
            readOnly={pricingLocked}
            aria-readonly={pricingLocked || undefined}
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

      {/* Locked-pricing notice. Shown only on Edit for non-platform-admin
          callers. Keeps the message close to the inputs so the user sees
          why the fields are read-only and where to go to change them. */}
      {pricingLocked && (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
          role="note"
        >
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span>
            {language === 'he'
              ? 'מחירים אלו הוסכמו עם נקסוס וניתן לשנותם רק על ידי נקסוס. לבקשת שינוי פנו לתמיכת נקסוס.'
              : 'These prices were agreed with Nexus and can only be changed by Nexus. Contact Nexus support to request a change.'}
          </span>
        </div>
      )}

      {/* SKU - optional internal company code (voucher-only). Always editable. */}
      <div>
        <label
          htmlFor="offer-sku"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {t('co_fieldSku')}
          <span className="font-normal text-slate-400">{t('co_optional')}</span>
          <FieldTooltip fieldKey="sku" />
        </label>
        <input
          id="offer-sku"
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder={t('co_skuPlaceholder')}
          maxLength={20}
          disabled={isSubmitting}
          dir="ltr"
          className={inputCls}
        />
      </div>
    </>
  );
};

export default VoucherPricingSection;
