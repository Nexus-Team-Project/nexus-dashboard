/**
 * VoucherPricePopover.tsx
 *
 * Anchored popover that lets a tenant set a per-offer voucher markup
 * PERCENTAGE on the base sale price. Slider + type-in box both range
 * [0, maxPct] where maxPct lifts the base to face value. Shows live
 * "Members pay" (effective) and "Your profit" (effective - nexusCost)
 * rows, plus a tooltip explaining the %. Save sends markupPct to the
 * backend, which recomputes + caches the effective price; onSaved gets
 * the new effective price.
 *
 * Rendered via React portal so it escapes table overflow:hidden. Closes
 * on Escape, on outside click, and after a successful save.
 *
 * Bilingual EN + HE; slider + numeric box stay LTR.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { updateTenantVoucherPrice } from '../../lib/api';
import FieldTooltip from '../FieldTooltip';

export interface VoucherPricePopoverProps {
  /** Identifier of the offer whose price is being set. */
  offerId: string;
  /** When set, the price is saved for THIS variant only (per-variant pricing). */
  variantId?: string;
  /** Voucher face value (the effective price is capped here). */
  faceValue: number;
  /** Nexus cost (used to show "your profit"). */
  nexusCost: number;
  /** Raw offer base sale price the markup % is applied to. */
  baseSalePrice: number;
  /** Currently stored markup % for this tenant (0 when none). */
  currentMarkupPct: number;
  /** Anchor element used to position the popover. */
  anchor: HTMLElement | null;
  /** Called with the new effective price after a successful save. */
  onSaved: (newPrice: number) => void;
  /** Called when the popover should close (cancel, backdrop, Esc, save). */
  onClose: () => void;
}

const VoucherPricePopover = ({
  offerId,
  variantId,
  faceValue,
  nexusCost,
  baseSalePrice,
  currentMarkupPct,
  anchor,
  onSaved,
  onClose,
}: VoucherPricePopoverProps) => {
  const { t, language } = useLanguage();
  // Pure markup math (mirrors backend supply-price.helper). base = the sale price
  // the % is applied to; effective is capped at faceValue and rounded to agorot.
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const maxPct =
    baseSalePrice > 0 && faceValue > baseSalePrice
      ? round2((faceValue / baseSalePrice - 1) * 100)
      : 0;
  const clampPct = (p: number) => (!Number.isFinite(p) || p < 0 ? 0 : p > maxPct ? maxPct : p);
  const [pct, setPct] = useState<number>(clampPct(currentMarkupPct));
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
      // The FieldTooltip panel + its "Learn more" modal render in portals outside
      // this popover; clicking them must NOT close the popover (which would unmount
      // the tooltip mid-interaction). role="tooltip"/"dialog" identify both.
      if ((e.target as HTMLElement).closest?.('[role="tooltip"], [role="dialog"]')) return;
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

  const effective = round2(Math.min(baseSalePrice * (1 + pct / 100), faceValue));
  const profit = round2(effective - nexusCost);

  const handleSave = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      await updateTenantVoucherPrice(offerId, clampPct(pct), variantId);
      onSaved(effective);
      onClose();
    } catch {
      setError(t('vp_error_generic'));
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, effective, offerId, variantId, onSaved, onClose, t]);

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
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center text-xs text-slate-500">
          <label htmlFor="vp-pct">{t('vp_pctBoxLabel')}</label>
          <FieldTooltip fieldKey="voucherMarkupPct" />
        </span>
        <input
          id="vp-pct"
          type="number"
          min={0}
          max={maxPct}
          step={0.1}
          value={pct}
          onChange={(e) => setPct(clampPct(Number(e.target.value)))}
          onWheel={(e) => e.currentTarget.blur()}
          disabled={saving}
          dir="ltr"
          className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-center dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          aria-label={t('vp_pctBoxLabel')}
        />
      </div>
      <input
        type="range"
        min={0}
        max={maxPct}
        step={0.1}
        value={pct}
        onChange={(e) => setPct(Number(e.target.value))}
        onWheel={(e) => e.currentTarget.blur()}
        disabled={saving}
        className="w-full accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        dir="ltr"
        aria-label={t('vp_title')}
      />
      <div className="mt-1 flex justify-between text-xs text-slate-400" dir="ltr">
        <span>0%</span>
        <span>{maxPct}%</span>
      </div>
      <div className="mt-3 flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t('vp_baseSalePrice')}</span>
          <span className="tabular-nums" dir="ltr">{`₪${baseSalePrice}`}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t('vp_value')}</span>
          <span className="tabular-nums" dir="ltr">{`₪${faceValue}`}</span>
        </div>
        <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{t('vp_membersPay')}</span>
          <span className="font-semibold text-slate-900 dark:text-white" dir="ltr">{`₪${effective.toFixed(2)}`}</span>
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
