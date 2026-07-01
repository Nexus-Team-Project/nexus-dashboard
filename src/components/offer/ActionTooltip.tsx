/**
 * ActionTooltip: a hover/focus tooltip that renders in a portal ABOVE its
 * trigger. Two reasons it is a portal rather than an absolutely-positioned child:
 *   1. It is never clipped by an ancestor's `overflow-hidden` (the offer-form hero
 *      banner is clipped) and never hidden beneath sibling cards - it sits at a
 *      high z-index on <body>, so it is above everything on the page.
 *   2. The trigger is wrapped in a plain <span> that owns the pointer/focus
 *      listeners, so the tooltip still appears when the wrapped control is
 *      `disabled` (a disabled <button> emits no mouse events of its own, which is
 *      why a native `title` on a disabled Publish button is flaky).
 *
 * The tooltip text is read live on every render, so it always reflects the
 * current reason (a stale native `title` was showing "need a title" even after
 * the title was filled).
 *
 * Positioning: the box's real width is measured once mounted, then its whole
 * left/right edges are clamped into the viewport (EDGE_MARGIN) so a long hint is
 * pushed fully onto the screen instead of just centering on a clamped point. The
 * box may end up off-center, so the down-arrow is placed at the trigger's center
 * (clamped inside the box) and keeps pointing at the button.
 *
 * Inputs:
 *   - text: the hint to show; when empty/undefined the trigger renders with no tooltip.
 *   - children: the trigger element (e.g. the Publish button).
 * Output: the trigger wrapped so hover/focus reveals `text` above it.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ActionTooltipProps {
  text?: string;
  children: ReactNode;
}

/** Viewport margin (px) so the tooltip box never runs off the left/right edge. */
const EDGE_MARGIN = 8;
/** Gap (px) between the tooltip and the top of the trigger. */
const GAP = 8;
/** Keep the arrow this far (px) from the box's own edges so it never detaches. */
const ARROW_INSET = 10;

interface TipPos {
  /** Top of the box's bottom edge line (the box sits above via translateY(-100%)). */
  top: number;
  /** Clamped left edge of the box, in viewport px. */
  left: number;
  /** Arrow x offset from the box's left edge (points at the trigger center). */
  arrow: number;
}

export default function ActionTooltip({ text, children }: ActionTooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<TipPos | null>(null);

  // Measure the trigger AND the mounted tooltip, then clamp the whole box into the
  // viewport. Runs before paint (useLayoutEffect), so the first frame is already
  // placed - the box is kept invisible (pos === null) until this computes it.
  useLayoutEffect(() => {
    if (!open || !wrapRef.current || !tipRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const width = tipRef.current.offsetWidth;
    const centerX = r.left + r.width / 2;
    const maxLeft = window.innerWidth - EDGE_MARGIN - width;
    const left = Math.max(EDGE_MARGIN, Math.min(centerX - width / 2, maxLeft));
    const arrow = Math.max(ARROW_INSET, Math.min(centerX - left, width - ARROW_INSET));
    setPos({ top: r.top - GAP, left, arrow });
  }, [open, text]);

  const show = () => { if (text) setOpen(true); };
  const hide = () => { setOpen(false); setPos(null); };

  return (
    <span
      ref={wrapRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="inline-flex"
    >
      {children}
      {open && text && createPortal(
        <div
          ref={tipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: pos ? pos.top : 0,
            left: pos ? pos.left : 0,
            transform: 'translateY(-100%)',
            visibility: pos ? 'visible' : 'hidden',
          }}
          className="z-[250] w-max max-w-xs rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium leading-snug text-white shadow-xl ring-1 ring-black/10"
        >
          {text}
          <span
            aria-hidden
            style={{ left: pos ? pos.arrow : '50%' }}
            className="absolute top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-slate-900"
          />
        </div>,
        document.body,
      )}
    </span>
  );
}
