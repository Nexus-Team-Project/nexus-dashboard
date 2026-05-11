/**
 * Modal for changing the email address of a not-yet-accepted contact or member.
 * Shows a notice when the entry was invited, explaining the old invite will be
 * revoked and a new one sent to the new address.
 */
import { useState } from 'react';

interface EditEmailModalProps {
  language: 'he' | 'en';
  currentEmail: string;
  /** True when the contact/member has a pending or expired invite — shows extra notice. */
  wasInvited: boolean;
  onClose: () => void;
  /** Called with the new email when the user confirms. */
  onSubmit: (email: string) => Promise<void>;
}

const COPY = {
  he: {
    title: 'שינוי אימייל',
    label: 'אימייל חדש',
    placeholder: 'name@example.com',
    inviteNotice: 'ההזמנה הקיימת תבוטל ותישלח הזמנה חדשה לכתובת החדשה.',
    cancel: 'ביטול',
    save: 'שמור',
    saving: 'שומר...',
    required: 'אימייל הוא שדה חובה',
    invalid: 'אימייל לא תקין',
    same: 'הכתובת החדשה זהה לכתובת הנוכחית',
  },
  en: {
    title: 'Change email',
    label: 'New email',
    placeholder: 'name@example.com',
    inviteNotice: 'The existing invite will be revoked and a new one will be sent to the new address.',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    required: 'Email is required',
    invalid: 'Invalid email address',
    same: 'The new address is the same as the current one',
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Renders a small centered modal with a single email input.
 * Input: current email, wasInvited flag, language, close and submit callbacks.
 * Output: validated new email passed to onSubmit.
 */
export default function EditEmailModal({
  language,
  currentEmail,
  wasInvited,
  onClose,
  onSubmit,
}: EditEmailModalProps) {
  const copy = COPY[language];
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError(copy.required); return; }
    if (!EMAIL_RE.test(trimmed)) { setError(copy.invalid); return; }
    if (trimmed === currentEmail.toLowerCase()) { setError(copy.same); return; }
    setError(null);
    setSaving(true);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email');
      setSaving(false);
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

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-5">
          <div>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              {language === 'he' ? 'כתובת נוכחית: ' : 'Current address: '}
              <span className="font-medium text-slate-700 dark:text-slate-300">{currentEmail}</span>
            </p>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.label} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder={copy.placeholder}
              autoFocus
              className={`w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 dark:bg-slate-800 dark:text-white ${
                error
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                  : 'border-slate-200 focus:border-primary focus:ring-primary/20 dark:border-slate-700'
              }`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          {wasInvited && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400">
              <span className="material-icons text-sm shrink-0 mt-0.5">info</span>
              <span>{copy.inviteNotice}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? copy.saving : copy.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
