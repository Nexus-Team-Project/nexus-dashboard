/**
 * Table and mobile card view for the Registered Members tab on the Members page.
 * Columns: Name+Email, Roles, Status, Invitation status, Joined.
 * Reuses the visual patterns from the original RolesPermissions member table.
 */
import { useRef, useState } from 'react';
import type { TenantMemberListItem, TenantRole } from '../../lib/api';
import { getTenantRoleLabel } from '../../lib/tenantRoles';

export interface RegisteredTableProps {
  members: TenantMemberListItem[];
  loading: boolean;
  language: 'he' | 'en';
  canManage?: boolean;
  /** Email of the currently logged-in user — their own row never shows a Remove option. */
  currentUserEmail?: string;
  onEditEmail?: (member: TenantMemberListItem) => void;
  onEditRoles?: (member: TenantMemberListItem) => void;
  onRemove?: (member: TenantMemberListItem) => void;
}

const COPY = {
  he: {
    name: 'שם',
    roles: 'תפקידים',
    status: 'סטטוס',
    invitation: 'הזמנה',
    joined: 'הצטרף',
    actions: 'פעולות',
    empty: 'אין חברים רשומים עדיין.',
    pending: 'ממתין לאישור',
    accepted: 'אושר',
    expired: 'פג תוקף',
    revoked: 'בוטל',
    noInvite: 'ללא הזמנה',
    editEmail: 'שינוי אימייל',
    editRoles: 'שינוי תפקידים',
    remove: 'הסר חבר',
  },
  en: {
    name: 'Name',
    roles: 'Roles',
    status: 'Status',
    invitation: 'Invite',
    joined: 'Joined',
    actions: 'Actions',
    empty: 'No registered members yet.',
    pending: 'Pending',
    accepted: 'Accepted',
    expired: 'Expired',
    revoked: 'Revoked',
    noInvite: 'No invite',
    editEmail: 'Change email',
    editRoles: 'Change roles',
    remove: 'Remove member',
  },
} as const;

/** Invite statuses where email and role edits are allowed. */
const ACTIONABLE_INVITE_STATUSES = ['pending', 'expired'];

/**
 * Three-dot action menu on each member row.
 * Remove is always available. Edit email + edit roles only when invite is pending/expired.
 * Input: member row, language, and optional action callbacks.
 * Output: dropdown with contextual options.
 */
function RowMenu({
  member,
  language,
  onEditEmail,
  onEditRoles,
  onRemove,
}: {
  member: TenantMemberListItem;
  language: 'he' | 'en';
  onEditEmail?: (m: TenantMemberListItem) => void;
  onEditRoles?: (m: TenantMemberListItem) => void;
  onRemove?: (m: TenantMemberListItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const copy = COPY[language];
  const canEditInvite = ACTIONABLE_INVITE_STATUSES.includes(member.invitationStatus ?? '');

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const right = window.innerWidth - r.right;
      // 64px bottom buffer accounts for the wizard bar fixed at the bottom.
      const spaceBelow = window.innerHeight - r.bottom - 64;
      if (spaceBelow < 160) {
        setDropPos({ bottom: window.innerHeight - r.top + 4, right });
      } else {
        setDropPos({ top: r.bottom + 4, right });
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="cursor-pointer rounded p-1 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
        aria-label={copy.actions}
      >
        <span className="material-icons text-xl">more_horiz</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="fixed z-20 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={dropPos.bottom !== undefined
              ? { bottom: dropPos.bottom, right: dropPos.right }
              : { top: dropPos.top, right: dropPos.right }}
          >
            {canEditInvite && onEditEmail && (
              <button
                type="button"
                onClick={() => { setOpen(false); onEditEmail(member); }}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <span className="material-icons text-sm text-slate-500">edit</span>
                <span className="font-medium">{copy.editEmail}</span>
              </button>
            )}
            {canEditInvite && onEditRoles && (
              <button
                type="button"
                onClick={() => { setOpen(false); onEditRoles(member); }}
                className="flex w-full cursor-pointer items-center gap-3 border-t border-slate-100 px-4 py-3 text-start text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <span className="material-icons text-sm text-slate-500">manage_accounts</span>
                <span className="font-medium">{copy.editRoles}</span>
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => { setOpen(false); onRemove(member); }}
                className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 ${canEditInvite ? 'border-t border-slate-100 dark:border-slate-700' : ''}`}
              >
                <span className="material-icons text-sm">person_remove</span>
                <span className="font-medium">{copy.remove}</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

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
export default function RegisteredTable({ members, loading, language, canManage, currentUserEmail, onEditEmail, onEditRoles, onRemove }: RegisteredTableProps) {
  const copy = COPY[language];

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[780px] text-sm" style={{ borderSpacing: 0 }}>
          <thead className="border-y-2 border-violet-200/60 bg-violet-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-2.5 text-start">{copy.name}</th>
              <th className="px-6 py-2.5 text-start">{copy.roles}</th>
              <th className="px-6 py-2.5 text-start">{copy.status}</th>
              <th className="px-6 py-2.5 text-start">{copy.invitation}</th>
              <th className="px-6 py-2.5 text-start">{copy.joined}</th>
              {canManage && <th className="w-12 px-6 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-slate-800">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3"><div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-3"><div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-3"><div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-3"><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" /></td>
                {canManage && <td className="px-6 py-3" />}
              </tr>
            ))}
            {!loading && members.map((m) => {
              const invite = inviteChip(m.invitationStatus, language);
              return (
                <tr key={m.tenantMemberId} className="group cursor-default transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
                  {canManage && (
                    <td className="px-6 py-2.5 text-end">
                      {m.email.toLowerCase() !== (currentUserEmail ?? '').toLowerCase() && (
                        <RowMenu
                          member={m}
                          language={language}
                          onEditEmail={onEditEmail}
                          onEditRoles={onEditRoles}
                          onRemove={onRemove}
                        />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {!loading && members.length === 0 && (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="px-6 py-10 text-center text-sm text-slate-500">{copy.empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 p-3 md:hidden">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-44 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
        {!loading && members.map((m) => {
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
              {canManage && m.email.toLowerCase() !== (currentUserEmail ?? '').toLowerCase() && (onEditEmail || onEditRoles || onRemove) && (() => {
                const canEdit = ACTIONABLE_INVITE_STATUSES.includes(m.invitationStatus ?? '');
                const effectiveRemove = onRemove;
                const hasActions = (canEdit && (onEditEmail || onEditRoles)) || effectiveRemove;
                if (!hasActions) return null;
                return (
                  <div className="mt-2 flex items-center gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                    {canEdit && onEditEmail && (
                      <button
                        type="button"
                        onClick={() => onEditEmail(m)}
                        className="cursor-pointer text-xs font-medium text-slate-500 hover:text-primary"
                      >
                        {copy.editEmail}
                      </button>
                    )}
                    {canEdit && onEditRoles && (
                      <button
                        type="button"
                        onClick={() => onEditRoles(m)}
                        className="cursor-pointer text-xs font-medium text-slate-500 hover:text-primary"
                      >
                        {copy.editRoles}
                      </button>
                    )}
                    {effectiveRemove && (
                      <button
                        type="button"
                        onClick={() => effectiveRemove(m)}
                        className="cursor-pointer text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        {copy.remove}
                      </button>
                    )}
                  </div>
                );
              })()}
            </article>
          );
        })}
        {!loading && members.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">{copy.empty}</div>
        )}
      </div>
    </>
  );
}
