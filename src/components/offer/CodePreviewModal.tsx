/**
 * CodePreviewModal: a client-side "preview before finalizing" dialog for voucher
 * barcode inventory. Renders ONE sample 1-D barcode (react-barcode, CODE128) and
 * ONE sample QR (qrcode.react) from a representative entered string, so the
 * provider sees what their codes will look like before committing. Confirm
 * finalizes the inventory choice; cancel returns to entry.
 *
 * Rendering is 100% client-side — the string is passed to the libraries as data
 * (SVG/canvas), never as HTML. Portal, z-[200], scroll-lock, Escape/backdrop cancel.
 *
 * Props:
 *   sampleValue - a representative entered barcode string (the first non-empty).
 *   count       - how many barcodes will be created (shown for context).
 *   busy        - disables actions while the parent is publishing.
 *   onConfirm   - finalize the inventory choice.
 *   onCancel    - return to entry without finalizing.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../i18n/LanguageContext';

interface CodePreviewModalProps {
  sampleValue: string;
  count: number;
  /** How many duplicate entries were combined before this preview (0 = none). */
  duplicatesRemoved?: number;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CodePreviewModal({ sampleValue, count, duplicatesRemoved = 0, busy = false, onConfirm, onCancel }: CodePreviewModalProps) {
  const { t } = useLanguage();

  // NOTE: this preview only ever renders on top of VoucherInventoryModal, which
  // already locks body scroll. It must NOT touch body.overflow itself — doing so
  // would capture the already-'hidden' value and restore it on unmount, leaving
  // the page permanently locked. Only the Escape handler lives here.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [busy, onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-label={t('vi_previewTitle')}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-card-dark shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('vi_previewTitle')}</h2>
          <button type="button" onClick={onCancel} disabled={busy} aria-label={t('of_cancel')}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            &#x2715;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('vi_previewBody').replace('{count}', String(count))}</p>
          {duplicatesRemoved > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">{t('vi_dupNotice').replace('{removed}', String(duplicatesRemoved)).replace('{unique}', String(count))}</p>
          )}

          {/* Sample barcode */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('vi_previewBarcode')}</span>
            <div className="bg-white rounded-md p-2 overflow-x-auto max-w-full" dir="ltr">
              <Barcode value={sampleValue} format="CODE128" height={56} fontSize={12} renderer="svg" />
            </div>
          </div>

          {/* Sample QR */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('vi_previewQr')}</span>
            <div className="bg-white rounded-md p-3" dir="ltr">
              <QRCodeSVG value={sampleValue} size={120} />
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 break-all" dir="ltr">{sampleValue}</p>
        </div>

        <div className="flex items-center gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onCancel} disabled={busy}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-60">
            {t('vi_previewBack')}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
            {busy ? t('of_saving') : t('vi_previewConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
