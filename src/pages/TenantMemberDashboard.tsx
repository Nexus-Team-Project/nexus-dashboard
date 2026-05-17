/**
 * Home page for tenant members with non-admin roles.
 * Rendered inside MemberLayout (which provides header and sidebar with sign-out).
 * Shows a welcome header, status-aware service cards, account details, and pending invitations.
 */
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import PendingInvitationsPanel from '../components/PendingInvitationsPanel';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TenantMemberDashboardProps {
  userName: string;
  userEmail: string;
  tenantName: string | null;
  role: string | null;
  /** Kept for backwards compatibility; sign-out lives in the sidebar now. */
  onLogout: () => Promise<void>;
  /** Catalog activation mode derived from TenantServiceActivation + Tenant.status. */
  catalogMode?: 'inactive' | 'sandbox' | 'live';
  /** Services this member was granted at invite time (e.g. ['benefits_catalog']). */
  memberServices?: string[];
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CopyLanguage = 'he' | 'en';

// ---------------------------------------------------------------------------
// Copy strings
// ---------------------------------------------------------------------------

/**
 * Localised UI copy for the member dashboard.
 * Each key maps to a Hebrew and English string.
 */
const COPY = {
  he: {
    tenantLabel: 'ארגון',
    roleLabel: 'תפקיד',
    emailLabel: 'אימייל',
    fallbackTenant: 'ארגון ללא שם',
    fallbackRole: 'member',
  },
  en: {
    tenantLabel: 'Tenant',
    roleLabel: 'Role',
    emailLabel: 'Email',
    fallbackTenant: 'Unnamed tenant',
    fallbackRole: 'member',
  },
} as const;

// ---------------------------------------------------------------------------
// Role metadata
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, Record<CopyLanguage, string>> = {
  finance: { he: 'כספים', en: 'Finance' },
  operator: { he: 'תפעול', en: 'Operator' },
  analyst: { he: 'אנליסט', en: 'Analyst' },
  developer: { he: 'מפתח', en: 'Developer' },
  support: { he: 'תמיכה', en: 'Support' },
  supply_manager: { he: 'ניהול ספקים', en: 'Supply manager' },
  member: { he: 'חבר', en: 'Member' },
};

const ROLE_CAPABILITIES: Record<string, Record<CopyLanguage, string[]>> = {
  finance: {
    he: ['לראות פעולות כספיות שהוקצו לתפקיד', 'לעבוד עם דוחות כספיים עתידיים', 'ללא הרשאת הזמנת חברים'],
    en: ['View finance work assigned to the role', 'Work with future finance reports', 'No member-invite permission'],
  },
  operator: {
    he: ['לעבוד עם פעולות תפעוליות עתידיות', 'לעקוב אחרי תהליכים ומשימות', 'ללא הרשאת ניהול חברים'],
    en: ['Work with future operations tasks', 'Track workflows and tasks', 'No member-management permission'],
  },
  analyst: {
    he: ['לראות תובנות ודוחות שיוקצו לתפקיד', 'לעקוב אחרי נתונים עסקיים מותרים', 'ללא שינוי הגדרות tenant'],
    en: ['View insights and reports assigned to the role', 'Track permitted business data', 'No tenant-settings changes'],
  },
  developer: {
    he: ['לעבוד עם כלי API ופיתוח עתידיים', 'לראות מידע טכני שמותר לתפקיד', 'ללא פעולות ניהול tenant'],
    en: ['Work with future API and developer tools', 'View technical data allowed for the role', 'No tenant-admin actions'],
  },
  support: {
    he: ['לעבוד עם פניות תמיכה עתידיות', 'לראות מידע שירות שמותר לתפקיד', 'ללא הרשאות כספים או ניהול'],
    en: ['Work with future support tickets', 'View service data allowed for the role', 'No finance or admin permissions'],
  },
  supply_manager: {
    he: ['לעבוד עם ספקים וקטלוג עתידיים', 'לעקוב אחרי סטטוס הצעות', 'ללא הרשאת הזמנת חברים'],
    en: ['Work with future supply and catalog tasks', 'Track offer status', 'No member-invite permission'],
  },
  member: {
    he: ['לראות את הארגון שאליו הוזמנת', 'לעבוד רק עם פעולות שיוקצו לך בעתיד', 'ללא דשבורד מנהלים'],
    en: ['See the tenant you belong to', 'Use only future actions assigned to you', 'No admin dashboard access'],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a readable label for a tenant role.
 * Input: role id from `/api/me` and active language.
 * Output: localised role label string.
 */
function getRoleLabel(role: string | null, language: CopyLanguage): string {
  if (!role) return COPY[language].fallbackRole;
  return ROLE_LABELS[role]?.[language] ?? role;
}

/**
 * Returns localised capability descriptions for a given role.
 * Reserved for future use in the account-details section.
 *
 * Input: role id from `/api/me` and active language.
 * Output: array of localised capability strings.
 */
function getRoleCapabilities(role: string | null, language: CopyLanguage): string[] {
  return ROLE_CAPABILITIES[role ?? 'member']?.[language] ?? ROLE_CAPABILITIES.member[language];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Renders one account context row in the details section.
 * Input: row label and display value.
 * Output: static definition-list row.
 */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CatalogServiceCard
// ---------------------------------------------------------------------------

interface CatalogServiceCardProps {
  catalogMode?: 'inactive' | 'sandbox' | 'live';
  language: 'he' | 'en';
  onNavigate: () => void;
}

/**
 * Service card for the Benefits Catalog.
 * Shows the current activation state as a coloured badge and an action button.
 * Input: catalogMode, language, onNavigate callback.
 * Output: card with status badge and CTA button.
 */
function CatalogServiceCard({ catalogMode, language, onNavigate }: CatalogServiceCardProps) {
  const isHe = language === 'he';

  const STATUS = {
    inactive: {
      badge: isHe ? 'לא פעיל עדיין' : 'Not yet active',
      badgeClass: 'bg-slate-100 text-slate-600',
      desc: isHe
        ? 'המנהל טרם הפעיל את שירות הקטלוג. הוא יהיה זמין בקרוב.'
        : "Your admin hasn't activated this service yet. It will be available soon.",
      btnLabel: isHe ? 'צפה בקטלוג' : 'View Catalog',
      btnClass: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 cursor-not-allowed',
      disabled: true,
    },
    sandbox: {
      badge: isHe ? 'תצוגה מקדימה' : 'Preview',
      badgeClass: 'bg-amber-100 text-amber-700',
      desc: isHe
        ? 'הקטלוג בתצוגה מקדימה. ניתן לעיין בהצעות; רכישות יופעלו בקרוב.'
        : 'Catalog is in preview mode. You can browse offers; purchases will be enabled soon.',
      btnLabel: isHe ? 'עיין בקטלוג' : 'Browse Catalog',
      btnClass: 'bg-primary shadow-sm hover:opacity-90 text-white',
      disabled: false,
    },
    live: {
      badge: isHe ? 'פעיל' : 'Live',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      desc: isHe
        ? 'הקטלוג פעיל. עיין וממש הצעות בלעדיות שלך.'
        : 'Catalog is live. Browse and redeem your exclusive offers.',
      btnLabel: isHe ? 'פתח קטלוג' : 'Open Catalog',
      btnClass: 'bg-primary shadow-sm hover:opacity-90 text-white',
      disabled: false,
    },
  };

  const state = STATUS[catalogMode ?? 'inactive'];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <span className="material-symbols-rounded text-primary">local_offer</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {isHe ? 'קטלוג הטבות' : 'Benefits Catalog'}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${state.badgeClass}`}>
          {state.badge}
        </span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{state.desc}</p>
      <button
        type="button"
        onClick={state.disabled ? undefined : onNavigate}
        disabled={state.disabled}
        className={`mt-auto rounded-lg px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${state.btnClass}`}
      >
        {state.btnLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Renders the member home page for non-admin tenant roles.
 * Replaces the old dead-end "limited role" card with a welcome page and
 * status-aware service cards derived from memberServices / catalogMode.
 *
 * Input: trusted `/api/me` identity, tenant context, role, catalogMode, and memberServices.
 * Output: welcome header, service cards grid, collapsible account details, and pending invitations.
 */
export default function TenantMemberDashboard({
  userName,
  userEmail,
  tenantName,
  role,
  catalogMode,
  memberServices,
}: TenantMemberDashboardProps) {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const copy = COPY[language];
  const roleLabel = getRoleLabel(role, language);

  /**
   * Determine whether the Benefits Catalog card should be shown.
   * Prefer the explicit memberServices array; fall back to inferring from catalogMode.
   * Any defined catalogMode value means the member was given catalog access.
   */
  const hasCatalog =
    memberServices?.includes('benefits_catalog') === true ||
    catalogMode !== undefined;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-3xl space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          {language === 'he' ? `שלום, ${userName}` : `Welcome, ${userName}`}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {tenantName
            ? (language === 'he' ? `חבר בארגון ${tenantName}` : `Member of ${tenantName}`)
            : (language === 'he' ? 'חבר ארגון' : 'Tenant member')}
          {' · '}
          <span className="font-medium text-slate-700">{roleLabel}</span>
        </p>
      </div>

      {/* Service cards - shown when the member has at least one service */}
      {hasCatalog && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {language === 'he' ? 'השירותים שלי' : 'My Services'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CatalogServiceCard
              catalogMode={catalogMode}
              language={language}
              onNavigate={() => navigate('/member-catalog')}
            />
          </div>
        </section>
      )}

      {/* Empty state - no services assigned yet */}
      {!hasCatalog && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            {language === 'he'
              ? 'עדיין אין שירותים מוקצים לחשבונך. פנה למנהל הארגון.'
              : 'No services assigned to your account yet. Contact your tenant admin.'}
          </p>
        </div>
      )}

      {/* Account details - collapsed by default to keep the page clean */}
      <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-700 select-none">
          {language === 'he' ? 'פרטי חשבון' : 'Account details'}
        </summary>
        <div className="px-5 pb-5 pt-1">
          <dl className="grid gap-3 sm:grid-cols-3">
            <DetailRow label={copy.tenantLabel} value={tenantName ?? copy.fallbackTenant} />
            <DetailRow label={copy.roleLabel} value={roleLabel} />
            <DetailRow label={copy.emailLabel} value={userEmail} />
          </dl>
        </div>
      </details>

      <PendingInvitationsPanel />
    </div>
  );
}
