/**
 * InfoTooltip - a small "i" icon that reveals custom help text on hover/tap.
 * Lighter than FieldTooltip (which is bound to the fi_<key> translation system);
 * used for the tenant-logo guidance where the text is passed in directly.
 * The popover is centered under the icon and capped to the viewport width so it
 * never overflows off-screen on mobile.
 */
import { useState } from 'react';

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="info"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="ms-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-indigo-500 cursor-help"
      >
        <span className="material-symbols-rounded !text-[16px]">info</span>
      </button>
      {open && (
        <span
          dir="auto"
          className="absolute top-6 left-1/2 z-50 w-60 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-slate-900 p-2.5 text-start text-xs leading-relaxed text-white shadow-xl dark:bg-slate-700"
        >
          {text}
        </span>
      )}
    </span>
  );
}
