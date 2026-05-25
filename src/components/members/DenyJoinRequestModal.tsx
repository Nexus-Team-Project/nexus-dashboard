/**
 * DenyJoinRequestModal - replaces the previous window.prompt() flow
 * for declining wallet join requests. Lets the admin write an
 * optional reason that ships with the rejection email so requesters
 * know why and whether to retry.
 *
 * Supports single and bulk modes. Bulk mode applies the same reason
 * to every selected request - useful when an admin needs to clear a
 * spam wave with one explanation.
 */
import { useState } from 'react';

interface DenyJoinRequestModalProps {
  language: 'he' | 'en';
  /** Required when count === 1. */
  displayName?: string;
  /** Required when count === 1. */
  email?: string;
  /** Number of requests this rejection covers. 1 for single. */
  count: number;
  onClose: () => void;
  /** Receives the trimmed reason or undefined when admin left it blank. */
  onConfirm: (reason: string | undefined) => Promise<void>;
}

const REASON_MAX = 500;

const COPY = {
  he: {
    title: 'דחיית בקשת הצטרפות',
    titleBulk: (n: number) => `דחיית ${n} בקשות הצטרפות`,
    body: (name: string) =>
      `אתה עומד לדחות את הבקשה של <strong>${name}</strong>. הסיבה תופיע באימייל שיישלח.`,
    bodyBulk: (n: number) =>
      `אתה עומד לדחות את <strong>${n}</strong> הבקשות הממתינות. הסיבה תופיע באימייל לכל מבקש.`,
    reasonLabel: 'סיבה (לא חובה)',
    reasonPlaceholder: 'לדוגמה: לא רלוונטי לארגון',
    cancel: 'ביטול',
    confirm: 'דחה',
    confirmBulk: (n: number) => `דחה את כולם (${n})`,
    working: 'מעבד...',
    charsLeft: (n: number) => `נותרו ${n} תווים`,
  },
  en: {
    title: 'Deny join request',
    titleBulk: (n: number) => `Deny ${n} join requests`,
    body: (name: string) =>
      `You are about to deny <strong>${name}</strong>'s request. The reason will be included in the rejection email.`,
    bodyBulk: (n: number) =>
      `You are about to deny <strong>${n}</strong> pending requests. The same reason will be sent to each requester.`,
    reasonLabel: 'Reason (optional)',
    reasonPlaceholder: 'e.g. Not affiliated with our organization',
    cancel: 'Cancel',
    confirm: 'Deny',
    confirmBulk: (n: number) => `Deny all (${n})`,
    working: 'Processing...',
    charsLeft: (n: number) => `${n} characters left`,
  },
} as const;

/**
 * Modal with a bounded textarea + red Deny button. Surfaces failures
 * inline so the admin can retry without losing the typed reason.
 *
 * Input: language + (name+email for single OR count for bulk) +
 *        async onConfirm handler that takes the trimmed reason.
 * Output: invokes onConfirm with the reason (or undefined when blank).
 */
export default function DenyJoinRequestModal({
  language,
  displayName,
  email,
  count,
  onClose,
  onConfirm,
}: DenyJoinRequestModalProps) {
  const copy = COPY[language];
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isBulk = count > 1;
  const label = displayName || email || '';

  const handleConfirm = async () => {
    setWorking(true);
    setError(null);
    try {
      const trimmed = reason.trim();
      await onConfirm(trimmed || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny');
      setWorking(false);
    }
  };

  const remaining = REASON_MAX - reason.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isBulk ? copy.titleBulk(count) : copy.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p
            className="text-sm leading-relaxed text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={{
              __html: isBulk ? copy.bodyBulk(count) : copy.body(label),
            }}
          />
          {!isBulk && email && (
            <p className="text-xs text-slate-500">{email}</p>
          )}

          <div>
            <label
              htmlFor="deny-reason"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {copy.reasonLabel}
            </label>
            <textarea
              id="deny-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
              placeholder={copy.reasonPlaceholder}
              rows={3}
              maxLength={REASON_MAX}
              disabled={working}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-[11px] text-slate-400">{copy.charsLeft(remaining)}</p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={working}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={working}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working ? copy.working : isBulk ? copy.confirmBulk(count) : copy.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
