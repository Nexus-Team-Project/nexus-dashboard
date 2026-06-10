/**
 * Displays the tenant's current billing plan, non-member seat usage, and
 * an Upgrade button that opens the coming-soon upgrade modal.
 * Shows a skeleton while plan data is loading.
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { TenantPlan, TenantSeats } from '../../lib/api';
import { getPlanLabel, PLAN_SEAT_LIMITS } from '../../lib/tenantRoles';
import { UpgradePlanModal } from './UpgradePlanModal';

const COPY = {
  he: {
    plan: 'תוכנית',
    seats: 'מושבים',
    of: 'מתוך',
    used: 'בשימוש',
    upgrade: 'שדרג תוכנית',
    limitReached: 'הגעת למגבלת המושבים',
    limitHint: 'שדרג כדי להזמין תפקידים נוספים מלבד חבר',
  },
  en: {
    plan: 'Plan',
    seats: 'Seats',
    of: 'of',
    used: 'used',
    upgrade: 'Upgrade plan',
    limitReached: 'Seat limit reached',
    limitHint: 'Upgrade to invite more non-member roles',
  },
} as const;

interface Props {
  plan?: TenantPlan;
  seats?: TenantSeats;
  isLoading?: boolean;
}

/**
 * Card showing plan name, seat progress bar, and an Upgrade button.
 * Input: plan tier, seats summary, and optional loading flag.
 * Output: rendered summary card or skeleton.
 */
export function PlanSummaryCard({ plan, seats, isLoading }: Props) {
  const { language, isRTL } = useLanguage();
  const t = COPY[language];
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading || !plan || !seats) {
    return (
      <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2 w-full max-w-xs rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((seats.used / seats.limit) * 100));
  const barColor = seats.isAtLimit ? 'bg-rose-500' : 'bg-primary';

  return (
    <>
      <div
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: plan info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-950 dark:text-white">
                {t.plan}: {getPlanLabel(plan, language)}
              </span>
              {seats.isAtLimit && (
                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                  {t.limitReached}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {seats.used} {t.of} {seats.limit} {t.seats} {t.used}
              {seats.isAtLimit && ` · ${t.limitHint}`}
            </p>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Right: upgrade button */}
          <button
            type="button"
            onClick={() => setShowUpgrade(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 shrink-0"
          >
            {t.upgrade}
          </button>
        </div>
      </div>

      {showUpgrade && (
        <UpgradePlanModal
          currentPlan={plan}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
}
