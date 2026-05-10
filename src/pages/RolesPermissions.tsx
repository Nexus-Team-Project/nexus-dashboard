/**
 * Shows real tenant members, roles, and permissions from Mongo domain APIs.
 * Members are loaded page-by-page from the server (25 per page) so the table
 * stays fast at any tenant size. Pending invitations appear above the table
 * in a separate panel. All filters are applied server-side.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  tenantMembersApi,
  type PendingInvitationItem,
  type TenantMemberListItem,
  type TenantRole,
  type TenantRolePermissions,
  type PaginationMeta,
} from '../lib/api';
import { getTenantRoleLabel, TENANT_ROLE_ORDER } from '../lib/tenantRoles';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useDebouncedValue } from '../lib/hooks/useDebouncedValue';

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
    invitation: 'הזמנה',
    role: 'תפקיד',
    name: 'שם',
    joined: 'הצטרף',
    pending: 'ממתין לאישור',
    accepted: 'אושר',
    expired: 'פג תוקף',
    revoked: 'בוטל',
    none: 'ללא הזמנה',
    empty: 'אין חברים שתואמים לחיפוש.',
    loading: 'טוען חברים והרשאות...',
    pendingInvites: 'הזמנות ממתינות',
    pendingInvitesHasMore: 'ועוד...',
    pageOf: (page: number, pages: number) => `עמוד ${page} מתוך ${pages}`,
    prev: 'הקודם',
    next: 'הבא',
    permissions: 'הרשאות',
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
    invitation: 'Invite',
    role: 'Role',
    name: 'Name',
    joined: 'Joined',
    pending: 'Pending',
    accepted: 'Accepted',
    expired: 'Expired',
    revoked: 'Revoked',
    none: 'No invite',
    empty: 'No members match this search.',
    loading: 'Loading members and permissions...',
    pendingInvites: 'Pending invitations',
    pendingInvitesHasMore: 'and more…',
    pageOf: (page: number, pages: number) => `Page ${page} of ${pages}`,
    prev: 'Prev',
    next: 'Next',
    permissions: 'Permissions',
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
 * Returns localized invite status text and color classes.
 * Input: invitation status from Mongo plus active dashboard language.
 * Output: label and style for a status chip.
 */
function getInviteStatus(status: string | null, language: 'he' | 'en'): { label: string; className: string } {
  const copy = COPY[language];
  switch (status) {
    case 'pending':
      return { label: copy.pending, className: 'bg-amber-50 text-amber-700' };
    case 'accepted':
      return { label: copy.accepted, className: 'bg-emerald-50 text-emerald-700' };
    case 'expired':
      return { label: copy.expired, className: 'bg-slate-100 text-slate-600' };
    case 'revoked':
      return { label: copy.revoked, className: 'bg-red-50 text-red-700' };
    default:
      return { label: copy.none, className: 'bg-slate-100 text-slate-600' };
  }
}

/**
 * Returns the membership status chip style.
 * Input: member status from Mongo.
 * Output: Tailwind classes for the visible chip.
 */
function getMemberStatusClassName(status: string): string {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700';
  if (status === 'suspended') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

const PAGE_SIZE = 25;

/**
 * Renders tenant role and member access management with server-side pagination.
 * Filters (search, status, role) are applied on the backend; page state lives
 * in the URL so back-navigation and link-sharing work correctly.
 *
 * Input: none.
 * Output: responsive paginated page backed by `/api/v1/tenant/*`.
 */
export default function RolesPermissions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, isRTL } = useLanguage();
  const { me } = useAuth();
  const copy = COPY[language];
  const canInviteMembers = me?.authorization.canManageMembers === true;

  // Read filter + page state from URL params for shareable links and back-nav.
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const searchInput = searchParams.get('q') ?? '';
  const statusFilter = searchParams.get('status') ?? 'all';
  const roleFilter = (searchParams.get('role') ?? 'all') as TenantRole | 'all';

  // Debounce the search string so each keystroke doesn't fire a request.
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const [members, setMembers] = useState<TenantMemberListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [roles, setRoles] = useState<TenantRolePermissions[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitationItem[]>([]);
  const [pendingHasMore, setPendingHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the fetch generation so stale responses from slow requests are dropped.
  const fetchGenRef = useRef(0);

  /**
   * Fetches the paged member list and pending invitations from the backend.
   * Drops responses that arrive out of order using a generation counter.
   * Input: current filter and page values.
   * Output: updates members, pagination, and pending-invitations state.
   */
  const fetchMembers = useCallback(async (
    currentPage: number,
    search: string,
    status: string,
    role: string,
    isFirstLoad: boolean,
  ) => {
    fetchGenRef.current += 1;
    const gen = fetchGenRef.current;

    if (isFirstLoad) setInitialLoading(true);
    else setPageLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(status !== 'all' ? { status } : {}),
        ...(role !== 'all' ? { role: role as TenantRole } : {}),
      };

      const [memberResult, roleResult, pendingResult] = await Promise.all([
        tenantMembersApi.list(params),
        isFirstLoad ? tenantMembersApi.roles() : Promise.resolve(null),
        isFirstLoad ? tenantMembersApi.pendingInvitations() : Promise.resolve(null),
      ]);

      if (gen !== fetchGenRef.current) return; // stale response, discard

      setMembers(memberResult.members);
      setPagination(memberResult.pagination);
      setError(null);

      if (roleResult) setRoles(roleResult.roles);
      if (pendingResult) {
        setPendingInvites(pendingResult.pendingInvitations);
        setPendingHasMore(pendingResult.hasMore);
      }
    } catch (fetchError) {
      if (gen !== fetchGenRef.current) return;
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load members');
    } finally {
      if (gen === fetchGenRef.current) {
        setInitialLoading(false);
        setPageLoading(false);
      }
    }
  }, []);

  // Re-fetch whenever the debounced search, status filter, role filter, or page changes.
  useEffect(() => {
    void fetchMembers(page, debouncedSearch, statusFilter, roleFilter, initialLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, statusFilter, roleFilter]);

  /**
   * Updates a URL search param and resets page to 1 for filter changes.
   * Input: param name and new value.
   * Output: URL updated, pagination resets.
   */
  const setFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'all' || value === '') next.delete(key);
      else next.set(key, value);
      next.delete('page'); // reset to page 1 on any filter change
      return next;
    });
  };

  /**
   * Changes the current page in the URL.
   * Input: target page number.
   * Output: URL updated; useEffect triggers a new fetch.
   */
  const goToPage = (target: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(target));
      return next;
    });
  };

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        {copy.loading}
      </div>
    );
  }

  const totalPages = pagination?.pages ?? 1;
  const showPagination = totalPages > 1;

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
        {canInviteMembers && (
          <button
            type="button"
            onClick={() => navigate('/settings/roles-permissions/invite')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            <span className="material-icons text-lg">person_add</span>
            {copy.invite}
          </button>
        )}
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Role permission summary cards */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {TENANT_ROLE_ORDER.map((role) => {
          const permissionCount = roles.find((item) => item.role === role)?.permissions.length ?? 0;
          return (
            <article key={role} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-card-dark">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{getTenantRoleLabel(role, language)}</p>
              <p className="mt-1 text-xs text-slate-500">{permissionCount} {copy.permissions}</p>
            </article>
          );
        })}
      </section>

      {/* Pending invitations panel — shown only when invitations exist */}
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
                {inv.roles.length > 0 && (
                  <span className="text-amber-500">·</span>
                )}
                {inv.roles.map((r) => getTenantRoleLabel(r, language)).join(', ')}
              </span>
            ))}
            {pendingHasMore && (
              <span className="self-center text-xs text-amber-600">{copy.pendingInvitesHasMore}</span>
            )}
          </div>
        </section>
      )}

      {/* Member table with server-side filters and pagination */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">{copy.members}</h2>
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:justify-end">
            <input
              value={searchInput}
              onChange={(event) => setFilter('q', event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
              placeholder={copy.search}
              type="search"
            />
            <select
              value={statusFilter}
              onChange={(event) => setFilter('status', event.target.value)}
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
              onChange={(event) => setFilter('role', event.target.value)}
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

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className={`w-full min-w-[780px] text-sm transition-opacity duration-150 ${pageLoading ? 'opacity-50' : 'opacity-100'}`}>
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/40">
              <tr>
                <th className="px-5 py-3 text-start font-semibold">{copy.name}</th>
                <th className="px-5 py-3 text-start font-semibold">{copy.role}</th>
                <th className="px-5 py-3 text-start font-semibold">{copy.status}</th>
                <th className="px-5 py-3 text-start font-semibold">{copy.invitation}</th>
                <th className="px-5 py-3 text-start font-semibold">{copy.joined}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((member) => {
                const inviteStatus = getInviteStatus(member.invitationStatus, language);
                return (
                  <tr key={member.tenantMemberId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
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
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getMemberStatusClassName(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inviteStatus.className}`}>
                        {inviteStatus.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(member.joinedAt, language)}</td>
                  </tr>
                );
              })}
              {members.length === 0 && !pageLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">{copy.empty}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className={`grid gap-3 p-3 transition-opacity duration-150 md:hidden ${pageLoading ? 'opacity-50' : 'opacity-100'}`}>
          {members.map((member) => {
            const inviteStatus = getInviteStatus(member.invitationStatus, language);
            return (
              <article key={member.tenantMemberId} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                    {getInitial(member)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">{member.displayName ?? member.email}</p>
                    <p className="truncate text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">{copy.role}</span>
                    <span className="font-semibold text-slate-700">{member.roles.map((role) => getTenantRoleLabel(role, language)).join(', ') || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">{copy.status}</span>
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${getMemberStatusClassName(member.status)}`}>{member.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">{copy.invitation}</span>
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${inviteStatus.className}`}>{inviteStatus.label}</span>
                  </div>
                </div>
              </article>
            );
          })}
          {members.length === 0 && !pageLoading && (
            <div className="px-5 py-8 text-center text-sm text-slate-500">{copy.empty}</div>
          )}
        </div>

        {/* Pagination footer — only shown when more than one page exists */}
        {showPagination && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-800">
            <button
              type="button"
              disabled={page <= 1 || pageLoading}
              onClick={() => goToPage(page - 1)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={copy.prev}
            >
              <span className="material-icons text-lg">{isRTL ? 'chevron_right' : 'chevron_left'}</span>
              {copy.prev}
            </button>

            <span className="text-sm text-slate-500">
              {copy.pageOf(page, totalPages)}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || pageLoading}
              onClick={() => goToPage(page + 1)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={copy.next}
            >
              {copy.next}
              <span className="material-icons text-lg">{isRTL ? 'chevron_left' : 'chevron_right'}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
