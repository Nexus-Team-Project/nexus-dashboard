import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TransactionStatus, TransactionType, PaymentMethod, TransactionChannel } from '../lib/api';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

// ─── Constants ───────────────────────────────────────────────────

const STATUS_STYLES: Record<TransactionStatus, string> = {
  successful: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  refunded: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  chargeback: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  authorized: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  voided: 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
};

const STATUS_LABEL_KEYS: Record<TransactionStatus, TranslationKey> = {
  pending: 'tx_status_pending',
  successful: 'tx_status_successful',
  declined: 'tx_status_declined',
  refunded: 'tx_status_refunded',
  chargeback: 'tx_status_chargeback',
  authorized: 'tx_status_authorized',
  voided: 'tx_status_voided',
};

// Methods with translatable labels (others are brand names — fixed strings)
const PAYMENT_METHOD_LABEL_KEYS: Partial<Record<PaymentMethod, TranslationKey>> = {
  credit_card: 'tx_pm_credit_card',
  il_direct_debit: 'tx_pm_il_direct_debit',
  bank_transfer: 'tx_pm_bank_transfer',
  cash: 'tx_pm_cash',
  check: 'tx_pm_check',
  multi: 'tx_pm_multi',
};

const PAYMENT_METHOD_BRAND_LABELS: Partial<Record<PaymentMethod, string>> = {
  bit: 'Bit',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  paypal: 'PayPal',
  alipay_qr: 'AliPay QR-Code',
  funds_transfer: 'Funds Transfer',
  pos: 'POS',
  echeck: 'eCheck',
};

// ─── Payment method icons (real logos from nexus-website + Material Symbols for generic) ───
type IconCfg =
  | { type: 'img'; src: string }
  | { type: 'material'; icon: string; color: string };

const PAYMENT_METHOD_ICON_MAP: Record<PaymentMethod, IconCfg> = {
  bit: { type: 'img', src: '/payment-icons/bit-logo.png' },
  apple_pay: { type: 'img', src: '/payment-icons/apple-pay.png' },
  google_pay: { type: 'img', src: '/payment-icons/google-pay.png' },
  paypal: { type: 'material', icon: 'account_balance_wallet', color: 'text-[#003087]' },
  alipay_qr: { type: 'material', icon: 'qr_code_2', color: 'text-[#1677FF]' },
  credit_card: { type: 'img', src: '' }, // resolved per-row as Visa or Mastercard
  il_direct_debit: { type: 'material', icon: 'event_repeat', color: 'text-purple-500' },
  bank_transfer: { type: 'material', icon: 'account_balance', color: 'text-emerald-600' },
  funds_transfer: { type: 'material', icon: 'swap_horiz', color: 'text-sky-500' },
  cash: { type: 'material', icon: 'payments', color: 'text-green-600' },
  check: { type: 'material', icon: 'receipt_long', color: 'text-amber-600' },
  pos: { type: 'material', icon: 'point_of_sale', color: 'text-orange-500' },
  echeck: { type: 'material', icon: 'receipt', color: 'text-teal-500' },
  multi: { type: 'material', icon: 'layers', color: 'text-indigo-500' },
};

// Deterministic pick: Visa for even IDs, Mastercard for odd
const CREDIT_CARD_ICONS = [
  { src: '/payment-icons/visa-logo.svg', label: 'Visa' },
  { src: '/payment-icons/mastercard-logo.png', label: 'Mastercard' },
];

// Methods whose icons should get rounded corners
const ROUNDED_ICON_METHODS = new Set<PaymentMethod>(['bit', 'apple_pay']);

const PaymentMethodIcon = ({ method, txId }: { method: PaymentMethod; txId?: string }) => {
  // Credit card → pick Visa or Mastercard based on txId
  if (method === 'credit_card') {
    const num = parseInt((txId || '0').replace(/\D/g, '') || '0', 10);
    const card = CREDIT_CARD_ICONS[num % 2];
    const isVisa = num % 2 === 0;
    return (
      <span className="inline-flex items-center justify-center rounded border border-slate-900/60 bg-white shrink-0" style={{ padding: isVisa ? '1px 2px' : '2px' }}>
        <img src={card.src} alt={card.label} className={`w-auto object-contain ${isVisa ? 'h-[14px]' : 'h-4'}`} />
      </span>
    );
  }
  const cfg = PAYMENT_METHOD_ICON_MAP[method];
  if (!cfg) return <span className="material-symbols-rounded !text-[18px] text-slate-400 shrink-0">help_outline</span>;
  if (cfg.type === 'img') {
    const rounded = ROUNDED_ICON_METHODS.has(method);
    if (rounded) {
      return (
        <span className="inline-flex shrink-0 rounded-[5px] overflow-hidden" style={{ height: 20 }}>
          <img src={cfg.src} alt={method} className="h-full w-auto object-cover" />
        </span>
      );
    }
    return <img src={cfg.src} alt={method} className="h-5 w-auto shrink-0 object-contain" />;
  }
  return <span className={`material-symbols-rounded !text-[18px] ${cfg.color} shrink-0`}>{cfg.icon}</span>;
};

const TYPE_LABEL_KEYS: Record<TransactionType, TranslationKey> = {
  payment: 'tx_type_payment',
  payout: 'tx_type_payout',
  topup: 'tx_type_topup',
  refund: 'tx_type_refund',
  third_party: 'tx_type_third_party',
};

const CHANNEL_LABEL_KEYS: Record<TransactionChannel, TranslationKey> = {
  club: 'tx_channel_club',
  direct: 'tx_channel_direct',
};

// Helper: resolve a payment method to its display label given a `t` function
function getPaymentMethodLabel(method: PaymentMethod, t: (key: TranslationKey) => string): string {
  const key = PAYMENT_METHOD_LABEL_KEYS[method];
  if (key) return t(key);
  return PAYMENT_METHOD_BRAND_LABELS[method] ?? method;
}

// Mock data Hebrew → translation key map. The mock customer/product/campaign
// fields are stored in Hebrew; this map lets the renderer resolve them via t().
// Strings not present in the map (e.g. already-English values like "yoav nex"
// or "TestProduct2") pass through unchanged.
const MOCK_FIELD_KEY_MAP: Record<string, TranslationKey> = {
  // Customers
  'אהרון צבאח': 'tx_cust_aharon',
  'יונן זריאן': 'tx_cust_yonen',
  'דנה לוי': 'tx_cust_dana',
  'משה כהן': 'tx_cust_moshe',
  'שרה דוד': 'tx_cust_sara',
  'אבי מזרחי': 'tx_cust_avi',
  'נועה פרץ': 'tx_cust_noa',
  'רחל אברהם': 'tx_cust_rachel',
  'יוסי שמעון': 'tx_cust_yossi',
  'עמית גולן': 'tx_cust_amit',
  'מיכל רוזן': 'tx_cust_michal',
  'דני ישראלי': 'tx_cust_dani',
  'טל ברקוביץ': 'tx_cust_tal',
  'ליאור חדד': 'tx_cust_lior',
  'שירות משלוחים מהיר': 'tx_cust_courier',
  'סליקת אשראי בע"מ': 'tx_cust_acquirer',
  // Products
  'התו המלא x 2': 'tx_prod_fullPass2',
  'שובר ורדימן נעמן': 'tx_prod_voucherVardiman',
  'מנוי חודשי Premium': 'tx_prod_premiumMonthly',
  'שובר מתנה 500': 'tx_prod_giftVoucher500',
  'התו המלא': 'tx_prod_fullPass',
  'חבילת עסקית': 'tx_prod_businessPackage',
  'מנוי שנתי': 'tx_prod_yearlySubscription',
  'חבילת בסיסית': 'tx_prod_basicPackage',
  'העברת כספים': 'tx_prod_fundsTransfer',
  'טעינת חשבון': 'tx_prod_accountTopup',
  'שובר מתנה 200': 'tx_prod_giftVoucher200',
  'עמלת שילוח': 'tx_prod_shippingFee',
  'עמלת סליקה': 'tx_prod_acquiringFee',
  // Campaigns
  'חג הפסח 2025': 'tx_camp_passover2025',
  'מבצע אביב': 'tx_camp_springSale',
};

function translateMockField(value: string | undefined, t: (key: TranslationKey) => string): string {
  if (!value) return '';
  const key = MOCK_FIELD_KEY_MAP[value];
  return key ? t(key) : value;
}

const CHANNEL_STYLES: Record<TransactionChannel, string> = {
  club: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  direct: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

// ─── Currency config ────────────────────────────────────────────
const CURRENCY_CONFIG: Record<string, { countryCode: string; code: string; hebrewName: string; symbol: string }> = {
  ILS: { countryCode: 'il', code: 'ILS', hebrewName: 'שקל ישראלי חדש', symbol: '₪' },
  USD: { countryCode: 'us', code: 'USD', hebrewName: 'דולר אמריקאי', symbol: '$' },
  EUR: { countryCode: 'eu', code: 'EUR', hebrewName: 'אירו', symbol: '€' },
  GBP: { countryCode: 'gb', code: 'GBP', hebrewName: 'לירה שטרלינג', symbol: '£' },
  JPY: { countryCode: 'jp', code: 'JPY', hebrewName: 'ין יפני', symbol: '¥' },
  CHF: { countryCode: 'ch', code: 'CHF', hebrewName: 'פרנק שוויצרי', symbol: 'CHF' },
  CAD: { countryCode: 'ca', code: 'CAD', hebrewName: 'דולר קנדי', symbol: 'C$' },
  AUD: { countryCode: 'au', code: 'AUD', hebrewName: 'דולר אוסטרלי', symbol: 'A$' },
  BRL: { countryCode: 'br', code: 'BRL', hebrewName: 'ריאל ברזילאי', symbol: 'R$' },
  CNY: { countryCode: 'cn', code: 'CNY', hebrewName: 'יואן סיני', symbol: '¥' },
  SEK: { countryCode: 'se', code: 'SEK', hebrewName: 'כתר שוודי', symbol: 'kr' },
  TRY: { countryCode: 'tr', code: 'TRY', hebrewName: 'לירה טורקית', symbol: '₺' },
  INR: { countryCode: 'in', code: 'INR', hebrewName: 'רופי הודי', symbol: '₹' },
  MXN: { countryCode: 'mx', code: 'MXN', hebrewName: 'פסו מקסיקני', symbol: 'MX$' },
  PLN: { countryCode: 'pl', code: 'PLN', hebrewName: 'זלוטי פולני', symbol: 'zł' },
  RUB: { countryCode: 'ru', code: 'RUB', hebrewName: 'רובל רוסי', symbol: '₽' },
  THB: { countryCode: 'th', code: 'THB', hebrewName: 'באט תאילנדי', symbol: '฿' },
  AED: { countryCode: 'ae', code: 'AED', hebrewName: 'דירהם אמירויות', symbol: 'د.إ' },
  SGD: { countryCode: 'sg', code: 'SGD', hebrewName: 'דולר סינגפורי', symbol: 'S$' },
  NZD: { countryCode: 'nz', code: 'NZD', hebrewName: 'דולר ניו זילנדי', symbol: 'NZ$' },
};

type TransactionTab = 'payments' | 'payouts' | 'topups' | 'third_party' | 'all';

interface LocalTransaction {
  id: string;
  date: string;
  customer: string;
  product: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  transactionDate: string;
  amount: number;
  currency: string;
  transactionId: string;
  paymentId: string;
  paymentMethodId: string;
  type: TransactionType;

  // Channel & financial fields
  channel: TransactionChannel;

  // Club-only (optional)
  marketPrice?: number;
  merchantDiscount?: number;
  basePrice?: number;
  nexusMargin?: number;
  tenantAdjustment?: number;

  // Direct-only (optional)
  processingFee?: number;

  // Common (always present)
  platformFee: number;
  merchantNet: number;

  // Campaign (optional)
  campaign?: string;
}

// ─── Currency cell with portal tooltip ──────────────────────────
const CurrencyCell = ({ currencyCode }: { currencyCode: string }) => {
  const cfg = CURRENCY_CONFIG[currencyCode];
  const ref = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  if (!cfg) return <>{currencyCode}</>;

  const showTip = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setTip({ x: r.left + r.width / 2, y: r.top });
    }
  };

  return (
    <>
      <span
        ref={ref}
        className="flex items-center gap-1.5 cursor-default"
        onMouseEnter={showTip}
        onMouseLeave={() => setTip(null)}
      >
        <img
          src={`https://flagcdn.com/w40/${cfg.countryCode}.png`}
          srcSet={`https://flagcdn.com/w80/${cfg.countryCode}.png 2x`}
          alt={cfg.code}
          className="w-5 h-[14px] object-cover rounded-[2px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)] shrink-0"
        />
        <span className="font-medium text-xs tracking-wide" dir="ltr">{cfg.code}</span>
      </span>
      {tip && createPortal(
        <div
          style={{ position: 'fixed', left: tip.x, top: tip.y - 8, transform: 'translate(-50%, -100%)', zIndex: 99999 }}
          className="px-2.5 py-1 rounded-md bg-slate-800 text-white text-[11px] whitespace-nowrap shadow-lg pointer-events-none"
        >
          {cfg.hebrewName}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>,
        document.body
      )}
    </>
  );
};

// ─── Mock Data ──────────────────────────────────────────────────

const MOCK_TRANSACTIONS: LocalTransaction[] = [
  // ── Club transactions ──
  { id: '1', date: '19 Mar, 12:43', customer: 'אהרון צבאח', product: 'התו המלא x 2', paymentMethod: 'credit_card', status: 'successful', transactionDate: '19 Mar, 12:43', amount: 960.16, currency: 'ILS', transactionId: 'TXN-2025-00201', paymentId: 'PAY-84f2a1c3', paymentMethodId: '4821', type: 'payment', channel: 'club', marketPrice: 1200.00, merchantDiscount: 300.00, basePrice: 900.00, nexusMargin: 45.00, tenantAdjustment: 60.16, platformFee: 45.00, merchantNet: 855.00, campaign: 'חג הפסח 2025' },
  { id: '3', date: '13 Mar, 00:12', customer: 'יונן זריאן', product: 'שובר ורדימן נעמן', paymentMethod: 'credit_card', status: 'successful', transactionDate: '13 Mar, 00:12', amount: 200.00, currency: 'ILS', transactionId: 'TXN-2025-00199', paymentId: 'PAY-a2c5e7f9', paymentMethodId: '2187', type: 'payment', channel: 'club', marketPrice: 280.00, merchantDiscount: 100.00, basePrice: 180.00, nexusMargin: 9.00, tenantAdjustment: 20.00, platformFee: 9.00, merchantNet: 171.00, campaign: 'מבצע אביב' },
  { id: '4', date: '13 Mar, 00:11', customer: 'יונן זריאן', product: 'שובר ורדימן נעמן', paymentMethod: 'credit_card', status: 'declined', transactionDate: '13 Mar, 00:11', amount: 200.00, currency: 'ILS', transactionId: 'TXN-2025-00198', paymentId: 'PAY-b3d6f8a0', paymentMethodId: '2187', type: 'payment', channel: 'club', marketPrice: 280.00, merchantDiscount: 100.00, basePrice: 180.00, nexusMargin: 9.00, tenantAdjustment: 20.00, platformFee: 9.00, merchantNet: 171.00 },
  { id: '5', date: '13 Mar, 00:09', customer: 'יונן זריאן', product: 'שובר ורדימן נעמן', paymentMethod: 'bit', status: 'declined', transactionDate: '13 Mar, 00:09', amount: 200.00, currency: 'ILS', transactionId: 'TXN-2025-00197', paymentId: 'PAY-c4e7a9b1', paymentMethodId: '8864', type: 'payment', channel: 'club', marketPrice: 280.00, merchantDiscount: 100.00, basePrice: 180.00, nexusMargin: 9.00, tenantAdjustment: 20.00, platformFee: 9.00, merchantNet: 171.00 },
  { id: '6', date: '13 Mar, 00:09', customer: 'יונן זריאן', product: 'שובר ורדימן נעמן', paymentMethod: 'credit_card', status: 'declined', transactionDate: '13 Mar, 00:09', amount: 200.00, currency: 'ILS', transactionId: 'TXN-2025-00196', paymentId: 'PAY-d5f8b0c2', paymentMethodId: '2187', type: 'payment', channel: 'club', marketPrice: 280.00, merchantDiscount: 100.00, basePrice: 180.00, nexusMargin: 9.00, tenantAdjustment: 20.00, platformFee: 9.00, merchantNet: 171.00 },
  { id: '7', date: '12 Mar, 23:50', customer: 'דנה לוי', product: 'מנוי חודשי Premium', paymentMethod: 'apple_pay', status: 'successful', transactionDate: '12 Mar, 23:50', amount: 149.90, currency: 'ILS', transactionId: 'TXN-2025-00195', paymentId: 'PAY-e6a9c1d3', paymentMethodId: '2785', type: 'payment', channel: 'club', marketPrice: 250.00, merchantDiscount: 80.00, basePrice: 170.00, nexusMargin: 8.50, tenantAdjustment: -20.10, platformFee: 8.50, merchantNet: 161.50, campaign: 'Premium Week' },
  { id: '8', date: '12 Mar, 18:22', customer: 'משה כהן', product: 'שובר מתנה 500', paymentMethod: 'google_pay', status: 'successful', transactionDate: '12 Mar, 18:22', amount: 500.00, currency: 'EUR', transactionId: 'TXN-2025-00194', paymentId: 'PAY-f7b0d2e4', paymentMethodId: '4096', type: 'payment', channel: 'club', marketPrice: 680.00, merchantDiscount: 220.00, basePrice: 460.00, nexusMargin: 23.00, tenantAdjustment: 40.00, platformFee: 23.00, merchantNet: 437.00, campaign: 'חג הפסח 2025' },
  { id: '11', date: '10 Mar, 16:45', customer: 'שרה דוד', product: 'התו המלא', paymentMethod: 'credit_card', status: 'refunded', transactionDate: '10 Mar, 16:45', amount: 480.08, currency: 'ILS', transactionId: 'TXN-2025-00191', paymentId: 'PAY-2ae3a5b7', paymentMethodId: '4821', type: 'refund', channel: 'club', marketPrice: 600.00, merchantDiscount: 150.00, basePrice: 450.00, nexusMargin: 22.50, tenantAdjustment: 30.08, platformFee: 22.50, merchantNet: 427.50, campaign: 'מבצע אביב' },
  { id: '12', date: '10 Mar, 09:12', customer: 'אבי מזרחי', product: 'שובר ורדימן נעמן', paymentMethod: 'bit', status: 'successful', transactionDate: '10 Mar, 09:12', amount: 200.00, currency: 'ILS', transactionId: 'TXN-2025-00190', paymentId: 'PAY-3bf4b6c8', paymentMethodId: '1429', type: 'payment', channel: 'club', marketPrice: 280.00, merchantDiscount: 100.00, basePrice: 180.00, nexusMargin: 9.00, tenantAdjustment: 20.00, platformFee: 9.00, merchantNet: 171.00 },
  { id: '13', date: '09 Mar, 20:33', customer: 'נועה פרץ', product: 'TestProduct2', paymentMethod: 'credit_card', status: 'chargeback', transactionDate: '09 Mar, 20:33', amount: 75.00, currency: 'ILS', transactionId: 'TXN-2025-00189', paymentId: 'PAY-4ca5c7d9', paymentMethodId: '9354', type: 'payment', channel: 'club', marketPrice: 120.00, merchantDiscount: 40.00, basePrice: 80.00, nexusMargin: 4.00, tenantAdjustment: -5.00, platformFee: 4.00, merchantNet: 76.00, campaign: 'Flash Sale' },
  // ── Direct transactions ──
  { id: '2', date: '15 Mar, 22:38', customer: 'yoav nex', product: 'TestProduct2', paymentMethod: 'credit_card', status: 'successful', transactionDate: '15 Mar, 22:39', amount: 0.10, currency: 'USD', transactionId: 'TXN-2025-00200', paymentId: 'PAY-91b3d4e5', paymentMethodId: '9354', type: 'payment', channel: 'direct', processingFee: 0.00, platformFee: 0.00, merchantNet: 0.10 },
  { id: '9', date: '11 Mar, 14:05', customer: 'רחל אברהם', product: 'חבילת עסקית', paymentMethod: 'bank_transfer', status: 'pending', transactionDate: '11 Mar, 14:05', amount: 1250.00, currency: 'ILS', transactionId: 'TXN-2025-00193', paymentId: 'PAY-08c1e3f5', paymentMethodId: '6507', type: 'payment', channel: 'direct', processingFee: 31.25, platformFee: 31.25, merchantNet: 1218.75 },
  { id: '10', date: '11 Mar, 10:30', customer: 'יוסי שמעון', product: 'מנוי שנתי', paymentMethod: 'paypal', status: 'successful', transactionDate: '11 Mar, 10:30', amount: 1440.00, currency: 'GBP', transactionId: 'TXN-2025-00192', paymentId: 'PAY-19d2f4a6', paymentMethodId: '9018', type: 'payment', channel: 'direct', processingFee: 36.00, platformFee: 36.00, merchantNet: 1404.00 },
  { id: '14', date: '08 Mar, 11:15', customer: 'עמית גולן', product: 'חבילת בסיסית', paymentMethod: 'il_direct_debit', status: 'authorized', transactionDate: '08 Mar, 11:15', amount: 89.90, currency: 'CHF', transactionId: 'TXN-2025-00188', paymentId: 'PAY-5db6d8e0', paymentMethodId: '7330', type: 'payment', channel: 'direct', processingFee: 2.25, platformFee: 2.25, merchantNet: 87.65 },
  { id: '15', date: '07 Mar, 15:28', customer: 'מיכל רוזן', product: 'מנוי חודשי Premium', paymentMethod: 'credit_card', status: 'voided', transactionDate: '07 Mar, 15:28', amount: 149.90, currency: 'ILS', transactionId: 'TXN-2025-00187', paymentId: 'PAY-6ec7e9f1', paymentMethodId: '0441', type: 'payment', channel: 'direct', processingFee: 3.75, platformFee: 3.75, merchantNet: 146.15 },
  { id: '16', date: '06 Mar, 08:00', customer: 'דני ישראלי', product: 'העברת כספים', paymentMethod: 'bank_transfer', status: 'successful', transactionDate: '06 Mar, 08:00', amount: 3500.00, currency: 'USD', transactionId: 'TXN-2025-00186', paymentId: 'PAY-7fd8f0a2', paymentMethodId: '6507', type: 'payout', channel: 'direct', processingFee: 87.50, platformFee: 87.50, merchantNet: 3412.50 },
  { id: '17', date: '05 Mar, 12:10', customer: 'טל ברקוביץ', product: 'טעינת חשבון', paymentMethod: 'credit_card', status: 'successful', transactionDate: '05 Mar, 12:10', amount: 500.00, currency: 'ILS', transactionId: 'TXN-2025-00185', paymentId: 'PAY-80e9a1b3', paymentMethodId: '4821', type: 'topup', channel: 'direct', processingFee: 12.50, platformFee: 12.50, merchantNet: 487.50 },
  { id: '18', date: '04 Mar, 17:55', customer: 'ליאור חדד', product: 'שובר מתנה 200', paymentMethod: 'cash', status: 'successful', transactionDate: '04 Mar, 17:55', amount: 200.00, currency: 'ILS', transactionId: 'TXN-2025-00184', paymentId: 'PAY-91f0b2c4', paymentMethodId: '5552', type: 'payment', channel: 'direct', processingFee: 5.00, platformFee: 5.00, merchantNet: 195.00 },
  { id: '19', date: '03 Mar, 10:20', customer: 'שירות משלוחים מהיר', product: 'עמלת שילוח', paymentMethod: 'bank_transfer', status: 'successful', transactionDate: '03 Mar, 10:20', amount: 85.00, currency: 'EUR', transactionId: 'TXN-2025-00183', paymentId: 'PAY-a2a1c3d5', paymentMethodId: '3663', type: 'third_party', channel: 'direct', processingFee: 2.13, platformFee: 2.13, merchantNet: 82.87 },
  { id: '20', date: '02 Mar, 14:45', customer: 'סליקת אשראי בע"מ', product: 'עמלת סליקה', paymentMethod: 'funds_transfer', status: 'successful', transactionDate: '02 Mar, 14:45', amount: 320.50, currency: 'JPY', transactionId: 'TXN-2025-00182', paymentId: 'PAY-b3b2d4e6', paymentMethodId: '8774', type: 'third_party', channel: 'direct', processingFee: 8.01, platformFee: 8.01, merchantNet: 312.49 },
];

// ─── Component ──────────────────────────────────────────────────

const Transactions = () => {
  const { t } = useLanguage();
  // Data state
  const [transactions] = useState<LocalTransaction[]>(MOCK_TRANSACTIONS);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [apiError] = useState('');

  // Tab
  const [activeTab, setActiveTab] = useState<TransactionTab>('payments');

  // UI panel states
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isCustomizeLoading, setIsCustomizeLoading] = useState(false);

  // Table search
  const [isTableSearchExpanded, setIsTableSearchExpanded] = useState(false);
  const tableSearchInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filters, setFilters] = useState({
    searchText: '',
    status: 'all' as 'all' | TransactionStatus,
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all' as 'all' | PaymentMethod,
    amountMin: '',
    amountMax: '',
    channel: 'all' as 'all' | TransactionChannel,
  });

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    customer: true,
    product: true,
    paymentMethod: true,
    status: true,
    transactionDate: true,
    amount: true,
    currency: true,
    transactionId: false,
    paymentId: true,
    paymentMethodId: true,
    type: false,
    channel: true,
    merchantNet: true,
    platformFee: false,
    marketPrice: false,
    campaign: true,
  });
  const [frozenColumns, setFrozenColumns] = useState<string[]>(['checkbox']);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowActionMenuId, setRowActionMenuId] = useState<string | null>(null);

  // Sticky header
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [headerWidth, setHeaderWidth] = useState(0);
  const [headerLeft, setHeaderLeft] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [_horizontalScrolled, setHorizontalScrolled] = useState(false);
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerOffsetRef = useRef<number>(0);

  // Overview
  const [overviewPeriod, setOverviewPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Detail panel
  const [selectedTransaction, setSelectedTransaction] = useState<LocalTransaction | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0);

  // Border highlight — direct DOM manipulation, no re-renders

  // Simulate loading
  useEffect(() => {
    const t = setTimeout(() => setIsTableLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Sticky header scroll listener
  useEffect(() => {
    let rafId = 0;

    const updateHeaderPosition = () => {
      if (tableRef.current && tableHeaderRef.current && tableContainerRef.current) {
        const tableRect = tableRef.current.getBoundingClientRect();
        void tableContainerRef.current.scrollLeft;
        setHeaderWidth(tableRect.width);
        setHeaderLeft(tableRect.left);
        // Measure actual header height for precise spacer
        const hdrH = tableHeaderRef.current.getBoundingClientRect().height;
        if (hdrH > 0) setHeaderHeight(hdrH);
        if (headerOffsetRef.current === 0) {
          headerOffsetRef.current = tableHeaderRef.current.getBoundingClientRect().top + window.scrollY;
        }
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (tableRef.current && tableHeaderRef.current) {
          const dashboardHeaderHeight = 64;
          const scrollPosition = window.scrollY + dashboardHeaderHeight;
          const shouldBeFixed = scrollPosition >= headerOffsetRef.current;
          if (shouldBeFixed !== isHeaderFixed) {
            setIsHeaderFixed(shouldBeFixed);
          }
          if (shouldBeFixed) {
            updateHeaderPosition();
          }
        }
      });
    };

    const handleHorizontalScroll = () => {
      if (isHeaderFixed) updateHeaderPosition();
      if (tableContainerRef.current) {
        setHorizontalScrolled(tableContainerRef.current.scrollLeft > 0);
      }
    };

    updateHeaderPosition();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeaderPosition);
    const container = tableContainerRef.current;
    if (container) container.addEventListener('scroll', handleHorizontalScroll);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeaderPosition);
      if (container) container.removeEventListener('scroll', handleHorizontalScroll);
    };
  }, [isHeaderFixed, showCustomizePanel, showFilterPanel, selectedTransaction]);

  useEffect(() => {
    if (isHeaderFixed && tableRef.current) {
      setTimeout(() => {
        const tableRect = tableRef.current!.getBoundingClientRect();
        setHeaderWidth(tableRect.width);
        setHeaderLeft(tableRect.left);
      }, 350);
    }
  }, [showCustomizePanel, showFilterPanel, selectedTransaction, isHeaderFixed]);

  // ─── Filtering ──────────────────────────────────────────────────

  const filteredTransactions = transactions.filter(tx => {
    // Tab filter
    if (activeTab === 'payments' && tx.type !== 'payment' && tx.type !== 'refund') return false;
    if (activeTab === 'payouts' && tx.type !== 'payout') return false;
    if (activeTab === 'topups' && tx.type !== 'topup') return false;
    if (activeTab === 'third_party' && tx.type !== 'third_party') return false;

    // Search — match against both raw and translated customer/product so users
    // can find rows by either Hebrew or English names regardless of UI language.
    if (filters.searchText) {
      const s = filters.searchText.toLowerCase();
      const customerTr = translateMockField(tx.customer, t).toLowerCase();
      const productTr = translateMockField(tx.product, t).toLowerCase();
      if (
        !tx.customer.toLowerCase().includes(s) &&
        !customerTr.includes(s) &&
        !tx.product.toLowerCase().includes(s) &&
        !productTr.includes(s) &&
        !tx.transactionId.toLowerCase().includes(s)
      ) return false;
    }

    // Status
    if (filters.status !== 'all' && tx.status !== filters.status) return false;

    // Payment method
    if (filters.paymentMethod !== 'all' && tx.paymentMethod !== filters.paymentMethod) return false;

    // Channel
    if (filters.channel !== 'all' && tx.channel !== filters.channel) return false;

    // Amount range
    if (filters.amountMin && tx.amount < parseFloat(filters.amountMin)) return false;
    if (filters.amountMax && tx.amount > parseFloat(filters.amountMax)) return false;

    return true;
  });

  // ─── Sorting ───────────────────────────────────────────────────
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedTransactions = sortColumn
    ? [...filteredTransactions].sort((a, b) => {
        const aVal = a[sortColumn as keyof LocalTransaction];
        const bVal = b[sortColumn as keyof LocalTransaction];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal ?? '');
        const bStr = String(bVal ?? '');
        return sortDirection === 'asc' ? aStr.localeCompare(bStr, 'he') : bStr.localeCompare(aStr, 'he');
      })
    : filteredTransactions;

  const activeFilterCount = [
    filters.searchText,
    filters.status !== 'all' ? filters.status : '',
    filters.paymentMethod !== 'all' ? filters.paymentMethod : '',
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
    filters.channel !== 'all' ? filters.channel : '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ searchText: '', status: 'all', dateFrom: '', dateTo: '', paymentMethod: 'all', amountMin: '', amountMax: '', channel: 'all' });
  };

  // ─── Row click → detail panel ─────────────────────────────────

  const handleRowClick = async (tx: LocalTransaction) => {
    if (selectedTransaction?.id === tx.id) {
      setSelectedTransaction(null);
    } else {
      setIsDetailLoading(true);
      await new Promise(resolve => setTimeout(resolve, 50));
      setSidebarKey(Date.now());
      await new Promise(resolve => setTimeout(resolve, 450));
      setSelectedTransaction(tx);
      setIsDetailLoading(false);
    }
  };

  // ─── Table container border highlight (direct DOM, no re-renders) ──
  const handleTableMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  // ─── Selection ────────────────────────────────────────────────

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAllSelection = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map(tx => tx.id));
    }
  };

  // ─── Column helpers ──────────────────────────────────────────

  const toggleColumnVisibility = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const toggleColumnFreeze = (col: string) => {
    setFrozenColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const COLUMN_WIDTHS: Record<string, number> = {
    checkbox: 48,
    date: 140,
    customer: 180,
    product: 200,
    paymentMethod: 150,
    status: 130,
    transactionDate: 140,
    amount: 120,
    currency: 100,
    transactionId: 160,
    paymentId: 140,
    paymentMethodId: 170,
    type: 100,
    channel: 100,
    merchantNet: 130,
    platformFee: 120,
    marketPrice: 130,
    campaign: 160,
  };

  const [columnOrder, setColumnOrder] = useState(['checkbox', 'date', 'customer', 'product', 'campaign', 'paymentMethod', 'channel', 'status', 'transactionDate', 'amount', 'merchantNet', 'platformFee', 'marketPrice', 'currency', 'transactionId', 'paymentId', 'paymentMethodId', 'type']);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Column resize
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Column settings menu
  const [columnMenuOpen, setColumnMenuOpen] = useState<string | null>(null);

  // Helper: get effective width for a column (user-resized or default)
  const getColWidth = (col: string) => columnWidths[col] || COLUMN_WIDTHS[col] || 120;

  const getColumnLeftPosition = (columnKey: string): number => {
    const frozenBefore = columnOrder.slice(0, columnOrder.indexOf(columnKey))
      .filter(col => frozenColumns.includes(col) && (col === 'checkbox' || visibleColumns[col as keyof typeof visibleColumns]));
    return frozenBefore.reduce((left, col) => left + getColWidth(col), 0);
  };

  const isLastFrozenColumn = (columnKey: string): boolean => {
    const frozenVisible = columnOrder.filter(col => frozenColumns.includes(col) && (col === 'checkbox' || visibleColumns[col as keyof typeof visibleColumns]));
    return frozenVisible[frozenVisible.length - 1] === columnKey;
  };

  // ─── Column resize ────────────────────────────────────────────
  const handleResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(colKey);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = getColWidth(colKey);

    const onMouseMove = (ev: MouseEvent) => {
      // RTL: moving mouse LEFT = increasing width, RIGHT = decreasing
      const diff = resizeStartX.current - ev.clientX;
      const newWidth = Math.max(80, resizeStartWidth.current + diff);
      setColumnWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };

    const onMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // ─── Column drag-to-reorder ─────────────────────────────────

  const handleColumnDragStart = (e: React.DragEvent, colKey: string) => {
    setDraggedColumn(colKey);
    setColumnMenuOpen(null);
    e.dataTransfer.effectAllowed = 'move';

    // ── Build an exact 1:1 clone of the column from the real DOM ──
    const thEl = e.currentTarget as HTMLTableCellElement;
    const table = thEl.closest('table');
    if (!table) return;

    // Find column index in the header row
    const headerRow = table.querySelector('thead tr');
    if (!headerRow) return;
    const allThs = Array.from(headerRow.querySelectorAll<HTMLTableCellElement>('th'));
    const colIndex = allThs.indexOf(thEl);
    if (colIndex === -1) return;

    const colWidth = thEl.getBoundingClientRect().width;
    const allBodyRows = Array.from(table.querySelectorAll('tbody tr'));

    // Outer ghost — spacious container so rotated content isn't clipped
    const pad = 50;
    const ghost = document.createElement('div');
    ghost.style.cssText = `position:absolute;top:-2000px;left:-2000px;pointer-events:none;padding:${pad}px;`;

    // Inner wrapper — gets the tilt + fade
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `transform:rotate(-6deg);opacity:0.72;border-radius:10px;overflow:hidden;box-shadow:0 16px 32px rgba(99,91,255,0.28),0 4px 12px rgba(0,0,0,0.12);border:2px solid #635bff;`;

    // Build a real <table> clone so styling is identical
    const cloneTable = document.createElement('table');
    cloneTable.style.cssText = `width:${colWidth}px;border-collapse:collapse;direction:rtl;table-layout:fixed;`;

    // Clone the <th>
    const cloneThead = document.createElement('thead');
    const cloneHeadRow = document.createElement('tr');
    const cloneTh = thEl.cloneNode(true) as HTMLElement;
    // Inline the computed styles so they persist outside the original context
    const thComputed = window.getComputedStyle(thEl);
    cloneTh.style.cssText = `
      padding:${thComputed.padding};
      background:${thComputed.backgroundColor};
      color:${thComputed.color};
      font-size:${thComputed.fontSize};
      font-weight:${thComputed.fontWeight};
      text-transform:${thComputed.textTransform};
      letter-spacing:${thComputed.letterSpacing};
      text-align:${thComputed.textAlign};
      width:${colWidth}px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      border:none;
    `;
    // Remove the dropdown menu button from the cloned header
    const menuBtn = cloneTh.querySelector('button');
    if (menuBtn) menuBtn.remove();
    const menuDropdown = cloneTh.querySelector('.fixed');
    if (menuDropdown) menuDropdown.remove();
    const absDropdown = cloneTh.querySelector('[class*="absolute"]');
    if (absDropdown) absDropdown.remove();
    cloneHeadRow.appendChild(cloneTh);
    cloneThead.appendChild(cloneHeadRow);
    cloneTable.appendChild(cloneThead);

    // Clone body cells (all visible rows)
    const cloneTbody = document.createElement('tbody');
    const maxRows = Math.min(allBodyRows.length, 8);
    for (let i = 0; i < maxRows; i++) {
      const origRow = allBodyRows[i];
      const origTds = origRow.querySelectorAll('td');
      if (colIndex >= origTds.length) continue;
      const origTd = origTds[colIndex] as HTMLElement;
      const cloneRow = document.createElement('tr');
      const cloneTd = origTd.cloneNode(true) as HTMLElement;
      const tdComputed = window.getComputedStyle(origTd);
      cloneTd.style.cssText = `
        padding:${tdComputed.padding};
        background:${tdComputed.backgroundColor};
        color:${tdComputed.color};
        font-size:${tdComputed.fontSize};
        font-weight:${tdComputed.fontWeight};
        text-align:${tdComputed.textAlign};
        width:${colWidth}px;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        border:none;
        border-bottom:1px solid #e2e8f0;
      `;
      cloneRow.appendChild(cloneTd);
      cloneTbody.appendChild(cloneRow);
    }

    // "More" row if there are more rows
    if (allBodyRows.length > maxRows) {
      const moreRow = document.createElement('tr');
      const moreTd = document.createElement('td');
      moreTd.textContent = `+${allBodyRows.length - maxRows} ${t('tx_more')}`;
      moreTd.style.cssText = `padding:6px 12px;font-size:11px;color:#94a3b8;text-align:center;background:#f8fafc;border:none;`;
      moreRow.appendChild(moreTd);
      cloneTbody.appendChild(moreRow);
    }

    cloneTable.appendChild(cloneTbody);
    wrapper.appendChild(cloneTable);
    ghost.appendChild(wrapper);
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, colWidth / 2 + pad, 20 + pad);
    setTimeout(() => ghost.remove(), 0);
  };

  const handleColumnDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (colKey !== 'checkbox' && colKey !== draggedColumn) {
      setDragOverColumn(colKey);
    }
  };

  const handleColumnDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetKey || targetKey === 'checkbox') return;
    setColumnOrder(prev => {
      const newOrder = [...prev];
      const dragIdx = newOrder.indexOf(draggedColumn);
      const targetIdx = newOrder.indexOf(targetKey);
      const [removed] = newOrder.splice(dragIdx, 1);
      newOrder.splice(targetIdx, 0, removed);
      return newOrder;
    });
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // ─── Overview metrics ────────────────────────────────────────

  const successfulTxs = transactions.filter(tx => tx.status === 'successful');
  const grossVolume = successfulTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const successfulCount = successfulTxs.length;
  void overviewPeriod; // mock - period doesn't change data

  // ─── Format helpers ──────────────────────────────────────────

  const formatCurrency = (amount: number) => `₪${amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatCurrencyByCode = (amount: number, currencyCode: string) => {
    const cfg = CURRENCY_CONFIG[currencyCode];
    const symbol = cfg?.symbol ?? currencyCode;
    const formatted = amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${symbol}${formatted}`;
  };

  const getStatusBadge = (status: TransactionStatus) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );

  // ─── Customer avatar helper ─────────────────────────────────
  const AVATAR_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500'];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  // ─── Column config (labels + renderers) ─────────────────────

  const COLUMN_CONFIG: Record<string, { label: string; cellClass: string; render: (tx: LocalTransaction) => React.ReactNode }> = {
    date: { label: t('tx_col_date'), cellClass: 'text-sm text-slate-600 dark:text-slate-400', render: tx => tx.date },
    customer: { label: t('tx_col_customer'), cellClass: 'text-sm font-medium text-slate-900 dark:text-white', render: tx => {
      const customerName = translateMockField(tx.customer, t);
      return (
        <span className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full ${getAvatarColor(customerName)} text-white text-[10px] font-bold flex items-center justify-center shrink-0 leading-none`}>
            {getInitials(customerName)}
          </span>
          <span className="truncate">{customerName}</span>
        </span>
      );
    } },
    product: { label: t('tx_col_product'), cellClass: 'text-sm text-slate-600 dark:text-slate-400', render: tx => (
      <span className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-[5px] bg-gradient-to-b from-[#fdfeff] to-[#edf1fc] border border-slate-200 flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <span className="material-symbols-rounded !text-[14px] text-[#676879]">shopping_bag</span>
        </span>
        <span className="truncate">{translateMockField(tx.product, t)}</span>
      </span>
    ) },
    paymentMethod: { label: t('tx_col_paymentMethod'), cellClass: 'text-sm text-slate-600 dark:text-slate-400', render: tx => (
      <span className="flex items-center gap-2">
        <PaymentMethodIcon method={tx.paymentMethod} txId={tx.id} />
        <span>{getPaymentMethodLabel(tx.paymentMethod, t)}</span>
      </span>
    ) },
    status: { label: t('tx_col_status'), cellClass: '', render: tx => getStatusBadge(tx.status) },
    transactionDate: { label: t('tx_col_transactionDate'), cellClass: 'text-sm text-slate-600 dark:text-slate-400', render: tx => tx.transactionDate },
    amount: { label: t('tx_col_amount'), cellClass: 'text-sm font-medium text-slate-900 dark:text-white', render: tx => formatCurrencyByCode(tx.amount, tx.currency) },
    currency: { label: t('tx_col_currency'), cellClass: 'text-sm text-slate-600 dark:text-slate-400', render: tx => <CurrencyCell currencyCode={tx.currency} /> },
    transactionId: { label: t('tx_col_transactionId'), cellClass: 'text-sm text-slate-500 dark:text-slate-400 font-mono text-xs', render: tx => tx.transactionId },
    paymentId: { label: t('tx_col_paymentId'), cellClass: 'text-sm text-slate-500 dark:text-slate-400 font-mono text-xs', render: tx => tx.paymentId },
    paymentMethodId: { label: t('tx_col_paymentMethodId'), cellClass: 'text-sm text-slate-500 dark:text-slate-400 font-mono text-xs', render: tx => (
      <span className="flex items-center gap-1 tracking-wider" dir="ltr">
        <span className="text-slate-400 text-[11px] leading-none" style={{ letterSpacing: '1.5px' }}>••••</span>
        <span>{tx.paymentMethodId}</span>
      </span>
    ) },
    type: { label: t('tx_col_type'), cellClass: 'text-sm text-slate-600 dark:text-slate-400', render: tx => t(TYPE_LABEL_KEYS[tx.type]) },
    channel: { label: t('tx_col_channel'), cellClass: '', render: tx => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CHANNEL_STYLES[tx.channel]}`}>
        {t(CHANNEL_LABEL_KEYS[tx.channel])}
      </span>
    ) },
    merchantNet: { label: t('tx_col_merchantNet'), cellClass: 'text-sm font-semibold text-emerald-700 dark:text-emerald-400', render: tx => formatCurrencyByCode(tx.merchantNet, tx.currency) },
    platformFee: { label: t('tx_col_platformFee'), cellClass: 'text-sm text-slate-500 dark:text-slate-400', render: tx => formatCurrencyByCode(tx.platformFee, tx.currency) },
    marketPrice: { label: t('tx_col_marketPrice'), cellClass: 'text-sm text-slate-500 dark:text-slate-400', render: tx => tx.marketPrice != null
      ? <span className="line-through decoration-slate-400">{formatCurrencyByCode(tx.marketPrice, tx.currency)}</span>
      : <span className="text-slate-300 dark:text-slate-600">—</span>
    },
    campaign: { label: t('tx_col_campaign'), cellClass: 'text-sm text-slate-600 dark:text-slate-400', render: tx => tx.campaign
      ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-medium">
          <span className="material-symbols-rounded !text-[13px]">campaign</span>
          <span className="truncate max-w-[100px]">{translateMockField(tx.campaign, t)}</span>
        </span>
      )
      : <span className="text-slate-300 dark:text-slate-600">—</span>
    },
  };

  // For customize panel
  const COLUMN_LABELS: [keyof typeof visibleColumns, string][] = Object.entries(COLUMN_CONFIG).map(
    ([key, cfg]) => [key as keyof typeof visibleColumns, cfg.label]
  );

  // Visible data columns in current order (excluding checkbox)
  const visibleOrderedColumns = columnOrder.filter(
    col => col !== 'checkbox' && visibleColumns[col as keyof typeof visibleColumns]
  );

  // Total table width (checkbox + visible columns + actions spacer)
  const totalTableWidth = getColWidth('checkbox') + visibleOrderedColumns.reduce((sum, col) => sum + getColWidth(col), 0) + 48;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('tx_pageTitle')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('tx_pageSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('tx_periodOverview')}</span>
          <select
            value={overviewPeriod}
            onChange={(e) => setOverviewPeriod(e.target.value as '7d' | '30d' | '90d')}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="7d">{t('tx_last7days')}</option>
            <option value="30d">{t('tx_last30days')}</option>
            <option value="90d">{t('tx_last90days')}</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-700 px-5 pb-5">
          <div className="py-3 md:pe-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('tx_grossVolume')}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(grossVolume)}</p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <span className="material-symbols-rounded !text-[14px]">trending_up</span>
                +12%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">₪8,420.00 {t('tx_priorPeriod')}</p>
          </div>
          <div className="py-3 md:px-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('tx_merchantNetTotal')}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(successfulTxs.reduce((sum, tx) => sum + tx.merchantNet, 0))}</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('tx_fees')}: {formatCurrency(successfulTxs.reduce((sum, tx) => sum + tx.platformFee, 0))}</p>
          </div>
          <div className="py-3 md:ps-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('tx_successfulPayments')}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{successfulCount}</p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <span className="material-symbols-rounded !text-[14px]">trending_up</span>
                +8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">9 {t('tx_priorPeriod')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700">
          {([
            { key: 'payments' as const, label: t('tx_tab_payments') },
            { key: 'payouts' as const, label: t('tx_tab_payouts') },
            { key: 'topups' as const, label: t('tx_tab_topups') },
            { key: 'third_party' as const, label: t('tx_tab_thirdParty') },
            { key: 'all' as const, label: t('tx_tab_all') },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-[#635bff] text-[#635bff]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Panel */}
        {showFilterPanel && (
          <aside className="w-full lg:w-[380px] animate-in slide-in-from-right">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
              {isFilterLoading ? (
                <div className="animate-pulse">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                      <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    </div>
                    <div>
                      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex items-center gap-3 p-2">
                            <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                      <div className="space-y-3">
                        <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                        <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold">{t('tx_filterTitle')}</h2>
                      <button onClick={() => setShowFilterPanel(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-rounded">close</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('tx_filterDesc')}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Active filters */}
                    {activeFilterCount > 0 && (
                      <div className="flex items-center justify-between p-3 bg-[#635bff]/10 rounded-lg">
                        <span className="text-sm font-medium text-[#635bff]">{activeFilterCount} {t('tx_activeFilters')}</span>
                        <button onClick={clearFilters} className="text-xs text-[#635bff] hover:underline font-medium">{t('tx_clearAll')}</button>
                      </div>
                    )}

                    {/* Search */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">{t('tx_search')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={filters.searchText}
                          onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                          className="w-full ps-10 pe-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                          placeholder={t('tx_searchPlaceholder')}
                        />
                        <span className="absolute start-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-slate-400 !text-[18px]">search</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">{t('tx_col_status')}</label>
                      <div className="space-y-1">
                        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                          <input type="radio" name="statusFilter" checked={filters.status === 'all'} onChange={() => setFilters({ ...filters, status: 'all' })} className="w-4 h-4 text-[#635bff] focus:ring-[#635bff]" />
                          <span className="text-sm">{t('tx_all')}</span>
                        </label>
                        {(Object.keys(STATUS_LABEL_KEYS) as TransactionStatus[]).map(status => (
                          <label key={status} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                            <input type="radio" name="statusFilter" checked={filters.status === status} onChange={() => setFilters({ ...filters, status })} className="w-4 h-4 text-[#635bff] focus:ring-[#635bff]" />
                            <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[status].split(' ')[0].replace('bg-', 'bg-').replace('/100', '-500').replace('100', '500')}`} style={{ backgroundColor: status === 'successful' ? '#10b981' : status === 'declined' ? '#ef4444' : status === 'pending' ? '#f59e0b' : status === 'refunded' ? '#8b5cf6' : status === 'chargeback' ? '#f97316' : status === 'authorized' ? '#0ea5e9' : '#64748b' }}></span>
                            <span className="text-sm">{t(STATUS_LABEL_KEYS[status])}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Date range */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">{t('tx_dateRange')}</label>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">{t('tx_fromDate')}</label>
                          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">{t('tx_toDate')}</label>
                          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* Payment method */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">{t('tx_col_paymentMethod')}</label>
                      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                          <input type="radio" name="paymentMethodFilter" checked={filters.paymentMethod === 'all'} onChange={() => setFilters({ ...filters, paymentMethod: 'all' })} className="w-4 h-4 text-[#635bff] focus:ring-[#635bff]" />
                          <span className="text-sm">{t('tx_all')}</span>
                        </label>
                        {([
                          'bit', 'apple_pay', 'google_pay', 'paypal', 'alipay_qr',
                          'credit_card', 'il_direct_debit', 'bank_transfer', 'funds_transfer',
                          'cash', 'check', 'pos', 'echeck', 'multi'
                        ] as PaymentMethod[]).map(method => (
                          <label key={method} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                            <input type="radio" name="paymentMethodFilter" checked={filters.paymentMethod === method} onChange={() => setFilters({ ...filters, paymentMethod: method })} className="w-4 h-4 text-[#635bff] focus:ring-[#635bff]" />
                            <span className="text-sm">{getPaymentMethodLabel(method, t)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Channel */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">{t('tx_col_channel')}</label>
                      <div className="space-y-1">
                        {(['all', 'club', 'direct'] as const).map(ch => (
                          <label key={ch} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                            <input type="radio" name="channelFilter" checked={filters.channel === ch} onChange={() => setFilters({ ...filters, channel: ch })} className="w-4 h-4 text-[#635bff] focus:ring-[#635bff]" />
                            <span className="text-sm">{ch === 'all' ? t('tx_all') : t(CHANNEL_LABEL_KEYS[ch])}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Amount range */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">{t('tx_amountRange')}</label>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">{t('tx_min')}</label>
                          <input type="number" value={filters.amountMin} onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none" placeholder="₪0" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">{t('tx_max')}</label>
                          <input type="number" value={filters.amountMax} onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none" placeholder="₪∞" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{t('tx_resultsLabel')}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{filteredTransactions.length} {t('tx_resultsOf')} {transactions.length}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}

        {/* Customize Panel */}
        {showCustomizePanel && (
          <aside className="w-full lg:w-[380px] animate-in slide-in-from-right">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 sticky top-8">
              {isCustomizeLoading ? (
                <div className="animate-pulse">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="h-4 w-52 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold">{t('tx_customizeTitle')}</h2>
                      <button onClick={() => setShowCustomizePanel(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-rounded">close</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('tx_customizeDesc')}</p>
                  </div>

                  <div className="p-6 space-y-3">
                    {COLUMN_LABELS.map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex items-center gap-3 cursor-pointer group flex-1">
                          <input
                            type="checkbox"
                            checked={visibleColumns[key]}
                            onChange={() => toggleColumnVisibility(key)}
                            className="w-4 h-4 rounded border-slate-300 text-[#635bff] focus:ring-[#635bff]"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                        </label>
                        <button
                          onClick={() => toggleColumnFreeze(key)}
                          className={`p-1 rounded transition-colors ${
                            frozenColumns.includes(key)
                              ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={t('tx_freezeColumn')}
                        >
                          <span className="material-symbols-rounded !text-[16px]">push_pin</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>
        )}

        {/* Main Table */}
        <div className={`transition-[width,flex] duration-300 ${selectedTransaction || showCustomizePanel || showFilterPanel ? 'flex-1 min-w-0' : 'w-full'}`}>
          <div
            className="relative bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 border-highlight-card"
            onMouseMove={handleTableMouseMove}
          >
            {/* Toolbar */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  {!isTableSearchExpanded ? (
                    <button
                      className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md transition-colors"
                      onClick={() => { setIsTableSearchExpanded(true); setTimeout(() => tableSearchInputRef.current?.focus(), 50); }}
                      title={t('tx_searchTitle')}
                    >
                      <span className="material-symbols-rounded !text-[16px]">search</span>
                    </button>
                  ) : (
                    <div className="relative">
                      <input
                        ref={tableSearchInputRef}
                        type="text"
                        value={filters.searchText}
                        onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                        className="w-52 ps-8 pe-8 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                        placeholder={t('tx_searchTransactions')}
                        autoFocus
                      />
                      <div className="absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="material-symbols-rounded text-slate-400 !text-[16px]">search</span>
                      </div>
                      <div className="absolute end-2.5 top-1/2 -translate-y-1/2">
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (filters.searchText) {
                              setFilters({ ...filters, searchText: '' });
                              tableSearchInputRef.current?.focus();
                            } else {
                              setIsTableSearchExpanded(false);
                            }
                          }}
                          className="text-slate-400 hover:text-slate-600 flex items-center justify-center"
                          tabIndex={-1}
                        >
                          <span className="material-symbols-rounded !text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Filter */}
                <button
                  onClick={() => {
                    const isOpening = !showFilterPanel;
                    setShowFilterPanel(isOpening);
                    setShowCustomizePanel(false);
                    if (isOpening) { setIsFilterLoading(true); setTimeout(() => setIsFilterLoading(false), 600); }
                  }}
                  className={`relative w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                    activeFilterCount > 0 ? 'bg-[#635bff] text-white' : 'text-[#635bff] hover:bg-[#635bff]/10'
                  }`}
                  title={t('tx_filter')}
                >
                  <span className="material-symbols-rounded !text-[16px]">filter_list</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -end-1.5 bg-white text-[#635bff] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#635bff]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Export */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 transition-colors"
                    title={t('tx_export')}
                  >
                    <span className="material-symbols-rounded !text-[16px]">file_download</span>
                  </button>
                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                      <div className="absolute start-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
                        <button
                          onClick={() => { setShowExportMenu(false); alert(t('tx_exportAlert')); }}
                          className="w-full px-4 py-3 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                        >
                          <span className="material-symbols-rounded text-sm text-[#635bff]">file_download</span>
                          <span>{t('tx_exportToExcel')}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Customize */}
                <button
                  onClick={() => {
                    setShowCustomizePanel(true);
                    setShowFilterPanel(false);
                    setIsCustomizeLoading(true);
                    setTimeout(() => setIsCustomizeLoading(false), 600);
                  }}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 transition-colors"
                  title={t('tx_customize')}
                >
                  <span className="material-symbols-rounded !text-[16px]">tune</span>
                </button>
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{t('tx_showing')} {filteredTransactions.length} {t('tx_resultsOf')} {transactions.length} {t('tx_transactions')}</span>
                <div className="flex gap-1">
                  <button className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md transition-colors">
                    <span className="material-symbols-rounded !text-[16px]">chevron_right</span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md transition-colors">
                    <span className="material-symbols-rounded !text-[16px]">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div
              ref={tableContainerRef}
              className="overflow-x-auto relative custom-scrollbar"
            >
              <table ref={tableRef} className="text-right" style={{ width: `${totalTableWidth}px`, minWidth: '100%', borderSpacing: 0, position: 'relative', tableLayout: 'fixed' }}>
                <thead
                  ref={tableHeaderRef}
                  style={{
                    position: isHeaderFixed ? 'fixed' : 'static',
                    top: isHeaderFixed ? '64px' : 'auto',
                    left: isHeaderFixed ? `${headerLeft}px` : 'auto',
                    zIndex: isHeaderFixed ? 30 : 1,
                    backgroundColor: 'rgb(238 242 255)',
                    width: isHeaderFixed ? `${headerWidth}px` : 'auto',
                    display: isHeaderFixed ? 'table' : 'table-header-group',
                    tableLayout: isHeaderFixed ? 'fixed' : 'auto',
                    willChange: 'transform',
                    boxShadow: isHeaderFixed ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'box-shadow 0.2s ease',
                  }}
                  className="dark:bg-slate-800"
                >
                  <tr className="bg-violet-50 dark:bg-slate-800 text-primary/70 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-y-2 border-violet-200/60">
                    {/* Checkbox */}
                    <th
                      className={`px-3 py-2.5 ${frozenColumns.includes('checkbox') && isLastFrozenColumn('checkbox') ? 'frozen-column-shadow' : ''}`}
                      style={{
                        width: `${getColWidth('checkbox')}px`,
                        ...(frozenColumns.includes('checkbox') ? {
                          position: 'sticky' as const,
                          right: 0,
                          zIndex: 20,
                          backgroundColor: 'rgb(238 242 255)',
                        } : {}),
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                        onChange={toggleAllSelection}
                        className="w-4 h-4 rounded border-slate-300 text-[#635bff] focus:ring-[#635bff]"
                      />
                    </th>

                    {visibleOrderedColumns.map(col => (
                      <th
                        key={col}
                        draggable={!resizingColumn}
                        onDragStart={(e) => { if (resizingColumn) { e.preventDefault(); return; } handleColumnDragStart(e, col); }}
                        onDragOver={(e) => handleColumnDragOver(e, col)}
                        onDrop={(e) => handleColumnDrop(e, col)}
                        onDragEnd={handleColumnDragEnd}
                        onContextMenu={(e) => { e.preventDefault(); setColumnMenuOpen(columnMenuOpen === col ? null : col); }}
                        className={`px-6 py-2.5 bg-violet-50 dark:bg-slate-800/50 cursor-grab active:cursor-grabbing select-none group/col relative overflow-visible ${
                          frozenColumns.includes(col) && isLastFrozenColumn(col) ? 'frozen-column-shadow' : ''
                        } ${draggedColumn === col ? '!bg-[#635bff]/20 border-x-2 border-[#635bff]/30' : ''} ${
                          dragOverColumn === col && draggedColumn !== col ? 'border-e-[3px] border-[#635bff]' : ''
                        }`}
                        style={{
                          width: `${getColWidth(col)}px`,
                          ...(frozenColumns.includes(col) ? { position: 'sticky' as const, right: `${getColumnLeftPosition(col)}px`, zIndex: 20, backgroundColor: draggedColumn === col ? 'rgba(99,91,255,0.15)' : 'rgb(238 242 255)' } : {}),
                        }}
                      >
                        <div className="flex items-center gap-1 overflow-hidden">
                          <span className="flex-1 truncate">{COLUMN_CONFIG[col].label}</span>
                          {sortColumn === col && (
                            <span className="material-symbols-rounded !text-[14px] text-[#635bff]">
                              {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setColumnMenuOpen(columnMenuOpen === col ? null : col); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            draggable={false}
                            className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover/col:opacity-100 hover:bg-slate-200/60 transition-opacity"
                          >
                            <span className="material-symbols-rounded !text-[14px]">expand_more</span>
                          </button>
                        </div>
                        {/* Column settings dropdown */}
                        {columnMenuOpen === col && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setColumnMenuOpen(null)} />
                            <div className="absolute top-full start-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden text-sm font-normal normal-case tracking-normal" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => { setSortColumn(col); setSortDirection('asc'); setColumnMenuOpen(null); }}
                                className={`w-full px-4 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 ${sortColumn === col && sortDirection === 'asc' ? 'text-[#635bff] bg-[#635bff]/5' : 'text-slate-700 dark:text-slate-300'}`}
                              >
                                <span className="material-symbols-rounded !text-[16px]">arrow_upward</span>
                                {t('tx_sortAsc')}
                              </button>
                              <button
                                onClick={() => { setSortColumn(col); setSortDirection('desc'); setColumnMenuOpen(null); }}
                                className={`w-full px-4 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 ${sortColumn === col && sortDirection === 'desc' ? 'text-[#635bff] bg-[#635bff]/5' : 'text-slate-700 dark:text-slate-300'}`}
                              >
                                <span className="material-symbols-rounded !text-[16px]">arrow_downward</span>
                                {t('tx_sortDesc')}
                              </button>
                              {sortColumn === col && (
                                <button
                                  onClick={() => { setSortColumn(null); setColumnMenuOpen(null); }}
                                  className="w-full px-4 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 text-slate-400"
                                >
                                  <span className="material-symbols-rounded !text-[16px]">close</span>
                                  {t('tx_removeSort')}
                                </button>
                              )}
                              <div className="border-t border-slate-100 dark:border-slate-700" />
                              <button
                                onClick={() => { setShowFilterPanel(true); setShowCustomizePanel(false); setColumnMenuOpen(null); }}
                                className="w-full px-4 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 text-slate-700 dark:text-slate-300"
                              >
                                <span className="material-symbols-rounded !text-[16px]">filter_list</span>
                                {t('tx_filterCol')}
                              </button>
                              <div className="border-t border-slate-100 dark:border-slate-700" />
                              <button
                                onClick={() => { toggleColumnFreeze(col); setColumnMenuOpen(null); }}
                                className={`w-full px-4 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 ${frozenColumns.includes(col) ? 'text-[#635bff]' : 'text-slate-700 dark:text-slate-300'}`}
                              >
                                <span className="material-symbols-rounded !text-[16px]">push_pin</span>
                                {frozenColumns.includes(col) ? t('tx_unfreezeColumn') : t('tx_freezeColumn')}
                              </button>
                              <button
                                onClick={() => { toggleColumnVisibility(col as keyof typeof visibleColumns); setColumnMenuOpen(null); }}
                                className="w-full px-4 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 text-slate-700 dark:text-slate-300"
                              >
                                <span className="material-symbols-rounded !text-[16px]">visibility_off</span>
                                {t('tx_hideColumn')}
                              </button>
                            </div>
                          </>
                        )}
                        {/* Resize handle on the end (left in RTL) edge */}
                        <div
                          className={`absolute top-0 end-0 h-full w-[5px] cursor-col-resize z-10 transition-colors ${
                            resizingColumn === col ? 'bg-[#635bff]' : 'hover:bg-[#635bff]/20'
                          }`}
                          onMouseDown={(e) => handleResizeStart(e, col)}
                          draggable={false}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => { e.stopPropagation(); setColumnWidths(prev => { const next = { ...prev }; delete next[col]; return next; }); }}
                        />
                      </th>
                    ))}
                    <th className="px-3 py-2.5 w-12 bg-violet-50 dark:bg-slate-800/50"></th>
                  </tr>
                </thead>

                <tbody>
                  {/* Spacer for fixed header — uses measured header height for zero-jump */}
                  {isHeaderFixed && <tr><td colSpan={100} style={{ height: `${headerHeight}px`, padding: 0, border: 'none' }}></td></tr>}

                  {/* Error banner */}
                  {apiError && (
                    <tr>
                      <td colSpan={100} className="px-6 py-3">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                          <span className="material-symbols-rounded !text-[18px]">error_outline</span>
                          {apiError}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Loading skeleton */}
                  {isTableLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2.5"><div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                        {visibleColumns.date && <td className="px-6 py-2.5"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.customer && <td className="px-6 py-2.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.product && <td className="px-6 py-2.5"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.paymentMethod && <td className="px-6 py-2.5"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.status && <td className="px-6 py-2.5"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div></td>}
                        {visibleColumns.transactionDate && <td className="px-6 py-2.5"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.amount && <td className="px-6 py-2.5"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.currency && <td className="px-6 py-2.5"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.transactionId && <td className="px-6 py-2.5"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.paymentId && <td className="px-6 py-2.5"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.paymentMethodId && <td className="px-6 py-2.5"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.type && <td className="px-6 py-2.5"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.campaign && <td className="px-6 py-2.5"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-md"></div></td>}
                        {visibleColumns.channel && <td className="px-6 py-2.5"><div className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-full"></div></td>}
                        {visibleColumns.merchantNet && <td className="px-6 py-2.5"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.platformFee && <td className="px-6 py-2.5"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        {visibleColumns.marketPrice && <td className="px-6 py-2.5"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                        <td className="px-3 py-2.5"><div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                      </tr>
                    ))
                  ) : sortedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={100} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="material-symbols-rounded text-4xl text-slate-300">receipt_long</span>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{t('tx_noTransactions')}</p>
                          {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="text-sm text-[#635bff] hover:underline">{t('tx_clearFilters')}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedTransactions.map(tx => (
                      <tr
                        key={tx.id}
                        onClick={() => handleRowClick(tx)}
                        className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          selectedTransaction?.id === tx.id ? 'bg-[#635bff]/5 dark:bg-[#635bff]/10 border-r-4 border-[#635bff]' :
                          selectedIds.includes(tx.id) ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className={`px-3 py-2.5 ${frozenColumns.includes('checkbox') && isLastFrozenColumn('checkbox') ? 'frozen-column-shadow' : ''}`}
                          style={frozenColumns.includes('checkbox') ? { position: 'sticky', right: 0, zIndex: 10, backgroundColor: selectedIds.includes(tx.id) ? 'rgb(245 243 255)' : 'white' } : {}}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(tx.id)}
                            onChange={() => toggleSelection(tx.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[#635bff] focus:ring-[#635bff]"
                          />
                        </td>

                        {visibleOrderedColumns.map(col => (
                          <td
                            key={col}
                            className={`px-6 py-2.5 overflow-hidden text-ellipsis whitespace-nowrap ${COLUMN_CONFIG[col].cellClass} ${
                              frozenColumns.includes(col) && isLastFrozenColumn(col) ? 'frozen-column-shadow' : ''
                            } ${draggedColumn === col ? '!bg-[#635bff]/10 border-x-2 border-[#635bff]/20' : ''} ${
                              dragOverColumn === col && draggedColumn !== col ? 'border-e-[3px] border-[#635bff]' : ''
                            }`}
                            style={frozenColumns.includes(col) ? { position: 'sticky', right: `${getColumnLeftPosition(col)}px`, zIndex: 10, backgroundColor: draggedColumn === col ? 'rgba(99,91,255,0.08)' : selectedIds.includes(tx.id) ? 'rgb(245 243 255)' : 'white' } : {}}
                          >{COLUMN_CONFIG[col].render(tx)}</td>
                        ))}

                        {/* Row actions */}
                        <td className="px-3 py-2.5">
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setRowActionMenuId(rowActionMenuId === tx.id ? null : tx.id); }}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <span className="material-symbols-rounded !text-[16px]">more_vert</span>
                            </button>
                            {rowActionMenuId === tx.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setRowActionMenuId(null)}></div>
                                <div className="absolute start-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
                                  <button onClick={(e) => { e.stopPropagation(); setRowActionMenuId(null); handleRowClick(tx); }} className="w-full px-4 py-2.5 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                                    <span className="material-symbols-rounded !text-[16px] text-slate-400">visibility</span>
                                    {t('tx_viewDetails')}
                                  </button>
                                  <button onClick={() => { setRowActionMenuId(null); }} className="w-full px-4 py-2.5 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                                    <span className="material-symbols-rounded !text-[16px] text-slate-400">content_copy</span>
                                    {t('tx_copyId')}
                                  </button>
                                  {tx.status === 'successful' && (
                                    <button onClick={() => { setRowActionMenuId(null); }} className="w-full px-4 py-2.5 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 border-t border-slate-100 dark:border-slate-700">
                                      <span className="material-symbols-rounded !text-[16px] text-red-400">undo</span>
                                      <span className="text-red-600">{t('tx_refundPayment')}</span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom pagination */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">{t('tx_showing')} {filteredTransactions.length} {t('tx_resultsOf')} {transactions.length} {t('tx_transactions')}</span>
              <div className="flex gap-1">
                <button className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md transition-colors">
                  <span className="material-symbols-rounded !text-[16px]">chevron_right</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md transition-colors">
                  <span className="material-symbols-rounded !text-[16px]">chevron_left</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Side Panel */}
        {(selectedTransaction || isDetailLoading) && (
          <aside
            key={sidebarKey}
            className="w-full lg:w-[380px] space-y-6 animate-in slide-in-from-left sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar"
          >
            {isDetailLoading ? (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 p-6">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-6">
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
                    <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Transaction Card */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 p-6 relative">
                  {/* Close */}
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="absolute top-4 left-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
                  >
                    <span className="material-symbols-rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
                  </button>

                  {/* Status + Amount hero */}
                  <div className="flex flex-col items-center text-center mb-6 mt-6">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                      selectedTransaction!.status === 'successful' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      selectedTransaction!.status === 'declined' ? 'bg-red-100 dark:bg-red-900/30' :
                      selectedTransaction!.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
                      selectedTransaction!.status === 'refunded' ? 'bg-violet-100 dark:bg-violet-900/30' :
                      selectedTransaction!.status === 'chargeback' ? 'bg-orange-100 dark:bg-orange-900/30' :
                      selectedTransaction!.status === 'authorized' ? 'bg-sky-100 dark:bg-sky-900/30' :
                      'bg-slate-100 dark:bg-slate-700/30'
                    }`}>
                      <span className={`material-symbols-rounded !text-[24px] ${
                        selectedTransaction!.status === 'successful' ? 'text-emerald-600' :
                        selectedTransaction!.status === 'declined' ? 'text-red-600' :
                        selectedTransaction!.status === 'pending' ? 'text-amber-600' :
                        selectedTransaction!.status === 'refunded' ? 'text-violet-600' :
                        selectedTransaction!.status === 'chargeback' ? 'text-orange-600' :
                        selectedTransaction!.status === 'authorized' ? 'text-sky-600' :
                        'text-slate-500'
                      }`}>{
                        selectedTransaction!.status === 'successful' ? 'check_circle' :
                        selectedTransaction!.status === 'declined' ? 'cancel' :
                        selectedTransaction!.status === 'pending' ? 'schedule' :
                        selectedTransaction!.status === 'refunded' ? 'undo' :
                        selectedTransaction!.status === 'chargeback' ? 'warning' :
                        selectedTransaction!.status === 'authorized' ? 'verified' :
                        'block'
                      }</span>
                    </div>
                    {getStatusBadge(selectedTransaction!.status)}
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-3">{formatCurrencyByCode(selectedTransaction!.merchantNet, selectedTransaction!.currency)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('tx_merchantNetSide')}</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{selectedTransaction!.transactionId}</p>
                  </div>

                  {/* Pricing waterfall */}
                  <div className="mt-1 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="material-symbols-rounded !text-[14px]">receipt_long</span>
                        {selectedTransaction!.channel === 'club' ? t('tx_clubPricingBreakdown') : t('tx_directPricingBreakdown')}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {selectedTransaction!.channel === 'club' ? (
                        <>
                          <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500">{t('tx_marketPriceLabel')}</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrencyByCode(selectedTransaction!.marketPrice!, selectedTransaction!.currency)}</span>
                          </div>
                          <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500">{t('tx_merchantDiscount')}</span>
                            <span className="font-medium text-red-500">-{formatCurrencyByCode(selectedTransaction!.merchantDiscount!, selectedTransaction!.currency)}</span>
                          </div>
                          <div className="flex justify-between px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">{t('tx_basePrice')}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrencyByCode(selectedTransaction!.basePrice!, selectedTransaction!.currency)}</span>
                          </div>
                          <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500">{t('tx_nexusFee')}</span>
                            <span className="font-medium text-red-500">-{formatCurrencyByCode(selectedTransaction!.nexusMargin!, selectedTransaction!.currency)}</span>
                          </div>
                          <div className="flex justify-between px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{t('tx_merchantNetSide')}</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrencyByCode(selectedTransaction!.merchantNet, selectedTransaction!.currency)}</span>
                          </div>
                          <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800">
                            <span className="text-[10px] text-slate-400 tracking-wider">{t('tx_consumerSide')}</span>
                          </div>
                          <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500">{selectedTransaction!.tenantAdjustment! < 0 ? t('tx_orgSubsidy') : t('tx_orgMarkup')}</span>
                            <span className={`font-medium ${selectedTransaction!.tenantAdjustment! < 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                              {selectedTransaction!.tenantAdjustment! < 0 ? '' : '+'}{formatCurrencyByCode(Math.abs(selectedTransaction!.tenantAdjustment!), selectedTransaction!.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20">
                            <span className="font-semibold text-blue-700 dark:text-blue-400">{t('tx_consumerPaid')}</span>
                            <span className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrencyByCode(selectedTransaction!.amount, selectedTransaction!.currency)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500">{t('tx_saleAmount')}</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrencyByCode(selectedTransaction!.amount, selectedTransaction!.currency)}</span>
                          </div>
                          <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500">{t('tx_processingFee')}</span>
                            <span className="font-medium text-red-500">-{formatCurrencyByCode(selectedTransaction!.processingFee!, selectedTransaction!.currency)}</span>
                          </div>
                          <div className="flex justify-between px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{t('tx_merchantNetSide')}</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrencyByCode(selectedTransaction!.merchantNet, selectedTransaction!.currency)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-slate-500">{t('tx_customer')}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{translateMockField(selectedTransaction!.customer, t)}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-slate-500">{t('tx_productService')}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{translateMockField(selectedTransaction!.product, t)}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-slate-500">{t('tx_paymentMethod')}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{getPaymentMethodLabel(selectedTransaction!.paymentMethod, t)}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-slate-500">{t('tx_channel')}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CHANNEL_STYLES[selectedTransaction!.channel]}`}>{t(CHANNEL_LABEL_KEYS[selectedTransaction!.channel])}</span>
                    </div>
                    {selectedTransaction!.campaign && (
                      <div className="flex justify-between py-3">
                        <span className="text-sm text-slate-500">{t('tx_campaign')}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-medium">
                          <span className="material-symbols-rounded !text-[13px]">campaign</span>
                          {translateMockField(selectedTransaction!.campaign, t)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-slate-500">{t('tx_typeLabel')}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{t(TYPE_LABEL_KEYS[selectedTransaction!.type])}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-slate-500">{t('tx_currency')}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedTransaction!.currency}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-slate-500">{t('tx_paymentDate')}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedTransaction!.date}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-slate-500">{t('tx_transactionDate')}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedTransaction!.transactionDate}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-2">
                    {selectedTransaction!.status === 'successful' && (
                      <button className="flex-1 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors flex items-center justify-center gap-1.5">
                        <span className="material-symbols-rounded !text-[14px]">undo</span>
                        {t('tx_refundPayment')}
                      </button>
                    )}
                    <button className="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5">
                      <span className="material-symbols-rounded !text-[14px]">receipt_long</span>
                      {t('tx_downloadReceipt')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </aside>
        )}
      </div>
    </>
  );
};

export default Transactions;
