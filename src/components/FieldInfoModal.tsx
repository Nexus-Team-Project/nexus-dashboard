/**
 * FieldInfoModal — field documentation modal opened from FieldTooltip "Learn more".
 *
 * Design: enterprise minimal — dark slate header strip, clean white body,
 * neutral example block. No gradients, no colored badge icons, no AI-pattern
 * decoration. Follows Minimalism + Trust & Authority design system.
 *
 * Behaviour: Escape closes, backdrop click closes, body scroll locked while
 * open. Close button receives focus on mount. RTL-aware.
 *
 * Renders via React portal to document.body to escape all stacking contexts.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { FieldInfoKey } from '../types/fieldInfo';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FieldInfoModalProps {
  /** Field whose fi_*_label/detail/example translation keys are used. */
  fieldKey: FieldInfoKey;
  /** Called when the modal should close (button, backdrop, or Escape). */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Portal-rendered field documentation modal.
 * Input:  fieldKey — which fi_* keys to render.
 * Output: backdrop + modal card, calls onClose on dismiss.
 */
export default function FieldInfoModal({ fieldKey, onClose }: FieldInfoModalProps) {
  const { t, language } = useLanguage();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isRTL = language === 'he';

  // Lock scroll, focus close button, register Escape handler.
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

  const fi = (suffix: 'label' | 'detail' | 'example') =>
    t(`fi_${fieldKey}_${suffix}` as TranslationKey);

  return createPortal(
    <>
      {/* Backdrop — no blur, clean dark overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering wrapper */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fim-title"
          dir={isRTL ? 'rtl' : 'ltr'}
          className="w-full max-w-sm overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/8"
        >

          {/* ── Header — dark slate strip ────────────────────── */}
          <div className="bg-slate-900 px-5 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {/* Eyebrow label */}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">
                {t('fi_exampleLabel') === 'Example' ? 'Field Guide' : 'מדריך שדה'}
              </p>
              <h3
                id="fim-title"
                className="text-[15px] font-semibold text-white leading-snug"
              >
                {fi('label')}
              </h3>
            </div>

            {/* Close button */}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t('fi_close')}
              className="shrink-0 mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-3 h-3" aria-hidden="true">
                <path d="M2 2l12 12M14 2L2 14" />
              </svg>
            </button>
          </div>

          {/* ── Body ─────────────────────────────────────────── */}
          <div className="bg-white px-5 pt-5 pb-4 space-y-4">

            {/* Detail paragraph */}
            <p className="text-[13.5px] text-slate-700 leading-[1.65]">
              {fi('detail')}
            </p>

            {/* Example block — neutral, no color decoration */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {/* "Example" heading strip */}
              <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex items-center gap-2">
                {/* Small document icon */}
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true">
                  <rect x="2" y="1" width="10" height="12" rx="1.5" />
                  <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {t('fi_exampleLabel')}
                </span>
              </div>
              {/* Example text */}
              <div className="px-3.5 py-3">
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  {fi('example')}
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────── */}
          <div className="bg-white border-t border-slate-100 px-5 py-3.5 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-primary shadow-sm hover:opacity-90 active:opacity-80 text-white px-5 py-2 rounded-lg text-[13px] font-semibold tracking-wide transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
