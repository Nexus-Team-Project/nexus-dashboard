/**
 * Renders the first-run workspace setup form with localized labels.
 * The component collects tenant setup data but leaves persistence to the parent.
 */
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import nexusBlackLogo from '../../assets/logos/Nexus_wide_logo_blak.png';
import { useLanguage } from '../../i18n/LanguageContext';
import { PhoneInputField } from '../ui/PhoneInputField';
import TenantLogo from '../common/TenantLogo';
import LogoCropUpload from '../common/LogoCropUpload';
import InfoTooltip from '../common/InfoTooltip';
import BrandColorPicker from '../common/BrandColorPicker';
import { DEFAULT_BRAND_COLOR } from '../../lib/brandColor';

const TOTAL_STEPS = 3;
const MIN_DESC_CHARS = 20;

export interface OnboardingData {
  org_name: string;
  website: string;
  business_desc: string;
  primary_use_cases: string[];
  phone: string;
  role: string;
  /** Optional square-cropped logo, uploaded by the parent after the workspace
   *  is created (the tenant must exist first). */
  logoBlob?: Blob;
  /** Optional brand color ("#rrggbb"), saved by the parent after the workspace
   *  is created. Omitted when the admin left the default untouched. */
  brandColor?: string;
}

// ── Use-case option definitions ────────────────────────────────────────────
const USE_CASES = [
  { id: 'benefits_club',  labelHe: 'מועדון הטבות', labelEn: 'Benefits club', whyHe: 'מתאים לארגונים המבקשים לחבר קהילות ולהעניק הטבות לחברים', whyEn: 'For organizations that want to connect communities and offer member benefits.', keywords: /קהילה|עמותה|ארגון|חברים|מועדון/i },
  { id: 'sms_marketing',  labelHe: 'שיווק SMS', labelEn: 'SMS marketing', whyHe: 'מתאים לעסקים המבקשים לשלוח קמפיינים וקידומי מכירות ב-SMS', whyEn: 'For businesses that want to run SMS campaigns and promotions.', keywords: /sms|מסרון|הודעה|טקסט|text|campaign|קמפיין/i },
  { id: 'employee_gifts', labelHe: 'מתנות לעובדים / מתנות לחגים', labelEn: 'Employee gifts / holiday gifts', whyHe: 'מתאים לחברות המחפשות פתרון להענקת מתנות ומוטיבציה לצוות', whyEn: 'For companies sending employee gifts and team incentives.', keywords: /עובד|employee|חג|gift|מתנה|staff|צוות/i },
  { id: 'loyalty',        labelHe: 'תוכנית נאמנות', labelEn: 'Loyalty program', whyHe: 'מתאים לעסקי קמעונאות ומסחר הרוצים לשמר לקוחות ולפתח תגמולים', whyEn: 'For retail and commerce businesses that want rewards and retention.', keywords: /נאמנות|loyalty|נקודות|חנות|store|retail|מסחר|לקוח/i },
  { id: 'branded_card',   labelHe: 'כרטיס אשראי ממוקד', labelEn: 'Prepaid / branded card', whyHe: 'מתאים לבנקים וחברות פיננסיות המנפיקות כרטיסים ממותגים', whyEn: 'For banks and financial companies issuing branded cards.', keywords: /כרטיס|card|בנק|bank|פרי.פייד|prepaid/i },
  { id: 'payment',        labelHe: 'עיבוד תשלומים לעסק שלי', labelEn: 'Payment processing for my business', whyHe: 'מתאים לעסקים הזקוקים לתשתית סליקה ועיבוד תשלומים', whyEn: 'For businesses that need payment acceptance and processing.', keywords: /תשלום|payment|סליקה|processing/i },
  { id: 'not_sure',       labelHe: 'עדיין לא בטוח', labelEn: 'Not sure yet', whyHe: '', whyEn: '', keywords: null as RegExp | null },
];

const CONTACT_ROLES = [
  { id: 'owner', he: 'בעלים', en: 'Owner' },
  { id: 'ceo', he: 'מנכ"ל', en: 'CEO' },
  { id: 'finance', he: 'כספים', en: 'Finance' },
  { id: 'operations', he: 'תפעול', en: 'Operations' },
  { id: 'marketing', he: 'שיווק', en: 'Marketing' },
  { id: 'product', he: 'מוצר', en: 'Product' },
  { id: 'developer', he: 'פיתוח', en: 'Developer' },
  { id: 'other', he: 'אחר', en: 'Other' },
] as const;

const COPY = {
  he: {
    welcomeTitle: (firstName?: string) => firstName ? `ברוכים הבאים לנקסוס, ${firstName}.` : 'ברוכים הבאים לנקסוס.',
    welcomeSubtitle: 'ספרו לנו קצת על הארגון שלכם כדי להתאים את הסביבה. תמיד ניתן לשנות זאת מאוחר יותר.',
    orgNameLabel: 'שם הארגון',
    orgNamePlaceholder: 'נקסוס בע"מ',
    logoLabel: 'לוגו הארגון',
    logoOptional: 'אופציונלי',
    logoUpload: 'העלאת לוגו',
    logoChange: 'החלפה',
    logoRemove: 'הסרה',
    logoTip: 'העלו לוגו מרובע (מומלץ 512×512 פיקסלים), עדיף PNG עם רקע שקוף - כך הלוגו נראה חד בכל מקום. עד 5MB. פורמטים: PNG, JPG, WEBP. אם לא תעלו, יוצגו ראשי התיבות של שם הארגון.',
    logoInvalidType: 'פורמט לא נתמך (PNG/JPG/WEBP)',
    logoTooLarge: 'הקובץ גדול מדי (עד 5MB)',
    brandColorLabel: 'צבע המותג',
    brandColorTip: 'זהו הצבע שמשתמשי הארגון שלך יראו כשהם נכנסים בפעם הראשונה להטבות שלך.',
    websiteLabel: 'אתר',
    websitePlaceholder: 'www.example.com',
    websiteError: 'כתובת האתר אינה תקינה',
    businessLabel: 'איזה סוג עסק אתם ומה אתם מציעים?',
    businessPlaceholder: 'לדוגמה: רשת קמעונאית המציעה מוצרי אלקטרוניקה ורוצה לפתח תוכנית נאמנות ללקוחות...',
    descHint: (n: number) => n < MIN_DESC_CHARS ? `${n} / ${MIN_DESC_CHARS} תווים מינימום` : `${n} תווים ✓`,
    step1Title: 'אלו הפתרונות שנראים הכי רלוונטיים לכם',
    step1Sub: 'בחרו את כל האפשרויות הרלוונטיות',
    suggested: 'מומלץ',
    whyTitle: 'למה מומלץ?',
    step2Title: 'כמה פרטים עליכם',
    step2Sub: 'כל השדות נדרשים כדי ליצור סביבת עבודה מאובטחת.',
    phoneLabel: 'טלפון',
    phoneError: 'מספר הטלפון אינו תקין',
    roleLabel: 'תפקיד',
    rolePlaceholder: 'בחרו תפקיד',
    back: 'חזרה',
    skip: 'דלג לעת עתה',
    continue: 'המשך',
    finish: 'סיים הגדרה',
    tooltipMsg: 'יש להשלים את כל השדות הנדרשים',
    searchCountry: 'חיפוש מדינה',
  },
  en: {
    welcomeTitle: (firstName?: string) => firstName ? `Welcome to Nexus, ${firstName}.` : 'Welcome to Nexus.',
    welcomeSubtitle: 'Tell us about your organization so we can tailor the workspace. You can change this later.',
    orgNameLabel: 'Organization name',
    orgNamePlaceholder: 'Nexus Ltd.',
    logoLabel: 'Organization logo',
    logoOptional: 'optional',
    logoUpload: 'Upload logo',
    logoChange: 'Change',
    logoRemove: 'Remove',
    logoTip: 'Upload a square logo (recommended 512×512 px), ideally a transparent PNG so it stays crisp everywhere. Max 5MB. Formats: PNG, JPG, WEBP. If you skip it, the organization-name initials are used.',
    logoInvalidType: 'Unsupported format (PNG/JPG/WEBP)',
    logoTooLarge: 'File too large (max 5MB)',
    brandColorLabel: 'Brand color',
    brandColorTip: 'This is the color your organization users will see when logging in for the first time to your benefits.',
    websiteLabel: 'Website',
    websitePlaceholder: 'www.example.com',
    websiteError: 'Website is invalid',
    businessLabel: 'What kind of business are you and what do you offer?',
    businessPlaceholder: 'Example: A retail chain that sells electronics and wants to build a customer loyalty program...',
    descHint: (n: number) => n < MIN_DESC_CHARS ? `${n} / ${MIN_DESC_CHARS} chars minimum` : `${n} chars ✓`,
    step1Title: 'Which solutions look most relevant?',
    step1Sub: 'Select all relevant options',
    suggested: 'Suggested',
    whyTitle: 'Why suggested?',
    step2Title: 'A few details about you',
    step2Sub: 'All fields are required to create a secure workspace.',
    phoneLabel: 'Phone',
    phoneError: 'Phone number is not valid',
    roleLabel: 'Role',
    rolePlaceholder: 'Select role',
    back: 'Back',
    skip: 'Skip for now',
    continue: 'Continue',
    finish: 'Finish setup',
    tooltipMsg: 'Complete all required fields to continue',
    searchCountry: 'Search country',
  },
} as const;

/**
 * Suggests use cases from the business description.
 * Input: free-text business description.
 * Output: matching use-case ids or conservative defaults.
 */
function getSuggested(desc: string): string[] {
  const matched = USE_CASES.filter(o => o.keywords && o.keywords.test(desc)).map(o => o.id);
  return matched.length > 0 ? matched : ['benefits_club', 'loyalty'];
}

// ── Component ──────────────────────────────────────────────────────────────
export interface WizardDraft {
  step?: number;
  orgName?: string;
  website?: string;
  businessDesc?: string;
  primarySelected?: string[];
  primarySuggested?: string[];
  phone?: string;
  role?: string;
  brandColor?: string;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onBack: () => void;
  onSkip: () => void;
  /** Called when user skips with "complete later" — receives current draft to persist. */
  onSkipWithDraft?: (draft: WizardDraft) => void;
  firstName?: string;
  /** Draft loaded from MongoDB — takes priority over localStorage. */
  backendDraft?: WizardDraft | null;
}

/**
 * Collects workspace setup data across three short steps.
 * Input: completion, back, and skip callbacks plus optional first name.
 * Output: localized wizard UI that emits validated form data to the parent.
 */
const DRAFT_KEY = 'nexus_onboarding_draft';

/** Reads a saved wizard draft from localStorage, returns null if none. */
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) as Record<string, unknown> : null;
  } catch { return null; }
}

/** Saves wizard draft fields to localStorage so they survive logout and browser restart. */
function saveDraft(data: Record<string, unknown>) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

/** Clears the saved draft after successful submission or explicit skip. */
export function clearOnboardingDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

export default function OnboardingWizard({ onComplete, onSkip, onSkipWithDraft, firstName, backendDraft }: OnboardingWizardProps) {
  const { language, isRTL } = useLanguage();
  const direction = isRTL ? 'rtl' : 'ltr';
  const c = COPY[language];

  // Backend draft (from MongoDB) takes priority over localStorage draft
  const localDraft = loadDraft();
  const draft: WizardDraft | null = backendDraft ?? localDraft;

  const [step, setStep] = useState((draft?.step as number | undefined) ?? 0);

  // Step 0 fields
  const [orgName, setOrgName]           = useState((draft?.orgName as string | undefined) ?? '');
  // Logo is optional and not draft-persisted (a Blob can't be serialized); it is
  // uploaded by the parent after the workspace is created.
  const [logoBlob, setLogoBlob]         = useState<Blob | null>(null);
  const [logoPreview, setLogoPreview]   = useState<string | null>(null);
  // Brand color (wallet first-login accent). Defaults to the shared default and
  // is only saved by the parent when the admin changes it from that default.
  const [brandColor, setBrandColor]     = useState<string>((draft?.brandColor as string | undefined) ?? DEFAULT_BRAND_COLOR);
  const [website, setWebsite]           = useState((draft?.website as string | undefined) ?? '');
  const [websiteError, setWebsiteError] = useState(false);
  const [businessDesc, setBusinessDesc] = useState((draft?.businessDesc as string | undefined) ?? '');

  // Step 1
  const [primarySelected, setPrimarySelected]   = useState<string[]>((draft?.primarySelected as string[] | undefined) ?? []);
  const [primarySuggested, setPrimarySuggested] = useState<string[]>((draft?.primarySuggested as string[] | undefined) ?? []);

  // "Why recommended" tooltip
  const [hoveredWhyId, setHoveredWhyId]   = useState<string | null>(null);
  const [whyPos, setWhyPos]               = useState({ top: 0, left: 0 });

  // Step 2 fields — phone stored as E164 (e.g. "+972508465858")
  const [phone, setPhone]           = useState((draft?.phone as string | undefined) ?? '');
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [role, setRole]             = useState((draft?.role as string | undefined) ?? '');

  // Disabled-continue tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos]   = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const descLen = businessDesc.trim().length;
  const descValid = descLen >= MIN_DESC_CHARS;

  // Auto-save draft to sessionStorage whenever any field changes
  useEffect(() => {
    saveDraft({ step, orgName, website, businessDesc, primarySelected, primarySuggested, phone, role, brandColor });
  }, [step, orgName, website, businessDesc, primarySelected, primarySuggested, phone, role, brandColor]);

  // ── URL validation ────────────────────────────────────────────────────────
  const validateWebsite = (val: string) => {
    if (!val.trim()) { setWebsiteError(false); return; }
    try {
      const url = val.startsWith('http') ? val : `https://${val}`;
      const parsed = new URL(url);
      setWebsiteError(!parsed.hostname.includes('.') || parsed.hostname.length < 4);
    } catch {
      setWebsiteError(true);
    }
  };

  const canContinue =
    step === 0 ? orgName.trim() !== '' && website.trim() !== '' && descValid && !websiteError :
    step === 1 ? primarySelected.length > 0 :
    phoneValid && role.trim() !== '';

  const handlePhoneChange = (e164: string, valid: boolean) => {
    setPhone(e164);
    setPhoneValid(valid);
    setPhoneTouched(true);
  };

  /** Returns current wizard field values for draft persistence. */
  const getCurrentDraft = (): WizardDraft => ({
    step,
    orgName,
    website,
    businessDesc,
    primarySelected,
    primarySuggested,
    phone,
    role,
  });

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (!canContinue) return;
    if (step === 0) {
      const suggested = getSuggested(businessDesc);
      setPrimarySuggested(suggested);
      setPrimarySelected(suggested);
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else {
      clearOnboardingDraft();
      onComplete({
        org_name: orgName, website, business_desc: businessDesc, primary_use_cases: primarySelected,
        phone, role, logoBlob: logoBlob ?? undefined,
        // Only send the color when the admin moved it off the default.
        brandColor: brandColor.toLowerCase() !== DEFAULT_BRAND_COLOR ? brandColor : undefined,
      });
    }
  };

  /** Moves the wizard one step back without losing entered data. */
  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  // ── Tooltip helpers ───────────────────────────────────────────────────────
  const handleContinueEnter = () => {
    setShowTooltip(true);
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setTooltipPos({ top: r.top - 8, left: r.left + r.width / 2 });
    }
  };

  const handleWhyEnter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHoveredWhyId(id);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setWhyPos({ top: r.top - 8, left: r.left + r.width / 2 });
  };

  // ── Back arrow ────────────────────────────────────────────────────────────
  const BackArrow = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12H19M12 5l7 7-7 7" />
    </svg>
  );

  // ── Shared input classes ─────────────────────────────────────────────────
  const inputBase = 'w-full px-3.5 py-2.5 border rounded-lg text-[14px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all';
  const inputNormal = `${inputBase} border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400`;
  const inputError  = `${inputBase} border-red-300 focus:ring-red-500/20 focus:border-red-400`;

  return (
    <div className="ws-modal" dir={direction}>

      {/* ── Fixed tooltip: disabled Continue ─────────────────────────────── */}
      {showTooltip && !canContinue && (
        <div
          style={{ position: 'fixed', top: tooltipPos.top, left: tooltipPos.left, transform: 'translate(-50%, -100%)', zIndex: 99999, pointerEvents: 'none' }}
          className="bg-slate-800 text-white text-[12px] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
          dir={direction}
        >
          {c.tooltipMsg}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800" />
        </div>
      )}

      {/* ── Fixed tooltip: "Why recommended?" ───────────────────────────── */}
      {hoveredWhyId && (() => {
        const opt = USE_CASES.find(o => o.id === hoveredWhyId);
        const why = language === 'he' ? opt?.whyHe : opt?.whyEn;
        if (!why) return null;
        return (
          <div
            style={{ position: 'fixed', top: whyPos.top, left: whyPos.left, transform: 'translate(-50%, -100%)', zIndex: 99998, pointerEvents: 'none', maxWidth: '260px' }}
            className="bg-slate-800 text-white text-[12px] px-3 py-2 rounded-lg shadow-lg leading-relaxed"
            dir={direction}
          >
            <div className="font-semibold text-indigo-300 mb-0.5">{c.whyTitle}</div>
            {why}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800" />
          </div>
        );
      })()}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 shrink-0" dir="ltr">
        <img src={nexusBlackLogo} alt="Nexus" className="h-10 w-auto object-contain" />
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`w-10 h-[3px] rounded-full transition-colors duration-500 ${i <= step ? 'bg-indigo-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <div className="ws-content">

        {/* ── Step 0: Welcome + Org form ─────────────────────────────────── */}
        {step === 0 && (
          <>
            <div className="mb-7">
              <h1 className="text-[26px] font-bold text-indigo-600 leading-tight mb-2">
                {c.welcomeTitle(firstName)}
              </h1>
              <p className="text-[14px] text-slate-500 leading-relaxed">{c.welcomeSubtitle}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">{c.orgNameLabel}</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder={c.orgNamePlaceholder}
                  className={inputNormal}
                />
              </div>

              {/* Optional organization logo (square crop). Skipped -> initials. */}
              <div>
                <label className="mb-1.5 flex items-center text-[13px] font-medium text-slate-700">
                  {c.logoLabel}
                  <span className="ms-1 text-xs text-slate-400">({c.logoOptional})</span>
                  <InfoTooltip text={c.logoTip} />
                </label>
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="h-14 w-14 rounded-2xl bg-white object-contain" />
                  ) : (
                    <TenantLogo name={orgName || 'N'} size={56} rounded="rounded-2xl" />
                  )}
                  <LogoCropUpload
                    onCropped={(b, p) => { if (logoPreview) URL.revokeObjectURL(logoPreview); setLogoBlob(b); setLogoPreview(p); }}
                    onError={(code) => toast.error(code === 'too_large' ? c.logoTooLarge : c.logoInvalidType)}
                  >
                    {(open) => (
                      <button type="button" onClick={open} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        {logoPreview ? c.logoChange : c.logoUpload}
                      </button>
                    )}
                  </LogoCropUpload>
                  {logoPreview && (
                    <button type="button" onClick={() => { URL.revokeObjectURL(logoPreview); setLogoBlob(null); setLogoPreview(null); }} className="text-xs font-medium text-slate-500 hover:text-red-600">
                      {c.logoRemove}
                    </button>
                  )}
                </div>
              </div>

              {/* Optional brand color (wallet first-login accent). */}
              <div>
                <label className="mb-1.5 flex items-center text-[13px] font-medium text-slate-700">
                  {c.brandColorLabel}
                  <span className="ms-1 text-xs text-slate-400">({c.logoOptional})</span>
                  <InfoTooltip text={c.brandColorTip} />
                </label>
                <BrandColorPicker value={brandColor} onChange={setBrandColor} />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">{c.websiteLabel}</label>
                <input
                  type="text"
                  value={website}
                  onChange={e => { setWebsite(e.target.value); validateWebsite(e.target.value); }}
                  onBlur={() => validateWebsite(website)}
                  placeholder={c.websitePlaceholder}
                  dir="ltr"
                  className={websiteError ? inputError : inputNormal}
                />
                {websiteError && <p className="text-[12px] text-red-500 mt-1">{c.websiteError}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">{c.businessLabel}</label>
                <textarea
                  value={businessDesc}
                  onChange={e => setBusinessDesc(e.target.value)}
                  rows={4}
                  placeholder={c.businessPlaceholder}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[14px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none leading-relaxed"
                />
                {/* Live character counter */}
                <p className={`mt-1 text-[12px] font-medium transition-colors ${descValid ? 'text-emerald-600' : descLen > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {c.descHint(descLen)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── Step 1: Solutions ─────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h2 className="text-[21px] font-semibold text-slate-900 leading-snug mb-1.5">{c.step1Title}</h2>
            <p className="text-[13px] text-slate-400 mb-5">{c.step1Sub}</p>

            <div className="grid grid-cols-2 gap-2">
              {[
                ...USE_CASES.filter(o => primarySuggested.includes(o.id)),
                ...USE_CASES.filter(o => !primarySuggested.includes(o.id)),
              ].map(option => {
                const isSelected  = primarySelected.includes(option.id);
                const isSuggested = primarySuggested.includes(option.id);
                const isNotSure   = option.id === 'not_sure';

                return (
                  <div
                    key={option.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => setPrimarySelected(prev => prev.includes(option.id) ? prev.filter(x => x !== option.id) : [...prev, option.id])}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setPrimarySelected(prev => prev.includes(option.id) ? prev.filter(x => x !== option.id) : [...prev, option.id]);
                      }
                    }}
                    className={`${isNotSure ? 'col-span-2' : ''} cursor-pointer text-start px-4 py-3 rounded-lg border text-[14px] transition-all select-none ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                        {isSelected && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="flex-1 leading-tight">{language === 'he' ? option.labelHe : option.labelEn}</span>
                      {isSuggested && (language === 'he' ? option.whyHe : option.whyEn) && (
                        <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                          <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                            {c.suggested}
                          </span>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={e => e.stopPropagation()}
                            onMouseEnter={e => handleWhyEnter(option.id, e)}
                            onMouseLeave={() => setHoveredWhyId(null)}
                            className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-500 text-[10px] font-bold flex items-center justify-center hover:bg-indigo-200 transition-colors leading-none"
                          >
                            ?
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Step 2: User details ───────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="mb-7">
              <h2 className="text-[21px] font-semibold text-slate-900 leading-snug mb-1.5">{c.step2Title}</h2>
              <p className="text-[13px] text-slate-400 leading-relaxed">{c.step2Sub}</p>
            </div>

            <div className="space-y-4">
              <PhoneInputField
                value={phone}
                defaultCountry="il"
                onChange={handlePhoneChange}
                label={c.phoneLabel}
                errorText={c.phoneError}
                searchPlaceholder={c.searchCountry}
                touched={phoneTouched}
              />

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">{c.roleLabel}</label>
                <select value={role} onChange={e => setRole(e.target.value)} className={inputNormal}>
                  <option value="">{c.rolePlaceholder}</option>
                  {CONTACT_ROLES.map(option => (
                    <option key={option.id} value={option.id}>{language === 'he' ? option.he : option.en}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="ws-footer-between">
        {step > 0 ? (
          <button onClick={handleBack} className="text-[14px] text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer">
            <BackArrow />
            {c.back}
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {/* Skip visible on every step — saves draft to MongoDB when "complete later" */}
          <button
            onClick={() => {
              if (onSkipWithDraft) {
                onSkipWithDraft(getCurrentDraft());
              } else {
                clearOnboardingDraft();
                onSkip();
              }
            }}
            className="cursor-pointer text-[14px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            {c.skip}
          </button>
          <button
            ref={btnRef}
            onClick={handleNext}
            onMouseEnter={handleContinueEnter}
            onMouseLeave={() => setShowTooltip(false)}
            disabled={!canContinue}
            className={`cursor-pointer px-6 py-2.5 text-[14px] font-semibold rounded-lg transition-colors ${canContinue ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            {step < TOTAL_STEPS - 1 ? c.continue : c.finish}
          </button>
        </div>
      </div>
    </div>
  );
}
