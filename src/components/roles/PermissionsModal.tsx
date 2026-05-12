/**
 * Centered modal that lists all permissions granted to a specific tenant role.
 * Triggered from the three-dots menu on the Roles & Permissions page.
 * Closes on Escape key or backdrop click.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TenantRole } from '../../lib/api';
import { getTenantRoleLabel } from '../../lib/tenantRoles';

/** Maps backend permission keys to human-readable labels and material icons. */
const PERM_META: Record<string, { en: string; he: string; icon: string }> = {
  'member.view':         { en: 'View workspace members',        he: 'צפייה בחברי סביבת העבודה',  icon: 'people' },
  'member.manage':       { en: 'Invite & manage members',       he: 'הזמנה וניהול חברים',          icon: 'manage_accounts' },
  'catalog.view':        { en: 'Browse the benefits catalog',   he: 'עיון בקטלוג ההטבות',          icon: 'storefront' },
  'catalog.purchase':    { en: 'Purchase from catalog',         he: 'רכישה מהקטלוג',               icon: 'shopping_cart' },
  'wallet.view_own':     { en: 'View own wallet balance',       he: 'צפייה ביתרת הארנק',           icon: 'account_balance_wallet' },
  'transaction.view_own':{ en: 'View own transaction history',  he: 'צפייה בהיסטוריית עסקאות',     icon: 'receipt_long' },
  'transaction.create':  { en: 'Initiate transactions',         he: 'יצירת עסקאות',                icon: 'add_card' },
};

interface Props {
  /** The role whose permissions are being displayed. */
  role: TenantRole;
  /** List of permission strings from the backend. */
  permissions: string[];
  onClose: () => void;
  language: 'he' | 'en';
  isRTL: boolean;
}

/**
 * Portal-rendered modal showing the permission list for a tenant role.
 * Input: role, permissions array, close handler, language, and RTL flag.
 * Output: backdrop + centered dialog rendered into document.body.
 */
export default function PermissionsModal({ role, permissions, onClose, language, isRTL }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const roleLabel = getTenantRoleLabel(role, language);
  const countLabel = language === 'he'
    ? `${permissions.length} הרשאות`
    : `${permissions.length} permission${permissions.length !== 1 ? 's' : ''}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={roleLabel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">{roleLabel}</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{countLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'he' ? 'סגור' : 'Close'}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        {/* Permission list */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {permissions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {language === 'he' ? 'אין הרשאות ספציפיות לתפקיד זה.' : 'No specific permissions for this role.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {permissions.map((perm) => {
                const meta = PERM_META[perm];
                return (
                  <li key={perm} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="material-icons text-base">{meta?.icon ?? 'check_circle'}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {meta ? meta[language] : perm}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">{perm}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
