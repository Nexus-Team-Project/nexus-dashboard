/**
 * Table and mobile card view for the Contacts tab on the Members page.
 * Columns: Full Name, Email, Status, Address, Last Activity, First Entry.
 * Per-row action menu lets admins invite a contact to the tenant.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TenantContact } from '../../lib/api';

export interface ContactsTableProps {
  contacts: TenantContact[];
  loading: boolean;
  language: 'he' | 'en';
  canManage: boolean;
  tenantName?: string;
}

const COPY = {
  he: {
    name: 'שם מלא',
    email: 'אימייל',
    status: 'סטטוס',
    address: 'כתובת',
    lastActivity: 'פעילות אחרונה',
    firstEntry: 'כניסה ראשונה',
    invitePrefix: 'הזמן ל-',
    empty: 'אין אנשי קשר עדיין.',
    noAddress: 'לא צוין',
    noActivity: 'לא ידוע',
  },
  en: {
    name: 'Full Name',
    email: 'Email',
    status: 'Status',
    address: 'Address',
    lastActivity: 'Last Activity',
    firstEntry: 'First Entry',
    invitePrefix: 'Invite to ',
    empty: 'No contacts yet.',
    noAddress: 'Not provided',
    noActivity: 'Unknown',
  },
} as const;

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

/**
 * Formats an ISO date string for display.
 * Input: ISO string, language, and fallback text for null values.
 * Output: localized medium-length date string.
 */
function fmtDate(iso: string | null | undefined, language: 'he' | 'en', fallback: string): string {
  if (!iso) return fallback;
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', { dateStyle: 'medium' }).format(
    new Date(iso),
  );
}

/**
 * Per-row action dropdown showing the "Invite to tenant" action.
 * Input: contact, manage permission flag, language, and navigate function.
 * Output: three-dot button that opens an action dropdown.
 */
function RowMenu({
  contact,
  canManage,
  language,
  tenantName,
  onInvite,
}: {
  contact: TenantContact;
  canManage: boolean;
  language: 'he' | 'en';
  tenantName: string;
  onInvite: (email: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const copy = COPY[language];
  if (!canManage) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer rounded p-1 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
        aria-label="Actions"
      >
        <span className="material-icons text-xl">more_horiz</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute end-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => { setOpen(false); onInvite(contact.email); }}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <span className="material-icons text-sm text-primary">person_add</span>
              <div className="min-w-0">
                <div className="font-medium">{copy.invitePrefix}{tenantName}</div>
                <div className="truncate text-xs text-slate-500">{contact.email}</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Renders the contacts table (desktop) and mobile card list.
 * Input: contact list, loading state, language, and manage permission.
 * Output: responsive data display with per-row action menus.
 */
export default function ContactsTable({ contacts, loading, language, canManage, tenantName = 'Tenant' }: ContactsTableProps) {
  const navigate = useNavigate();
  const copy = COPY[language];

  /** Navigates to the invite page with the email pre-filled. */
  const handleInvite = (email: string) => {
    navigate(`/settings/roles-permissions/invite?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      {/* Desktop table */}
      <div className={`hidden overflow-x-auto md:block transition-opacity duration-150 ${loading ? 'opacity-50' : ''}`}>
        <table className="w-full min-w-[860px] text-sm" style={{ borderSpacing: 0 }}>
          <thead className="border-y-2 border-violet-200/60 bg-violet-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-2.5 text-start">{copy.name}</th>
              <th className="px-6 py-2.5 text-start">{copy.email}</th>
              <th className="px-6 py-2.5 text-start">{copy.status}</th>
              <th className="px-6 py-2.5 text-start">{copy.address}</th>
              <th className="px-6 py-2.5 text-start">{copy.lastActivity}</th>
              <th className="px-6 py-2.5 text-start">{copy.firstEntry}</th>
              <th className="w-12 px-6 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {contacts.map((c) => (
              <tr
                key={c.tenantContactId}
                className="group cursor-default transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
              >
                <td className="max-w-[160px] truncate px-6 py-2.5 font-medium text-slate-900 dark:text-white">
                  {c.displayName || '-'}
                </td>
                <td className="max-w-[200px] truncate px-6 py-2.5 text-slate-600 dark:text-slate-300">{c.email}</td>
                <td className="px-6 py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[c.status] ?? STATUS_CLASSES.inactive}`}>
                    {c.status}
                  </span>
                </td>
                <td className="max-w-[180px] truncate px-6 py-2.5 text-slate-500">{c.address ?? copy.noAddress}</td>
                <td className="px-6 py-2.5 text-slate-500">{fmtDate(c.lastActivityAt, language, copy.noActivity)}</td>
                <td className="px-6 py-2.5 text-slate-500">{fmtDate(c.createdAt, language, '-')}</td>
                <td className="px-6 py-2.5 text-end">
                  <RowMenu contact={c} canManage={canManage} language={language} tenantName={tenantName} onInvite={handleInvite} />
                </td>
              </tr>
            ))}
            {contacts.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">{copy.empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className={`grid gap-3 p-3 md:hidden transition-opacity duration-150 ${loading ? 'opacity-50' : ''}`}>
        {contacts.map((c) => (
          <article key={c.tenantContactId} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-white">{c.displayName || '-'}</p>
                <p className="truncate text-xs text-slate-500">{c.email}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[c.status] ?? STATUS_CLASSES.inactive}`}>
                {c.status}
              </span>
            </div>
            {c.address && <p className="mt-2 text-xs text-slate-500">{c.address}</p>}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{fmtDate(c.createdAt, language, '-')}</span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleInvite(c.email)}
                  className="cursor-pointer font-medium text-primary hover:underline"
                >
                  {copy.invitePrefix}{tenantName}
                </button>
              )}
            </div>
          </article>
        ))}
        {contacts.length === 0 && !loading && (
          <div className="py-8 text-center text-sm text-slate-500">{copy.empty}</div>
        )}
      </div>
    </>
  );
}
