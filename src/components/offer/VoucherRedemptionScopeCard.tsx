/**
 * VoucherRedemptionScopeCard: the voucher-only card for the SHARED redemption
 * text - the redemption terms (תנאי מימוש) and method (אופן מימוש) that apply to
 * every variant by default. A variant can override this text for itself via the
 * "use custom redemption text" toggle inside its VariantBuilder; this card holds
 * the single shared default. Controlled by the parent. Reuses existing form tokens.
 */
import { useLanguage } from '../../i18n/LanguageContext';

const inputCls =
  'w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60';
const labelCls = 'mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300';

interface VoucherRedemptionScopeCardProps {
  /** Shared redemption terms (applies to all variants unless a variant overrides). */
  terms: string;
  setTerms: (v: string) => void;
  /** Shared redemption method (applies to all variants unless a variant overrides). */
  method: string;
  setMethod: (v: string) => void;
  isSubmitting?: boolean;
}

/** Renders the shared redemption-terms/method card. */
export default function VoucherRedemptionScopeCard({
  terms, setTerms, method, setMethod, isSubmitting = false,
}: VoucherRedemptionScopeCardProps) {
  const { t } = useLanguage();
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
      <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-white">{t('co_sectionRedemption')}</h2>
      <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">{t('co_sharedRedemptionHint')}</p>
      <div className="mb-4">
        <label className={labelCls}>{t('co_variantTermsLabel')}</label>
        <textarea
          value={terms} onChange={(e) => setTerms(e.target.value)} rows={3}
          disabled={isSubmitting} className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>{t('co_variantMethodLabel')}</label>
        <textarea
          value={method} onChange={(e) => setMethod(e.target.value)} rows={3}
          disabled={isSubmitting} className={inputCls}
        />
      </div>
    </section>
  );
}
