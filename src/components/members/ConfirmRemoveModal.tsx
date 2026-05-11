/**
 * Confirmation dialog before removing a contact or member from the tenant.
 * Shows what will be deleted and whether a removal email will be sent.
 */
import { useState } from 'react';

interface ConfirmRemoveModalProps {
  language: 'he' | 'en';
  tenantName: string;
  displayName: string;
  email: string;
  /** True when the person was invited — removal email is sent in this case. */
  willSendEmail: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const COPY = {
  he: {
    title: 'הסרת חבר',
    body: (name: string, tenant: string) =>
      `האם להסיר את <strong>${name}</strong> מסביבת העבודה <strong>${tenant}</strong>?`,
    emailNotice: 'ישלח אימייל עדכון למשתמש.',
    noEmailNotice: 'לא ישלח אימייל (איש הקשר לא הוזמן עדיין).',
    warning: 'פעולה זו אינה ניתנת לביטול.',
    cancel: 'ביטול',
    confirm: 'הסר',
    removing: 'מסיר...',
  },
  en: {
    title: 'Remove member',
    body: (name: string, tenant: string) =>
      `Remove <strong>${name}</strong> from the <strong>${tenant}</strong> workspace?`,
    emailNotice: 'A removal notification will be sent to the user.',
    noEmailNotice: 'No email will be sent (contact was never invited).',
    warning: 'This action cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Remove',
    removing: 'Removing...',
  },
} as const;

/**
 * Renders a confirmation modal with a red remove button.
 * Input: display name, email, tenant name, email flag, language, callbacks.
 * Output: calls onConfirm when the user confirms the removal.
 */
export default function ConfirmRemoveModal({
  language,
  tenantName,
  displayName,
  email,
  willSendEmail,
  onClose,
  onConfirm,
}: ConfirmRemoveModalProps) {
  const copy = COPY[language];
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = displayName || email;

  const handleConfirm = async () => {
    setRemoving(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{copy.title}</h2>
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
            className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: copy.body(label, tenantName) }}
          />
          <p className="text-xs text-slate-500">{email}</p>

          <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${
            willSendEmail
              ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400'
              : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <span className="material-icons text-sm shrink-0 mt-0.5">
              {willSendEmail ? 'mail_outline' : 'mail_lock'}
            </span>
            <span>{willSendEmail ? copy.emailNotice : copy.noEmailNotice}</span>
          </div>

          <p className="text-xs font-medium text-red-600 dark:text-red-400">{copy.warning}</p>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={removing}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removing ? copy.removing : copy.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
