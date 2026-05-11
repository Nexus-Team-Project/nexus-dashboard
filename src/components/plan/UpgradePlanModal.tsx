/**
 * Coming-soon upgrade plan modal that shows the three available plan tiers.
 * Real billing via PayMe is not yet implemented — this is an informational screen.
 * Uses createPortal to render directly into document.body so the backdrop
 * escapes all stacking contexts (header, wizard bar) and covers everything.
 */
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { TenantPlan } from '../../lib/api';
import { getPlanLabel, PLAN_SEAT_LIMITS } from '../../lib/tenantRoles';

const COPY = {
  he: {
    title: 'שדרג את התוכנית שלך',
    subtitle: 'בחר את התוכנית המתאימה לצוות שלך',
    comingSoon: 'שדרוג אמיתי יגיע בקרוב',
    comingSoonDetail: 'פנה אלינו כדי לשדרג ידנית',
    currentPlan: 'תוכנית נוכחית',
    seatsLabel: 'מושבים שאינם חבר',
    gotIt: 'הבנתי',
    unlimited: 'ללא הגבלה',
    memberNote: 'הזמנות חבר: ללא הגבלה בכל תוכנית',
    plans: {
      basic:    { tagline: 'מתחילים' },
      advanced: { tagline: 'צוותים גדלים' },
      premium:  { tagline: 'ארגונים' },
    },
  },
  en: {
    title: 'Upgrade your plan',
    subtitle: 'Choose the plan that fits your team',
    comingSoon: 'Real upgrades coming soon',
    comingSoonDetail: 'Contact us to upgrade manually',
    currentPlan: 'Current plan',
    seatsLabel: 'Non-member seats',
    gotIt: 'Got it',
    unlimited: 'Unlimited',
    memberNote: 'Member invites: unlimited on every plan',
    plans: {
      basic:    { tagline: 'Getting started' },
      advanced: { tagline: 'Growing teams' },
      premium:  { tagline: 'Organisations' },
    },
  },
} as const;

const PLAN_ORDER: TenantPlan[] = ['basic', 'advanced', 'premium'];

interface Props {
  currentPlan: TenantPlan;
  onClose: () => void;
}

/**
 * Full-screen backdrop modal with three plan tier cards side-by-side.
 * Input: currentPlan to highlight, onClose callback.
 * Output: informational upgrade screen with a "Got it" close button.
 */
export function UpgradePlanModal({ currentPlan, onClose }: Props) {
  const { language, isRTL } = useLanguage();
  const t = COPY[language];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-md p-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in zoom-in duration-200 max-h-[92vh]">
        {/* Header — always visible */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t.title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto">
        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const isCurrent = plan === currentPlan;
            const seats = PLAN_SEAT_LIMITS[plan];
            return (
              <div
                key={plan}
                className={`relative flex flex-col gap-3 rounded-xl border p-5 transition-all ${
                  isCurrent
                    ? 'border-primary ring-2 ring-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                    {t.currentPlan}
                  </span>
                )}
                <div>
                  <p className="text-lg font-bold text-slate-950 dark:text-white">
                    {getPlanLabel(plan, language)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.plans[plan].tagline}
                  </p>
                </div>
                <div className="mt-auto">
                  <p className="text-3xl font-extrabold text-slate-950 dark:text-white">
                    {seats}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.seatsLabel}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Member note */}
        <p className="px-6 pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
          {t.memberNote}
        </p>

        {/* Coming soon banner */}
        <div className="mx-6 mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">{t.comingSoon}</p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-500">{t.comingSoonDetail}</p>
        </div>
        </div>{/* end scrollable content */}

        {/* Footer — always visible at bottom */}
        <div className="flex shrink-0 items-center justify-end border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            {t.gotIt}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
