/**
 * Shows pending workspace invitations and the "Invite members" action.
 * The member table has moved to the Members page (/users).
 * Role definitions and permission details are shown on the Invite page.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  tenantMembersApi,
  tenantJoinRequestsApi,
  type PendingInvitationItem,
  type TenantJoinRequestItem,
} from '../lib/api';
import { getTenantRoleLabel } from '../lib/tenantRoles';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { PlanSummaryCard } from '../components/plan/PlanSummaryCard';

const COPY = {
  he: {
    settings: 'הגדרות',
    title: 'תפקידים והרשאות',
    body: 'ניהול הגישה לסביבת העבודה.',
    invite: 'הזמן חברים',
    pendingInvites: 'הזמנות ממתינות',
    pendingHasMore: 'ועוד...',
    invitePrompt: 'כדי להוסיף חברים לסביבת העבודה, לחץ על כפתור "הזמן חברים". הזמנות פתוחות יופיעו כאן.',
    joinRequests: 'בקשות הצטרפות מארנק',
    joinRequestsHint: 'משתמשים שביקשו להצטרף לארגון דרך הארנק. אישור יוסיף אותם כחברים.',
    approve: 'אשר',
    deny: 'דחה',
    denyReason: 'סיבת דחייה (לא חובה)',
    cancel: 'ביטול',
  },
  en: {
    settings: 'Settings',
    title: 'Roles and permissions',
    body: 'Manage who has access to this workspace.',
    invite: 'Invite members',
    pendingInvites: 'Pending invitations',
    pendingHasMore: 'and more…',
    invitePrompt: 'To add members to this workspace, press the "Invite members" button above. Pending invitations will appear here.',
    joinRequests: 'Wallet join requests',
    joinRequestsHint: 'Users who asked to join your tenant from the wallet. Approve to add them as members.',
    approve: 'Approve',
    deny: 'Deny',
    denyReason: 'Deny reason (optional)',
    cancel: 'Cancel',
  },
} as const;

/**
 * Renders the plan summary card, invite button, and pending invitations panel.
 * Input: none — reads tenant auth context from AuthContext.
 * Output: header with invite action + amber pending invitations chips.
 */
export default function RolesPermissions() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { me } = useAuth();
  const copy = COPY[language];
  const canInviteMembers = me?.authorization.canManageMembers === true;

  const [pendingInvites, setPendingInvites] = useState<PendingInvitationItem[]>([]);
  const [pendingHasMore, setPendingHasMore] = useState(false);
  const [joinRequests, setJoinRequests] = useState<TenantJoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    /** Loads pending invitations + join requests on mount. */
    const load = async () => {
      try {
        const [pendingResult, joinResult] = await Promise.all([
          tenantMembersApi.pendingInvitations(),
          // Best-effort: tenants without the permission silently get []
          tenantJoinRequestsApi.list().catch(() => ({ requests: [] })),
        ]);
        setPendingInvites(pendingResult.pendingInvitations);
        setPendingHasMore(pendingResult.hasMore);
        setJoinRequests(joinResult.requests);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  /** Approve a join request. Removes the row optimistically. */
  const approveJoinRequest = async (id: string): Promise<void> => {
    setActingId(id);
    try {
      await tenantJoinRequestsApi.approve(id);
      setJoinRequests((rows) => rows.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActingId(null);
    }
  };

  /** Deny a join request with an optional reason. */
  const denyJoinRequest = async (id: string): Promise<void> => {
    const reason = window.prompt(copy.denyReason) ?? undefined;
    setActingId(id);
    try {
      await tenantJoinRequestsApi.deny(id, reason || undefined);
      setJoinRequests((rows) => rows.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny');
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl space-y-6 animate-pulse">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-56 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-80 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-10 w-36 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-card-dark space-y-4">
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800" />
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

      {/* Plan + seat summary (tenant admins only) */}
      {me?.context.isTenant && (
        <PlanSummaryCard
          plan={me.context.plan}
          seats={me.context.seats}
          isLoading={!me.context.plan}
        />
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Invite prompt — shown when there are no pending invitations */}
      {pendingInvites.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-card-dark">
          <span className="material-icons mb-3 text-4xl text-slate-300 dark:text-slate-600">person_add</span>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{copy.invitePrompt}</p>
        </div>
      )}

      {/* Plan #4: wallet join requests */}
      {joinRequests.length > 0 && (
        <section className="rounded-lg border border-violet-200 bg-violet-50 p-4 shadow-sm dark:border-violet-800/40 dark:bg-violet-900/20">
          <h2 className="mb-1 text-sm font-semibold text-violet-800 dark:text-violet-200">
            {copy.joinRequests} ({joinRequests.length})
          </h2>
          <p className="mb-3 text-xs text-violet-700/80 dark:text-violet-300/80">{copy.joinRequestsHint}</p>
          <div className="space-y-2">
            {joinRequests.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-lg border border-violet-200 bg-white p-3 dark:bg-violet-900/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {r.displayName ?? r.email}
                  </div>
                  {r.displayName && (
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">{r.email}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { void approveJoinRequest(r.id); }}
                    disabled={actingId === r.id}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-40"
                  >
                    {copy.approve}
                  </button>
                  <button
                    type="button"
                    onClick={() => { void denyJoinRequest(r.id); }}
                    disabled={actingId === r.id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    {copy.deny}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
