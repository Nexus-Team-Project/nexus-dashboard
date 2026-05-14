/**
 * Tenant admin page for inviting workspace collaborators.
 * Emails are added as expandable rows, each with its own role accordion.
 * The role accordion is shown but disabled until at least one email is added.
 * CSV import and the bulk-inactive flow from the Members page pre-populate
 * email rows with the "member" role selected by default.
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
import { getTenantRoleLabel, isSeatConsumingRole, parseEmails, PLAN_SEAT_LIMITS } from '../lib/tenantRoles';
import { parseCsv, type ParsedCsv } from '../lib/csvParser';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import CsvColumnMapper, { type ResolvedInviteRow } from '../components/invite/CsvColumnMapper';
import CsvImportGuide from '../components/invite/CsvImportGuide';
import RoleGroupAccordion from '../components/invite/RoleGroupAccordion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteRow {
  id: string;
  email: string;
  roles: TenantRole[];
  /** Services granted to this member at invite time. Defaults to benefits_catalog. */
  services: string[];
  status: 'draft' | 'pending' | 'failed';
  error?: string;
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

const COPY = {
  he: {
    back: 'חזרה',
    titlePrefix: 'הזמן חברים ל',
    titleFallback: 'הזמן חברים',
    emailsLabel: 'הוסף אימייל',
    emailPlaceholder: 'name@example.com',
    addEmail: 'הוסף',
    uploadCsv: 'ייבא CSV',
    rolesLabel: 'בחר תפקידים',
    rolesHint: 'לחץ על אימייל כדי לבחור את התפקידים שלו.',
    rolesDisabledHint: 'הוסף לפחות אימייל אחד כדי לבחור תפקידים.',
    searchRoles: 'חפש תפקידים',
    send: 'שלח הזמנות',
    sending: 'שולח...',
    cancel: 'ביטול',
    invalid: 'לא נמצא אימייל תקין.',
    successToast: 'ההזמנות נשלחו',
    failedToast: 'חלק מההזמנות נכשלו',
    csvTooBig: 'הקובץ ריק או לא נמצאו עמודות.',
    seatLimitWarning: 'הגעת למגבלת המושבים. ניתן עדיין להזמין תפקיד "חבר" ללא הגבלה.',
    upgradePlan: 'שדרג תוכנית',
    pending: 'ממתין',
    failed: 'נכשל',
    draft: 'טיוטה',
    rolesFor: 'תפקידים עבור',
    seatsLeft: 'מושבים פנויים',
    remove: 'הסר',
    searchEmails: 'חפש לפי אימייל',
  },
  en: {
    back: 'Back',
    titlePrefix: 'Invite members to',
    titleFallback: 'Invite members',
    emailsLabel: 'Add email',
    emailPlaceholder: 'name@example.com',
    addEmail: 'Add',
    uploadCsv: 'Import CSV',
    rolesLabel: 'Select roles',
    rolesHint: 'Click an email below to select roles for that person.',
    rolesDisabledHint: 'Add at least one email above to select roles.',
    searchRoles: 'Search roles',
    send: 'Send invites',
    sending: 'Sending…',
    cancel: 'Cancel',
    invalid: 'No valid email found.',
    successToast: 'Invites sent',
    failedToast: 'Some invites failed',
    csvTooBig: 'File is empty or has no columns.',
    seatLimitWarning: 'Seat limit reached. You can still freely invite the "Member" role.',
    upgradePlan: 'Upgrade plan',
    pending: 'Invite sent',
    failed: 'Failed',
    draft: 'Draft',
    rolesFor: 'Roles for',
    seatsLeft: 'seats left',
    remove: 'Remove',
    searchEmails: 'Search by email',
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a new invite row with the default member role and benefits_catalog service. */
function makeRow(email: string): InviteRow {
  return { id: `${email}_${crypto.randomUUID()}`, email, roles: ['member'], services: ['benefits_catalog'], status: 'draft' };
}

/** Merges new emails into an existing row list without duplicates. */
function mergeRows(existing: InviteRow[], emails: string[]): InviteRow[] {
  const seen = new Set(existing.map((r) => r.email));
  return [...existing, ...emails.filter((e) => !seen.has(e)).map(makeRow)];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Invite collaborators page with per-email role accordions.
 * Input: none — reads tenant context from AuthContext.
 * Output: sends invitations via the bulk invite API with per-email roles.
 */
export default function InviteCollaborators() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isRTL } = useLanguage();
  const { me, reloadMe } = useAuth();
  const copy = COPY[language];

  const tenantName = me?.context.tenantName ?? null;
  const plan = me?.context.plan;
  const seats = me?.context.seats;
  const seatsLimit = plan ? PLAN_SEAT_LIMITS[plan] : null;
  const seatsUsed = seats?.used ?? 0;
  const atLimit = seats?.isAtLimit === true;
  const seatsRemaining = seats?.remaining ?? Infinity;

  const pageTitle = tenantName
    ? language === 'he' ? `${copy.titlePrefix}-${tenantName}` : `${copy.titlePrefix} ${tenantName}`
    : copy.titleFallback;

  // ── Rows (one per invited email, each with its own roles) ───────────────────
  // Compute initial rows outside useState so expandedId can reference them.
  const initialRows = useMemo<InviteRow[]>(() => {
    const stored = sessionStorage.getItem('pendingInviteEmails');
    if (stored) {
      sessionStorage.removeItem('pendingInviteEmails');
      try {
        const emails: string[] = JSON.parse(stored);
        if (emails.length) return emails.map(makeRow);
      } catch { /* ignore */ }
    }
    const q = new URLSearchParams(location.search).get('email');
    return q ? [makeRow(q)] : [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount

  const [rows, setRows] = useState<InviteRow[]>(initialRows);
  // Auto-expand the first pre-filled row so the accordion is ready.
  const [expandedId, setExpandedId] = useState<string | null>(initialRows[0]?.id ?? null);

  const [emailInput, setEmailInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [emailSearch, setEmailSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [rolePerms, setRolePerms] = useState<TenantRolePermissions[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [csvData, setCsvData] = useState<ParsedCsv | null>(null);

  useEffect(() => {
    void tenantMembersApi.roles()
      .then((res) => setRolePerms(res.roles))
      .catch(() => { /* non-critical */ });
  }, []);

  // ── Seat limit ──────────────────────────────────────────────────────────────
  const draftNonMemberCount = useMemo(
    () => rows.filter((r) => r.status !== 'pending' && r.roles.some(isSeatConsumingRole)).length,
    [rows],
  );
  const seatLimitReached = atLimit || Math.max(0, seatsRemaining - draftNonMemberCount) <= 0;

  // ── Email helpers ───────────────────────────────────────────────────────────

  const addEmails = (raw: string) => {
    const parsed = parseEmails(raw);
    if (!parsed.length) { setInputError(copy.invalid); return; }
    setRows((cur) => {
      const next = mergeRows(cur, parsed);
      // Auto-expand the first newly added row.
      const firstNew = next.find((r) => parsed.includes(r.email) && r.status === 'draft');
      if (firstNew && expandedId === null) setExpandedId(firstNew.id);
      return next;
    });
    setEmailInput('');
    setInputError(null);
  };

  const removeRow = (id: string) => {
    setRows((cur) => cur.filter((r) => r.id !== id));
    if (expandedId === id) { setExpandedId(null); setRoleSearch(''); }
  };

  /** Rows visible after applying the email search filter. */
  const visibleRows = useMemo(() => {
    if (!emailSearch.trim()) return rows;
    const q = emailSearch.toLowerCase();
    return rows.filter((r) => r.email.toLowerCase().includes(q));
  }, [rows, emailSearch]);

  const toggleRole = (rowId: string, role: TenantRole) => {
    setRows((cur) =>
      cur.map((row) => {
        if (row.id !== rowId) return row;
        const has = row.roles.includes(role);
        if (has && row.roles.length === 1) return row; // keep at least one role
        return { ...row, roles: has ? row.roles.filter((r) => r !== role) : [...row.roles, role] };
      }),
    );
  };

  /**
   * Updates the services array for a specific invite row.
   * Input: row id and updated services array.
   * Output: row updated in state; other rows untouched.
   */
  const updateRowServices = (rowId: string, services: string[]) => {
    setRows((cur) => cur.map((r) => r.id === rowId ? { ...r, services } : r));
  };

  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.headers.length) { setSubmitError(copy.csvTooBig); return; }
    setSubmitError(null);
    setCsvData(parsed);
  };

  const handleCsvConfirm = (resolved: ResolvedInviteRow[]) => {
    setRows((cur) => mergeRows(cur, resolved.map((r) => r.email)));
    setCsvData(null);
  };

  // ── Send ────────────────────────────────────────────────────────────────────

  const sendInvites = async () => {
    const draftRows = rows.filter((r) => r.status !== 'pending');
    if (!draftRows.length) return;
    setIsSending(true);
    setSubmitError(null);
    try {
      const payload = draftRows.map((r) => ({ email: r.email, roles: r.roles, services: r.services ?? ['benefits_catalog'], language, sendEmail: true }));
      const response =
        payload.length === 1
          ? { results: [{ email: payload[0].email, ok: true, result: await tenantMembersApi.invite(payload[0]) }] }
          : await tenantMembersApi.bulkInvite(payload, language);

      const results = response.results as BulkTenantMemberInviteResult[];
      const byEmail = new Map(results.map((r) => [r.email, r]));
      setRows((cur) =>
        cur.map((row) => {
          const res = byEmail.get(row.email);
          if (!res) return row;
          return res.ok ? { ...row, status: 'pending', error: undefined } : { ...row, status: 'failed', error: res.error ?? copy.failed };
        }),
      );
      const failedCount = results.filter((r) => !r.ok).length;
      if (failedCount > 0) {
        toast.error(copy.failedToast, { description: `${failedCount}/${results.length}` });
      } else {
        toast.success(copy.successToast, { description: `${results.length}` });
        void reloadMe();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setSubmitError(msg);
      toast.error(copy.failedToast, { description: msg });
    } finally {
      setIsSending(false);
    }
  };

  const hasDraft = rows.some((r) => r.status !== 'pending');

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={() => navigate('/settings/roles-permissions')}
            className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
            <span className="material-icons text-lg">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
            {copy.back}
          </button>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{pageTitle}</h1>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/settings/roles-permissions')}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 transition-colors">
            {copy.cancel}
          </button>
          <button type="button" disabled={isSending || !hasDraft}
            onClick={() => void sendInvites()}
            className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity">
            {isSending ? copy.sending : copy.send}
          </button>
        </div>
      </header>

      {/* Seat bar */}
      {seats && seatsLimit && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-card-dark sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-icons text-base text-primary">people</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {language === 'he'
                  ? `${Math.max(0, seatsLimit - seatsUsed)} מושבים פנויים`
                  : `${Math.max(0, seatsLimit - seatsUsed)} ${copy.seatsLeft}`}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full transition-all ${atLimit ? 'bg-rose-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, Math.round((seatsUsed / seatsLimit) * 100))}%` }} />
                </div>
                <span className="text-xs text-slate-500">{seatsUsed}/{seatsLimit}</span>
              </div>
            </div>
          </div>
          <button type="button" className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
            {copy.upgradePlan}
          </button>
        </div>
      )}

      {seatLimitReached && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          {copy.seatLimitWarning}
        </div>
      )}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">{submitError}</div>
      )}

      {/* Email input */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <label className="mb-3 block text-sm font-semibold text-slate-800 dark:text-white">{copy.emailsLabel}</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addEmails(emailInput); }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (parseEmails(pasted).length > 1) { e.preventDefault(); addEmails(pasted); }
            }}
            placeholder={copy.emailPlaceholder} type="email"
            className="min-h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900" />
          <button type="button" onClick={() => addEmails(emailInput)}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
            {copy.addEmail}
          </button>
          <button type="button" onClick={() => setGuideOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-icons text-lg">upload_file</span>
            {copy.uploadCsv}
          </button>
        </div>
        {inputError && <p className="mt-2 text-xs text-red-600">{inputError}</p>}
      </section>

      {/* CSV modals */}
      {guideOpen && <CsvImportGuide language={language} onFileSelected={(f) => void handleCsvFile(f)} onClose={() => setGuideOpen(false)} />}
      {csvData && <CsvColumnMapper csv={csvData} language={language} onConfirm={handleCsvConfirm} onCancel={() => setCsvData(null)} />}

      {/* Role selection section */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-card-dark">
        {/* Section header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
              {expandedId
                ? `${copy.rolesFor} ${rows.find((r) => r.id === expandedId)?.email ?? ''}`
                : copy.rolesLabel}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {rows.length === 0 ? copy.rolesDisabledHint : copy.rolesHint}
            </p>
          </div>
          {/* Email search — only shown when there are rows to filter */}
          {rows.length > 0 && (
            <div className="relative shrink-0 sm:w-52">
              <span className="material-icons absolute start-3 top-1/2 -translate-y-1/2 text-base text-slate-400">search</span>
              <input
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                placeholder={copy.searchEmails}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white ps-9 pe-3 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          )}
        </div>

        {/* Email rows — each clickable to expand its role accordion */}
        {visibleRows.map((row, ri) => {
          const isExpanded = expandedId === row.id;
          return (
            <div key={row.id} className={ri > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}>
              {/* Row summary header */}
              <div className="flex items-center gap-3 px-5 py-3">
                <button type="button"
                  onClick={() => {
                    const opening = !isExpanded;
                    setExpandedId(opening ? row.id : null);
                    if (!opening) setRoleSearch('');
                  }}
                  className="flex flex-1 cursor-pointer items-center gap-3 min-w-0 text-start">
                  <span className={`material-icons text-base transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} text-slate-400`}>
                    chevron_right
                  </span>
                  <span className="truncate text-sm font-medium text-slate-800 dark:text-white">{row.email}</span>
                  {/* Role chips */}
                  <div className="flex flex-wrap gap-1">
                    {row.roles.map((r) => (
                      <span key={r} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {getTenantRoleLabel(r, language)}
                      </span>
                    ))}
                  </div>
                  {/* Status chip */}
                  {row.status === 'pending' && (
                    <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">{copy.pending}</span>
                  )}
                  {row.status === 'failed' && (
                    <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700" title={row.error}>{copy.failed}</span>
                  )}
                </button>
                <button type="button" onClick={() => removeRow(row.id)} disabled={row.status === 'pending'}
                  aria-label={copy.remove}
                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800 transition-colors">
                  <span className="material-icons text-base">close</span>
                </button>
              </div>

              {/* Expanded role accordion for this email */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 pb-4 pt-3 dark:border-slate-800">
                  {/* Role search — only visible when accordion is open */}
                  <div className="relative mb-3">
                    <span className="material-icons absolute start-3 top-1/2 -translate-y-1/2 text-base text-slate-400">search</span>
                    <input
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      placeholder={copy.searchRoles}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white ps-9 pe-3 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                  <RoleGroupAccordion
                    selectedRoles={row.roles}
                    onToggle={(role) => toggleRole(row.id, role)}
                    disabled={false}
                    seatLimitReached={seatLimitReached && !row.roles.some(isSeatConsumingRole)}
                    rolePerms={rolePerms}
                    search={roleSearch}
                  />

                  {/* Service access — shown per invite row so admins can opt members in/out of catalog */}
                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {language === 'he' ? 'גישה לשירותים' : 'Service Access'}
                    </p>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.services?.includes('benefits_catalog') ?? true}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...(row.services ?? []), 'benefits_catalog']
                            : (row.services ?? []).filter((s) => s !== 'benefits_catalog');
                          updateRowServices(row.id, updated);
                        }}
                        className="h-4 w-4 rounded border-slate-300 accent-primary"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {language === 'he' ? 'קטלוג הטבות' : 'Benefits Catalog'}
                      </span>
                      <span className="ml-1 text-xs text-slate-400">
                        {language === 'he' ? '(עיון ורכישת הצעות)' : '(browse and purchase offers)'}
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state — accordion shown disabled when no rows */}
        {rows.length === 0 && (
          <div className="px-5 pb-5 pt-3">
            <RoleGroupAccordion
              selectedRoles={['member']}
              onToggle={() => { /* no-op while disabled */ }}
              disabled={true}
              seatLimitReached={false}
              rolePerms={rolePerms}
              search=""
            />
          </div>
        )}

        {/* No results after email search */}
        {rows.length > 0 && visibleRows.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {language === 'he' ? 'לא נמצאו אימיילים תואמים.' : 'No emails match your search.'}
          </p>
        )}
      </section>
    </div>
  );
}
