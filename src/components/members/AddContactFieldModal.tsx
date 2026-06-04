/**
 * Modal to create a new custom column on the contacts table. Collects a column
 * name + value type; for label types it also collects the allowed option list.
 * Persists via tenantContactFieldsApi.create.
 */
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { tenantContactFieldsApi, type ContactField, type ContactFieldType } from '../../lib/api';

const COPY = {
  he: {
    title: 'הוספת עמודה',
    nameLabel: 'שם העמודה',
    namePh: 'לדוגמה: מחלקה',
    typeLabel: 'סוג הערך',
    optionsLabel: 'אפשרויות לבחירה',
    optionPh: 'הוסף אפשרות ולחץ Enter',
    add: 'הוסף',
    create: 'צור עמודה',
    creating: 'יוצר...',
    cancel: 'ביטול',
    needOption: 'יש להוסיף לפחות אפשרות אחת',
    failed: 'יצירת העמודה נכשלה',
    types: {
      free_text: 'טקסט חופשי',
      number: 'מספר',
      date: 'תאריך',
      single_label: 'תווית (בחירה אחת)',
      multi_label: 'תוויות (בחירה מרובה)',
      location: 'מיקום (כתובת)',
    },
  },
  en: {
    title: 'Add column',
    nameLabel: 'Column name',
    namePh: 'e.g. Department',
    typeLabel: 'Value type',
    optionsLabel: 'Selectable options',
    optionPh: 'Type an option and press Enter',
    add: 'Add',
    create: 'Create column',
    creating: 'Creating...',
    cancel: 'Cancel',
    needOption: 'Add at least one option',
    failed: 'Failed to create the column',
    types: {
      free_text: 'Free text',
      number: 'Number',
      date: 'Date',
      single_label: 'Label (single choice)',
      multi_label: 'Labels (multiple choice)',
      location: 'Location (address)',
    },
  },
} as const;

const TYPE_ORDER: ContactFieldType[] = ['free_text', 'number', 'date', 'single_label', 'multi_label', 'location'];

export default function AddContactFieldModal({
  language,
  onClose,
  onCreated,
}: {
  language: 'he' | 'en';
  onClose: () => void;
  onCreated: (field: ContactField) => void;
}) {
  const copy = COPY[language];
  const [name, setName] = useState('');
  const [type, setType] = useState<ContactFieldType>('free_text');
  const [options, setOptions] = useState<string[]>([]);
  const [draftOption, setDraftOption] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isLabel = type === 'single_label' || type === 'multi_label';

  const addOption = () => {
    const v = draftOption.trim().slice(0, 40);
    if (!v || options.includes(v) || options.length >= 30) return;
    setOptions((prev) => [...prev, v]);
    setDraftOption('');
  };

  const submit = async () => {
    if (!name.trim()) return;
    if (isLabel && options.length === 0) { toast.error(copy.needOption); return; }
    setBusy(true);
    try {
      const field = await tenantContactFieldsApi.create({
        name: name.trim(),
        type,
        ...(isLabel ? { options } : {}),
      });
      onCreated(field);
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
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{copy.title}</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{copy.nameLabel}</label>
          <input
            type="text"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.namePh}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{copy.typeLabel}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ContactFieldType)}
            className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>{copy.types[t]}</option>
            ))}
          </select>
        </div>

        {isLabel && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{copy.optionsLabel}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draftOption}
                maxLength={40}
                onChange={(e) => setDraftOption(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                placeholder={copy.optionPh}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button type="button" onClick={addOption} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {copy.add}
              </button>
            </div>
            {options.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {options.map((o) => (
                  <span key={o} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {o}
                    <button type="button" onClick={() => setOptions((prev) => prev.filter((x) => x !== o))} className="text-slate-400 hover:text-red-500" aria-label="remove">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {copy.cancel}
          </button>
          <button type="button" onClick={() => void submit()} disabled={busy || !name.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50">
            {busy ? copy.creating : copy.create}
          </button>
        </div>
      </div>
    </div>
  );
}
