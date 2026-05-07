/**
 * Shows a limited dashboard for invited tenant members with the basic tenant context.
 * This prevents member-role users from seeing tenant-admin analytics or controls.
 */
import { useLanguage } from '../i18n/LanguageContext';

interface TenantMemberDashboardProps {
  userName: string;
  userEmail: string;
  tenantName: string | null;
  role: string | null;
  onLogout: () => Promise<void>;
}

const COPY = {
  he: {
    badge: 'חבר צוות',
    title: 'נכנסת כדייר חבר',
    tenantLabel: 'שייך לארגון',
    roleLabel: 'תפקיד',
    emailLabel: 'אימייל',
    fallbackTenant: 'ארגון ללא שם',
    fallbackRole: 'member',
    body: 'זהו דשבורד בסיסי לחברי צוות. פעולות ניהול, הזמנת חברים ואנליטיקות עסקיות זמינות רק למנהלי הארגון.',
    signOut: 'התנתקות',
  },
  en: {
    badge: 'Team member',
    title: 'You are signed in as a tenant member',
    tenantLabel: 'Tenant',
    roleLabel: 'Role',
    emailLabel: 'Email',
    fallbackTenant: 'Unnamed tenant',
    fallbackRole: 'member',
    body: 'This is a basic dashboard for invited team members. Admin actions, member invites, and business analytics are only available to tenant admins.',
    signOut: 'Sign out',
  },
} as const;

/**
 * Renders one tenant context row in the member dashboard.
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
 * Renders the tenant-member placeholder dashboard.
 * Input: trusted `/api/me` identity, tenant context, role, and logout callback.
 * Output: member-only dashboard with no admin navigation or analytics.
 */
export default function TenantMemberDashboard({
  userName,
  userEmail,
  tenantName,
  role,
  onLogout,
}: TenantMemberDashboardProps) {
  const { language, isRTL } = useLanguage();
  const copy = COPY[language];

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#edf1fc] px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center justify-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
            <DetailRow label={copy.roleLabel} value={role ?? copy.fallbackRole} />
            <DetailRow label={copy.emailLabel} value={userEmail} />
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="min-w-0 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{userName}</span>
            </div>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {copy.signOut}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
