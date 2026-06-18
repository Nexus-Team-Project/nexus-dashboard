/**
 * Shared loading + error states for the offer form pages (Edit Offer).
 * Extracted so the page files stay under the 350-line limit. Pure presentation.
 */
import { useLanguage } from '../../i18n/LanguageContext';

/** Animated skeleton matching the OfferFormLayout shell (banner + 12-col grid). */
export function OfferFormSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="h-[250px] bg-slate-200" />
      <div className="px-4 sm:px-8 -mt-16 pb-12 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="h-64 rounded-2xl bg-white border border-slate-200" />
          <div className="h-80 rounded-2xl bg-white border border-slate-200" />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="h-40 rounded-2xl bg-white border border-slate-200" />
          <div className="h-32 rounded-2xl bg-white border border-slate-200" />
        </div>
      </div>
    </div>
  );
}

interface OfferFormErrorStateProps {
  /** Error message to show. */
  message: string;
  /** Back-to-catalog handler. */
  onBack: () => void;
}

/** Centered error card with a back-to-catalog button. */
export function OfferFormErrorState({ message, onBack }: OfferFormErrorStateProps) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
        <p className="text-sm text-red-700 mb-6">{message}</p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          {t('of_backToCatalog')}
        </button>
      </div>
    </div>
  );
}
