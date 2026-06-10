/**
 * DeleteOfferConfirmModal: confirmation dialog before permanently deleting an offer.
 * Shows the offer title and a warning. Calls onConfirm after the user accepts.
 *
 * Props:
 *   offerTitle - title of the offer being deleted (shown in dialog).
 *   isDeleting - true while the delete API call is in progress (shows spinner).
 *   onConfirm  - called when user clicks the red confirm button.
 *   onCancel   - called when user dismisses without confirming.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DeleteOfferConfirmModalProps {
  offerTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteOfferConfirmModal({
  offerTitle,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteOfferConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button on open; restore previous focus on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    return () => { prev?.focus(); };
  }, []);

  // Close on Escape key.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isDeleting) onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isDeleting, onCancel]);

  // Trap Tab/Shift+Tab inside the modal — cycles between cancel and confirm buttons.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
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

  // Lock background scroll.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={() => !isDeleting && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-offer-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="delete-offer-title"
            className="text-base font-semibold text-slate-900 dark:text-white"
          >
            מחיקת הצעה
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            האם למחוק את <span className="font-medium text-slate-700 dark:text-slate-200">"{offerTitle}"</span>?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            פעולה זו תמחק את ההצעה ואת התמונה שלה לצמיתות. לא ניתן לבטל.
          </p>
        </div>

        <div className="flex justify-start gap-2">
          {/* In RTL: first in DOM = visually rightmost */}
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                מוחק...
              </>
            ) : (
              'מחק לצמיתות'
            )}
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
