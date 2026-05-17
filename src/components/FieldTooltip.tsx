/**
 * FieldTooltip — inline "i" icon that shows a short tooltip on hover/tap and
 * opens a FieldInfoModal with detailed explanation + example on "Learn more".
 *
 * The tooltip panel is rendered via React portal so it escapes any
 * overflow:hidden ancestor (e.g. the EditOfferDrawer modal card).
 * Position is computed from getBoundingClientRect on the trigger button.
 *
 * Desktop: mouseenter → show after 150 ms delay, mouseleave → close after 200 ms.
 *          Moving the mouse over the tooltip cancels the close timer.
 * Mobile:  tap icon to toggle open/closed; tap outside to close.
 * Keyboard: Escape closes; scroll closes.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import FieldInfoModal from './FieldInfoModal';
import type { FieldInfoKey } from '../types/fieldInfo';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FieldTooltipProps {
  /** Which field this tooltip describes — maps to fi_<fieldKey>_* translation keys. */
  fieldKey: FieldInfoKey;
  /** Whether the tooltip appears above or below the icon. Defaults to 'top'. */
  placement?: 'top' | 'bottom';
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a small circular "i" button inline with a field label.
 * Hover/tap shows a short tooltip; clicking "Learn more" opens FieldInfoModal.
 *
 * Input:  fieldKey - identifies which field's info to display.
 * Output: button + portal tooltip + optional FieldInfoModal.
 */
export default function FieldTooltip({ fieldKey, placement = 'top' }: FieldTooltipProps) {
  const { t } = useLanguage();
  const [open, setOpen]           = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const buttonRef  = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const openTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: clear both pending timers.
  const clearTimers = useCallback(() => {
    if (openTimer.current)  clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Snapshot button position so the portal can render in the right spot.
  const snapRect = useCallback(() => {
    if (buttonRef.current) setAnchorRect(buttonRef.current.getBoundingClientRect());
  }, []);

  const scheduleOpen = useCallback(() => {
    clearTimers();
    snapRect();
    openTimer.current = setTimeout(() => setOpen(true), 150);
  }, [clearTimers, snapRect]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  }, [clearTimers]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Cleanup on unmount.
  useEffect(() => () => clearTimers(), [clearTimers]);

  // Close on outside click/tap (mobile toggle-off).
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || tooltipRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  // Close on Escape key or any scroll event.
  useEffect(() => {
    if (!open) return;
    const onKey    = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, [open]);

  // Toggle on click/tap of the icon button.
  const handleToggle = () => {
    if (open) {
      clearTimers();
      setOpen(false);
    } else {
      snapRect();
      setOpen(true);
    }
  };

  const handleLearnMore = () => {
    setOpen(false);
    setModalOpen(true);
  };

  // Compute fixed-position style for the portal tooltip panel.
  const tooltipStyle: React.CSSProperties | undefined = anchorRect
    ? {
        position: 'fixed',
        left: anchorRect.left + anchorRect.width / 2,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        ...(placement === 'top'
          ? { bottom: window.innerHeight - anchorRect.top + 8 }
          : { top: anchorRect.bottom + 8 }),
      }
    : undefined;

  // Dynamic translation key helper — asserts the template literal is a valid key.
  const fi = (suffix: 'label' | 'short') =>
    t(`fi_${fieldKey}_${suffix}` as TranslationKey);

  return (
    <>
      {/* ── Trigger icon ─────────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={fi('label')}
        aria-expanded={open}
        className="ms-1.5 inline-flex items-center justify-center w-[15px] h-[15px] shrink-0 rounded-full border border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 cursor-help"
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onClick={handleToggle}
        onTouchStart={(e) => { e.preventDefault(); handleToggle(); }}
      >
        {/* SVG "i" — dot above a vertical bar inside a circle outline */}
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-2.5 h-2.5" aria-hidden="true">
          <circle cx="6" cy="6" r="5.25" />
          <circle cx="6" cy="4" r="0.5" fill="currentColor" stroke="none" />
          <line x1="6" y1="6" x2="6" y2="9" />
        </svg>
      </button>

      {/* ── Tooltip panel — rendered via portal ──────────────────────── */}
      {open && tooltipStyle && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          style={tooltipStyle}
          className="w-52 rounded-xl bg-white shadow-xl border border-slate-100 p-3 dark:bg-slate-800 dark:border-slate-700"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {fi('short')}
          </p>
          <button
            type="button"
            onClick={handleLearnMore}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            {t('fi_learnMore')}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        </div>,
        document.body,
      )}

      {/* ── Detailed info modal ───────────────────────────────────────── */}
      {modalOpen && (
        <FieldInfoModal
          fieldKey={fieldKey}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
