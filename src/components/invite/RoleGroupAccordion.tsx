/**
 * Wix-style role selection accordion grouped by category.
 * Used per-email in the Invite Collaborators page. Each group is collapsible.
 * Each role row has a three-dots button that opens a detailed RoleInfoModal.
 * Disabled state shows the accordion greyed out until an email is selected.
 */
import { useState } from 'react';
import type { TenantRole, TenantRolePermissions } from '../../lib/api';
import { getTenantRoleLabel, isSeatConsumingRole } from '../../lib/tenantRoles';
import { useLanguage } from '../../i18n/LanguageContext';
import RoleInfoModal from '../roles/RoleInfoModal';

// ─── Role groups ──────────────────────────────────────────────────────────────

interface RoleItem { role: TenantRole; descEn: string; descHe: string }
interface RoleGroup { id: string; labelEn: string; labelHe: string; roles: RoleItem[] }

const ROLE_GROUPS: RoleGroup[] = [
  {
    id: 'management', labelEn: 'Management', labelHe: 'ניהול',
    roles: [
      { role: 'admin',              descEn: 'Full workspace control - manages team, billing, catalog, and all settings.',              descHe: 'שליטה מלאה בסביבת העבודה - ניהול צוות, כספים, קטלוג וכל ההגדרות.' },
      { role: 'back_office_manager', descEn: 'Day-to-day operations: catalog, allocations, approvals, and member management.',          descHe: 'תפעול שוטף: קטלוג, הקצאות, אישורים וניהול חברים.' },
    ],
  },
  {
    id: 'people', labelEn: 'People & HR', labelHe: 'אנשים ומשאבי אנוש',
    roles: [
      { role: 'hr_manager', descEn: 'Member lifecycle, group assignments, bulk import, and HR system integration.', descHe: 'מחזור חיי חברים, קבוצות, ייבוא ואינטגרציה עם מערכות HR.' },
    ],
  },
  {
    id: 'finance', labelEn: 'Finance', labelHe: 'כספים',
    roles: [
      { role: 'finance',          descEn: 'Financial strategy: budgets, allocations, pricing, and reporting.',           descHe: 'אסטרטגיה פיננסית: תקציבים, הקצאות, תמחור ודיווח.' },
      { role: 'billing_manager',  descEn: 'Organization billing: subscriptions, payment methods, and platform invoices.', descHe: 'חיוב הארגון: מנויים, אמצעי תשלום וחשבוניות פלטפורמה.' },
      { role: 'payments_manager', descEn: 'Member payments: transaction monitoring, refunds, and chargebacks.',           descHe: 'תשלומי חברים: מעקב עסקאות, החזרים וחיובים חוזרים.' },
    ],
  },
  {
    id: 'support', labelEn: 'Customer & Support', labelHe: 'לקוחות ותמיכה',
    roles: [
      { role: 'support_agent', descEn: 'Member support: case lookup, issue explanation, refund initiation, and escalation.', descHe: 'תמיכה בחברים: צפייה בתיקים, הסבר בעיות, יזום החזרים והסלמה.' },
    ],
  },
  {
    id: 'technical', labelEn: 'Technical', labelHe: 'טכני',
    roles: [
      { role: 'developer',      descEn: 'API keys, webhooks, and developer tooling.',              descHe: 'מפתחות API, webhooks וכלי פיתוח.' },
      { role: 'supply_manager', descEn: 'Provider supply and catalog exposure management.',         descHe: 'ניהול ספקים וחשיפת קטלוג.' },
    ],
  },
  {
    id: 'members', labelEn: 'Members', labelHe: 'חברים',
    roles: [
      { role: 'member', descEn: 'Standard member access - browse catalog and manage own purchases and wallet.', descHe: 'גישת חבר בסיסית - עיון בקטלוג וניהול רכישות אישיות וארנק.' },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Currently selected roles for this email row. */
  selectedRoles: TenantRole[];
  /** Called when a role checkbox is toggled. */
  onToggle: (role: TenantRole) => void;
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
 * Input: selectedRoles, onToggle, disabled, seatLimitReached, rolePerms, search.
 * Output: collapsible role groups with checkboxes, descriptions, and info modals.
 */
export default function RoleGroupAccordion({
  selectedRoles, onToggle, disabled, seatLimitReached, rolePerms, search = '',
}: Props) {
  const { language, isRTL } = useLanguage();
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(['management', 'finance', 'technical', 'members']),
  );
  /** Role whose info modal is currently open. Null when closed. */
  const [infoRole, setInfoRole] = useState<TenantRole | null>(null);

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

  const infoLabel = language === 'he' ? 'פרטי תפקיד' : 'Role details';

  return (
    <>
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
                      <div
                        key={item.role}
                        className={`flex items-start gap-3 px-5 py-4 transition-colors
                          ${ri > 0 ? 'border-t border-slate-50 dark:border-slate-800/60' : ''}
                          ${isLocked ? 'opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                      >
                        {/* Checkbox + text — wrapped in label for click-to-toggle */}
                        <label className={`flex flex-1 min-w-0 cursor-pointer items-start gap-3 ${isLocked ? 'cursor-not-allowed' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isLocked}
                            onChange={() => !isLocked && onToggle(item.role)}
                            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-primary disabled:cursor-not-allowed"
                          />
                          <div className="min-w-0">
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

                        {/* Three-dots button — outside label so it doesn't toggle checkbox */}
                        <button
                          type="button"
                          aria-label={infoLabel}
                          onClick={() => setInfoRole(item.role)}
                          className="mt-0.5 shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                        >
                          <span className="material-icons text-[18px]">more_vert</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Role info modal */}
      {infoRole && (
        <RoleInfoModal
          role={infoRole}
          onClose={() => setInfoRole(null)}
          language={language}
          isRTL={isRTL}
        />
      )}
    </>
  );
}
