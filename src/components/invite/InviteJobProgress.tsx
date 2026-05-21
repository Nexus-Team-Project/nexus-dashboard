/**
 * Compact progress panel rendered under the invite form while the background
 * worker delivers a bulk invite job. Polls the backend every 3 seconds, shows
 * an animated progress bar with per-status counts, and exposes a "retry
 * failed" action once delivery completes with errors.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  tenantMembersApi,
  type InviteJobStatusResponse,
} from '../../lib/api';

interface InviteJobProgressProps {
  jobIds: string[];
  language: 'he' | 'en';
  onAllComplete?: () => void;
}

interface AggregateStatus {
  totalCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  done: boolean;
  failedEmails: { email: string; lastError?: string }[];
}

const POLL_MS = 3_000;

const COPY = {
  he: {
    title: 'שליחת ההזמנות מתבצעת ברקע',
    subtitle: 'תוכל לעזוב את העמוד - השליחה תמשיך.',
    sent: 'נשלחו',
    failed: 'נכשלו',
    skipped: 'דולגו',
    pending: 'בהמתנה',
    completed: 'הסתיים',
    retry: 'נסה שוב את הכושלים',
    retried: 'הכושלים הוחזרו לתור',
    retryFailed: 'הניסיון החוזר נכשל',
    of: 'מתוך',
  },
  en: {
    title: 'Invites are being sent in the background',
    subtitle: 'You can leave this page — delivery continues.',
    sent: 'Sent',
    failed: 'Failed',
    skipped: 'Skipped',
    pending: 'Pending',
    completed: 'Completed',
    retry: 'Retry failed',
    retried: 'Failed items requeued',
    retryFailed: 'Retry request failed',
    of: 'of',
  },
} as const;

/**
 * Aggregates many job statuses into a single rollup row.
 * Input: list of per-job status responses.
 * Output: combined counters and a `done` flag.
 */
function aggregate(jobs: InviteJobStatusResponse[]): AggregateStatus {
  const acc: AggregateStatus = {
    totalCount: 0,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    done: jobs.length > 0,
    failedEmails: [],
  };
  for (const job of jobs) {
    acc.totalCount += job.totalCount;
    acc.sentCount += job.sentCount;
    acc.failedCount += job.failedCount;
    acc.skippedCount += job.skippedCount;
    if (job.status !== 'completed') acc.done = false;
    acc.failedEmails.push(...job.failedItems);
  }
  return acc;
}

export default function InviteJobProgress({ jobIds, language, onAllComplete }: InviteJobProgressProps) {
  const copy = COPY[language];
  const [jobs, setJobs] = useState<InviteJobStatusResponse[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (jobIds.length === 0) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const responses = await Promise.all(jobIds.map((id) => tenantMembersApi.getInviteJobStatus(id)));
        if (cancelled) return;
        setJobs(responses);
        const allDone = responses.every((r) => r.status === 'completed');
        if (allDone && !completedRef.current) {
          completedRef.current = true;
          onAllComplete?.();
        }
      } catch {
        // Transient error: polling will retry on the next interval.
      }
    };

    void tick();
    const handle = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [jobIds, onAllComplete]);

  const summary = aggregate(jobs);
  const percent =
    summary.totalCount === 0
      ? 100
      : Math.min(100, Math.round(((summary.sentCount + summary.failedCount) / summary.totalCount) * 100));
  const pending = Math.max(0, summary.totalCount - summary.sentCount - summary.failedCount);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const failedJobIds = jobs.filter((j) => j.failedCount > 0).map((j) => j.jobId);
      await Promise.all(failedJobIds.map((id) => tenantMembersApi.retryInviteJobFailed(id)));
      completedRef.current = false;
      toast.success(copy.retried);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error';
      toast.error(copy.retryFailed, { description: message });
    } finally {
      setIsRetrying(false);
    }
  };

  if (jobIds.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{copy.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{copy.subtitle}</p>
        </div>
        {summary.done && summary.failedCount > 0 && (
          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={isRetrying}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {copy.retry}
          </button>
        )}
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <span className="text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">{summary.sentCount}</span> {copy.sent}
        </span>
        <span className="text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-red-600">{summary.failedCount}</span> {copy.failed}
        </span>
        <span className="text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-amber-600">{summary.skippedCount}</span> {copy.skipped}
        </span>
        <span className="text-slate-500">
          <span className="font-semibold">{pending}</span> {copy.pending} {copy.of}{' '}
          <span className="font-semibold">{summary.totalCount}</span>
        </span>
        {summary.done && (
          <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {copy.completed}
          </span>
        )}
      </div>

      {summary.done && summary.failedEmails.length > 0 && (
        <ul className="mt-3 max-h-40 overflow-auto rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs dark:border-slate-800 dark:bg-slate-900/40">
          {summary.failedEmails.slice(0, 25).map((row) => (
            <li key={row.email} className="flex items-start justify-between gap-3 py-0.5">
              <span className="truncate text-slate-700 dark:text-slate-300">{row.email}</span>
              <span className="shrink-0 text-red-600">{row.lastError}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
