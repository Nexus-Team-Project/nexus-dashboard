/**
 * PublishConfirmModal: approve/cancel confirmation shown when an admin publishes
 * a voucher. Publishing is the step where the actual work happens (the offer is
 * created and the chosen in-memory inventory is applied), so it is gated behind
 * an explicit confirmation. Bilingual; modeled on DeleteOfferConfirmModal
 * (portal, z-index, scroll-lock, focus trap, Escape/backdrop cancel).
 *
 * Props:
 *   summary  - short text describing the inventory that will be applied.
 *   busy     - true while the publish request is in flight (disables actions).
 *   onConfirm - approve → publish.
 *   onCancel  - dismiss without publishing.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';

interface PublishConfirmModalProps {
  summary: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PublishConfirmModal({ summary, busy, onConfirm, onCancel }: PublishConfirmModalProps) {
  const { t } = useLanguage();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus confirm on open; restore previous focus on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    return () => { prev?.focus(); };
  }, []);

  // Close on Escape (unless busy).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [busy, onCancel]);

  // Trap Tab between the two buttons.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Lock background scroll.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-confirm-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h2 id="publish-confirm-title" className="text-base font-semibold text-slate-900 dark:text-white">
            {t('co_pubConfirmTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('co_pubConfirmBody')}</p>
          <p className="mt-1 text-sm">
            <span className="text-slate-500 dark:text-slate-400">{t('co_invCurrentLabel')} </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{summary}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
          >
            {busy ? t('of_saving') : t('co_pubConfirmYes')}
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {t('of_cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
