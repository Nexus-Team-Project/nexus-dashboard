/**
 * Shows real tenant members, roles, and permissions from Mongo domain APIs.
 * Tenant admins use this page to review access and start the invite flow.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantMembersApi, type TenantMemberListItem, type TenantRole, type TenantRolePermissions } from '../lib/api';
import { getTenantRoleLabel, TENANT_ROLE_ORDER } from '../lib/tenantRoles';
import { useLanguage } from '../i18n/LanguageContext';

const COPY = {
  he: {
    settings: 'הגדרות',
    title: 'תפקידים והרשאות',
    body: 'ראה מי יכול לעבוד בסביבת העבודה ואילו הרשאות יש לכל תפקיד.',
    invite: 'הזמן חברים',
    roles: 'תפקידים',
    members: 'חברי צוות',
    search: 'חפש לפי שם או אימייל',
    all: 'הכל',
    status: 'סטטוס',
    role: 'תפקיד',
    name: 'שם',
    joined: 'הצטרף',
    empty: 'אין חברים שתואמים לחיפוש.',
    loading: 'טוען חברים והרשאות...',
  },
  en: {
    settings: 'Settings',
    title: 'Roles and permissions',
    body: 'See who can work in this workspace and what each role can access.',
    invite: 'Invite members',
    roles: 'Roles',
    members: 'Team members',
    search: 'Search by name or email',
    all: 'All',
    status: 'Status',
    role: 'Role',
    name: 'Name',
    joined: 'Joined',
    empty: 'No members match this search.',
    loading: 'Loading members and permissions...',
  },
} as const;

/**
 * Builds a stable avatar initial from member identity fields.
 * Input: member row from the backend.
 * Output: one uppercase character for the avatar.
 */
function getInitial(member: TenantMemberListItem): string {
  return (member.displayName ?? member.email).trim().charAt(0).toUpperCase();
}

/**
 * Formats date text for the active language.
 * Input: ISO date and dashboard language.
 * Output: localized date string.
 */
function formatDate(value: string, language: 'he' | 'en'): string {
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', { dateStyle: 'medium' }).format(new Date(value));
}

/**
 * Renders tenant role and member access management.
 * Input: none.
 * Output: responsive page backed by `/api/v1/tenant/*`.
 */
export default function RolesPermissions() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const copy = COPY[language];
  const [members, setMembers] = useState<TenantMemberListItem[]>([]);
  const [roles, setRoles] = useState<TenantRolePermissions[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<TenantRole | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Loads tenant members and role permissions together.
     * Input: authenticated session from dashboard context.
     * Output: local page state for table and role cards.
     */
    const loadAccessData = async () => {
      try {
        setLoading(true);
        const [memberResult, roleResult] = await Promise.all([
          tenantMembersApi.list(),
          tenantMembersApi.roles(),
        ]);
        setMembers(memberResult.members);
        setRoles(roleResult.roles);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    void loadAccessData();
  }, []);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery = !query
        || member.email.toLowerCase().includes(query)
        || (member.displayName ?? '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesRole = roleFilter === 'all' || member.roles.includes(roleFilter);
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [members, roleFilter, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        {copy.loading}
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <button type="button" onClick={() => navigate('/settings')} className="hover:text-primary">
              {copy.settings}
            </button>
            <span className="material-icons text-sm">{isRTL ? 'chevron_left' : 'chevron_right'}</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{copy.title}</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-normal text-slate-950 dark:text-white">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{copy.body}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings/roles-permissions/invite')}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          <span className="material-icons text-lg">person_add</span>
          {copy.invite}
        </button>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {TENANT_ROLE_ORDER.map((role) => {
          const permissionCount = roles.find((item) => item.role === role)?.permissions.length ?? 0;
          return (
            <article key={role} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-card-dark">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{getTenantRoleLabel(role, language)}</p>
              <p className="mt-1 text-xs text-slate-500">{permissionCount} permissions</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">{copy.members}</h2>
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:justify-end">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
              placeholder={copy.search}
              type="search"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              aria-label={copy.status}
            >
              <option value="all">{copy.all}</option>
              <option value="active">active</option>
              <option value="suspended">suspended</option>
              <option value="deactivated">deactivated</option>
            </select>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as TenantRole | 'all')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              aria-label={copy.role}
            >
              <option value="all">{copy.all}</option>
              {TENANT_ROLE_ORDER.map((role) => (
                <option key={role} value={role}>{getTenantRoleLabel(role, language)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/40">
              <tr>
                <th className="px-5 py-3 text-start font-semibold">{copy.name}</th>
                <th className="px-5 py-3 text-start font-semibold">{copy.role}</th>
                <th className="px-5 py-3 text-start font-semibold">{copy.status}</th>
                <th className="px-5 py-3 text-start font-semibold">{copy.joined}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map((member) => (
                <tr key={member.tenantMemberId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                        {getInitial(member)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-950 dark:text-white">{member.displayName ?? member.email}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                    {member.roles.map((role) => getTenantRoleLabel(role, language)).join(', ') || '-'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {member.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(member.joinedAt, language)}</td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">{copy.empty}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
