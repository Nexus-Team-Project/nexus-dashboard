/**
 * SidebarTooltip: shows a collapsed nav item's FULL label in a tooltip that is
 * portalled to <body>, so it is never clipped by the sidebar's `overflow-y-auto`.
 * The app-wide `[data-tooltip]` tooltip is a CSS pseudo-element and gets cut off
 * inside that scroll box when the sidebar is collapsed (the text runs past the
 * narrow sidebar and is clipped). This renders the label on the content-facing
 * (inline-end) side of the item, above everything, on one line.
 *
 * Active only when `label` is non-empty (i.e. the sidebar is collapsed); otherwise
 * it renders the child untouched so the expanded sidebar is byte-for-byte unchanged.
 * The wrapper is `display:block` so it does not disturb the nav's vertical rhythm
 * or the item's own full-width flex layout.
 *
 * Inputs: label (full text; empty disables the tooltip), children (the nav item).
 * Output: the child, plus a hover/focus-triggered portalled tooltip beside it.
 */
import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface SidebarTooltipProps {
  label: string;
  children: ReactNode;
}

/** Gap (px) between the item and the tooltip. */
const GAP = 12;

export default function SidebarTooltip({ label, children }: SidebarTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; rtl: boolean } | null>(null);

  // No label -> expanded sidebar: render the item as-is, no wrapper, no tooltip.
  if (!label) return <>{children}</>;

  // Place the tooltip on the content-facing side (inline-end): to the right of the
  // item in LTR, to the left in RTL (where the sidebar sits on the right). Direction
  // is read from the item itself so it is correct regardless of where `dir` is set.
  const show = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rtl = getComputedStyle(el).direction === 'rtl';
    setPos({
      top: r.top + r.height / 2,
      left: rtl ? r.left - GAP : r.right + GAP,
      rtl,
    });
  };
  const hide = () => setPos(null);

  return (
    <span
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="block"
    >
      {children}
      {pos && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            transform: pos.rtl ? 'translate(-100%, -50%)' : 'translateY(-50%)',
          }}
          className="pointer-events-none z-[250] whitespace-nowrap rounded-md bg-[#1a1a2e] px-3 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          {label}
        </div>,
        document.body,
      )}
    </span>
  );
}
