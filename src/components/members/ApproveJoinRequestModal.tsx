/**
 * ApproveJoinRequestModal - confirmation dialog before approving one
 * or many wallet join requests. Shows who will be added, the tenant
 * they will be added to, and a notice that the requester(s) will
 * receive a branded confirmation email.
 *
 * Single-request mode displays the name + email. Bulk mode (count >
 * 1) shows the count and skips the per-row identity row.
 *
 * Replaces the previous "approve immediately on button click" path
 * so admins never irreversibly add a member by misclick. Mirrors the
 * visual language of ConfirmRemoveModal so the page feels coherent.
 */
import { useState } from 'react';

interface ApproveJoinRequestModalProps {
  language: 'he' | 'en';
  tenantName: string;
  /** Required when count === 1. Ignored for bulk. */
  displayName?: string;
  /** Required when count === 1. Ignored for bulk. */
  email?: string;
  /** Number of requests this confirmation covers. 1 for single. */
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const COPY = {
  he: {
    title: 'אישור בקשת הצטרפות',
    titleBulk: (n: number) => `אישור ${n} בקשות הצטרפות`,
    body: (name: string, tenant: string) =>
      `לאשר את <strong>${name}</strong> כחבר ב-<strong>${tenant}</strong>?`,
    bodyBulk: (n: number, tenant: string) =>
      `לאשר את <strong>${n}</strong> הבקשות הממתינות עבור <strong>${tenant}</strong>?`,
    emailNotice: 'ישלח אימייל אישור למבקש.',
    emailNoticeBulk: 'ישלח אימייל אישור לכל אחד מהמבקשים.',
    cancel: 'ביטול',
    confirm: 'אשר',
    confirmBulk: (n: number) => `אשר את כולם (${n})`,
    working: 'מעבד...',
  },
  en: {
    title: 'Approve join request',
    titleBulk: (n: number) => `Approve ${n} join requests`,
    body: (name: string, tenant: string) =>
      `Approve <strong>${name}</strong> as a member of <strong>${tenant}</strong>?`,
    bodyBulk: (n: number, tenant: string) =>
      `Approve all <strong>${n}</strong> pending requests for <strong>${tenant}</strong>?`,
    emailNotice: 'A confirmation email will be sent to the requester.',
    emailNoticeBulk: 'A confirmation email will be sent to each requester.',
    cancel: 'Cancel',
    confirm: 'Approve',
    confirmBulk: (n: number) => `Approve all (${n})`,
    working: 'Processing...',
  },
} as const;

/**
 * Renders the approve confirmation modal with a primary-color confirm
 * button. Closes when the parent flips its state via onClose.
 *
 * Input: language + tenant + requester (single) or count (bulk) +
 *        async onConfirm handler that performs the API call.
 * Output: triggers onConfirm; surfaces failures inline without closing
 *         so the admin can retry without losing the dialog.
 */
export default function ApproveJoinRequestModal({
  language,
  tenantName,
  displayName,
  email,
  count,
  onClose,
  onConfirm,
}: ApproveJoinRequestModalProps) {
  const copy = COPY[language];
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isBulk = count > 1;
  const label = displayName || email || '';

  const handleConfirm = async () => {
    setWorking(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
      setWorking(false);
    }
  };

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
              __html: isBulk
                ? copy.bodyBulk(count, tenantName)
                : copy.body(label, tenantName),
            }}
          />
          {!isBulk && email && (
            <p className="text-xs text-slate-500">{email}</p>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
            <span className="material-icons mt-0.5 shrink-0 text-sm">mail_outline</span>
            <span>{isBulk ? copy.emailNoticeBulk : copy.emailNotice}</span>
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
              className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working ? copy.working : isBulk ? copy.confirmBulk(count) : copy.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
