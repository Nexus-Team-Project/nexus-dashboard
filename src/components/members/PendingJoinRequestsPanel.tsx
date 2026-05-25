/**
 * PendingJoinRequestsPanel - shows inbound wallet join requests waiting
 * for tenant-admin action. Each row carries an Approve and a Deny
 * button. Approving writes the user to tenantMembersV2 + tenantUserRoles
 * + tenantContacts on the backend so they immediately appear in both
 * the Registered and Contacts tabs once the parent refreshes them.
 *
 * The panel auto-hides when there are no pending requests so admins
 * never see an empty section under the page header.
 *
 * Calls:
 *  GET   /api/v1/tenant/join-requests   (initial + after each decision)
 *  PATCH /api/v1/tenant/join-requests/:id  with { decision, reason? }
 */
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  tenantJoinRequestsApi,
  type TenantJoinRequestItem,
} from '../../lib/api';

interface PendingJoinRequestsPanelProps {
  /** Active dashboard language; controls all visible copy + date format. */
  language: 'he' | 'en';
  /**
   * Called after a successful approve/deny so the parent Members page
   * can refresh both the Contacts and Registered Members lists - an
   * approved request inserts rows into both collections on the backend.
   */
  onDecisionMade?: () => void;
}

const COPY = {
  he: {
    title: 'בקשות הצטרפות ממתינות',
    subtitle: (n: number) =>
      n === 1 ? 'בקשה חדשה אחת ממתינה לאישור' : `${n} בקשות חדשות ממתינות לאישור`,
    approve: 'אישור',
    deny: 'דחייה',
    denyPrompt: 'סיבת הדחייה (לא חובה)',
    requestedAt: 'התקבל',
    approveSuccess: (email: string) => `${email} אושר/ה כחבר בארגון`,
    denySuccess: (email: string) => `הבקשה של ${email} נדחתה`,
    decideFailed: 'הפעולה נכשלה',
    loading: 'טוען בקשות...',
    deciding: 'מעבד...',
  },
  en: {
    title: 'Pending join requests',
    subtitle: (n: number) =>
      n === 1 ? '1 new request waiting for approval' : `${n} new requests waiting for approval`,
    approve: 'Approve',
    deny: 'Deny',
    denyPrompt: 'Reason for denial (optional)',
    requestedAt: 'Requested',
    approveSuccess: (email: string) => `${email} approved as a member`,
    denySuccess: (email: string) => `Request from ${email} was denied`,
    decideFailed: 'Action failed',
    loading: 'Loading requests...',
    deciding: 'Processing...',
  },
} as const;

/**
 * Formats a timestamp for the row's "Requested at" column.
 * Input: ISO date string. Output: localized short date+time, or
 * an em-dash placeholder when the string is empty.
 */
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

export default function PendingJoinRequestsPanel({
  language,
  onDecisionMade,
}: PendingJoinRequestsPanelProps) {
  const copy = COPY[language];
  const isHe = language === 'he';

  const [requests, setRequests] = useState<TenantJoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  // Surface backend failures (403 / 500 / network) so admins do not
  // see a silently-disappearing panel and conclude "there are no
  // pending requests" when in fact the call failed. Without this the
  // panel auto-hid on any error and the only signal was the brief
  // loading skeleton.
  const [error, setError] = useState<string | null>(null);

  /**
   * Reloads the pending list. Used on mount and after every decision
   * so the row vanishes immediately on success.
   */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await tenantJoinRequestsApi.list();
      // Defensive: backend can in theory return decided rows for audit;
      // only render pending here so the panel always reflects actionable work.
      setRequests(r.requests.filter((req) => req.status === 'pending'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      // Console error captures the full Error object (including the
      // backend's error payload from request()) for devtools triage.
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

  const decide = async (
    req: TenantJoinRequestItem,
    decision: 'approve' | 'deny',
  ): Promise<void> => {
    let reason: string | undefined;
    if (decision === 'deny') {
      const r = window.prompt(copy.denyPrompt);
      // window.prompt returns null on cancel. Treat that as cancel.
      if (r === null) return;
      reason = r.trim() || undefined;
    }
    setDecidingId(req.id);
    try {
      if (decision === 'approve') {
        await tenantJoinRequestsApi.approve(req.id);
      } else {
        await tenantJoinRequestsApi.deny(req.id, reason);
      }
      toast.success(
        decision === 'approve'
          ? copy.approveSuccess(req.email)
          : copy.denySuccess(req.email),
      );
      await reload();
      onDecisionMade?.();
    } catch (err) {
      toast.error(copy.decideFailed, {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDecidingId(null);
    }
  };

  // Hide the entire panel when there is nothing to action AND no
  // error AND we are past the initial-load skeleton. When an error
  // occurs we keep the panel mounted so the admin sees the failure
  // instead of a silently-disappearing UI.
  if (!loading && requests.length === 0 && !error) return null;

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      aria-label={copy.title}
      className="mb-6 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {copy.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {loading ? copy.loading : copy.subtitle(requests.length)}
          </p>
        </div>
      </header>

      {error && !loading ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {isHe ? 'הטעינה נכשלה: ' : 'Load failed: '}
          <code className="font-mono">{error}</code>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-md bg-white/60 dark:bg-slate-900/50"
            />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {requests.map((req) => {
            const busy = decidingId === req.id;
            return (
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
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void decide(req, 'approve')}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? copy.deciding : copy.approve}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void decide(req, 'deny')}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {copy.deny}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
