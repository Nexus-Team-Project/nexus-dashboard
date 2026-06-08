/**
 * Read-only modal showing a pending join request's onboarding answers,
 * localized via the wallet mirror registry. Opened from PendingJoinRequestsPanel.
 */
import { useEffect } from 'react';
import type { JoinAnswersSnapshot, WalletProfileFieldDef } from '../../lib/api';
import { localizeMirrorValue, mirrorFieldLabel } from './walletMirror';

interface Props {
  language: 'he' | 'en';
  name: string;
  email: string;
  answers: JoinAnswersSnapshot;
  mirrorDefs: WalletProfileFieldDef[];
  onClose: () => void;
}

const COPY = {
  he: { title: 'תשובות המשתמש', none: 'המשתמש לא ענה על שאלות.', close: 'סגור' },
  en: { title: 'Applicant answers', none: 'This applicant answered no questions.', close: 'Close' },
} as const;

/** Pick the snapshot value that matches a registry def by its profileKey. */
function valueFor(def: WalletProfileFieldDef, a: JoinAnswersSnapshot): unknown {
  switch (def.profileKey) {
    case 'purpose': return a.purpose;
    case 'lifeStage': return a.lifeStage;
    case 'gender': return a.gender;
    case 'birthday': return a.birthday;
    case 'motivation': return a.motivation;
    default: return undefined;
  }
}

/** True when a snapshot value is effectively empty. */
function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

export default function JoinRequestAnswersModal({ language, name, email, answers, mirrorDefs, onClose }: Props) {
  const copy = COPY[language];
  const isHe = language === 'he';

  // Lock body scroll while open (z-[200] sits above the sticky navbar).
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const rows = mirrorDefs
    .map((def) => ({ def, value: valueFor(def, answers) }))
    .filter((r) => !isEmpty(r.value));

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        dir={isHe ? 'rtl' : 'ltr'}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{copy.title}</h3>
        <p className="mt-0.5 truncate text-xs text-slate-500">{name} · {email}</p>

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{copy.none}</p>
        ) : (
          <dl className="mt-4 space-y-3">
            {rows.map(({ def, value }) => {
              const localized = localizeMirrorValue(def, value, language);
              return (
                <div key={def.sourceFieldKey}>
                  <dt className="text-xs font-semibold text-slate-500">{mirrorFieldLabel(def, language)}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {Array.isArray(localized)
                      ? localized.map((v) => (
                          <span key={v} className="inline-block rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">{v}</span>
                        ))
                      : <span className="text-sm text-slate-700 dark:text-slate-200" dir="auto">{localized}</span>}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {copy.close}
          </button>
        </div>
      </div>
    </div>
  );
}
