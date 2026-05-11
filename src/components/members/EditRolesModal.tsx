/**
 * Modal for updating the roles of a tenant member with a pending or expired invite.
 * Displays checkboxes for all available tenant roles with a brief description.
 * At least one role must remain selected.
 */
import { useState } from 'react';
import type { TenantRole } from '../../lib/api';
import { TENANT_ROLE_ORDER, TENANT_ROLE_COPY, getTenantRoleLabel } from '../../lib/tenantRoles';

interface EditRolesModalProps {
  language: 'he' | 'en';
  currentRoles: TenantRole[];
  onClose: () => void;
  /** Called with the new role list when the user confirms. */
  onSubmit: (roles: TenantRole[]) => Promise<void>;
}

const COPY = {
  he: {
    title: 'שינוי תפקידים',
    subtitle: 'בחר לפחות תפקיד אחד.',
    cancel: 'ביטול',
    save: 'שמור',
    saving: 'שומר...',
    noRoles: 'יש לבחור לפחות תפקיד אחד',
    unchanged: 'לא בוצע שינוי בתפקידים',
  },
  en: {
    title: 'Change roles',
    subtitle: 'Select at least one role.',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    noRoles: 'At least one role must be selected',
    unchanged: 'No change was made to the roles',
  },
} as const;

/**
 * Renders a modal with role checkboxes for each available tenant role.
 * Input: current roles, language, close and submit callbacks.
 * Output: new role list passed to onSubmit if different from current.
 */
export default function EditRolesModal({
  language,
  currentRoles,
  onClose,
  onSubmit,
}: EditRolesModalProps) {
  const copy = COPY[language];
  const [selected, setSelected] = useState<Set<TenantRole>>(new Set(currentRoles));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (role: TenantRole) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role); else next.add(role);
      return next;
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.size === 0) { setError(copy.noRoles); return; }
    setError(null);
    setSaving(true);
    try {
      await onSubmit(Array.from(selected));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roles');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{copy.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="divide-y divide-slate-100 px-2 py-2 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {TENANT_ROLE_ORDER.map((role) => {
              const roleCopy = TENANT_ROLE_COPY[role];
              const isChecked = selected.has(role);
              return (
                <label
                  key={role}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isChecked ? 'bg-primary/5' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(role)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                  />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isChecked ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                      {getTenantRoleLabel(role, language)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'he' ? roleCopy.descriptionHe : roleCopy.descriptionEn}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {error && (
            <p className="px-6 pb-2 text-xs text-red-500">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? copy.saving : copy.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
