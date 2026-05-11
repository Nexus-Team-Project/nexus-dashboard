/**
 * Multi-role selector dropdown for the tenant member invite table.
 * Renders selected roles as pill chips; a portal dropdown lists all roles
 * with checkboxes so the menu escapes table overflow clipping.
 * Supports per-role disabling for plan-based seat limits.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TenantRole } from '../../lib/api';
import { getTenantRoleLabel, TENANT_ROLE_ORDER } from '../../lib/tenantRoles';

export interface RoleDropdownProps {
  rowId: string;
  selectedRoles: TenantRole[];
  disabled: boolean;
  language: 'he' | 'en';
  /** Called when a role checkbox is toggled. At least one role stays selected. */
  onToggle: (rowId: string, role: TenantRole) => void;
  placeholder: string;
  /** Roles that cannot be selected (e.g. seat limit reached). */
  disabledRoles?: TenantRole[];
  /** Tooltip shown on disabled role items. */
  disabledReason?: string;
}

/**
 * Renders a multi-role dropdown anchored to its trigger button via a portal.
 * Input: row id, selected roles, toggle handler, disabled state, and language.
 * Output: pill display + fixed-position checkbox menu.
 */
export default function RoleDropdown({
  rowId,
  selectedRoles,
  disabled,
  language,
  onToggle,
  placeholder,
  disabledRoles = [],
  disabledReason,
}: RoleDropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  /**
   * Recalculates the fixed menu position from the trigger button's bounding rect.
   * Called on open and on scroll to keep menu aligned.
   */
  const recalcPosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
      zIndex: 9999,
    });
  };

  useLayoutEffect(() => {
    if (open) recalcPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClose = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    const handleScroll = () => recalcPosition();
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  return (
    <div className="min-w-[180px]">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedRoles.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          selectedRoles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {getTenantRoleLabel(role, language)}
            </span>
          ))
        )}
        <span className="material-icons ms-auto text-base text-slate-400">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            aria-multiselectable="true"
            style={menuStyle}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            {TENANT_ROLE_ORDER.map((role) => {
              const checked = selectedRoles.includes(role);
              const isRoleDisabled = disabledRoles.includes(role) && !checked;
              return (
                <li key={role} title={isRoleDisabled ? disabledReason : undefined}>
                  <label
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                      isRoleDisabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isRoleDisabled}
                      onChange={() => !isRoleDisabled && onToggle(rowId, role)}
                      className="h-4 w-4 rounded border-slate-300 accent-primary disabled:cursor-not-allowed"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {getTenantRoleLabel(role, language)}
                    </span>
                    {isRoleDisabled && (
                      <span className="material-icons ms-auto text-sm text-slate-400">lock</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
