/**
 * DenyOfferModal - platform admin modal for denying a pending ecosystem voucher offer.
 * Collects a mandatory denial reason (minimum 10 characters) and calls the deny API.
 * The backend emails the denial reason to the creating supplier tenant.
 *
 * Uses the same portal + backdrop + modal pattern as DeleteOfferConfirmModal.
 *
 * Props:
 *   offer    - the CatalogItem being denied (used for offer title in the header).
 *   onClose  - called when the modal should be dismissed without submitting.
 *   onDenied - async callback called after a successful denial so the parent
 *              can reload the catalog list.
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { denyOfferApi, type CatalogItem } from '../lib/api';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DenyOfferModalProps {
  /** The catalog offer being denied - used to display the offer title. */
  offer: CatalogItem;
  /** Called when the modal should close without a denial being submitted. */
  onClose: () => void;
  /**
   * Async callback invoked after a successful denial.
   * Parent should reload the catalog list and then close the modal.
   */
  onDenied: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Modal dialog for platform admins to deny a pending voucher offer.
 * Requires a minimum 10-character denial reason before the submit button is enabled.
 *
 * Input: DenyOfferModalProps (offer, onClose, onDenied).
 * Output: calls denyOfferApi on submit; calls onDenied then onClose on success.
 */
export default function DenyOfferModal({ offer, onClose, onDenied }: DenyOfferModalProps) {
  const { t, language } = useLanguage();
  const [reason, setReason] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  /** Minimum character requirement for the denial reason. */
  const MIN_REASON_LENGTH = 10;
  const MAX_REASON_LENGTH = 1000;

  const isValid = reason.trim().length >= MIN_REASON_LENGTH;

  // Focus the textarea on open; restore focus on unmount.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    textareaRef.current?.focus();
    return () => { prev?.focus(); };
  }, []);

  // Close on Escape key when not in the middle of submitting.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSending) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isSending, onClose]);

  // Trap Tab/Shift+Tab focus inside the modal.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        document.querySelector('[data-deny-modal]')?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), textarea:not(:disabled)',
        ) ?? [],
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Lock background scroll while modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /**
   * Calls denyOfferApi with the entered reason, then delegates to onDenied/onClose.
   * Sets isSending during the async operation and shows an error on failure.
   */
  const handleSubmit = async () => {
    if (!isValid || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      await denyOfferApi(offer.offerId, reason.trim());
      await onDenied();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : (language === 'he' ? 'שגיאה בשליחת הדחייה' : 'Failed to send denial');
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => !isSending && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deny-offer-modal-title"
    >
      <div
        data-deny-modal=""
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 p-6"
        onClick={(e) => e.stopPropagation()}
        dir={language === 'he' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="deny-offer-modal-title"
              className="text-base font-semibold text-slate-900 dark:text-white"
            >
              {t('co_denyModalTitle')}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {offer.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            aria-label={language === 'he' ? 'סגור' : 'Close'}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 shrink-0"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('co_denyModalBody')}
          </p>
          <textarea
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={MAX_REASON_LENGTH}
            rows={4}
            disabled={isSending}
            placeholder={t('co_denyModalPlaceholder')}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-60"
            aria-describedby="deny-reason-hint"
          />
          <div id="deny-reason-hint" className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {reason.trim().length < MIN_REASON_LENGTH && reason.length > 0
                ? (language === 'he'
                    ? `${MIN_REASON_LENGTH - reason.trim().length} תווים נוספים נדרשים`
                    : `${MIN_REASON_LENGTH - reason.trim().length} more characters required`)
                : ''}
            </span>
            <span>{reason.length}/{MAX_REASON_LENGTH}</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Footer */}
        <div className="flex gap-2 justify-start">
          {/* In RTL: first in DOM = visually rightmost */}
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!isValid || isSending}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSending && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {t('co_denyModalSubmit')}
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {t('co_denyModalCancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
