/**
 * VoucherInventorySection: the voucher-only "set up inventory" card on the
 * Create Offer page. It opens the inventory popup and shows the currently
 * chosen (in-memory) inventory so the admin sees their choice before publishing.
 *
 * No backend work happens here — the parent holds the choice in state and
 * applies it at publish time. Making a choice (or skipping) is required before
 * the offer can be published; this card surfaces that requirement.
 *
 * Props:
 *   choiceMade - whether the admin has chosen inventory or explicitly skipped.
 *   inventory  - the staged inventory (null = skipped / none).
 *   onOpen     - open the inventory popup.
 *   disabled   - disable the open button while submitting.
 */
import { useLanguage } from '../../i18n/LanguageContext';

interface VoucherInventorySectionProps {
  /** Whether the admin has chosen inventory or explicitly skipped. */
  choiceMade: boolean;
  /** Pre-formatted summary of the staged choice (from `voucherInventorySummary`). */
  summary: string;
  onOpen: () => void;
  disabled?: boolean;
}

export default function VoucherInventorySection({ choiceMade, summary, onOpen, disabled }: VoucherInventorySectionProps) {
  const { t } = useLanguage();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('co_invSectionTitle')}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('co_invSectionHint')}</p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          disabled={disabled}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {choiceMade ? t('co_invEditBtn') : t('co_invOpenBtn')}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-slate-500 dark:text-slate-400">{t('co_invCurrentLabel')}</span>
        <span
          className={
            choiceMade
              ? 'font-semibold text-slate-900 dark:text-white'
              : 'font-medium text-amber-600 dark:text-amber-400'
          }
        >
          {summary}
        </span>
      </div>
    </section>
  );
}
