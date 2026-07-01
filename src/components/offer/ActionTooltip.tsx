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
 * Inputs:
 *   - text: the hint to show; when empty/undefined the trigger renders with no tooltip.
 *   - children: the trigger element (e.g. the Publish button).
 * Output: the trigger wrapped so hover/focus reveals `text` centered above it.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ActionTooltipProps {
  text?: string;
  children: ReactNode;
}

/** Viewport margin (px) so the tooltip never runs off the left/right edge. */
const EDGE_MARGIN = 8;
/** Gap (px) between the tooltip's arrow and the top of the trigger. */
const GAP = 8;

export default function ActionTooltip({ text, children }: ActionTooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Measure the trigger when the tooltip opens (or its text changes) and place the
  // tooltip's bottom edge just above the trigger, horizontally centered but clamped
  // into the viewport so long hints stay readable near a screen edge.
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const center = r.left + r.width / 2;
    const clamped = Math.min(Math.max(center, EDGE_MARGIN), window.innerWidth - EDGE_MARGIN);
    setPos({ top: r.top - GAP, left: clamped });
  }, [open, text]);

  const show = () => { if (text) setOpen(true); };
  const hide = () => setOpen(false);

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
      {open && text && pos && createPortal(
        <div
          role="tooltip"
          style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
          className="z-[250] w-max max-w-xs rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-medium leading-snug text-white shadow-xl ring-1 ring-black/10"
        >
          {text}
          <span
            aria-hidden
            className="absolute start-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-slate-900"
          />
        </div>,
        document.body,
      )}
    </span>
  );
}
