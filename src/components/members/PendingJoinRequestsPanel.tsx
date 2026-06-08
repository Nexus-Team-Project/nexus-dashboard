/**
 * PendingJoinRequestsPanel - admin-facing list of inbound wallet
 * join requests waiting for approval. Built to scale: a tenant can
 * accumulate hundreds of pending requests, so the panel collapses
 * by default once the list grows, exposes a search input, scrolls
 * internally, and offers bulk Approve-all / Deny-all actions.
 *
 * Each decision routes through a proper modal (Approve / Deny) instead
 * of a window.prompt - matching the look and feel of the page's
 * existing ConfirmRemoveModal / EditRolesModal flows.
 *
 * Calls:
 *  GET   /api/v1/tenant/join-requests
 *  PATCH /api/v1/tenant/join-requests/:id   { decision, reason? }
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  tenantJoinRequestsApi,
  type TenantJoinRequestItem,
  type WalletProfileFieldDef,
} from '../../lib/api';
import ApproveJoinRequestModal from './ApproveJoinRequestModal';
import DenyJoinRequestModal from './DenyJoinRequestModal';
import JoinRequestAnswersModal from './JoinRequestAnswersModal';
import ToggleSwitch from '../ToggleSwitch';

interface PendingJoinRequestsPanelProps {
  language: 'he' | 'en';
  /** Tenant display name used in the modal copy. */
  tenantName: string;
  /**
   * Called after a successful decision (single or bulk) so the parent
   * Members page can refresh Contacts + Registered lists - the backend
   * approval writes to tenantContacts AND tenantMembersV2 in one go.
   */
  onDecisionMade?: () => void;
  /** Wallet mirror-field registry, used to localize a request's answers. */
  mirrorDefs?: WalletProfileFieldDef[];
}

/** When the pending count meets or exceeds this, the panel collapses on first load. */
const COLLAPSE_THRESHOLD = 6;
/** When the count exceeds this, a search input renders inside the header. */
const SEARCH_THRESHOLD = 5;

const COPY = {
  he: {
    title: 'בקשות הצטרפות ממתינות',
    subtitle: (n: number) =>
      n === 1 ? 'בקשה אחת ממתינה לאישור' : `${n} בקשות ממתינות לאישור`,
    expand: 'הצג',
    collapse: 'הסתר',
    searchPlaceholder: 'חפש לפי שם או מייל...',
    approve: 'אשר',
    deny: 'דחה',
    viewAnswers: 'צפה במידע שנמסר בתהליך ההרשמה',
    approveAll: 'אשר את כולם',
    denyAll: 'דחה את כולם',
    requestedAt: 'התקבל',
    noMatches: 'אין תוצאות לחיפוש.',
    approveSuccess: (email: string) => `${email} אושר/ה כחבר`,
    denySuccess: (email: string) => `הבקשה של ${email} נדחתה`,
    approveBulkSuccess: (n: number) => `${n} בקשות אושרו`,
    denyBulkSuccess: (n: number) => `${n} בקשות נדחו`,
    decideFailed: 'הפעולה נכשלה',
    loadFailed: 'הטעינה נכשלה: ',
    loading: 'טוען בקשות...',
    autoAcceptOn: 'בקשות הצטרפות מאושרות אוטומטית',
    autoAcceptOff: 'בקשות הצטרפות ממתינות לאישורך',
    autoAcceptLabel: 'אישור אוטומטי של בקשות הצטרפות',
    autoAcceptUpdateFailed: 'עדכון ההגדרה נכשל',
  },
  en: {
    title: 'Pending join requests',
    subtitle: (n: number) =>
      n === 1 ? '1 request waiting for approval' : `${n} requests waiting for approval`,
    expand: 'Show',
    collapse: 'Hide',
    searchPlaceholder: 'Search by name or email...',
    approve: 'Approve',
    deny: 'Deny',
    viewAnswers: 'View answers',
    approveAll: 'Approve all',
    denyAll: 'Deny all',
    requestedAt: 'Requested',
    noMatches: 'No requests match your search.',
    approveSuccess: (email: string) => `${email} approved as a member`,
    denySuccess: (email: string) => `Request from ${email} was denied`,
    approveBulkSuccess: (n: number) => `${n} requests approved`,
    denyBulkSuccess: (n: number) => `${n} requests denied`,
    decideFailed: 'Action failed',
    loadFailed: 'Load failed: ',
    loading: 'Loading requests...',
    autoAcceptOn: 'Join requests are auto-accepted',
    autoAcceptOff: 'Join requests need your approval',
    autoAcceptLabel: 'Auto-accept join requests',
    autoAcceptUpdateFailed: 'Could not update the setting',
  },
} as const;

/** Localized short date+time for the per-row 'requested at' line. */
function formatRequestedAt(iso: string, language: 'he' | 'en'): string {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Internal modal state. We model the three states as a discriminated
 * union so the JSX cannot accidentally render an approve modal while
 * a bulk deny is being confirmed.
 */
type ModalState =
  | { kind: 'none' }
  | { kind: 'approve-one'; req: TenantJoinRequestItem }
  | { kind: 'approve-bulk'; requests: TenantJoinRequestItem[] }
  | { kind: 'deny-one'; req: TenantJoinRequestItem }
  | { kind: 'deny-bulk'; requests: TenantJoinRequestItem[] }
  | { kind: 'view-answers'; req: TenantJoinRequestItem };

export default function PendingJoinRequestsPanel({
  language,
  tenantName,
  onDecisionMade,
  mirrorDefs,
}: PendingJoinRequestsPanelProps) {
  const copy = COPY[language];
  const isHe = language === 'he';

  const [requests, setRequests] = useState<TenantJoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);
  /** True once the initial fetch resolved - prevents re-collapsing on later refetches. */
  const [collapseInitialized, setCollapseInitialized] = useState(false);
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });

  /**
   * Auto-accept setting state. We default to `true` (the backend default)
   * while loading so the optimistic UI never flickers to "off". `settingsReady`
   * flips true only after the GET resolves; if the GET 403s (caller is not a
   * tenant admin) we simply hide the toggle rather than show a broken control.
   */
  const [autoAccept, setAutoAccept] = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const r = await tenantJoinRequestsApi.getSettings();
        if (active) {
          setAutoAccept(r.autoAcceptEnabled);
          setSettingsReady(true);
        }
      } catch (err) {
        // 403 (not a tenant admin) or transient error: keep the toggle hidden.
        console.error('[pending-join-requests] settings load failed:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /**
   * Optimistically flips the auto-accept setting, persists it, and reverts
   * on failure. Surfaces failures via the same `toast` pattern the rest of
   * the panel uses for decision errors.
   * Input: next - the desired on/off value from the toggle.
   * Output: none (state is updated as a side effect).
   */
  const handleToggleAutoAccept = async (next: boolean): Promise<void> => {
    const previous = autoAccept;
    setAutoAccept(next);
    setSavingSettings(true);
    try {
      const r = await tenantJoinRequestsApi.updateSettings(next);
      setAutoAccept(r.autoAcceptEnabled);
    } catch (err) {
      console.error('[pending-join-requests] settings update failed:', err);
      setAutoAccept(previous);
      toast.error(copy.autoAcceptUpdateFailed);
    } finally {
      setSavingSettings(false);
    }
  };

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await tenantJoinRequestsApi.list();
      const pending = r.requests.filter((req) => req.status === 'pending');
      setRequests(pending);
      // Auto-collapse only on the FIRST load so admins who manually
      // expanded a large list do not get re-collapsed on refresh.
      setCollapseInitialized((wasInit) => {
        if (!wasInit && pending.length >= COLLAPSE_THRESHOLD) setExpanded(false);
        return true;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      console.error('[pending-join-requests] list failed:', err);
      setRequests([]);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /**
   * Filtered view. We match on display name OR email so admins can
   * triage either way without a separate "search by" selector.
   */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.displayName ?? '').toLowerCase().includes(q),
    );
  }, [requests, search]);

  /**
   * Sequentially submits one decision per pending request. Sequential
   * (not Promise.all) so a flaky network surfaces a clear partial state
   * rather than a thundering herd: if request N fails, requests 1..N-1
   * are already through and the panel reloads the remaining set.
   *
   * Input: list of requests + the decision shape.
   * Output: count of successful decisions; failures are toasted but
   *         do not abort the batch.
   */
  const submitDecisions = async (
    rows: TenantJoinRequestItem[],
    decision: 'approve' | 'deny',
    reason: string | undefined,
  ): Promise<number> => {
    let ok = 0;
    for (const r of rows) {
      try {
        if (decision === 'approve') await tenantJoinRequestsApi.approve(r.id);
        else await tenantJoinRequestsApi.deny(r.id, reason);
        ok += 1;
      } catch (err) {
        console.error('[pending-join-requests] decide failed for', r.id, err);
      }
    }
    return ok;
  };

  const closeModal = () => setModal({ kind: 'none' });

  const handleApproveOne = async (req: TenantJoinRequestItem): Promise<void> => {
    const ok = await submitDecisions([req], 'approve', undefined);
    if (ok === 1) {
      toast.success(copy.approveSuccess(req.email));
      closeModal();
      await reload();
      onDecisionMade?.();
    } else {
      toast.error(copy.decideFailed);
      throw new Error(copy.decideFailed);
    }
  };

  const handleDenyOne = async (
    req: TenantJoinRequestItem,
    reason: string | undefined,
  ): Promise<void> => {
    const ok = await submitDecisions([req], 'deny', reason);
    if (ok === 1) {
      toast.success(copy.denySuccess(req.email));
      closeModal();
      await reload();
      onDecisionMade?.();
    } else {
      toast.error(copy.decideFailed);
      throw new Error(copy.decideFailed);
    }
  };

  const handleApproveBulk = async (
    rows: TenantJoinRequestItem[],
  ): Promise<void> => {
    const ok = await submitDecisions(rows, 'approve', undefined);
    if (ok > 0) toast.success(copy.approveBulkSuccess(ok));
    if (ok < rows.length) toast.error(copy.decideFailed);
    closeModal();
    await reload();
    onDecisionMade?.();
  };

  const handleDenyBulk = async (
    rows: TenantJoinRequestItem[],
    reason: string | undefined,
  ): Promise<void> => {
    const ok = await submitDecisions(rows, 'deny', reason);
    if (ok > 0) toast.success(copy.denyBulkSuccess(ok));
    if (ok < rows.length) toast.error(copy.decideFailed);
    closeModal();
    await reload();
    onDecisionMade?.();
  };

  // Hide the entire panel only when there is nothing to action, no error,
  // we are past the initial skeleton, AND the auto-accept toggle is not
  // available (settings did not load / caller is not an admin). When the
  // toggle IS available we keep the panel mounted so admins can flip the
  // setting even with zero pending requests.
  if (!loading && requests.length === 0 && !error && !settingsReady) return null;

  const showSearch = !loading && requests.length > SEARCH_THRESHOLD;
  const showBulkActions = !loading && filtered.length >= 2;

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      aria-label={copy.title}
      className="mb-6 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {copy.title}
          </h3>
          {!loading && requests.length > 0 && (
            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-bold text-white">
              {requests.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && requests.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span>{expanded ? copy.collapse : copy.expand}</span>
              <span className="material-icons text-[16px]">
                {expanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Auto-accept setting: hidden until the GET resolves (and stays hidden
          for non-admins whose GET 403s). When ON, new join requests skip the
          pending list below; any pre-existing pending rows still render. */}
      {settingsReady && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
          <p className="min-w-0 flex-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            {autoAccept ? copy.autoAcceptOn : copy.autoAcceptOff}
          </p>
          <ToggleSwitch
            checked={autoAccept}
            onChange={(next) => void handleToggleAutoAccept(next)}
            disabled={savingSettings}
            aria-label={copy.autoAcceptLabel}
          />
        </div>
      )}

      {!loading && (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {copy.subtitle(requests.length)}
        </p>
      )}

      {error && !loading && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {copy.loadFailed}
          <code className="font-mono">{error}</code>
        </div>
      )}

      {loading ? (
        <div className="mt-3 space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-md bg-white/60 dark:bg-slate-900/50"
            />
          ))}
        </div>
      ) : expanded ? (
        <div className="mt-3 space-y-3">
          {showSearch && (
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          )}

          {showBulkActions && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModal({ kind: 'approve-bulk', requests: filtered })}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
              >
                {copy.approveAll} ({filtered.length})
              </button>
              <button
                type="button"
                onClick={() => setModal({ kind: 'deny-bulk', requests: filtered })}
                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                {copy.denyAll} ({filtered.length})
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-white px-3 py-3 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              {copy.noMatches}
            </p>
          ) : (
            <ul className="max-h-[360px] space-y-2 overflow-y-auto pe-1">
              {filtered.map((req) => (
                <li
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200/70 bg-white px-3 py-2 dark:border-amber-900/40 dark:bg-slate-900"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {req.displayName || req.email}
                    </div>
                    <div className="truncate text-xs text-slate-600 dark:text-slate-400">
                      {req.email}
                      <span className="mx-2 text-slate-300">|</span>
                      {copy.requestedAt}: {formatRequestedAt(req.createdAt, language)}
                    </div>
                  </div>
                  <div className={`flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap ${isHe ? 'justify-start' : 'justify-end'}`}>
                    {req.answersSnapshot && (
                      <button
                        type="button"
                        onClick={() => setModal({ kind: 'view-answers', req })}
                        className="cursor-pointer rounded-md border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50 dark:border-violet-900/40 dark:bg-slate-900 dark:text-violet-300 dark:hover:bg-violet-950/30"
                      >
                        {copy.viewAnswers}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setModal({ kind: 'approve-one', req })}
                      className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                    >
                      {copy.approve}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ kind: 'deny-one', req })}
                      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {copy.deny}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {modal.kind === 'approve-one' && (
        <ApproveJoinRequestModal
          language={language}
          tenantName={tenantName}
          displayName={modal.req.displayName ?? undefined}
          email={modal.req.email}
          count={1}
          onClose={closeModal}
          onConfirm={() => handleApproveOne(modal.req)}
        />
      )}
      {modal.kind === 'approve-bulk' && (
        <ApproveJoinRequestModal
          language={language}
          tenantName={tenantName}
          count={modal.requests.length}
          onClose={closeModal}
          onConfirm={() => handleApproveBulk(modal.requests)}
        />
      )}
      {modal.kind === 'deny-one' && (
        <DenyJoinRequestModal
          language={language}
          displayName={modal.req.displayName ?? undefined}
          email={modal.req.email}
          count={1}
          onClose={closeModal}
          onConfirm={(reason) => handleDenyOne(modal.req, reason)}
        />
      )}
      {modal.kind === 'deny-bulk' && (
        <DenyJoinRequestModal
          language={language}
          count={modal.requests.length}
          onClose={closeModal}
          onConfirm={(reason) => handleDenyBulk(modal.requests, reason)}
        />
      )}
      {modal.kind === 'view-answers' && modal.req.answersSnapshot && (
        <JoinRequestAnswersModal
          language={language}
          name={modal.req.displayName || modal.req.email}
          email={modal.req.email}
          answers={modal.req.answersSnapshot}
          mirrorDefs={mirrorDefs ?? []}
          onClose={closeModal}
        />
      )}
    </section>
  );
}
