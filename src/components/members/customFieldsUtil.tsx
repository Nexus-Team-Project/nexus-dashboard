/**
 * Shared rendering + input helpers for contact custom columns.
 * Used by the contacts table (read-only cells), the edit-contact modal (inputs),
 * and the CSV import mapper. Keeps per-type behavior in one place.
 */
import type { ContactField, WalletProfileFieldDef } from '../../lib/api';
import { localizeMirrorValue } from './walletMirror';

type Lang = 'he' | 'en';

/** True when a stored value is effectively empty for its type. */
export function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** Read-only cell content for a custom value (chips for labels, text otherwise).
 *  When `mirrorDef` is given (a wallet_profile column), label tokens are
 *  localized to the admin's language via the registry. */
export function renderCustomCell(
  field: ContactField,
  value: unknown,
  language: Lang,
  mirrorDef?: WalletProfileFieldDef,
): React.ReactNode {
  if (isEmptyValue(value)) return <span className="text-slate-300 dark:text-slate-600">—</span>;

  const chip = (text: string, key?: string) => (
    <span key={key} className="inline-block rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">{text}</span>
  );

  if (field.type === 'single_label') {
    const text = mirrorDef ? String(localizeMirrorValue(mirrorDef, value, language)) : String(value);
    return chip(text);
  }
  if (field.type === 'multi_label') {
    const arr = mirrorDef
      ? (localizeMirrorValue(mirrorDef, value, language) as string[])
      : (Array.isArray(value) ? value.map(String) : [String(value)]);
    return <span className="flex flex-wrap gap-1">{arr.map((v) => chip(v, v))}</span>;
  }
  if (field.type === 'date') {
    const d = new Date(String(value));
    const text = Number.isNaN(d.getTime())
      ? String(value)
      : new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', { dateStyle: 'medium' }).format(d);
    return <span className="text-slate-500">{text}</span>;
  }
  return <span className="text-slate-500" dir="auto">{String(value)}</span>;
}

const inputBase =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white';

/**
 * Editable input for one custom field. `value` is the current value (string |
 * number | string[]); `onChange` reports the new value (empty -> '' or []).
 */
export function CustomFieldInput({
  field,
  value,
  onChange,
}: {
  field: ContactField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        onWheel={(e) => e.currentTarget.blur()}
        className={inputBase}
      />
    );
  }
  if (field.type === 'date') {
    return (
      <input
        type="date"
        value={typeof value === 'string' ? value.slice(0, 10) : ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
      />
    );
  }
  if (field.type === 'single_label') {
    return (
      <select value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} className={inputBase}>
        <option value="">—</option>
        {(field.options ?? []).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'multi_label') {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (o: string) =>
      onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
    return (
      <div className="flex flex-wrap gap-1.5">
        {(field.options ?? []).map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                on
                  ? 'bg-primary text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  }
  // free_text + location
  return (
    <input
      type="text"
      maxLength={500}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      dir="auto"
      className={inputBase}
    />
  );
}
