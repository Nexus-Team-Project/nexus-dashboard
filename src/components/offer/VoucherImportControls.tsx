/**
 * Manual / Import entry points for the voucher create page (replaces the old
 * Manual | CSV toggle). "Manual" is the default authoring mode (no-op selector);
 * "Import" opens a small inline popover offering CSV (coming soon, disabled) and
 * Excel (XLSX, functional). Picking Excel calls `onImportXlsx`. Voucher-only;
 * the caller renders this only when the offer type is voucher.
 */
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface VoucherImportControlsProps {
  /** Open the XLSX import flow. */
  onImportXlsx: () => void;
  disabled?: boolean;
}

export default function VoucherImportControls({ onImportXlsx, disabled = false }: VoucherImportControlsProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the popover on any outside pointer-down (mouse + touch), matching the
  // repo's tooltip/popover pattern (no CSS group-hover).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  const btnBase = 'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors';

  return (
    <div className="mb-2 flex items-center gap-2">
      {/* Manual is the default mode; clicking it just dismisses the import menu. */}
      <button
        type="button"
        onClick={() => setOpen(false)}
        disabled={disabled}
        className={`${btnBase} bg-primary text-white shadow-sm hover:opacity-90 disabled:opacity-60`}
      >
        <span className="material-icons text-base">edit</span>
        {t('vxi_manual')}
      </button>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={open}
          className={`${btnBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-60`}
        >
          <span className="material-icons text-base">upload_file</span>
          {t('vxi_import')}
          <span className="material-icons text-base">{open ? 'expand_less' : 'expand_more'}</span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute z-[60] mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            {/* CSV: present but not wired yet. */}
            <button
              type="button"
              role="menuitem"
              disabled
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <span className="material-icons text-base">description</span>
                {t('vxi_importCsv')}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wide">{t('vxi_csvSoon')}</span>
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-800" />
            {/* Excel: the functional path. */}
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onImportXlsx(); }}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="material-icons text-base text-emerald-600">grid_on</span>
              {t('vxi_importXlsx')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
