/**
 * Manual / Import entry points for the voucher create page (replaces the old
 * Manual | CSV toggle). "Manual" is the default authoring mode; "Import" opens
 * the upload modal directly (it accepts CSV and XLSX), with no intermediate
 * selection menu. Voucher-only; the caller renders this only for vouchers.
 */
import { useLanguage } from '../../i18n/LanguageContext';

interface VoucherImportControlsProps {
  /** Open the import (upload) modal. */
  onOpenImport: () => void;
  disabled?: boolean;
}

export default function VoucherImportControls({ onOpenImport, disabled = false }: VoucherImportControlsProps) {
  const { t } = useLanguage();
  const btnBase = 'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors';

  return (
    <div className="mb-2 flex items-center gap-2">
      {/* Manual is the current/default authoring mode - shown active, no action needed. */}
      <span className={`${btnBase} bg-primary text-white shadow-sm`}>
        <span className="material-icons text-base">edit</span>
        {t('vxi_manual')}
      </span>

      <button
        type="button"
        onClick={onOpenImport}
        disabled={disabled}
        className={`${btnBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-60`}
      >
        <span className="material-icons text-base">upload_file</span>
        {t('vxi_import')}
      </button>
    </div>
  );
}
