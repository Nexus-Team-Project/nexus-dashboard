/**
 * OfferDescriptionModal: a reusable dialog that renders a single offer's full
 * rich-text (HTML) description on a clean, high-contrast surface.
 *
 * Used wherever a description cannot be shown inline at full fidelity - e.g. the
 * Benefits Partnerships table cell (too narrow for formatted HTML) and the
 * Product Catalog card grid ("view description" without opening the full offer
 * panel). Renders the author's custom HTML styling (colors, sizes, lists,
 * headings) as-is via RichTextDisplay on a white panel, so nothing is washed out
 * or forced to a single color.
 *
 * Presentational only: the caller owns the open/close state and passes the offer
 * title + description HTML. Follows the shared modal pattern (portal, backdrop
 * dismiss, Escape to close, focus trap, body-scroll-lock, RTL-aware).
 *
 * Props:
 *   title   - offer title shown in the header.
 *   html    - the description HTML to render (sanitized by RichTextDisplay).
 *   onClose - called when the dialog should be dismissed.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import RichTextDisplay from './RichTextDisplay';

interface OfferDescriptionModalProps {
  title: string;
  html: string;
  onClose: () => void;
}

export default function OfferDescriptionModal({ title, html, onClose }: OfferDescriptionModalProps) {
  const { t, language } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button on open; restore focus to the trigger on unmount.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => { prev?.focus(); };
  }, []);

  // Close on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Trap Tab focus inside the dialog.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? [],
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

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const hasContent = !!html && html.trim() !== '' && html !== '<p></p>';

  return createPortal(
    <div
      className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir={language === 'he' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {t('desc_modalEyebrow')}
            </p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={language === 'he' ? 'סגור' : 'Close'}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        {/* Body - full HTML on a clean high-contrast surface, scrolls when tall. */}
        <div className="overflow-y-auto px-6 py-5">
          {hasContent ? (
            <RichTextDisplay html={html} className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed" />
          ) : (
            <p className="text-sm italic text-slate-400">{t('desc_noDescription')}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
