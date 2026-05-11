/**
 * Table and mobile card view for the Registered Members tab on the Members page.
 * Columns: Name+Email, Roles, Status, Invitation status, Joined.
 * Reuses the visual patterns from the original RolesPermissions member table.
 */
import type { TenantMemberListItem, TenantRole } from '../../lib/api';
import { getTenantRoleLabel } from '../../lib/tenantRoles';

export interface RegisteredTableProps {
  members: TenantMemberListItem[];
  loading: boolean;
  language: 'he' | 'en';
}

const COPY = {
  he: {
    name: 'שם',
    roles: 'תפקידים',
    status: 'סטטוס',
    invitation: 'הזמנה',
    joined: 'הצטרף',
    empty: 'אין חברים רשומים עדיין.',
    pending: 'ממתין לאישור',
    accepted: 'אושר',
    expired: 'פג תוקף',
    revoked: 'בוטל',
    noInvite: 'ללא הזמנה',
  },
  en: {
    name: 'Name',
    roles: 'Roles',
    status: 'Status',
    invitation: 'Invite',
    joined: 'Joined',
    empty: 'No registered members yet.',
    pending: 'Pending',
    accepted: 'Accepted',
    expired: 'Expired',
    revoked: 'Revoked',
    noInvite: 'No invite',
  },
} as const;

const MEMBER_STATUS_CLASSES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  deactivated: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const INVITE_STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  expired: 'bg-slate-100 text-slate-600',
  revoked: 'bg-red-50 text-red-700',
};

/**
 * Returns one uppercase character for the avatar circle.
 * Input: member row.
 * Output: first letter of display name or email.
 */
function getInitial(member: TenantMemberListItem): string {
  return (member.displayName ?? member.email).trim().charAt(0).toUpperCase();
}

/**
 * Formats an ISO date string for the active language.
 * Input: ISO string and language.
 * Output: medium-length localized date.
 */
function fmtDate(iso: string, language: 'he' | 'en'): string {
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', { dateStyle: 'medium' }).format(
    new Date(iso),
  );
}

/**
 * Returns the invite status label and CSS classes.
 * Input: raw status string and language.
 * Output: label and Tailwind class string.
 */
function inviteChip(status: string | null, language: 'he' | 'en') {
  const copy = COPY[language];
  const key = status ?? '';
  const label = { pending: copy.pending, accepted: copy.accepted, expired: copy.expired, revoked: copy.revoked }[key] ?? copy.noInvite;
  const cls = INVITE_STATUS_CLASSES[key] ?? 'bg-slate-100 text-slate-600';
  return { label, cls };
}

/**
 * Renders the registered members table (desktop) and mobile cards.
 * Input: member list, loading state, and language.
 * Output: responsive table/card display.
 */
export default function RegisteredTable({ members, loading, language }: RegisteredTableProps) {
  const copy = COPY[language];

  return (
    <>
      {/* Desktop table */}
      <div className={`hidden overflow-x-auto md:block transition-opacity duration-150 ${loading ? 'opacity-50' : ''}`}>
        <table className="w-full min-w-[780px] text-sm" style={{ borderSpacing: 0 }}>
          <thead className="border-y-2 border-violet-200/60 bg-violet-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-2.5 text-start">{copy.name}</th>
              <th className="px-6 py-2.5 text-start">{copy.roles}</th>
              <th className="px-6 py-2.5 text-start">{copy.status}</th>
              <th className="px-6 py-2.5 text-start">{copy.invitation}</th>
              <th className="px-6 py-2.5 text-start">{copy.joined}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((m) => {
              const invite = inviteChip(m.invitationStatus, language);
              return (
                <tr key={m.tenantMemberId} className="cursor-default transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {getInitial(m)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{m.displayName ?? m.email}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {m.roles.map((r: TenantRole) => (
                        <span key={r} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {getTenantRoleLabel(r, language)}
                        </span>
                      ))}
                      {m.roles.length === 0 && <span className="text-slate-400">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${MEMBER_STATUS_CLASSES[m.status] ?? MEMBER_STATUS_CLASSES.deactivated}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${invite.cls}`}>{invite.label}</span>
                  </td>
                  <td className="px-6 py-2.5 text-slate-500">{fmtDate(m.joinedAt, language)}</td>
                </tr>
              );
            })}
            {members.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">{copy.empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className={`grid gap-3 p-3 md:hidden transition-opacity duration-150 ${loading ? 'opacity-50' : ''}`}>
        {members.map((m) => {
          const invite = inviteChip(m.invitationStatus, language);
          return (
            <article key={m.tenantMemberId} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  {getInitial(m)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{m.displayName ?? m.email}</p>
                  <p className="truncate text-xs text-slate-500">{m.email}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">{copy.roles}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {m.roles.map((r: TenantRole) => getTenantRoleLabel(r, language)).join(', ') || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">{copy.status}</span>
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${MEMBER_STATUS_CLASSES[m.status] ?? MEMBER_STATUS_CLASSES.deactivated}`}>{m.status}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">{copy.invitation}</span>
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${invite.cls}`}>{invite.label}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">{copy.joined}</span>
                  <span className="text-slate-700 dark:text-slate-300">{fmtDate(m.joinedAt, language)}</span>
                </div>
              </div>
            </article>
          );
        })}
        {members.length === 0 && !loading && (
          <div className="py-8 text-center text-sm text-slate-500">{copy.empty}</div>
        )}
      </div>
    </>
  );
}
