/**
 * VoucherRedemptionScopeCard: the voucher-only card that hosts the single shared
 * "Same for all variants / Different per variant" toggle (RedemptionScopeToggle)
 * and, when the scope is "shared", the parent-level redemption terms (תנאי מימוש)
 * and method (אופן מימוש) inputs. When the scope is "per variant" those two
 * fields move into each variant (the VariantBuilder), so this card shows only the
 * toggle. Controlled by the parent. Styling reuses the existing offer-form tokens.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import RedemptionScopeToggle, { type RedemptionScope } from './RedemptionScopeToggle';

const inputCls =
  'w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60';
const labelCls = 'mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300';

interface VoucherRedemptionScopeCardProps {
  scope: RedemptionScope;
  setScope: (s: RedemptionScope) => void;
  /** Parent-level redemption terms (used only when scope === 'shared'). */
  terms: string;
  setTerms: (v: string) => void;
  /** Parent-level redemption method (used only when scope === 'shared'). */
  method: string;
  setMethod: (v: string) => void;
  isSubmitting?: boolean;
}

/** Renders the redemption-scope card. */
export default function VoucherRedemptionScopeCard({
  scope, setScope, terms, setTerms, method, setMethod, isSubmitting = false,
}: VoucherRedemptionScopeCardProps) {
  const { t } = useLanguage();
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
      <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">{t('co_sectionRedemption')}</h2>
      <RedemptionScopeToggle value={scope} onChange={setScope} disabled={isSubmitting} />
      {scope === 'shared' && (
        <>
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
        </>
      )}
    </section>
  );
}
