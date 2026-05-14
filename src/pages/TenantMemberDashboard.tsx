/**
 * Shows a limited dashboard for non-admin tenant roles with role-specific scope.
 * This prevents operational roles from seeing tenant-admin analytics or controls.
 * Renders a "View Benefits Catalog" button when the tenant's catalogMode is not inactive.
 */
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import PendingInvitationsPanel from '../components/PendingInvitationsPanel';

interface TenantMemberDashboardProps {
  userName: string;
  userEmail: string;
  tenantName: string | null;
  role: string | null;
  onLogout: () => Promise<void>;
  /**
   * Catalog activation state from /api/me.
   * When not 'inactive', a "View Benefits Catalog" button is shown.
   */
  catalogMode?: 'inactive' | 'sandbox' | 'live';
}

type CopyLanguage = 'he' | 'en';

const COPY = {
  he: {
    badge: 'דשבורד לפי תפקיד',
    title: 'נכנסת לתפקיד מוגבל',
    tenantLabel: 'שייך לארגון',
    roleLabel: 'תפקיד',
    emailLabel: 'אימייל',
    capabilitiesTitle: 'מה אפשר לעשות בתפקיד הזה',
    fallbackTenant: 'ארגון ללא שם',
    fallbackRole: 'member',
    body: 'זהו דשבורד בסיסי לפי תפקיד. פעולות ניהול מלאות, הזמנת חברים ואנליטיקות מנהלים זמינות רק למנהלי הארגון.',
    signOut: 'התנתקות',
  },
  en: {
    badge: 'Role dashboard',
    title: 'You are signed in with limited access',
    tenantLabel: 'Tenant',
    roleLabel: 'Role',
    emailLabel: 'Email',
    capabilitiesTitle: 'What this role can do',
    fallbackTenant: 'Unnamed tenant',
    fallbackRole: 'member',
    body: 'This is a basic dashboard for your tenant role. Full admin actions, member invites, and admin analytics are only available to tenant admins.',
    signOut: 'Sign out',
  },
} as const;

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

/**
 * Returns a readable label for a tenant role.
 * Input: role id from `/api/me` and active language.
 * Output: localized role label.
 */
function getRoleLabel(role: string | null, language: CopyLanguage): string {
  if (!role) return COPY[language].fallbackRole;
  return ROLE_LABELS[role]?.[language] ?? role;
}

/**
 * Returns the role capability list shown on the limited dashboard.
 * Input: role id from `/api/me` and active language.
 * Output: simple user-facing capability bullets.
 */
function getRoleCapabilities(role: string | null, language: CopyLanguage): string[] {
  return ROLE_CAPABILITIES[role ?? 'member']?.[language] ?? ROLE_CAPABILITIES.member[language];
}

/**
 * Renders one tenant context row in the role dashboard.
 * Input: row label and value.
 * Output: static display row.
 */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

/**
 * Renders the limited tenant-role dashboard.
 * Input: trusted `/api/me` identity, tenant context, role, and logout callback.
 * Output: role-only dashboard with no admin navigation or analytics.
 */
export default function TenantMemberDashboard({
  userName,
  userEmail,
  tenantName,
  role,
  onLogout,
  catalogMode,
}: TenantMemberDashboardProps) {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  /** Show the catalog entry point whenever the tenant has activated the service. */
  const showCatalogButton = catalogMode !== undefined && catalogMode !== 'inactive';
  const copy = COPY[language];
  const roleLabel = getRoleLabel(role, language);
  const capabilities = getRoleCapabilities(role, language);

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#edf1fc] px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center justify-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <PendingInvitationsPanel />
          <div className="mb-5 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {copy.badge}
          </div>
          <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.body}
          </p>

          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            <DetailRow label={copy.tenantLabel} value={tenantName ?? copy.fallbackTenant} />
            <DetailRow label={copy.roleLabel} value={roleLabel} />
            <DetailRow label={copy.emailLabel} value={userEmail} />
          </dl>

          <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-950">{copy.capabilitiesTitle}</h2>
            <ul className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              {capabilities.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="material-symbols-rounded !text-[18px] text-sky-600">check_circle</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="min-w-0 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{userName}</span>
            </div>
            {/* Benefits Catalog entry point - visible when tenant has activated the service */}
            {showCatalogButton && (
              <button
                type="button"
                onClick={() => navigate('/member-catalog')}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                View Benefits Catalog
              </button>
            )}
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {copy.signOut}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
