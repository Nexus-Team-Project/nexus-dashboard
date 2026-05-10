/**
 * Lets tenant admins invite one member or bulk upload a .txt email list.
 * Each row has a multi-role selector and permission preview before sending.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  tenantMembersApi,
  type BulkTenantMemberInviteResult,
  type TenantRole,
  type TenantRolePermissions,
} from '../lib/api';
import { getTenantRoleLabel, parseEmails, TENANT_ROLE_COPY, TENANT_ROLE_ORDER } from '../lib/tenantRoles';
import { useLanguage } from '../i18n/LanguageContext';

interface InviteRow {
  id: string;
  email: string;
  roles: TenantRole[];
  status: 'draft' | 'pending' | 'failed';
  error?: string;
}

const COPY = {
  he: {
    back: 'חזרה',
    title: 'הזמן חברי tenant',
    body: 'הוסף אימייל אחד, הדבק כמה אימיילים, או העלה קובץ txt. לכל אימייל אפשר לבחור תפקידים.',
    manual: 'הוסף אימייל',
    manualPlaceholder: 'name@example.com',
    add: 'הוסף',
    upload: 'העלה קובץ txt',
    email: 'אימייל',
    roles: 'תפקידים',
    permissions: 'הרשאות',
    remove: 'הסר',
    send: 'שלח הזמנות',
    sending: 'שולח...',
    cancel: 'ביטול',
    empty: 'עדיין אין אימיילים להזמנה.',
    sent: 'נשלח',
    pending: 'ממתין לאישור',
    draft: 'טיוטה',
    failed: 'נכשל',
    invalid: 'לא נמצא אימייל תקין.',
    successToast: 'ההזמנות נשלחו',
    failedToast: 'חלק מההזמנות נכשלו',
    selectRoles: 'בחר תפקידים',
    noRoles: 'לא נבחרו תפקידים',
  },
  en: {
    back: 'Back',
    title: 'Invite tenant members',
    body: 'Add one email, paste many emails, or upload a txt file. Each email can receive multiple roles.',
    manual: 'Add email',
    manualPlaceholder: 'name@example.com',
    add: 'Add',
    upload: 'Upload txt file',
    email: 'Email',
    roles: 'Roles',
    permissions: 'Permissions',
    remove: 'Remove',
    send: 'Send invites',
    sending: 'Sending...',
    cancel: 'Cancel',
    empty: 'No invite emails yet.',
    sent: 'Sent',
    pending: 'Invite pending',
    draft: 'Draft',
    failed: 'Failed',
    invalid: 'No valid email found.',
    successToast: 'Invites sent',
    failedToast: 'Some invites failed',
    selectRoles: 'Select roles',
    noRoles: 'No roles selected',
  },
} as const;

/**
 * Creates invite rows from emails while keeping existing row choices.
 * Input: existing rows, parsed emails, and default roles.
 * Output: merged rows with unique email addresses.
 */
function mergeRows(existingRows: InviteRow[], emails: string[], defaultRoles: TenantRole[]): InviteRow[] {
  const existing = new Set(existingRows.map((row) => row.email));
  const newRows = emails
    .filter((email) => !existing.has(email))
    .map((email) => ({
      id: `${email}_${crypto.randomUUID()}`,
      email,
      roles: [...defaultRoles],
      status: 'draft' as const,
    }));
  return [...existingRows, ...newRows];
}

interface RoleDropdownProps {
  rowId: string;
  selectedRoles: TenantRole[];
  disabled: boolean;
  language: 'he' | 'en';
  onToggle: (rowId: string, role: TenantRole) => void;
  placeholder: string;
}

/**
 * Renders a multi-role selector as a dropdown with checkboxes per role.
 * Uses a portal + fixed positioning to escape table overflow clipping.
 * Input: row id, currently selected roles, and toggle handler.
 * Output: pill-based display + checkbox dropdown anchored to the button.
 */
function RoleDropdown({ rowId, selectedRoles, disabled, language, onToggle, placeholder }: RoleDropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  /** Recalculate fixed position whenever the dropdown opens or the window scrolls. */
  const recalcPosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
      zIndex: 9999,
    });
  };

  useLayoutEffect(() => {
    if (open) recalcPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClose = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const handleScroll = () => recalcPosition();
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  return (
    <div className="min-w-[180px]">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedRoles.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          selectedRoles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {getTenantRoleLabel(role, language)}
            </span>
          ))
        )}
        <span className="material-icons ms-auto text-base text-slate-400">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            aria-multiselectable="true"
            style={menuStyle}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            {TENANT_ROLE_ORDER.map((role) => {
              const checked = selectedRoles.includes(role);
              return (
                <li key={role}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(rowId, role)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-slate-950"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {getTenantRoleLabel(role, language)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}

/**
 * Renders the tenant member invite form with multi-role support.
 * Input: none.
 * Output: single and bulk invite UI connected to Mongo-backed v1 APIs.
 */
export default function InviteCollaborators() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const copy = COPY[language];
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [rolePermissions, setRolePermissions] = useState<TenantRolePermissions[]>([]);
  const [manualEmail, setManualEmail] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    /**
     * Loads available role permissions from the backend.
     * Input: current authenticated tenant admin session.
     * Output: role permission cards for permission preview.
     */
    const loadRoles = async () => {
      const result = await tenantMembersApi.roles();
      setRolePermissions(result.roles);
    };

    void loadRoles().catch((error) => setSubmitError(error instanceof Error ? error.message : 'Failed to load roles'));
  }, []);

  const permissionsByRole = useMemo(() => {
    return new Map(rolePermissions.map((r) => [r.role, r.permissions]));
  }, [rolePermissions]);

  /**
   * Adds parsed emails into the invite table.
   * Input: free text from input, paste, or file.
   * Output: rows state updated or validation error shown.
   */
  const addEmails = (value: string) => {
    const emails = parseEmails(value);
    if (emails.length === 0) {
      setSubmitError(copy.invalid);
      return;
    }
    setRows((current) => mergeRows(current, emails, ['member']));
    setManualEmail('');
    setSubmitError(null);
  };

  /**
   * Reads a .txt file and extracts email addresses from it.
   * Input: browser file input change event.
   * Output: parsed email rows.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const text = await file.text();
    addEmails(text);
  };

  /**
   * Toggles one role on or off for a given invite row.
   * Input: row id and role to toggle.
   * Output: rows state updated; at least one role always selected.
   */
  const toggleRole = (rowId: string, role: TenantRole) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;
        const has = row.roles.includes(role);
        if (has && row.roles.length === 1) return row;
        return {
          ...row,
          roles: has ? row.roles.filter((r) => r !== role) : [...row.roles, role],
        };
      }),
    );
  };

  /**
   * Sends all draft invite rows through single or bulk API.
   * Input: current table rows.
   * Output: row statuses reflect backend results and emails are sent.
   */
  const sendInvites = async () => {
    const draftRows = rows.filter((row) => row.status !== 'pending');
    if (draftRows.length === 0) return;
    setIsSending(true);
    setSubmitError(null);

    try {
      const payload = draftRows.map((row) => ({
        email: row.email,
        roles: row.roles,
        language,
        sendEmail: true,
      }));
      const response =
        payload.length === 1
          ? { results: [{ email: payload[0].email, ok: true, result: await tenantMembersApi.invite(payload[0]) }] }
          : await tenantMembersApi.bulkInvite(payload, language);
      applyResults(response.results);
      const failedCount = response.results.filter((r) => !r.ok).length;
      if (failedCount > 0) {
        toast.error(copy.failedToast, { description: `${failedCount}/${response.results.length}` });
      } else {
        toast.success(copy.successToast, { description: `${response.results.length}` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send invites';
      setSubmitError(message);
      toast.error(copy.failedToast, { description: message });
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Applies backend bulk results to the visible rows.
   * Input: per-email success or failure results.
   * Output: row status and errors update in place.
   */
  const applyResults = (results: BulkTenantMemberInviteResult[]) => {
    const byEmail = new Map(results.map((r) => [r.email, r]));
    setRows((current) =>
      current.map((row) => {
        const result = byEmail.get(row.email);
        if (!result) return row;
        return result.ok
          ? { ...row, status: 'pending', error: undefined }
          : { ...row, status: 'failed', error: result.error ?? copy.failed };
      }),
    );
  };

  /**
   * Aggregates unique permissions for all selected roles in a row.
   * Input: selected role names and the full permissionsByRole map.
   * Output: sorted deduplicated permission strings.
   */
  const getRowPermissions = (roles: TenantRole[], byRole: Map<TenantRole, string[]>): string[] => {
    const all = new Set<string>();
    for (const role of roles) {
      for (const perm of byRole.get(role) ?? []) all.add(perm);
    }
    return Array.from(all).sort();
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/settings/roles-permissions')}
            className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-primary"
          >
            <span className="material-icons text-lg">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
            {copy.back}
          </button>
          <h1 className="text-3xl font-bold tracking-normal text-slate-950 dark:text-white">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{copy.body}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings/roles-permissions')}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            disabled={isSending || rows.length === 0}
            onClick={() => void sendInvites()}
            className="cursor-pointer rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? copy.sending : copy.send}
          </button>
        </div>
      </header>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-white">{copy.manual}</label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={manualEmail}
            onChange={(event) => setManualEmail(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') addEmails(manualEmail); }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData('text');
              if (parseEmails(pasted).length > 1) {
                event.preventDefault();
                addEmails(pasted);
              }
            }}
            className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900"
            placeholder={copy.manualPlaceholder}
            type="email"
          />
          <button
            type="button"
            onClick={() => addEmails(manualEmail)}
            className="cursor-pointer rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            {copy.add}
          </button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">
            <span className="material-icons text-lg ltr:mr-2 rtl:ml-2">upload_file</span>
            {copy.upload}
            <input type="file" accept=".txt,text/plain" onChange={(event) => void handleFileChange(event)} className="sr-only" />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/40">
              <tr>
                <th className="px-5 py-3 text-start font-semibold">{copy.email}</th>
                <th className="px-5 py-3 text-start font-semibold">{copy.roles}</th>
                <th className="px-5 py-3 text-start font-semibold">{copy.permissions}</th>
                <th className="px-5 py-3 text-start font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => {
                const permissions = getRowPermissions(row.roles, permissionsByRole);
                return (
                  <tr key={row.id} className="align-top">
                    <td className="px-5 py-4 font-medium text-slate-950 dark:text-white">{row.email}</td>
                    <td className="px-5 py-4">
                      <RoleDropdown
                        rowId={row.id}
                        selectedRoles={row.roles}
                        disabled={row.status === 'pending'}
                        language={language}
                        onToggle={toggleRole}
                        placeholder={copy.selectRoles}
                      />
                    </td>
                    <td className="max-w-[260px] px-5 py-4 text-xs text-slate-500">
                      {row.roles.length === 1 ? (
                        <p className="mb-2 font-medium text-slate-700 dark:text-slate-300">
                          {TENANT_ROLE_COPY[row.roles[0]][language === 'he' ? 'descriptionHe' : 'descriptionEn']}
                        </p>
                      ) : (
                        <p className="mb-2 font-medium text-slate-700 dark:text-slate-300">
                          {row.roles.map((r) => getTenantRoleLabel(r, language)).join(' + ')}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {permissions.length === 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          permissions.map((perm) => (
                            <span
                              key={perm}
                              className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {perm}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {row.status === 'pending' && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                          {copy.pending}
                        </span>
                      )}
                      {row.status === 'failed' && (
                        <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                          {row.error ?? copy.failed}
                        </span>
                      )}
                      {row.status === 'draft' && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          {copy.draft}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-end">
                      <button
                        type="button"
                        disabled={row.status === 'pending'}
                        onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                        className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {copy.remove}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                    {copy.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
