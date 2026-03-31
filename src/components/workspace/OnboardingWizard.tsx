import { useState, useEffect } from 'react';

export interface OnboardingData {
  org_name: string;
  website?: string;
  business_desc: string;
  primary_use_cases?: string[];
  phone?: string;
  role?: string;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onBack: () => void;
}

interface UseCase {
  id: string;
  label: string;
  labelHe: string;
  icon: string;
  keywords: RegExp;
}

const USE_CASES: UseCase[] = [
  { id: 'benefits_club', label: 'Benefits Club', labelHe: 'מועדון הטבות', icon: 'loyalty', keywords: /benefit|club|incentive|perks|הטב|מועדון/i },
  { id: 'digital_wallet', label: 'Digital Wallet', labelHe: 'ארנק דיגיטלי', icon: 'account_balance_wallet', keywords: /wallet|ארנק|דיגיטלי|digital/i },
  { id: 'vouchers', label: 'Vouchers', labelHe: 'קופונים', icon: 'confirmation_number', keywords: /voucher|coupon|קופון|שובר/i },
  { id: 'employee_gifts', label: 'Employee Gifts', labelHe: 'מתנות לעובדים', icon: 'card_giftcard', keywords: /gift|employee|עובד|מתנ|reward/i },
  { id: 'loyalty', label: 'Loyalty Program', labelHe: 'תוכנית נאמנות', icon: 'star', keywords: /loyal|נאמנות|retention|program/i },
  { id: 'prepaid_card', label: 'Prepaid Card', labelHe: 'כרטיס נטען', icon: 'credit_card', keywords: /prepaid|card|כרטיס|נטען|טעינ/i },
  { id: 'payment', label: 'Payment Solutions', labelHe: 'פתרונות תשלום', icon: 'payments', keywords: /payment|pay|תשלום|סליקה/i },
  { id: 'not_sure', label: 'Not sure yet', labelHe: 'עדיין לא בטוח/ה', icon: 'help_outline', keywords: /(?!x)x/ },
];

const OnboardingWizard = ({ onComplete, onBack }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);

  // Step 0 fields
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1 fields
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [suggestedUseCases, setSuggestedUseCases] = useState<string[]>([]);

  // Step 2 fields
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');

  // Auto-suggest use cases based on business description
  useEffect(() => {
    const suggested = USE_CASES
      .filter(uc => uc.keywords.test(businessDesc))
      .map(uc => uc.id);
    setSuggestedUseCases(suggested);
  }, [businessDesc]);

  // When entering step 1, auto-select suggested cases
  useEffect(() => {
    if (step === 1 && selectedUseCases.length === 0 && suggestedUseCases.length > 0) {
      setSelectedUseCases(suggestedUseCases);
    }
  }, [step]);

  const validateStep0 = () => {
    const newErrors: Record<string, string> = {};
    if (!orgName.trim()) newErrors.orgName = 'שם הארגון הוא שדה חובה';
    if (!businessDesc.trim()) newErrors.businessDesc = 'תיאור העסק הוא שדה חובה';
    if (website && !/^https?:\/\/.+\..+/.test(website) && !/^.+\..+/.test(website)) {
      newErrors.website = 'כתובת אתר לא תקינה';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 0) {
      if (!validateStep0()) return;
      setStep(1);
    } else if (step === 1) {
      if (selectedUseCases.length === 0) {
        setErrors({ useCases: 'יש לבחור לפחות תחום שימוש אחד' });
        return;
      }
      setErrors({});
      setStep(2);
    } else if (step === 2) {
      onComplete({
        org_name: orgName.trim(),
        website: website.trim() || undefined,
        business_desc: businessDesc.trim(),
        primary_use_cases: selectedUseCases,
        phone: phone.trim() || undefined,
        role: role.trim() || undefined,
      });
    }
  };

  const handleBack = () => {
    if (step === 0) {
      onBack();
    } else {
      setStep(step - 1);
    }
  };

  const toggleUseCase = (id: string) => {
    setSelectedUseCases(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setErrors({});
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              i === step
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : i < step
                ? 'bg-green-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
            }`}>
              {i < step ? (
                <span className="material-symbols-rounded !text-[16px]">check</span>
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div className={`w-12 h-0.5 rounded-full transition-colors ${
                i < step ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Organization Info */}
      {step === 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">פרטי הארגון</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">ספרו לנו קצת על בית העסק שלכם</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              שם הארגון <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={orgName}
              onChange={e => { setOrgName(e.target.value); setErrors(prev => ({ ...prev, orgName: '' })); }}
              placeholder="לדוגמה: נקסוס טכנולוגיות"
              autoFocus
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                errors.orgName ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.orgName && <p className="text-red-500 text-xs mt-1">{errors.orgName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              אתר אינטרנט
            </label>
            <input
              type="url"
              value={website}
              onChange={e => { setWebsite(e.target.value); setErrors(prev => ({ ...prev, website: '' })); }}
              placeholder="https://www.example.com"
              dir="ltr"
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-left ${
                errors.website ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              תיאור העסק <span className="text-red-500">*</span>
            </label>
            <textarea
              value={businessDesc}
              onChange={e => { setBusinessDesc(e.target.value); setErrors(prev => ({ ...prev, businessDesc: '' })); }}
              placeholder="במה עוסק בית העסק? מה אתם מחפשים להשיג?"
              rows={4}
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none ${
                errors.businessDesc ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.businessDesc && <p className="text-red-500 text-xs mt-1">{errors.businessDesc}</p>}
          </div>
        </div>
      )}

      {/* Step 1: Use Cases */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">תחומי שימוש</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">מה תרצו לעשות עם Nexus?</p>
          </div>

          {errors.useCases && (
            <p className="text-red-500 text-sm text-center">{errors.useCases}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {USE_CASES.map(uc => {
              const isSelected = selectedUseCases.includes(uc.id);
              const isSuggested = suggestedUseCases.includes(uc.id);
              return (
                <button
                  key={uc.id}
                  onClick={() => toggleUseCase(uc.id)}
                  className={`relative p-4 rounded-2xl border-2 text-right transition-all duration-200 ${
                    uc.id === 'not_sure' ? 'col-span-2' : ''
                  } ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      <span className="material-symbols-rounded !text-xl">{uc.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">{uc.labelHe}</div>
                      <div className="text-xs text-slate-400">{uc.label}</div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-rounded text-primary !text-xl">check_circle</span>
                    )}
                  </div>
                  {isSuggested && !isSelected && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                      מומלץ
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Personal Details */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">פרטים אישיים</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">אופציונלי — ניתן לדלג</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              טלפון
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="050-1234567"
              dir="ltr"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-left"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              תפקיד
            </label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="לדוגמה: מנכ״ל, סמנכ״ל שיווק..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-rounded text-violet-600 !text-xl">info</span>
              <p className="text-sm text-violet-700 dark:text-violet-300">
                השדות האלה אופציונליים. תוכלו להשלים אותם מאוחר יותר בהגדרות הפרופיל.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-sm font-medium"
        >
          <span className="material-symbols-rounded !text-[18px]">arrow_forward</span>
          <span>חזרה</span>
        </button>

        <button
          onClick={handleNext}
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all text-sm"
        >
          {step === 2 ? 'סיום הגדרה' : 'המשך'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingWizard;
