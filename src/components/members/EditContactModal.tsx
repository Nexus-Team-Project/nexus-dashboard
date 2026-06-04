/**
 * Modal to edit a contact: its base fields (name, address, phone) and all of the
 * tenant's custom-column values. Existing rows that predate a column simply show
 * an empty input. Saves via tenantContactsApi.update; only changed base fields
 * are sent (so unrelated edits don't reset phone verification).
 */
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { tenantContactsApi, type ContactField, type TenantContact } from '../../lib/api';
import { CustomFieldInput } from './customFieldsUtil';

const COPY = {
  he: {
    title: 'עריכת איש קשר',
    name: 'שם מלא',
    address: 'כתובת',
    phone: 'טלפון',
    customSection: 'עמודות מותאמות אישית',
    save: 'שמירה',
    saving: 'שומר...',
    cancel: 'ביטול',
    failed: 'השמירה נכשלה',
    saved: 'איש הקשר עודכן',
  },
  en: {
    title: 'Edit contact',
    name: 'Full name',
    address: 'Address',
    phone: 'Phone',
    customSection: 'Custom columns',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    failed: 'Save failed',
    saved: 'Contact updated',
  },
} as const;

const inputBase =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white';

/** Initial editable value for a custom field from the stored contact value. */
function initialValue(field: ContactField, stored: unknown): unknown {
  if (field.type === 'multi_label') return Array.isArray(stored) ? stored : [];
  return stored ?? '';
}

export default function EditContactModal({
  language,
  contact,
  fields,
  onClose,
  onSaved,
}: {
  language: 'he' | 'en';
  contact: TenantContact;
  fields: ContactField[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const copy = COPY[language];
  const [displayName, setDisplayName] = useState(contact.displayName ?? '');
  const [address, setAddress] = useState(contact.address ?? '');
  const [phone, setPhone] = useState(contact.phone ?? '');
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of fields) init[f.fieldId] = initialValue(f, contact.customFields?.[f.fieldId]);
    return init;
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const payload: {
        displayName?: string;
        address?: string;
        phone?: string;
        customFields?: Record<string, unknown>;
      } = { customFields: values };
      // Only send changed base fields. Skip clearing the name (server requires >=1 char).
      if (displayName.trim() && displayName !== (contact.displayName ?? '')) payload.displayName = displayName.trim();
      if (address !== (contact.address ?? '')) payload.address = address;
      if (phone !== (contact.phone ?? '')) payload.phone = phone;

      await tenantContactsApi.update(contact.tenantContactId, payload);
      toast.success(copy.saved);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(copy.failed, { description: err instanceof Error ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        dir={language === 'he' ? 'rtl' : 'ltr'}
        className="flex max-h-[85vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{copy.title}</h2>
        <p className="-mt-2 truncate text-xs text-slate-400">{contact.email}</p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{copy.name}</label>
          <input type="text" value={displayName} maxLength={255} onChange={(e) => setDisplayName(e.target.value)} className={inputBase} dir="auto" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{copy.address}</label>
          <input type="text" value={address} maxLength={500} onChange={(e) => setAddress(e.target.value)} className={inputBase} dir="auto" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{copy.phone}</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputBase} dir="ltr" placeholder="05XXXXXXXX" />
        </div>

        {fields.length > 0 && (
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{copy.customSection}</p>
            <div className="flex flex-col gap-4">
              {fields.map((f) => (
                <div key={f.fieldId}>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" dir="auto">{f.name}</label>
                  <CustomFieldInput field={f} value={values[f.fieldId]} onChange={(next) => setValues((prev) => ({ ...prev, [f.fieldId]: next }))} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {copy.cancel}
          </button>
          <button type="button" onClick={() => void save()} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50">
            {busy ? copy.saving : copy.save}
          </button>
        </div>
      </div>
    </div>
  );
}
