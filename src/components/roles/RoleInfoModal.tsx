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
  operator: {
    icon: 'tune',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    taglineEn: 'Keeps day-to-day operations running',
    taglineHe: 'שומר על התפעול השוטף',
    aboutEn:
      'Operators handle the daily work of running the workspace. They manage catalog content, run allocation campaigns, and support members, without touching billing or sensitive financial settings. A great fit for team leads or operations managers who need broad operational access.',
    aboutHe:
      'מפעילים מטפלים בעבודה היומיומית של ניהול סביבת העבודה. הם מנהלים תוכן קטלוג, מריצים קמפיינים של הקצאות ותומכים בחברים, מבלי לגעת בחיוב או בהגדרות כספיות רגישות. מתאים מאוד לראשי צוותים או מנהלי תפעול הזקוקים לגישה תפעולית רחבה.',
    capabilitiesEn: [
      'Browse and manage the benefits catalog',
      'Create and run allocation campaigns for members',
      'View and assist workspace members',
      'Access operational dashboards and activity reports',
      'Update catalog items, offers, and availability',
    ],
    capabilitiesHe: [
      'עיון וניהול קטלוג ההטבות',
      'יצירה והפעלת קמפיינים של הקצאות לחברים',
      'צפייה וסיוע לחברי סביבת העבודה',
      'גישה ללוחות מחוונים תפעוליים ודוחות פעילות',
      'עדכון פריטי קטלוג, מבצעים וזמינות',
    ],
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
