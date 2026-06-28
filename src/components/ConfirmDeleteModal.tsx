/**
 * ConfirmDeleteModal: the dashboard's single reusable confirmation dialog for
 * destructive / delete actions. Presentational only - the caller owns the data,
 * the delete request, and the `isDeleting` flag; this component renders the
 * confirm UI and reports the user's choice via onConfirm / onCancel.
 *
 * Consolidates the patterns already used by DeleteOfferConfirmModal (portal,
 * focus management, focus trap, Escape-to-cancel, body-scroll-lock, red confirm
 * + neutral cancel + spinner) and ConfirmRemoveModal (bilingual via props,
 * backdrop dismiss). It is locale-agnostic: pass already-localized strings; the
 * dialog only reads `useLanguage` to pick its text direction.
 *
 * Props:
 *   title        - dialog heading.
 *   message      - the confirmation question (string or node).
 *   warning?     - optional red "cannot be undone" line under the message.
 *   confirmLabel - confirm (delete) button text, localized by the caller.
 *   cancelLabel  - cancel button text, localized by the caller.
 *   busyLabel?   - confirm-button text while deleting (defaults to confirmLabel).
 *   isDeleting?  - true while the caller's delete request is in flight (disables
 *                  the buttons, shows a spinner, and blocks cancel/Escape/backdrop).
 *   onConfirm    - called when the user accepts.
 *   onCancel     - called on cancel / Escape / backdrop click (ignored while deleting).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface ConfirmDeleteModalProps {
  title: string;
  message: ReactNode;
  warning?: string;
  confirmLabel: string;
  cancelLabel: string;
  busyLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  title,
  message,
  warning,
  confirmLabel,
  cancelLabel,
  busyLabel,
  isDeleting = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const { language } = useLanguage();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button on open; restore the previously focused element on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    return () => { prev?.focus(); };
  }, []);

  // Escape cancels (unless deleting); Tab/Shift+Tab cycle between the two buttons.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) { onCancel(); return; }
      if (e.key !== 'Tab') return;
      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isDeleting, onCancel]);

  // Lock background scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    // z-[220] keeps the confirm above page chrome AND other modals (z-[200]) and
    // their sub-editors (z-[210]) - a delete confirm must always be on top.
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !isDeleting && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
          {warning && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{warning}</p>}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isDeleting ? (busyLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
