/**
 * Table and mobile card view for the Contacts tab on the Members page.
 * Columns: Full Name, Email, Status, Address, Last Activity, First Entry.
 * Per-row action menu lets admins invite a contact to the tenant.
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TenantContact, ContactField } from '../../lib/api';
import { renderCustomCell, isEmptyValue } from './customFieldsUtil';

export interface ContactsTableProps {
  contacts: TenantContact[];
  loading: boolean;
  language: 'he' | 'en';
  canManage: boolean;
  tenantName?: string;
  /** Tenant-defined custom columns, in display order. */
  contactFields: ContactField[];
  onEditEmail?: (contact: TenantContact) => void;
  onEditContact?: (contact: TenantContact) => void;
  onRemove?: (contact: TenantContact) => void;
  /** Custom-column management (admins). */
  onRenameColumn?: (field: ContactField) => void;
  onDeleteColumn?: (field: ContactField) => void;
  onMoveColumn?: (field: ContactField, dir: 'earlier' | 'later') => void;
}

const COPY = {
  he: {
    name: 'שם מלא',
    email: 'אימייל',
    status: 'סטטוס',
    address: 'כתובת',
    phone: 'טלפון',
    lastActivity: 'פעילות אחרונה',
    firstEntry: 'כניסה ראשונה',
    invitePrefix: 'הזמן ל-',
    editEmail: 'שינוי אימייל',
    editContact: 'עריכת פרטים',
    remove: 'הסר',
    addColumn: 'הוסף עמודה',
    renameColumn: 'שנה שם',
    deleteColumn: 'מחק עמודה',
    moveEarlier: 'הזז שמאלה',
    moveLater: 'הזז ימינה',
    empty: 'אין אנשי קשר עדיין.',
    noAddress: 'לא צוין',
    noPhone: 'לא צוין',
    noActivity: 'לא ידוע',
    phoneVerified: 'מאומת',
    phoneUnverified: 'לא אומת',
    phoneVerifiedTitle: 'אומת על ידי המשתמש',
    phoneUnverifiedTitle: 'לא אומת על ידי המשתמש',
  },
  en: {
    name: 'Full Name',
    email: 'Email',
    status: 'Status',
    address: 'Address',
    phone: 'Phone',
    lastActivity: 'Last Activity',
    firstEntry: 'First Entry',
    invitePrefix: 'Invite to ',
    editEmail: 'Change email',
    editContact: 'Edit details',
    remove: 'Remove',
    addColumn: 'Add column',
    renameColumn: 'Rename',
    deleteColumn: 'Delete column',
    moveEarlier: 'Move left',
    moveLater: 'Move right',
    empty: 'No contacts yet.',
    noAddress: 'Not provided',
    noPhone: 'Not provided',
    noActivity: 'Unknown',
    phoneVerified: 'Verified',
    phoneUnverified: 'Unverified',
    phoneVerifiedTitle: 'Verified by the user',
    phoneUnverifiedTitle: 'Not verified by the user',
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
const NOT_ACCEPTED: TenantContact['status'][] = ['inactive', 'pending', 'expired'];

function RowMenu({
  contact,
  canManage,
  language,
  tenantName,
  onInvite,
  onEditEmail,
  onEditContact,
  onRemove,
}: {
  contact: TenantContact;
  canManage: boolean;
  language: 'he' | 'en';
  tenantName: string;
  onInvite: (email: string) => void;
  onEditEmail?: (contact: TenantContact) => void;
  onEditContact?: (contact: TenantContact) => void;
  onRemove?: (contact: TenantContact) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const copy = COPY[language];
  if (!canManage) return null;

  const isNotAccepted = NOT_ACCEPTED.includes(contact.status);

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
        aria-label="Actions"
      >
        <span className="material-icons text-xl">more_horiz</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="fixed z-20 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={dropPos.bottom !== undefined
              ? { bottom: dropPos.bottom, right: dropPos.right }
              : { top: dropPos.top, right: dropPos.right }}
          >
            {/* Edit details (base fields + custom columns) */}
            {onEditContact && (
              <button
                type="button"
                onClick={() => { setOpen(false); onEditContact(contact); }}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 text-start text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <span className="material-icons text-sm text-slate-500">edit_note</span>
                <span className="font-medium">{copy.editContact}</span>
              </button>
            )}
            {/* Invite to tenant */}
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
            {/* Change email — only for not-yet-accepted */}
            {isNotAccepted && onEditEmail && (
              <button
                type="button"
                onClick={() => { setOpen(false); onEditEmail(contact); }}
                className="flex w-full cursor-pointer items-center gap-3 border-t border-slate-100 px-4 py-3 text-start text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <span className="material-icons text-sm text-slate-500">edit</span>
                <span className="font-medium">{copy.editEmail}</span>
              </button>
            )}
            {/* Remove — only for not-yet-accepted */}
            {isNotAccepted && onRemove && (
              <button
                type="button"
                onClick={() => { setOpen(false); onRemove(contact); }}
                className="flex w-full cursor-pointer items-center gap-3 border-t border-slate-100 px-4 py-3 text-start text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-900/20"
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

/**
 * Custom-column header with a management menu (rename / move / delete). Without
 * manage permission it renders just the column name.
 */
function ColumnHeaderMenu({
  field,
  language,
  isFirst,
  isLast,
  onRename,
  onDelete,
  onMove,
}: {
  field: ContactField;
  language: 'he' | 'en';
  isFirst: boolean;
  isLast: boolean;
  onRename?: (f: ContactField) => void;
  onDelete?: (f: ContactField) => void;
  onMove?: (f: ContactField, dir: 'earlier' | 'later') => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const copy = COPY[language];
  const canManage = !!(onRename || onDelete || onMove);

  if (!canManage) return <span className="truncate" dir="auto">{field.name}</span>;

  // Fixed positioning (computed from the trigger) so the menu escapes the
  // table's overflow-x-auto wrapper, which would otherwise clip it.
  const handleOpen = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="inline-flex items-center gap-1">
      <span className="max-w-[140px] truncate" dir="auto">{field.name}</span>
      <button ref={btnRef} type="button" onClick={handleOpen} className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-600" aria-label={field.name}>
        <span className="material-icons text-sm">expand_more</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="fixed z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white normal-case shadow-lg dark:border-slate-700 dark:bg-slate-800" style={{ top: pos.top, right: pos.right }}>
            {onRename && (
              <button type="button" onClick={() => { setOpen(false); onRename(field); }} className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-start text-sm font-normal tracking-normal text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <span className="material-icons text-sm text-slate-500">edit</span>{copy.renameColumn}
              </button>
            )}
            {onMove && !isFirst && (
              <button type="button" onClick={() => { setOpen(false); onMove(field, 'earlier'); }} className="flex w-full cursor-pointer items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-start text-sm font-normal tracking-normal text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                <span className="material-icons text-sm text-slate-500">arrow_back</span>{copy.moveEarlier}
              </button>
            )}
            {onMove && !isLast && (
              <button type="button" onClick={() => { setOpen(false); onMove(field, 'later'); }} className="flex w-full cursor-pointer items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-start text-sm font-normal tracking-normal text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                <span className="material-icons text-sm text-slate-500">arrow_forward</span>{copy.moveLater}
              </button>
            )}
            {onDelete && (
              <button type="button" onClick={() => { setOpen(false); onDelete(field); }} className="flex w-full cursor-pointer items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-start text-sm font-normal tracking-normal text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-900/20">
                <span className="material-icons text-sm">delete</span>{copy.deleteColumn}
              </button>
            )}
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
export default function ContactsTable({
  contacts,
  loading,
  language,
  canManage,
  tenantName = 'Tenant',
  contactFields,
  onEditEmail,
  onEditContact,
  onRemove,
  onRenameColumn,
  onDeleteColumn,
  onMoveColumn,
}: ContactsTableProps) {
  const navigate = useNavigate();
  const copy = COPY[language];

  /** Navigates to the invite page with the email pre-filled. */
  const handleInvite = (email: string) => {
    navigate(`/settings/roles-permissions/invite?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] text-sm" style={{ borderSpacing: 0 }}>
          <thead className="border-y-2 border-violet-200/60 bg-violet-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-2.5 text-start">{copy.name}</th>
              <th className="px-6 py-2.5 text-start">{copy.email}</th>
              <th className="px-6 py-2.5 text-start">{copy.phone}</th>
              <th className="px-6 py-2.5 text-start">{copy.status}</th>
              <th className="px-6 py-2.5 text-start">{copy.address}</th>
              <th className="px-6 py-2.5 text-start">{copy.lastActivity}</th>
              <th className="px-6 py-2.5 text-start">{copy.firstEntry}</th>
              {contactFields.map((f, i) => (
                <th key={f.fieldId} className="px-6 py-2.5 text-start">
                  <ColumnHeaderMenu
                    field={f}
                    language={language}
                    isFirst={i === 0}
                    isLast={i === contactFields.length - 1}
                    onRename={canManage ? onRenameColumn : undefined}
                    onDelete={canManage ? onDeleteColumn : undefined}
                    onMove={canManage ? onMoveColumn : undefined}
                  />
                </th>
              ))}
              <th className="w-12 px-6 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-slate-800">
                <td className="px-6 py-3"><div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-3"><div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-3"><div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-3"><div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-3"><div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-3"><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-3"><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" /></td>
                {contactFields.map((f) => (
                  <td key={f.fieldId} className="px-6 py-3"><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" /></td>
                ))}
                <td className="px-6 py-3" />
              </tr>
            ))}
            {!loading && contacts.map((c) => (
              <tr
                key={c.tenantContactId}
                className="group cursor-default transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
              >
                <td className="max-w-[160px] truncate px-6 py-2.5 font-medium text-slate-900 dark:text-white">
                  {c.displayName || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-2.5 text-slate-600 dark:text-slate-300">{c.email}</td>
                <td className="px-6 py-2.5 text-slate-500">
                  {c.phone ? (
                    <div className="flex flex-col items-start gap-1">
                      <span className="whitespace-nowrap" dir="ltr">{c.phone}</span>
                      {c.phoneVerified ? (
                        <span title={copy.phoneVerifiedTitle} className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          {copy.phoneVerified}
                        </span>
                      ) : (
                        <span title={copy.phoneUnverifiedTitle} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-700 dark:text-slate-400">
                          {copy.phoneUnverified}
                        </span>
                      )}
                    </div>
                  ) : (
                    copy.noPhone
                  )}
                </td>
                <td className="px-6 py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[c.status] ?? STATUS_CLASSES.inactive}`}>
                    {c.status}
                  </span>
                </td>
                <td className="max-w-[180px] truncate px-6 py-2.5 text-slate-500">{c.address ?? copy.noAddress}</td>
                <td className="px-6 py-2.5 text-slate-500">{fmtDate(c.lastActivityAt, language, copy.noActivity)}</td>
                <td className="px-6 py-2.5 text-slate-500">{fmtDate(c.createdAt, language, '-')}</td>
                {contactFields.map((f) => (
                  <td key={f.fieldId} className="max-w-[200px] truncate px-6 py-2.5">
                    {renderCustomCell(f, c.customFields?.[f.fieldId], language)}
                  </td>
                ))}
                <td className="px-6 py-2.5 text-end">
                  <RowMenu contact={c} canManage={canManage} language={language} tenantName={tenantName} onInvite={handleInvite} onEditEmail={onEditEmail} onEditContact={onEditContact} onRemove={onRemove} />
                </td>
              </tr>
            ))}
            {!loading && contacts.length === 0 && (
              <tr>
                <td colSpan={8 + contactFields.length} className="px-6 py-10 text-center text-sm text-slate-500">{copy.empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 p-3 md:hidden">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
        {!loading && contacts.map((c) => (
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
            {c.phone && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500" dir="ltr">
                <span>{c.phone}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${c.phoneVerified ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                  {c.phoneVerified ? copy.phoneVerified : copy.phoneUnverified}
                </span>
              </p>
            )}
            {c.address && <p className="mt-1 text-xs text-slate-500">{c.address}</p>}
            {contactFields
              .filter((f) => !isEmptyValue(c.customFields?.[f.fieldId]))
              .map((f) => (
                <p key={f.fieldId} className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-600 dark:text-slate-400" dir="auto">{f.name}:</span>
                  {renderCustomCell(f, c.customFields?.[f.fieldId], language)}
                </p>
              ))}
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
            {canManage && (onEditContact || NOT_ACCEPTED.includes(c.status)) && (
              <div className="mt-2 flex items-center gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                {onEditContact && (
                  <button
                    type="button"
                    onClick={() => onEditContact(c)}
                    className="cursor-pointer text-xs font-medium text-slate-500 hover:text-primary"
                  >
                    {copy.editContact}
                  </button>
                )}
                {NOT_ACCEPTED.includes(c.status) && onEditEmail && (
                  <button
                    type="button"
                    onClick={() => onEditEmail(c)}
                    className="cursor-pointer text-xs font-medium text-slate-500 hover:text-primary"
                  >
                    {copy.editEmail}
                  </button>
                )}
                {NOT_ACCEPTED.includes(c.status) && onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(c)}
                    className="cursor-pointer text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    {copy.remove}
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
        {!loading && contacts.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">{copy.empty}</div>
        )}
      </div>
    </>
  );
}
