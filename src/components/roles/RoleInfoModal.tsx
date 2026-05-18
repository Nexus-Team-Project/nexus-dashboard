/**
 * Modern role detail modal. Shows a gradient header with the role name,
 * a plain-English "about" paragraph, and a checklist of what the person
 * can actually do. No technical permission keys are shown anywhere.
 * Triggered by the three-dots menu on each role row in the invite accordion.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TenantRole } from '../../lib/api';
import { getTenantRoleLabel } from '../../lib/tenantRoles';

// ─── Role content ─────────────────────────────────────────────────────────────

interface RoleContent {
  icon: string;
  gradient: string; // CSS gradient string, avoids Tailwind purge issues
  taglineEn: string;
  taglineHe: string;
  aboutEn: string;
  aboutHe: string;
  capabilitiesEn: string[];
  capabilitiesHe: string[];
}

const ROLE_CONTENT: Record<TenantRole, RoleContent> = {
  owner: {
    icon: 'workspace_premium',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    taglineEn: 'Workspace creator and ultimate authority',
    taglineHe: 'יוצר סביבת העבודה וסמכות עליונה',
    aboutEn:
      "The owner is the person who created the workspace. They hold the highest level of trust in the system and are the only one who can transfer ownership to another admin or permanently delete the workspace. There is exactly one owner per workspace and the role cannot be reassigned through the normal invite flow.",
    aboutHe:
      'הבעלים הוא האדם שיצר את סביבת העבודה. הם מחזיקים ברמת האמון הגבוהה ביותר במערכת והם היחידים שיכולים להעביר בעלות למנהל אחר או למחוק את סביבת העבודה לצמיתות. יש בעלים אחד בדיוק לכל סביבת עבודה.',
    capabilitiesEn: [
      'Everything an Admin can do',
      'Transfer workspace ownership to another admin',
      'Permanently delete the workspace and all its data',
    ],
    capabilitiesHe: [
      'כל מה שמנהל יכול לעשות',
      'העברת בעלות על סביבת העבודה למנהל אחר',
      'מחיקה קבועה של סביבת העבודה וכל הנתונים שלה',
    ],
  },
  admin: {
    icon: 'admin_panel_settings',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    taglineEn: 'Unrestricted access to everything',
    taglineHe: 'גישה בלתי מוגבלת לכל דבר',
    aboutEn:
      'Admins hold the highest level of authority in the workspace. They can configure every setting, manage the full team, oversee finances, and control the benefits catalog end-to-end. This role is typically reserved for founders, owners, or senior leadership who need full visibility and control.',
    aboutHe:
      'למנהלים רמת הסמכות הגבוהה ביותר בסביבת העבודה. הם יכולים להגדיר כל הגדרה, לנהל את הצוות המלא, לפקח על הכספים ולשלוט בקטלוג ההטבות מקצה לקצה. תפקיד זה שמור בדרך כלל למייסדים, בעלים או הנהלה בכירה הזקוקים לנראות ושליטה מלאה.',
    capabilitiesEn: [
      'Invite, manage, and remove any workspace member',
      'Change member roles and access levels at any time',
      'Configure workspace settings, branding, and preferences',
      'View all financial reports, transactions, and wallet balances',
      'Set up, edit, and deactivate the benefits catalog',
      'Activate and manage workspace services',
    ],
    capabilitiesHe: [
      'הזמנה, ניהול והסרת כל חבר בסביבת העבודה',
      'שינוי תפקידי חברים ורמות גישה בכל עת',
      'הגדרת הגדרות סביבת העבודה, מיתוג והעדפות',
      'צפייה בכל הדוחות הכספיים, העסקאות ויתרות הארנק',
      'הגדרה, עריכה וביטול קטלוג ההטבות',
      'הפעלה וניהול שירותי סביבת העבודה',
    ],
  },
  back_office_manager: {
    icon: 'tune',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    taglineEn: 'Keeps day-to-day operations running',
    taglineHe: 'שומר על התפעול השוטף',
    aboutEn:
      'Back-office managers handle the daily work of running the workspace. They manage catalog content, run allocation campaigns, and manage members, without touching pricing decisions or financial strategy. A great fit for team leads or operations managers who need broad operational access.',
    aboutHe:
      'מנהלי הבק-אופיס מטפלים בעבודה היומיומית של ניהול סביבת העבודה. הם מנהלים תוכן קטלוג, מריצים קמפיינים של הקצאות ומנהלים חברים, מבלי לגעת בהחלטות תמחור או אסטרטגיה פיננסית. מתאים מאוד לראשי צוותים או מנהלי תפעול.',
    capabilitiesEn: [
      'Browse and manage the benefits catalog',
      'Adopt and exclude catalog offers',
      'Create and run allocation campaigns for members',
      'View and manage workspace members and groups',
      'Access operational dashboards and activity reports',
    ],
    capabilitiesHe: [
      'עיון וניהול קטלוג ההטבות',
      'אימוץ והסרת מבצעי קטלוג',
      'יצירה והפעלת קמפיינים של הקצאות לחברים',
      'צפייה וניהול חברי סביבת העבודה וקבוצות',
      'גישה ללוחות מחוונים תפעוליים ודוחות פעילות',
    ],
  },
  hr_manager: {
    icon: 'people',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
    taglineEn: 'Manages people, groups, and HR data',
    taglineHe: 'מנהל אנשים, קבוצות ונתוני HR',
    aboutEn:
      'HR managers own the member lifecycle: onboarding new members, updating their profile data, managing group assignments, and running bulk imports from HR systems. They have no access to financial data, catalog configuration, or developer settings.',
    aboutHe:
      'מנהלי HR הם הבעלים של מחזור חיי החברים: קבלת חברים חדשים, עדכון נתוני הפרופיל שלהם, ניהול שיוך לקבוצות והרצת ייבוא מרוכז ממערכות HR. אין להם גישה לנתונים פיננסיים, הגדרות קטלוג או הגדרות פיתוח.',
    capabilitiesEn: [
      'Add and update member profiles and employment data',
      'Activate, suspend, or deactivate members',
      'Bulk import members via CSV or HR system sync',
      'Export member records',
      'Create and manage groups and group rules',
      'Assign members to groups',
    ],
    capabilitiesHe: [
      'הוספה ועדכון פרופילי חברים ונתוני עבודה',
      'הפעלה, השעיה או ביטול חשבונות חברים',
      'ייבוא חברים בכמות גדולה דרך CSV או סנכרון מערכת HR',
      'ייצוא רשומות חברים',
      'יצירה וניהול קבוצות וכללי קבוצות',
      'שיוך חברים לקבוצות',
    ],
  },
  billing_manager: {
    icon: 'receipt_long',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    taglineEn: 'Manages the organization\'s subscription with NEXUS',
    taglineHe: 'מנהל את מנוי הארגון ב-NEXUS',
    aboutEn:
      "Billing managers handle the organization's financial relationship with the platform itself. They manage the subscription plan, keep payment methods on file up to date, and download invoices for accounting. This role is separate from financial strategy (Finance) and member payments (Payments Manager).",
    aboutHe:
      'מנהלי חיוב מטפלים בקשר הפיננסי של הארגון עם הפלטפורמה עצמה. הם מנהלים את תוכנית המנוי, שומרים על אמצעי תשלום עדכניים ומורידים חשבוניות לחשבונאות. תפקיד זה נפרד מאסטרטגיה פיננסית (כספים) ותשלומי חברים (מנהל תשלומים).',
    capabilitiesEn: [
      'View and manage the workspace subscription plan',
      'Add, update, or remove payment methods on file',
      'Download invoices issued by NEXUS to the organization',
      'Configure custom domains and white-label settings',
      'View billing history and current charges',
    ],
    capabilitiesHe: [
      'צפייה וניהול תוכנית המנוי של סביבת העבודה',
      'הוספה, עדכון או הסרה של אמצעי תשלום',
      'הורדת חשבוניות שהנפיקה NEXUS לארגון',
      'הגדרת דומיינים מותאמים אישית והגדרות white-label',
      'צפייה בהיסטוריית חיוב וחיובים נוכחיים',
    ],
  },
  payments_manager: {
    icon: 'payments',
    gradient: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
    taglineEn: 'Handles member-side payment operations',
    taglineHe: 'מטפל בפעולות תשלום בצד החברים',
    aboutEn:
      'Payments managers oversee member-facing financial flows: monitoring transactions, processing refunds, responding to chargebacks, and reviewing settlement reports. They do not manage the organization billing or financial strategy. Ideal for finance operations teams or payment processors.',
    aboutHe:
      'מנהלי תשלומים מפקחים על זרימות פיננסיות מול חברים: ניטור עסקאות, עיבוד החזרים, תגובה לחיובים חוזרים ובדיקת דוחות סליקה. הם לא מנהלים חיוב ארגוני או אסטרטגיה פיננסית. אידיאלי לצוותי תפעול פיננסי.',
    capabilitiesEn: [
      'Monitor all member payment transactions',
      'Process full and partial refunds',
      'Void transactions before completion',
      'Respond to chargebacks and provide evidence',
      'View settlement reports and payout history',
      'Configure PSP settings and payment routing',
    ],
    capabilitiesHe: [
      'ניטור כל עסקאות התשלום של חברים',
      'עיבוד החזרים מלאים וחלקיים',
      'ביטול עסקאות לפני השלמה',
      'תגובה לחיובים חוזרים ומסירת ראיות',
      'צפייה בדוחות סליקה והיסטוריית תשלומים',
      'הגדרת הגדרות PSP וניתוב תשלומים',
    ],
  },
  support_agent: {
    icon: 'support_agent',
    gradient: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
    taglineEn: 'Helps individual members resolve issues',
    taglineHe: 'עוזר לחברים בודדים לפתור בעיות',
    aboutEn:
      'Support agents work one member at a time. They can look up a specific member\'s case, understand why a purchase failed, initiate a refund request, open a recovery investigation for a stuck transaction, and escalate to higher-tier roles when needed. They never have access to aggregate data or bulk operations.',
    aboutHe:
      'נציגי תמיכה עובדים עם חבר אחד בכל פעם. הם יכולים לחפש את התיק של חבר ספציפי, להבין מדוע רכישה נכשלה, ליזום בקשת החזר, לפתוח חקירת שחזור לעסקה תקועה ולהסלים לתפקידים בדרגה גבוהה יותר בעת הצורך.',
    capabilitiesEn: [
      'Look up a specific member\'s full case: wallet, transactions, entitlements, eligibility',
      'Understand why a member\'s eligibility check passed or failed',
      'Initiate a refund request for a member transaction',
      'Open a recovery investigation for a stuck or failed transaction',
      'Log communication with a member',
      'Escalate a case to a higher-tier role',
    ],
    capabilitiesHe: [
      'חיפוש התיק המלא של חבר ספציפי: ארנק, עסקאות, זכאויות, כשירות',
      'הבנה מדוע בדיקת הכשירות של חבר עברה או נכשלה',
      'יזום בקשת החזר עבור עסקת חבר',
      'פתיחת חקירת שחזור לעסקה תקועה או כושלת',
      'רישום תקשורת עם חבר',
      'הסלמת תיק לתפקיד בדרגה גבוהה יותר',
    ],
  },
  operator: {
    icon: 'tune',
    gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
    taglineEn: 'Deprecated - replaced by Back-office manager',
    taglineHe: 'תפקיד ישן - הוחלף ב"ניהול תפעולי"',
    aboutEn: 'This role has been renamed to Back-office manager. Existing members with this role retain their access until migrated.',
    aboutHe: 'תפקיד זה שונה שמו ל"ניהול תפעולי". חברים קיימים עם תפקיד זה שומרים על גישתם עד להגירה.',
    capabilitiesEn: ['Same permissions as Back-office manager.'],
    capabilitiesHe: ['אותן הרשאות כמו "ניהול תפעולי".'],
  },
  finance: {
    icon: 'account_balance',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    taglineEn: 'Full visibility into the money flow',
    taglineHe: 'נראות מלאה לזרימת הכסף',
    aboutEn:
      'Finance roles are designed for people who need to track and report on money, without being able to change workspace settings or manage members. They see everything financial: wallets, transactions, spending patterns, and reports. Ideal for accountants, CFOs, or finance analysts.',
    aboutHe:
      'תפקידי כספים מיועדים לאנשים שצריכים לעקוב ולדווח על כסף, מבלי שיוכלו לשנות הגדרות סביבת העבודה או לנהל חברים. הם רואים הכל פיננסי: ארנקות, עסקאות, דפוסי הוצאות ודוחות. אידיאלי לרואי חשבון, מנהלי כספים או אנליסטים פיננסיים.',
    capabilitiesEn: [
      'View all wallet balances across the workspace',
      'Access the full transaction history for all members',
      'Generate and export detailed financial reports',
      'Monitor spending patterns and budget utilization',
      'Track member purchase activity over time',
    ],
    capabilitiesHe: [
      'צפייה בכל יתרות הארנק בסביבת העבודה',
      'גישה להיסטוריית עסקאות מלאה לכל החברים',
      'יצירה וייצוא דוחות כספיים מפורטים',
      'מעקב אחר דפוסי הוצאות וניצול תקציב',
      'מעקב אחר פעילות רכישות חברים לאורך זמן',
    ],
  },
  analyst: {
    icon: 'bar_chart',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    taglineEn: 'Data visibility without write access',
    taglineHe: 'נראות נתונים ללא גישת כתיבה',
    aboutEn:
      "Analysts get read access to the workspace's data so they can build insights without disrupting operations. They can browse the catalog, review member engagement, and pull reports, but cannot change anything. Perfect for data analysts, business intelligence teams, or external consultants reviewing workspace performance.",
    aboutHe:
      'אנליסטים מקבלים גישת קריאה לנתוני סביבת העבודה כדי שיוכלו לבנות תובנות מבלי לשבש תפעול. הם יכולים לעיין בקטלוג, לבחון מעורבות חברים ולמשוך דוחות, אך אינם יכולים לשנות דבר. מושלם לאנליסטים, צוותי בינה עסקית או יועצים חיצוניים הסוקרים ביצועי סביבת עבודה.',
    capabilitiesEn: [
      'Browse the benefits catalog in read-only mode',
      'View member engagement and activity data',
      'Access analytical dashboards and visualizations',
      'Export data and reports for external analysis',
      'Review usage trends and workspace metrics',
    ],
    capabilitiesHe: [
      'עיון בקטלוג ההטבות במצב קריאה בלבד',
      'צפייה בנתוני מעורבות ופעילות חברים',
      'גישה ללוחות מחוונים אנליטיים ויזואליזציות',
      'ייצוא נתונים ודוחות לניתוח חיצוני',
      'סקירת מגמות שימוש ומדדי סביבת עבודה',
    ],
  },
  developer: {
    icon: 'code',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    taglineEn: 'Builds and manages technical integrations',
    taglineHe: 'בונה ומנהל אינטגרציות טכניות',
    aboutEn:
      'Developers get the access they need to integrate external systems with the workspace: API keys, webhooks, and developer tooling, without touching member data, finances, or catalog content. Ideal for engineers or technical leads responsible for connecting your workspace to other platforms.',
    aboutHe:
      'מפתחים מקבלים את הגישה הדרושה להם לשילוב מערכות חיצוניות עם סביבת העבודה: מפתחות API, webhooks וכלי פיתוח, מבלי לגעת בנתוני חברים, כספים או תוכן קטלוג. אידיאלי למהנדסים או ראשי טכנולוגיה האחראים לחיבור סביבת העבודה שלכם לפלטפורמות אחרות.',
    capabilitiesEn: [
      'Create and manage API keys for external integrations',
      'Configure webhooks and event subscriptions',
      'Access developer tools, sandbox environments, and logs',
      'Monitor API usage, errors, and response times',
      'Test integrations without affecting live data',
    ],
    capabilitiesHe: [
      'יצירה וניהול מפתחות API לאינטגרציות חיצוניות',
      'הגדרת webhooks ומנויי אירועים',
      'גישה לכלי פיתוח, סביבות sandbox ולוגים',
      'מעקב אחר שימוש ב-API, שגיאות וזמני תגובה',
      'בדיקת אינטגרציות מבלי להשפיע על נתונים חיים',
    ],
  },
  supply_manager: {
    icon: 'inventory_2',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
    taglineEn: 'Controls what members see in the catalog',
    taglineHe: 'שולט במה שחברים רואים בקטלוג',
    aboutEn:
      'Supply managers own the catalog layer between providers and members. They decide which offers are visible, configure pricing and availability, and manage relationships with external providers, all without access to member records or financial reports. The right role for procurement leads or catalog managers.',
    aboutHe:
      'מנהלי ספקים הם הבעלים של שכבת הקטלוג בין ספקים לחברים. הם מחליטים אילו מבצעים גלויים, מגדירים תמחור וזמינות, ומנהלים קשרים עם ספקים חיצוניים, הכל ללא גישה לרשומות חברים או דוחות כספיים. התפקיד הנכון לראשי רכש או מנהלי קטלוג.',
    capabilitiesEn: [
      'Control which catalog offers are visible to members',
      'Set pricing, availability, and expiry for each offer',
      'Manage relationships and agreements with providers',
      'Configure offer visibility rules by member groups',
      'Review supply performance and offer engagement metrics',
    ],
    capabilitiesHe: [
      'שליטה על אילו מבצעי קטלוג גלויים לחברים',
      'הגדרת תמחור, זמינות ותפוגה לכל מבצע',
      'ניהול קשרים והסכמים עם ספקים',
      'הגדרת כללי נראות מבצעים לפי קבוצות חברים',
      'סקירת ביצועי היצע ומדדי מעורבות מבצעים',
    ],
  },
  member: {
    icon: 'person',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
    taglineEn: 'Standard access to personal benefits',
    taglineHe: 'גישה רגילה להטבות אישיות',
    aboutEn:
      "Members get access to the benefits that the workspace has made available to them. They can browse the catalog, use their wallet, and track their own purchases, but have no visibility into other members' data or any administrative controls. This is the baseline role for all staff who use the platform as end users.",
    aboutHe:
      'חברים מקבלים גישה להטבות שסביבת העבודה הפכה לזמינות עבורם. הם יכולים לעיין בקטלוג, להשתמש בארנק שלהם ולעקוב אחר הרכישות שלהם, אך אין להם נראות לנתונים של חברים אחרים או כל בקרה מינהלית. זהו תפקיד הבסיס לכל הצוות שמשתמש בפלטפורמה כמשתמשי קצה.',
    capabilitiesEn: [
      'Browse and search the full benefits catalog',
      'View their personal wallet balance and top-up history',
      'Make purchases from the catalog using their wallet',
      'Track their own transaction and purchase history',
      'Manage their personal profile within the workspace',
    ],
    capabilitiesHe: [
      'עיון וחיפוש בקטלוג ההטבות המלא',
      'צפייה ביתרת הארנק האישי והיסטוריית טעינות',
      'ביצוע רכישות מהקטלוג באמצעות הארנק',
      'מעקב אחר היסטוריית עסקאות ורכישות אישיות',
      'ניהול פרופיל אישי בתוך סביבת העבודה',
    ],
  },

  // Platform roles - shown only for platform staff, not in tenant invite UI
  platform_admin: {
    icon: 'admin_panel_settings',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    taglineEn: 'Full platform authority',
    taglineHe: 'סמכות פלטפורמה מלאה',
    aboutEn: 'NEXUS staff role with full authority over all tenants, providers, and platform configuration.',
    aboutHe: 'תפקיד צוות NEXUS עם סמכות מלאה על כל הארגונים, הספקים והגדרות הפלטפורמה.',
    capabilitiesEn: ['All platform permissions including global configuration and role assignment.'],
    capabilitiesHe: ['כל הרשאות הפלטפורמה כולל הגדרות גלובליות ושיוך תפקידים.'],
  },
  platform_operator: {
    icon: 'security',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
    taglineEn: 'Cross-tenant incident response',
    taglineHe: 'תגובה לאירועים חוצי-ארגונים',
    aboutEn: 'NEXUS staff role for incident response: suspend workspaces, process recovery decisions. Always step-up authenticated.',
    aboutHe: 'תפקיד צוות NEXUS לתגובה לאירועים: השעיית סביבות עבודה, עיבוד החלטות שחזור. תמיד מאומת ב-step-up.',
    capabilitiesEn: ['Suspend and unsuspend workspaces', 'Process recovery decisions', 'Cross-tenant read access'],
    capabilitiesHe: ['השעיה וביטול השעיה של סביבות עבודה', 'עיבוד החלטות שחזור', 'גישת קריאה חוצה-ארגונים'],
  },
  platform_back_office: {
    icon: 'business_center',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #164e63 100%)',
    taglineEn: 'Routine cross-tenant operations',
    taglineHe: 'תפעול שוטף חוצה-ארגונים',
    aboutEn: 'NEXUS staff role for routine operations: approving provider activations and workspace requests.',
    aboutHe: 'תפקיד צוות NEXUS לתפעול שוטף: אישור הפעלות ספקים ובקשות סביבת עבודה.',
    capabilitiesEn: ['Approve or reject provider activations', 'View all tenants', 'Cross-tenant read access'],
    capabilitiesHe: ['אישור או דחיית הפעלות ספקים', 'צפייה בכל הארגונים', 'גישת קריאה חוצה-ארגונים'],
  },
  platform_marketing: {
    icon: 'campaign',
    gradient: 'linear-gradient(135deg, #db2777 0%, #831843 100%)',
    taglineEn: 'Platform-wide communications',
    taglineHe: 'תקשורת ברחבי הפלטפורמה',
    aboutEn: 'NEXUS staff role for platform-wide announcements, newsletters, and feature launch communications.',
    aboutHe: 'תפקיד צוות NEXUS להודעות ברחבי הפלטפורמה, ניוזלטרים ותקשורת השקת תכונות.',
    capabilitiesEn: ['Send platform-wide announcements', 'Manage platform marketing communications'],
    capabilitiesHe: ['שליחת הודעות ברחבי הפלטפורמה', 'ניהול תקשורת שיווקית של הפלטפורמה'],
  },
  platform_commerce: {
    icon: 'storefront',
    gradient: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
    taglineEn: 'Provider relations and platform pricing',
    taglineHe: 'קשרי ספקים ותמחור פלטפורמה',
    aboutEn: 'NEXUS staff role managing provider commercial agreements, platform pricing strategy, and cross-tenant catalog curation.',
    aboutHe: 'תפקיד צוות NEXUS לניהול הסכמים מסחריים עם ספקים, אסטרטגיית תמחור פלטפורמה וקיצור קטלוג חוצה-ארגונים.',
    capabilitiesEn: ['Manage provider relations and agreements', 'Set platform-level pricing', 'View settlement reports'],
    capabilitiesHe: ['ניהול קשרי ספקים והסכמים', 'הגדרת תמחור ברמת הפלטפורמה', 'צפייה בדוחות סליקה'],
  },
  platform_support: {
    icon: 'headset_mic',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)',
    taglineEn: 'Read-only cross-tenant support access',
    taglineHe: 'גישת תמיכה לקריאה בלבד חוצה-ארגונים',
    aboutEn: 'NEXUS staff role for customer support investigations - read-only access across all tenants.',
    aboutHe: 'תפקיד צוות NEXUS לחקירות תמיכת לקוחות - גישת קריאה בלבד על כל הארגונים.',
    capabilitiesEn: ['Cross-tenant read access for support investigations', 'View cross-tenant audit log'],
    capabilitiesHe: ['גישת קריאה חוצה-ארגונים לחקירות תמיכה', 'צפייה ביומן ביקורת חוצה-ארגונים'],
  },
  platform_finance: {
    icon: 'account_balance',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)',
    taglineEn: 'Settlement, reconciliation, and platform billing',
    taglineHe: 'סליקה, פיוס וחיוב פלטפורמה',
    aboutEn: 'NEXUS staff role managing settlement reports, platform billing configuration, and payout oversight.',
    aboutHe: 'תפקיד צוות NEXUS לניהול דוחות סליקה, הגדרות חיוב פלטפורמה ופיקוח על תשלומים.',
    capabilitiesEn: ['View settlement reports and payout history', 'Manage platform billing configuration', 'View cross-tenant audit log'],
    capabilitiesHe: ['צפייה בדוחות סליקה והיסטוריית תשלומים', 'ניהול הגדרות חיוב פלטפורמה', 'צפייה ביומן ביקורת חוצה-ארגונים'],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  role: TenantRole;
  onClose: () => void;
  language: 'he' | 'en';
  isRTL: boolean;
}

/**
 * Impressive role detail modal with gradient header, about text, and capability list.
 * Input: role, close handler, language, RTL flag.
 * Output: portal-rendered centered modal with entrance animation.
 */
export default function RoleInfoModal({ role, onClose, language, isRTL }: Props) {
  const content = ROLE_CONTENT[role];
  const label = getTenantRoleLabel(role, language);

  // Entrance animation: scale from 0.96 → 1 and fade in on mount.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const capabilities = language === 'he' ? content.capabilitiesHe : content.capabilitiesEn;
  const about = language === 'he' ? content.aboutHe : content.aboutEn;
  const tagline = language === 'he' ? content.taglineHe : content.taglineEn;
  const aboutLabel = language === 'he' ? 'על התפקיד' : 'About this role';
  const canDoLabel = language === 'he' ? 'מה הם יכולים לעשות' : 'What they can do';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: `rgba(0,0,0,${visible ? 0.45 : 0})`,
        backdropFilter: visible ? 'blur(4px)' : 'none',
        transition: 'background 0.2s ease, backdrop-filter 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
        }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        {/* Gradient header */}
        <div
          className="relative px-6 pb-6 pt-5"
          style={{ background: content.gradient }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'he' ? 'סגור' : 'Close'}
            className="absolute end-4 top-4 cursor-pointer rounded-lg p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <span className="material-icons text-xl">close</span>
          </button>

          {/* Icon bubble */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <span className="material-icons text-3xl text-white">{content.icon}</span>
          </div>

          <h2 className="text-xl font-bold text-white">{label}</h2>
          <p className="mt-1 text-sm font-medium text-white/75">{tagline}</p>
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* About */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {aboutLabel}
            </h3>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{about}</p>
          </div>

          {/* Capabilities */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {canDoLabel}
            </h3>
            <ul className="space-y-2.5">
              {capabilities.map((cap, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: content.gradient }}
                  >
                    <span className="material-icons text-[13px] text-white">check</span>
                  </span>
                  <span className="text-sm leading-5 text-slate-700 dark:text-slate-200">{cap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
