/**
 * Wix-style role selection accordion grouped by category.
 * Used per-email in the Invite Collaborators page. Each group is collapsible.
 * Disabled state shows the accordion greyed out until an email is selected.
 */
import { useState } from 'react';
import type { TenantRole, TenantRolePermissions } from '../../lib/api';
import { getTenantRoleLabel, isSeatConsumingRole } from '../../lib/tenantRoles';

// ─── Role groups ──────────────────────────────────────────────────────────────

interface RoleItem { role: TenantRole; descEn: string; descHe: string }
interface RoleGroup { id: string; labelEn: string; labelHe: string; roles: RoleItem[] }

const ROLE_GROUPS: RoleGroup[] = [
  {
    id: 'management', labelEn: 'Management', labelHe: 'ניהול',
    roles: [
      { role: 'admin',    descEn: 'Full workspace control – manages team, billing, catalog, and all settings.', descHe: 'שליטה מלאה בסביבת העבודה – ניהול צוות, כספים, קטלוג וכל ההגדרות.' },
      { role: 'operator', descEn: 'Day-to-day operations. Manages catalog items, allocations, and members.',      descHe: 'תפעול שוטף. ניהול פריטי קטלוג, הקצאות וחברי הארגון.' },
    ],
  },
  {
    id: 'finance', labelEn: 'Finance & Analytics', labelHe: 'כספים ואנליטיקה',
    roles: [
      { role: 'finance', descEn: 'Financial oversight – wallet, transactions, and financial reports.',   descHe: 'פיקוח פיננסי – ארנק, עסקאות ודוחות כספיים.' },
      { role: 'analyst', descEn: 'Data & reporting – view catalog, member activity, and analytics.',     descHe: 'נתונים ודיווח – צפייה בקטלוג, פעילות חברים ואנליטיקה.' },
    ],
  },
  {
    id: 'technical', labelEn: 'Technical', labelHe: 'טכני',
    roles: [
      { role: 'developer',      descEn: 'Platform integration – API keys, webhooks, and developer tooling.',   descHe: 'אינטגרציה – מפתחות API, webhooks וכלי פיתוח.' },
      { role: 'supply_manager', descEn: 'Supply & catalog – provider relationships and offer configuration.',   descHe: 'ספקים וקטלוג – קשרי ספקים וקונפיגורציית מבצעים.' },
    ],
  },
  {
    id: 'members', labelEn: 'Members', labelHe: 'חברים',
    roles: [
      { role: 'member', descEn: 'Standard member access – browse catalog and manage own purchases and wallet.', descHe: 'גישת חבר בסיסית – עיון בקטלוג וניהול רכישות אישיות וארנק.' },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Currently selected roles for this email row. */
  selectedRoles: TenantRole[];
  /** Called when a role checkbox is toggled. */
  onToggle: (role: TenantRole) => void;
  language: 'he' | 'en';
  /** When true the accordion is shown but fully non-interactive. */
  disabled: boolean;
  /** Whether the plan seat limit is reached (non-member roles get lock icon). */
  seatLimitReached: boolean;
  /** Role → permissions from backend (used to show permission count). */
  rolePerms: TenantRolePermissions[];
  /** Optional search query to filter visible roles. */
  search?: string;
}

/**
 * Grouped role accordion for a single invite row.
 * Input: selectedRoles, onToggle, language, disabled, seatLimitReached.
 * Output: collapsible role groups with checkboxes and plain-English descriptions.
 */
export default function RoleGroupAccordion({
  selectedRoles, onToggle, language, disabled, seatLimitReached, rolePerms, search = '',
}: Props) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(['management', 'finance', 'technical', 'members']),
  );

  const permsByRole = new Map(rolePerms.map((r) => [r.role, r.permissions]));

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const filteredGroups = search.trim()
    ? ROLE_GROUPS.map((g) => ({
        ...g,
        roles: g.roles.filter((r) => {
          const q = search.toLowerCase();
          return (
            getTenantRoleLabel(r.role, language).toLowerCase().includes(q) ||
            (language === 'he' ? r.descHe : r.descEn).toLowerCase().includes(q)
          );
        }),
      })).filter((g) => g.roles.length > 0)
    : ROLE_GROUPS;

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-card-dark ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {filteredGroups.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          {language === 'he' ? 'לא נמצאו תפקידים.' : 'No roles match your search.'}
        </p>
      )}
      {filteredGroups.map((group, gi) => {
        const isOpen = openGroups.has(group.id);
        return (
          <div key={group.id} className={gi > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}>
            {/* Group header */}
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="flex w-full cursor-pointer items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {language === 'he' ? group.labelHe : group.labelEn}
              </span>
              <span
                className="material-icons text-base text-slate-400 transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : '' }}
              >
                expand_more
              </span>
            </button>

            {/* Role rows */}
            {isOpen && (
              <div className="border-t border-slate-100 dark:border-slate-800">
                {group.roles.map((item, ri) => {
                  const checked = selectedRoles.includes(item.role);
                  const isLocked = isSeatConsumingRole(item.role) && seatLimitReached && !checked;
                  const perms = permsByRole.get(item.role) ?? [];
                  return (
                    <label
                      key={item.role}
                      className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors
                        ${ri > 0 ? 'border-t border-slate-50 dark:border-slate-800/60' : ''}
                        ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isLocked}
                        onChange={() => !isLocked && onToggle(item.role)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-primary disabled:cursor-not-allowed"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {getTenantRoleLabel(item.role, language)}
                          </span>
                          {isLocked && <span className="material-icons text-sm text-slate-400">lock</span>}
                        </div>
                        <p className="mt-0.5 text-sm leading-5 text-slate-500 dark:text-slate-400">
                          {language === 'he' ? item.descHe : item.descEn}
                        </p>
                        {perms.length > 0 && (
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {perms.length} {language === 'he' ? 'הרשאות' : 'permissions'}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
