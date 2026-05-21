/**
 * VoucherPricePopover.tsx
 *
 * Anchored popover that lets a tenant set its per-offer voucher member
 * price. Slider bounded by [nexusCost, faceValue]. Shows live "Members
 * pay" and "Your profit" rows. Save calls updateTenantVoucherPrice on
 * the backend and propagates the new price back via onSaved.
 *
 * Rendered via React portal so it escapes table overflow:hidden. Closes
 * on Escape, on outside click, and after a successful save.
 *
 * Bilingual EN + HE; slider numeric labels stay LTR.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { updateTenantVoucherPrice } from '../../lib/api';

export interface VoucherPricePopoverProps {
  /** Identifier of the offer whose price is being set. */
  offerId: string;
  /** Voucher face value (slider max). */
  faceValue: number;
  /** Nexus cost (slider min). */
  nexusCost: number;
  /** Currently saved member price for this tenant. */
  currentMemberPrice: number;
  /** Anchor element used to position the popover. */
  anchor: HTMLElement | null;
  /** Called with the new price after a successful save. */
  onSaved: (newPrice: number) => void;
  /** Called when the popover should close (cancel, backdrop, Esc, save). */
  onClose: () => void;
}

const VoucherPricePopover = ({
  offerId,
  faceValue,
  nexusCost,
  currentMemberPrice,
  anchor,
  onSaved,
  onClose,
}: VoucherPricePopoverProps) => {
  const { t, language } = useLanguage();
  const [value, setValue] = useState<number>(
    Math.min(Math.max(currentMemberPrice, nexusCost), faceValue),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(e.target as Node)) return;
      if (anchor && anchor.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [anchor, onClose]);

  // Anchor-based positioning. The popover prefers to open below the anchor
  // cell, but flips above when there is not enough room below. When neither
  // direction fits (very small viewport), it anchors to the bottom of the
  // viewport so the whole popover (including Save/Cancel) stays visible.
  //
  // Position computation pseudocode:
  //   if (rect.bottom + 6 + height <= viewportH - 8) -> open BELOW
  //   else if (rect.top - 6 - height >= 8)           -> open ABOVE
  //   else                                            -> clamp to BOTTOM of viewport
  const [popoverHeight, setPopoverHeight] = useState<number>(0);

  // Measure the rendered popover height after mount and on resize so the
  // initial position computed above is correct (orientation change on mobile
  // is the common reason this needs to re-run).
  useLayoutEffect(() => {
    const measure = () => {
      const h = popoverRef.current?.offsetHeight ?? 0;
      if (h > 0) setPopoverHeight(h);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  const rect = anchor?.getBoundingClientRect();
  let style: React.CSSProperties;
  if (!rect) {
    style = { display: 'none' };
  } else {
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const height = popoverHeight;
    const margin = 8;
    const gap = 6;

    let top: number;
    if (height === 0) {
      // First render: place near anchor but keep invisible to avoid a flash
      // in the wrong spot. Real position is set on the next layout pass.
      top = rect.bottom + gap;
    } else if (rect.bottom + gap + height <= viewportH - margin) {
      top = rect.bottom + gap;
    } else if (rect.top - gap - height >= margin) {
      top = rect.top - gap - height;
    } else {
      top = Math.max(margin, viewportH - height - margin);
    }

    style = {
      position: 'fixed',
      top,
      left: Math.max(margin, Math.min(viewportW - 296, rect.left)),
      width: 288,
      zIndex: 200,
      visibility: height === 0 ? 'hidden' : 'visible',
    };
  }

  const profit = value - nexusCost;

  const handleSave = useCallback(async () => {
    if (value < nexusCost || value > faceValue) {
      setError(
        t('vp_error_bounds')
          .replace('{{min}}', String(nexusCost))
          .replace('{{max}}', String(faceValue)),
      );
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateTenantVoucherPrice(offerId, value);
      onSaved(value);
      onClose();
    } catch {
      setError(t('vp_error_generic'));
    } finally {
      setSaving(false);
    }
  }, [value, nexusCost, faceValue, offerId, onSaved, onClose, t]);

  return createPortal(
    <div
      ref={popoverRef}
      style={style}
      role="dialog"
      aria-label={t('vp_title')}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        {t('vp_title')}
      </h3>
      <input
        type="range"
        min={nexusCost}
        max={faceValue}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onWheel={(e) => e.currentTarget.blur()}
        disabled={saving}
        className="w-full accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        dir="ltr"
        aria-label={t('vp_title')}
      />
      <div className="mt-1 flex justify-between text-xs text-slate-400" dir="ltr">
        <span>{t('vp_minLabel').replace('{{value}}', `₪${nexusCost}`)}</span>
        <span>{t('vp_maxLabel').replace('{{value}}', `₪${faceValue}`)}</span>
      </div>
      <div className="mt-3 flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{t('vp_membersPay')}</span>
          <span className="font-semibold text-slate-900 dark:text-white">{`₪${value}`}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{t('vp_yourProfit')}</span>
          <span
            className={
              profit > 0
                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                : 'font-semibold text-slate-500'
            }
          >
            {`₪${profit.toFixed(2)}`}
          </span>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {t('vp_cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-white shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {t('vp_save')}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default VoucherPricePopover;
