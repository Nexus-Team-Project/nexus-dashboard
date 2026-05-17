/**
 * FieldInfoModal — detailed field explanation modal opened from FieldTooltip.
 *
 * Renders via React portal to document.body so it sits above all stacking
 * contexts (including EditOfferDrawer and other modals).
 *
 * Anatomy:
 *   Header  — indigo "i" badge + field label + close button
 *   Body    — detail paragraph + example box (indigo left-border card)
 *   Footer  — "Got it" primary button
 *
 * Behaviour: Escape closes, backdrop click closes, body scroll is locked
 * while open. Close button receives focus on mount for keyboard accessibility.
 * dir attribute adapts to the current language (RTL for Hebrew).
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { FieldInfoKey } from '../types/fieldInfo';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FieldInfoModalProps {
  /** Field whose label, detail, and example are displayed. */
  fieldKey: FieldInfoKey;
  /** Called when the modal should close (close button, backdrop, or Escape). */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Full-screen backdrop + centered card modal with field documentation.
 *
 * Input:  fieldKey - determines which fi_* translation keys are used.
 * Output: portal-rendered modal, calls onClose when dismissed.
 */
export default function FieldInfoModal({ fieldKey, onClose }: FieldInfoModalProps) {
  const { t, language } = useLanguage();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll and register keyboard/cleanup handlers.
  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Dynamic key resolver — asserts the template literal is a valid TranslationKey.
  const fi = (suffix: 'label' | 'detail' | 'example') =>
    t(`fi_${fieldKey}_${suffix}` as TranslationKey);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fim-title"
        dir={language === 'he' ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            {/* Indigo "i" badge */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400">
                <circle cx="6" cy="6" r="5.25" />
                <circle cx="6" cy="4" r="0.5" fill="currentColor" stroke="none" />
                <line x1="6" y1="6" x2="6" y2="9" />
              </svg>
            </div>

            <h3
              id="fim-title"
              className="flex-1 text-sm font-semibold text-slate-900 dark:text-white"
            >
              {fi('label')}
            </h3>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t('fi_close')}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden="true">
                <path d="M2 2l12 12M14 2L2 14" />
              </svg>
            </button>
          </div>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="px-5 py-4 space-y-4">
            {/* Detail paragraph */}
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {fi('detail')}
            </p>

            {/* Example card */}
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border-s-4 border-indigo-400 dark:border-indigo-600 px-4 py-3">
              <span className="block text-[10px] font-semibold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest mb-1.5">
                {t('fi_exampleLabel')}
              </span>
              <p className="text-sm text-indigo-800 dark:text-indigo-300 italic leading-relaxed">
                {fi('example')}
              </p>
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-primary shadow-sm hover:opacity-90 text-white py-2.5 text-sm font-semibold transition-opacity"
            >
              {t('fi_gotIt')}
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body,
  );
}
