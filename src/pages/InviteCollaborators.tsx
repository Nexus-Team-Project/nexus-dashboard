/**
 * Tenant admin page for inviting one member or bulk-importing from a CSV file.
 * Each row in the invite table has a multi-role selector and permission preview.
 * CSV imports go through a column-mapping step before rows are added to the table.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  tenantMembersApi,
  type BulkTenantMemberInviteResult,
  type TenantRole,
  type TenantRolePermissions,
} from '../lib/api';
import { getTenantRoleLabel, parseEmails, TENANT_ROLE_COPY } from '../lib/tenantRoles';
import { parseCsv, type ParsedCsv } from '../lib/csvParser';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import RoleDropdown from '../components/invite/RoleDropdown';
import CsvColumnMapper, { type ResolvedInviteRow } from '../components/invite/CsvColumnMapper';
import CsvImportGuide from '../components/invite/CsvImportGuide';

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
    titlePrefix: 'הזמן חברים ל',
    body: 'הוסף אימייל אחד, הדבק כמה אימיילים, או ייבא קובץ CSV.',
    manual: 'הוסף אימייל',
    manualPlaceholder: 'name@example.com',
    add: 'הוסף',
    uploadCsv: 'ייבא CSV',
    email: 'אימייל',
    roles: 'תפקידים',
    permissions: 'הרשאות',
    remove: 'הסר',
    send: 'שלח הזמנות',
    sending: 'שולח...',
    cancel: 'ביטול',
    empty: 'עדיין אין אימיילים להזמנה.',
    pending: 'ממתין לאישור',
    draft: 'טיוטה',
    failed: 'נכשל',
    invalid: 'לא נמצא אימייל תקין.',
    successToast: 'ההזמנות נשלחו',
    failedToast: 'חלק מההזמנות נכשלו',
    selectRoles: 'בחר תפקידים',
    csvTooBig: 'הקובץ ריק או לא נמצאו עמודות.',
  },
  en: {
    back: 'Back',
    titlePrefix: 'Invite members to',
    body: 'Add one email, paste many emails, or import a CSV file.',
    manual: 'Add email',
    manualPlaceholder: 'name@example.com',
    add: 'Add',
    uploadCsv: 'Import CSV',
    email: 'Email',
    roles: 'Roles',
    permissions: 'Permissions',
    remove: 'Remove',
    send: 'Send invites',
    sending: 'Sending...',
    cancel: 'Cancel',
    empty: 'No invite emails yet.',
    pending: 'Invite pending',
    draft: 'Draft',
    failed: 'Failed',
    invalid: 'No valid email found.',
    successToast: 'Invites sent',
    failedToast: 'Some invites failed',
    selectRoles: 'Select roles',
    csvTooBig: 'File is empty or has no columns.',
  },
} as const;

/**
 * Merges new emails into the existing invite row list without duplicates.
 * Preserves roles already set on existing rows.
 * Input: current rows, new email strings, and default roles for new rows.
 * Output: deduplicated merged row array.
 */
function mergeRows(
  existingRows: InviteRow[],
  emails: string[],
  defaultRoles: TenantRole[],
): InviteRow[] {
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

/**
 * Returns the deduplicated union of permissions for a set of roles.
 * Input: role names and the full role→permissions map.
 * Output: sorted unique permission strings.
 */
function getRowPermissions(
  roles: TenantRole[],
  byRole: Map<TenantRole, string[]>,
): string[] {
  const all = new Set<string>();
  for (const role of roles) {
    for (const perm of byRole.get(role) ?? []) all.add(perm);
  }
  return Array.from(all).sort();
}

/**
 * Renders the invite page with a manual email input, CSV import, and invite table.
 * CSV imports open a column-mapping step before rows are added to the table.
 * Input: none.
 * Output: connected invite UI backed by Mongo domain v1 APIs.
 */
export default function InviteCollaborators() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isRTL } = useLanguage();
  const { me } = useAuth();
  const copy = COPY[language];

  const tenantName = me?.context.tenantName ?? null;
  /** "הזמן חברים ל-Acme" / "Invite members to Acme" */
  const pageTitle = tenantName
    ? language === 'he'
      ? `${copy.titlePrefix}-${tenantName}`
      : `${copy.titlePrefix} ${tenantName}`
    : language === 'he' ? 'הזמן חברים' : 'Invite members';

  const ROWS_PER_PAGE = 10;
  const [rowsPage, setRowsPage] = useState(1);

  const [rows, setRows] = useState<InviteRow[]>(() => {
    // Pre-fill from sessionStorage when navigating from the Members page inactive-invite flow.
    const stored = sessionStorage.getItem('pendingInviteEmails');
    if (stored) {
      sessionStorage.removeItem('pendingInviteEmails');
      try {
        const emails: string[] = JSON.parse(stored);
        if (emails.length > 0) {
          return emails.map((email) => ({
            id: `${email}_${crypto.randomUUID()}`,
            email,
            roles: ['member' as TenantRole],
            status: 'draft' as const,
          }));
        }
      } catch { /* fall through */ }
    }
    // Pre-fill from ?email= query param when navigating from the Contacts row action.
    const email = new URLSearchParams(location.search).get('email');
    if (!email) return [];
    return [{ id: `${email}_${crypto.randomUUID()}`, email, roles: ['member'], status: 'draft' }];
  });
  const totalRowPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const safeRowsPage = Math.min(rowsPage, totalRowPages);
  const visibleRows = rows.slice((safeRowsPage - 1) * ROWS_PER_PAGE, safeRowsPage * ROWS_PER_PAGE);

  const [rolePermissions, setRolePermissions] = useState<TenantRolePermissions[]>([]);
  const [manualEmail, setManualEmail] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  /** Controls whether the CSV import guide modal is open. */
  const [guideOpen, setGuideOpen] = useState(false);
  /** Holds parsed CSV data while the column-mapping step is active. */
  const [csvData, setCsvData] = useState<ParsedCsv | null>(null);

  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    /** Loads role permission data for the permission preview column. */
    const loadRoles = async () => {
      const result = await tenantMembersApi.roles();
      setRolePermissions(result.roles);
      setRolesLoading(false);
    };
    void loadRoles().catch((err) => {
      setSubmitError(err instanceof Error ? err.message : 'Failed to load roles');
      setRolesLoading(false);
    });
  }, []);

  const permissionsByRole = useMemo(
    () => new Map(rolePermissions.map((r) => [r.role, r.permissions])),
    [rolePermissions],
  );

  /**
   * Parses free-text or pasted content and merges valid emails into the table.
   * Input: raw text from the manual input, paste, or .txt drop.
   * Output: rows state updated; error shown when no valid email is found.
   */
  const addEmails = (value: string) => {
    const emails = parseEmails(value);
    if (emails.length === 0) {
      setSubmitError(copy.invalid);
      return;
    }
    setRows((current) => mergeRows(current, emails, ['member']));
    setRowsPage(1);
    setManualEmail('');
    setSubmitError(null);
  };

  /**
   * Reads a CSV File object and opens the column-mapping step.
   * Called by CsvImportGuide once the user selects a file.
   * Input: File from the guide's hidden file input.
   * Output: csvData state set, which renders the CsvColumnMapper card.
   */
  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.headers.length === 0) {
      setSubmitError(copy.csvTooBig);
      return;
    }
    setSubmitError(null);
    setCsvData(parsed);
  };

  /**
   * Called when the user confirms the CSV column mapping.
   * Merges resolved rows into the invite table and closes the mapper.
   * Input: array of resolved email+roles from CsvColumnMapper.
   * Output: rows state updated, csvData cleared.
   */
  const handleCsvConfirm = (resolved: ResolvedInviteRow[]) => {
    setRows((current) =>
      mergeRows(
        current,
        resolved.map((r) => r.email),
        ['member'], // fallback; actual roles applied below
      ).map((row) => {
        const match = resolved.find((r) => r.email === row.email);
        return match ? { ...row, roles: match.roles } : row;
      }),
    );
    setCsvData(null);
  };

  /**
   * Toggles one role on a specific invite row.
   * Prevents removing the last remaining role from a row.
   * Input: row id and the role to toggle.
   * Output: rows state updated.
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
   * Sends all draft invite rows through the single or bulk invite API.
   * Input: current table rows with status 'draft' or 'failed'.
   * Output: row statuses updated to 'pending' or 'failed', toast shown.
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
          ? {
              results: [
                {
                  email: payload[0].email,
                  ok: true,
                  result: await tenantMembersApi.invite(payload[0]),
                },
              ],
            }
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
   * Applies per-email backend results to the visible invite rows.
   * Input: array of { email, ok, error } results from the bulk invite API.
   * Output: matching rows updated to 'pending' or 'failed'.
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

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
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
          <h1 className="text-3xl font-bold tracking-normal text-slate-950 dark:text-white">
            {pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {copy.body}
          </p>
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
            className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? copy.sending : copy.send}
          </button>
        </div>
      </header>

      {/* Global error banner */}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
          {submitError}
        </div>
      )}

      {/* Manual input and upload controls */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-white">
          {copy.manual}
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addEmails(manualEmail);
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (parseEmails(pasted).length > 1) {
                e.preventDefault();
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
            className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            {copy.add}
          </button>
          {/* CSV import — opens the guide modal first */}
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            <span className="material-icons text-lg">upload_file</span>
            {copy.uploadCsv}
          </button>
        </div>
      </section>

      {/* CSV import guide modal — shown when the user clicks Import CSV */}
      {guideOpen && (
        <CsvImportGuide
          language={language}
          onFileSelected={(file) => void handleCsvFile(file)}
          onClose={() => setGuideOpen(false)}
        />
      )}

      {/* CSV column-mapping step — shown after a CSV file is selected */}
      {csvData && (
        <CsvColumnMapper
          csv={csvData}
          language={language}
          onConfirm={handleCsvConfirm}
          onCancel={() => setCsvData(null)}
        />
      )}

      {/* Invite table */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-card-dark">
        {rolesLoading && (
          <div className="animate-pulse divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-8 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        )}
        {!rolesLoading && <>
        {/* Pagination controls — only shown when rows exceed one page */}
        {totalRowPages > 1 && (
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2.5 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              {language === 'he'
                ? `עמוד ${safeRowsPage} מתוך ${totalRowPages} · ${rows.length} אימיילים`
                : `Page ${safeRowsPage} of ${totalRowPages} · ${rows.length} emails`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safeRowsPage <= 1}
                onClick={() => setRowsPage((p) => Math.max(1, p - 1))}
                className="inline-flex cursor-pointer items-center gap-0.5 rounded px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-icons text-base">{isRTL ? 'chevron_right' : 'chevron_left'}</span>
                {language === 'he' ? 'הקודם' : 'Prev'}
              </button>
              <button
                type="button"
                disabled={safeRowsPage >= totalRowPages}
                onClick={() => setRowsPage((p) => Math.min(totalRowPages, p + 1))}
                className="inline-flex cursor-pointer items-center gap-0.5 rounded px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {language === 'he' ? 'הבא' : 'Next'}
                <span className="material-icons text-base">{isRTL ? 'chevron_left' : 'chevron_right'}</span>
              </button>
            </div>
          </div>
        )}
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
              {visibleRows.map((row) => {
                const permissions = getRowPermissions(row.roles, permissionsByRole);
                return (
                  <tr key={row.id} className="align-top">
                    <td className="px-5 py-4 font-medium text-slate-950 dark:text-white">
                      {row.email}
                    </td>
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
                          {
                            TENANT_ROLE_COPY[row.roles[0]][
                              language === 'he' ? 'descriptionHe' : 'descriptionEn'
                            ]
                          }
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
                        onClick={() =>
                          setRows((current) => current.filter((item) => item.id !== row.id))
                        }
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
        </>}
      </section>
    </div>
  );
}
