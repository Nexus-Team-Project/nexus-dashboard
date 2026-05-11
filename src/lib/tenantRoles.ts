/**
 * Shares tenant role labels, descriptions, plan helpers, and email parsing for
 * member UI. The dashboard reads real permissions from the backend and only
 * formats them here.
 */
import type { TenantPlan, TenantRole } from './api';

export const TENANT_ROLE_ORDER: TenantRole[] = [
  'admin',
  'finance',
  'operator',
  'analyst',
  'developer',
  'supply_manager',
  'member',
];

export const TENANT_ROLE_COPY: Record<TenantRole, { he: string; en: string; descriptionHe: string; descriptionEn: string }> = {
  admin: {
    he: 'מנהל',
    en: 'Admin',
    descriptionHe: 'ניהול מלא של סביבת העבודה, צוות, קטלוג וכספים.',
    descriptionEn: 'Full workspace, team, catalog, and finance management.',
  },
  finance: {
    he: 'כספים',
    en: 'Finance',
    descriptionHe: 'ניהול צפייה ותפעול פיננסי.',
    descriptionEn: 'Finance viewing and management.',
  },
  operator: {
    he: 'תפעול',
    en: 'Operator',
    descriptionHe: 'תפעול קטלוג, הקצאות וחברי tenant.',
    descriptionEn: 'Catalog, allocation, and tenant member operations.',
  },
  analyst: {
    he: 'אנליסט',
    en: 'Analyst',
    descriptionHe: 'צפייה בנתונים, קטלוג ודוחות.',
    descriptionEn: 'View data, catalog, and reports.',
  },
  developer: {
    he: 'מפתח',
    en: 'Developer',
    descriptionHe: 'ניהול מפתחות API וכלי פיתוח.',
    descriptionEn: 'Manage API keys and developer tools.',
  },
  supply_manager: {
    he: 'ניהול ספקים',
    en: 'Supply manager',
    descriptionHe: 'ניהול חשיפת קטלוג וספקים.',
    descriptionEn: 'Manage catalog exposure and provider supply.',
  },
  member: {
    he: 'חבר',
    en: 'Member',
    descriptionHe: 'גישה בסיסית לקטלוג החבר.',
    descriptionEn: 'Basic member catalog access.',
  },
};

/**
 * Returns a role label for the active dashboard language.
 * Input: tenant role and language.
 * Output: human-readable role label.
 */
export function getTenantRoleLabel(role: TenantRole, language: 'he' | 'en'): string {
  return TENANT_ROLE_COPY[role]?.[language] ?? role;
}

/** Non-member roles that consume one plan seat per distinct identity. */
export function isSeatConsumingRole(role: TenantRole): boolean {
  return role !== 'member';
}

export const PLAN_SEAT_LIMITS: Record<TenantPlan, number> = {
  basic: 3,
  advanced: 5,
  premium: 10,
};

const PLAN_LABELS: Record<TenantPlan, { he: string; en: string }> = {
  basic: { he: 'בסיסי', en: 'Basic' },
  advanced: { he: 'מתקדם', en: 'Advanced' },
  premium: { he: 'פרימיום', en: 'Premium' },
};

/**
 * Returns a human-readable plan label.
 * Input: plan tier and language.
 * Output: localized plan name.
 */
export function getPlanLabel(plan: TenantPlan, language: 'he' | 'en'): string {
  return PLAN_LABELS[plan]?.[language] ?? plan;
}

/**
 * Extracts unique email addresses from pasted text or .txt file content.
 * Input: free text separated by spaces, commas, semicolons, or new lines.
 * Output: normalized unique email list.
 */
export function parseEmails(value: string): string[] {
  const matches = value.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) ?? [];
  return Array.from(new Set(matches));
}
