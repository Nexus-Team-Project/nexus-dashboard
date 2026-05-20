/**
 * Modal for manually adding a single contact to the tenant address book.
 * Calls the contacts API on submit and notifies the parent on success.
 */
import { useState } from 'react';
import { tenantContactsApi } from '../../lib/api';
import { normalizeIsraeliPhone } from '../../lib/israeliPhone';

interface AddContactModalProps {
  language: 'he' | 'en';
  onClose: () => void;
  /** Called after a contact is successfully created so the table can refresh. */
  onCreated: () => void;
}

const COPY = {
  he: {
    title: 'הוסף איש קשר',
    name: 'שם מלא',
    namePh: 'ישראל ישראלי',
    email: 'אימייל',
    emailPh: 'name@example.com',
    address: 'כתובת',
    addressPh: 'רחוב הרצל 1, תל אביב',
    phone: 'טלפון נייד',
    phonePh: '0508465858 / +972508465858',
    cancel: 'ביטול',
    save: 'שמור',
    saving: 'שומר...',
    required: 'אימייל הוא שדה חובה',
    invalid: 'אימייל לא תקין',
    invalidPhone: 'מספר טלפון לא תקין. השתמש בפורמט 05XXXXXXXX או +972XXXXXXXX.',
  },
  en: {
    title: 'Add contact',
    name: 'Full Name',
    namePh: 'Jane Smith',
    email: 'Email',
    emailPh: 'name@example.com',
    address: 'Address',
    addressPh: '1 Main St, City',
    phone: 'Mobile phone',
    phonePh: '0508465858 / +972508465858',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    required: 'Email is required',
    invalid: 'Invalid email address',
    invalidPhone: 'Invalid phone number. Use 05XXXXXXXX or +972XXXXXXXX.',
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Renders a centered modal with a form to create one contact.
 * Input: language, close callback, success callback.
 * Output: form that posts to the contacts API on submit.
 */
export default function AddContactModal({ language, onClose, onCreated }: AddContactModalProps) {
  const copy = COPY[language];
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { setError(copy.required); return; }
    if (!EMAIL_RE.test(trimmedEmail)) { setError(copy.invalid); return; }

    // Phone is optional. When provided, it must normalize to a valid Israeli
    // mobile; otherwise we block the submit and show a per-field error.
    const trimmedPhone = phone.trim();
    let normalizedPhone: string | undefined;
    if (trimmedPhone) {
      const n = normalizeIsraeliPhone(trimmedPhone);
      if (!n) { setPhoneError(copy.invalidPhone); return; }
      normalizedPhone = n;
    }

    setError(null);
    setPhoneError(null);
    setSaving(true);
    try {
      await tenantContactsApi.create({
        email: trimmedEmail,
        displayName: displayName.trim() || undefined,
        address: address.trim() || undefined,
        phone: normalizedPhone,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in zoom-in duration-200">
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-5">
          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.name}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={copy.namePh}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.email} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder={copy.emailPh}
              className={`w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 dark:bg-slate-800 dark:text-white ${
                error
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                  : 'border-slate-200 focus:border-primary focus:ring-primary/20 dark:border-slate-700'
              }`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.address}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={copy.addressPh}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Phone (Israeli mobile, optional) */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.phone}
            </label>
            <input
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
              placeholder={copy.phonePh}
              className={`w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 dark:bg-slate-800 dark:text-white ${
                phoneError
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                  : 'border-slate-200 focus:border-primary focus:ring-primary/20 dark:border-slate-700'
              }`}
            />
            {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
          </div>

          {/* Actions */}
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
