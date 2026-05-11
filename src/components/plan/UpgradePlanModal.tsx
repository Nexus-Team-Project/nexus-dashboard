/**
 * Upgrade plan modal — premium SaaS pricing sheet.
 * Three plan cards: dark featured card for the recommended tier (Vercel/Linear pattern),
 * seat count only (no feature lists), coming-soon upgrade state.
 * Portal-rendered to document.body to escape all stacking contexts.
 */
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { TenantPlan } from '../../lib/api';
import { getPlanLabel, PLAN_SEAT_LIMITS } from '../../lib/tenantRoles';

// ─── Copy ────────────────────────────────────────────────────────────────────

const COPY = {
  he: {
    eyebrow: 'תוכניות',
    title: 'הגדל את הצוות שלך',
    subtitle: 'הכל כלול - שדרג כשתהיה מוכן',
    seats: 'מושבים',
    active: 'פעיל',
    recommended: 'מומלץ',
    comingSoon: 'בקרוב',
    billingNote: 'חיוב דרך PayMe · משיקים בקרוב',
    close: 'סגור',
    membersFree: 'הזמנות חבר ללא הגבלה בכל תוכנית',
    plans: {
      basic: { tagline: 'צוות קטן' },
      advanced: { tagline: 'צוות גדל' },
      premium: { tagline: 'ארגון' },
    },
  },
  en: {
    eyebrow: 'Plans',
    title: 'Scale your team',
    subtitle: 'Everything included — upgrade when ready',
    seats: 'seats',
    active: 'Active',
    recommended: 'Recommended',
    comingSoon: 'Coming soon',
    billingNote: 'Billing via PayMe · Launching soon',
    close: 'Close',
    membersFree: 'Member invites are free on every plan',
    plans: {
      basic: { tagline: 'Small team' },
      advanced: { tagline: 'Growing team' },
      premium: { tagline: 'Organisation' },
    },
  },
} as const;

const PLAN_ORDER: TenantPlan[] = ['basic', 'advanced', 'premium'];
const FEATURED_PLAN: TenantPlan = 'advanced';

// ─── Icons ───────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1" />
      <path d="M4.5 7l1.75 1.75L9.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Plan card ───────────────────────────────────────────────────────────────

interface CardProps {
  plan: TenantPlan;
  isCurrent: boolean;
  isFeatured: boolean;
  language: 'he' | 'en';
}

function PlanCard({ plan, isCurrent, isFeatured, language }: CardProps) {
  const t = COPY[language];
  const seats = PLAN_SEAT_LIMITS[plan];

  if (isFeatured) {
    /* ── Dark featured card ──────────────────────────────────────────── */
    return (
      <div className="relative flex flex-col rounded-2xl bg-slate-950 px-6 py-7 shadow-2xl">
        {/* Subtle grid texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Top badges */}
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">
            {getPlanLabel(plan, language)}
          </span>
          {isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-semibold text-primary">
              <CheckCircleIcon />
              {t.active}
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/60">
              {t.recommended}
            </span>
          )}
        </div>

        {/* Seat number */}
        <div className="mb-1">
          <span className="text-6xl font-black tracking-tighter text-white sm:text-7xl">
            {seats}
          </span>
        </div>
        <p className="mb-6 text-sm font-medium text-white/40">{t.seats}</p>

        {/* Tagline */}
        <p className="mb-8 text-xs text-white/30">{t.plans[plan].tagline}</p>

        {/* CTA */}
        {isCurrent ? (
          <div className="mt-auto rounded-xl bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white/50 select-none">
            {t.active}
          </div>
        ) : (
          <div className="mt-auto space-y-1.5">
            <div className="cursor-not-allowed rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 opacity-30 select-none">
              Upgrade
            </div>
            <p className="text-center text-[11px] text-white/25">{t.comingSoon}</p>
          </div>
        )}
      </div>
    );
  }

  /* ── Light card ────────────────────────────────────────────────────── */
  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-100 bg-white px-6 py-7 dark:border-slate-800 dark:bg-slate-900">
      {/* Top badges */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
          {getPlanLabel(plan, language)}
        </span>
        {isCurrent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
            <CheckCircleIcon />
            {t.active}
          </span>
        )}
      </div>

      {/* Seat number */}
      <div className="mb-1">
        <span className="text-6xl font-black tracking-tighter text-slate-950 dark:text-white sm:text-7xl">
          {seats}
        </span>
      </div>
      <p className="mb-6 text-sm font-medium text-slate-400 dark:text-slate-500">{t.seats}</p>

      {/* Tagline */}
      <p className="mb-8 text-xs text-slate-400 dark:text-slate-600">{t.plans[plan].tagline}</p>

      {/* CTA */}
      {isCurrent ? (
        <div className="mt-auto rounded-xl border border-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-400 dark:border-slate-800 dark:text-slate-600 select-none">
          {t.active}
        </div>
      ) : (
        <div className="mt-auto space-y-1.5">
          <div className="cursor-not-allowed rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-300 dark:border-slate-700 dark:text-slate-600 select-none">
            Upgrade
          </div>
          <p className="text-center text-[11px] text-slate-300 dark:text-slate-700">{t.comingSoon}</p>
        </div>
      )}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface Props {
  currentPlan: TenantPlan;
  onClose: () => void;
}

/**
 * Portal-rendered premium pricing modal.
 * Input: currentPlan to mark active, onClose callback.
 * Output: three plan cards over a blurred backdrop, always centered.
 */
export function UpgradePlanModal({ currentPlan, onClose }: Props) {
  const { language, isRTL } = useLanguage();
  const t = COPY[language];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-lg"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl dark:bg-slate-950 animate-in fade-in zoom-in duration-200 max-h-[88vh]">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between px-7 pt-7 pb-1">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              {t.eyebrow}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {t.title}
            </h2>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{t.subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ms-4 cursor-pointer self-start rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Cards ────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PLAN_ORDER.map((plan) => (
              <PlanCard
                key={plan}
                plan={plan}
                isCurrent={plan === currentPlan}
                isFeatured={plan === FEATURED_PLAN}
                language={language}
              />
            ))}
          </div>

          {/* Member note */}
          <p className="mt-4 text-center text-[11px] text-slate-300 dark:text-slate-700">
            {t.membersFree}
          </p>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200/60 px-7 py-4 dark:border-slate-800">
          <p className="text-[11px] text-slate-300 dark:text-slate-700">{t.billingNote}</p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80 dark:bg-white dark:text-slate-950"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>,
    document.body,
  );
}
