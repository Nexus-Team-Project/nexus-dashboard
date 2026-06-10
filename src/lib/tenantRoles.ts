/**
 * Tenant role labels, descriptions, plan helpers, and email parsing for member UI.
 * Role definitions align with NEXUS-PRODSPEC-ROLES-001 v0.1.
 * owner and deprecated roles (operator, analyst) are excluded from the invite UI.
 */
import type { TenantPlan, TenantRole } from './api';

/** Roles shown in the invite UI accordion - excludes owner (auto-assigned) and deprecated roles. */
export const INVITE_ROLE_ORDER: TenantRole[] = [
  'admin',
  'back_office_manager',
  'hr_manager',
  'finance',
  'billing_manager',
  'payments_manager',
  'support_agent',
  'developer',
  'supply_manager',
  'member',
];

/** Full role order including owner and deprecated roles (used for display in member lists). */
export const TENANT_ROLE_ORDER: TenantRole[] = [
  'owner',
  'admin',
  'back_office_manager',
  'hr_manager',
  'finance',
  'billing_manager',
  'payments_manager',
  'support_agent',
  'developer',
  'supply_manager',
  'member',
  'operator',   // deprecated
  'analyst',    // deprecated
];

export const TENANT_ROLE_COPY: Record<TenantRole, {
  he: string;
  en: string;
  descriptionHe: string;
  descriptionEn: string;
}> = {
  owner: {
    he: 'בעלים',
    en: 'Owner',
    descriptionHe: 'יוצר סביבת העבודה. סמכות עליונה, כולל העברה ומחיקה של סביבת העבודה.',
    descriptionEn: 'Workspace creator and ultimate authority, including transfer and deletion.',
  },
  admin: {
    he: 'מנהל',
    en: 'Admin',
    descriptionHe: 'ניהול מלא של סביבת העבודה, צוות, קטלוג וכספים.',
    descriptionEn: 'Full workspace, team, catalog, and finance management.',
  },
  back_office_manager: {
    he: 'ניהול תפעולי',
    en: 'Back-office manager',
    descriptionHe: 'תפעול שוטף: קטלוג, הקצאות, אישורים וניהול חברים.',
    descriptionEn: 'Day-to-day operations: catalog, allocations, approvals, and member management.',
  },
  hr_manager: {
    he: 'מנהל משאבי אנוש',
    en: 'HR manager',
    descriptionHe: 'מחזור חיי חברים, קבוצות, ייבוא ואינטגרציה עם מערכות HR.',
    descriptionEn: 'Member lifecycle, group assignments, bulk import, and HR system integration.',
  },
  finance: {
    he: 'כספים',
    en: 'Finance',
    descriptionHe: 'אסטרטגיה פיננסית: תקציבים, הקצאות, תמחור ודיווח.',
    descriptionEn: 'Financial strategy: budgets, allocations, pricing, and reporting.',
  },
  billing_manager: {
    he: 'מנהל חיוב',
    en: 'Billing manager',
    descriptionHe: 'חיוב הארגון: מנויים, אמצעי תשלום וחשבוניות פלטפורמה.',
    descriptionEn: 'Organization billing: subscriptions, payment methods, and platform invoices.',
  },
  payments_manager: {
    he: 'מנהל תשלומים',
    en: 'Payments manager',
    descriptionHe: 'תשלומי חברים: מעקב עסקאות, החזרים וחיובים חוזרים.',
    descriptionEn: 'Member payments: transaction monitoring, refunds, and chargebacks.',
  },
  support_agent: {
    he: 'נציג תמיכה',
    en: 'Support agent',
    descriptionHe: 'תמיכה בחברים: צפייה בתיקים, הסבר בעיות, יזום החזרים והסלמה.',
    descriptionEn: 'Member support: case lookup, issue explanation, refund initiation, and escalation.',
  },
  developer: {
    he: 'מפתח',
    en: 'Developer',
    descriptionHe: 'ניהול מפתחות API, webhooks וכלי פיתוח.',
    descriptionEn: 'Manage API keys, webhooks, and developer tooling.',
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
  // Deprecated
  operator: {
    he: 'תפעול',
    en: 'Operator',
    descriptionHe: 'תפקיד ישן - הועבר ל"ניהול תפעולי".',
    descriptionEn: 'Deprecated - migrated to back-office manager.',
  },
  analyst: {
    he: 'אנליסט',
    en: 'Analyst',
    descriptionHe: 'תפקיד ישן - יוחלף על ידי משנה "viewer" בעתיד.',
    descriptionEn: 'Deprecated - will be replaced by the viewer modifier.',
  },
  // Platform roles
  platform_admin: {
    he: 'מנהל פלטפורמה',
    en: 'Platform admin',
    descriptionHe: 'סמכות פלטפורמה מלאה.',
    descriptionEn: 'Full platform authority.',
  },
  platform_operator: {
    he: 'תפעול פלטפורמה',
    en: 'Platform operator',
    descriptionHe: 'תגובה לאירועים חוצי-ארגונים.',
    descriptionEn: 'Cross-tenant incident response.',
  },
  platform_back_office: {
    he: 'בק-אופיס פלטפורמה',
    en: 'Platform back-office',
    descriptionHe: 'תפעול שוטף חוצה-ארגונים.',
    descriptionEn: 'Routine cross-tenant operations.',
  },
  platform_marketing: {
    he: 'שיווק פלטפורמה',
    en: 'Platform marketing',
    descriptionHe: 'תקשורת ושיווק לכל הפלטפורמה.',
    descriptionEn: 'Platform-wide communications and marketing.',
  },
  platform_commerce: {
    he: 'מסחר פלטפורמה',
    en: 'Platform commerce',
    descriptionHe: 'קשרי ספקים ואסטרטגיית תמחור פלטפורמה.',
    descriptionEn: 'Provider relations and platform pricing strategy.',
  },
  platform_support: {
    he: 'תמיכה פלטפורמה',
    en: 'Platform support',
    descriptionHe: 'גישת קריאה חוצה-ארגונים לתמיכת לקוחות.',
    descriptionEn: 'Read-only cross-tenant access for customer support.',
  },
  platform_finance: {
    he: 'כספי פלטפורמה',
    en: 'Platform finance',
    descriptionHe: 'סליקה, פיוס ספרים וחיוב פלטפורמה.',
    descriptionEn: 'Settlement, ledger reconciliation, and platform billing.',
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
