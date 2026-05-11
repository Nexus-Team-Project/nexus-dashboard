/**
 * Shows tenant role definitions, permission counts, and pending invitations.
 * The member table has moved to the Members page (/users).
 * This page focuses on who can do what and which invitations are outstanding.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  tenantMembersApi,
  type PendingInvitationItem,
  type TenantRolePermissions,
} from '../lib/api';
import { getTenantRoleLabel, TENANT_ROLE_ORDER } from '../lib/tenantRoles';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const COPY = {
  he: {
    settings: 'הגדרות',
    title: 'תפקידים והרשאות',
    body: 'ראה מי יכול לעבוד בסביבת העבודה ואילו הרשאות יש לכל תפקיד.',
    invite: 'הזמן חברים',
    permissions: 'הרשאות',
    pendingInvites: 'הזמנות ממתינות',
    pendingHasMore: 'ועוד...',
    loading: 'טוען תפקידים...',
  },
  en: {
    settings: 'Settings',
    title: 'Roles and permissions',
    body: 'See who can work in this workspace and what each role can access.',
    invite: 'Invite members',
    permissions: 'permissions',
    pendingInvites: 'Pending invitations',
    pendingHasMore: 'and more…',
    loading: 'Loading roles...',
  },
} as const;

/**
 * Renders role permission cards and the pending invitations panel.
 * Input: none — reads tenant auth context from AuthContext.
 * Output: role cards grid + amber pending invitations chips.
 */
export default function RolesPermissions() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { me } = useAuth();
  const copy = COPY[language];
  const canInviteMembers = me?.authorization.canManageMembers === true;

  const [roles, setRoles] = useState<TenantRolePermissions[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitationItem[]>([]);
  const [pendingHasMore, setPendingHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /** Loads role permissions and pending invitations on mount. */
    const load = async () => {
      try {
        const [rolesResult, pendingResult] = await Promise.all([
          tenantMembersApi.roles(),
          tenantMembersApi.pendingInvitations(),
        ]);
        setRoles(rolesResult.roles);
        setPendingInvites(pendingResult.pendingInvitations);
        setPendingHasMore(pendingResult.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roles');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-56 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-96 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-10 w-36 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        {/* Role cards skeleton */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-card-dark space-y-2">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
        {/* Pending panel skeleton */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-card-dark space-y-3">
          <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-7 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <button type="button" onClick={() => navigate('/settings')} className="cursor-pointer hover:text-primary">
              {copy.settings}
            </button>
            <span className="material-icons text-sm">{isRTL ? 'chevron_left' : 'chevron_right'}</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{copy.title}</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-normal text-slate-950 dark:text-white">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{copy.body}</p>
        </div>
        {canInviteMembers && (
          <button
            type="button"
            onClick={() => navigate('/settings/roles-permissions/invite')}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            <span className="material-icons text-lg">person_add</span>
            {copy.invite}
          </button>
        )}
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Role permission summary cards */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {TENANT_ROLE_ORDER.map((role) => {
          const permissionCount = roles.find((item) => item.role === role)?.permissions.length ?? 0;
          return (
            <article
              key={role}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-card-dark"
            >
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {getTenantRoleLabel(role, language)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{permissionCount} {copy.permissions}</p>
            </article>
          );
        })}
      </section>

      {/* Pending invitations panel */}
      {pendingInvites.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800/40 dark:bg-amber-900/20">
          <h2 className="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
            {copy.pendingInvites} ({pendingInvites.length}{pendingHasMore ? '+' : ''})
          </h2>
          <div className="flex flex-wrap gap-2">
            {pendingInvites.map((inv) => (
              <span
                key={inv.invitationId || inv.email}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              >
                <span className="material-icons text-sm">mail</span>
                {inv.email}
                {inv.roles.length > 0 && <span className="text-amber-500">·</span>}
                {inv.roles.map((r) => getTenantRoleLabel(r, language)).join(', ')}
              </span>
            ))}
            {pendingHasMore && (
              <span className="self-center text-xs text-amber-600">{copy.pendingHasMore}</span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
