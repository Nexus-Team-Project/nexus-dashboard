import React from 'react';
import type { BusinessSetupData } from '../types';

interface StepProps {
  data: BusinessSetupData;
  onChange: (updates: Partial<BusinessSetupData>) => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all';
const labelClass = 'block text-[13px] font-medium text-slate-700 mb-1.5';
const radioClass = 'w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500';

const COUNTRIES = [
  'United States',
  'Israel',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Netherlands',
  'Japan',
  'Singapore',
];

const BUSINESS_TYPES = ['Unregistered', 'Registered', 'Nonprofit'] as const;

const BUSINESS_TYPE_HE: Record<string, string> = {
  Unregistered: 'לא רשום',
  Registered: 'רשום',
  Nonprofit: 'מלכ״ר',
};

const BUSINESS_STRUCTURES = [
  'Single-member LLC',
  'Multi-member LLC',
  'Partnership',
  'Private corporation',
] as const;

const BUSINESS_STRUCTURE_HE: Record<string, string> = {
  'Single-member LLC': 'חברה בע״מ בעלים יחיד',
  'Multi-member LLC': 'חברה בע״מ מרובת בעלים',
  Partnership: 'שותפות',
  'Private corporation': 'חברה פרטית',
};

const EIN_OPTIONS = ['Yes', 'No'] as const;

const EIN_OPTIONS_HE: Record<string, string> = {
  Yes: 'כן',
  No: 'לא',
};

const BusinessTypeStep: React.FC<StepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">בחרו את סוג העסק</h1>
        <p className="text-sm text-slate-500 mt-1">ספרו לנו על מבנה העסק שלכם כדי שנוכל להגדיר את החשבון בצורה נכונה.</p>
      </div>

      {/* Business location */}
      <div>
        <label className={labelClass}>מיקום העסק</label>
        <select
          className={inputClass}
          value={data.business_location}
          onChange={(e) => onChange({ business_location: e.target.value })}
        >
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      {/* Business type */}
      <div>
        <label className={labelClass}>סוג עסק</label>
        <div className="space-y-3 mt-2">
          {BUSINESS_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="business_type"
                className={radioClass}
                value={type}
                checked={data.business_type === type}
                onChange={(e) =>
                  onChange({
                    business_type: e.target.value,
                    // Reset dependent fields when type changes
                    ...(e.target.value !== 'Registered' ? { business_structure: '' } : {}),
                    ...(e.target.value !== 'Unregistered' ? { has_ein: '' } : {}),
                  })
                }
              />
              <span className="text-[14px] text-slate-700">{BUSINESS_TYPE_HE[type]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Business structure — only if Registered */}
      {data.business_type === 'Registered' && (
        <div>
          <label className={labelClass}>מבנה עסקי</label>
          <div className="space-y-3 mt-2">
            {BUSINESS_STRUCTURES.map((structure) => (
              <label key={structure} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="business_structure"
                  className={radioClass}
                  value={structure}
                  checked={data.business_structure === structure}
                  onChange={(e) => onChange({ business_structure: e.target.value })}
                />
                <span className="text-[14px] text-slate-700">{BUSINESS_STRUCTURE_HE[structure]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Has EIN? — only if Unregistered */}
      {data.business_type === 'Unregistered' && (
        <div>
          <label className={labelClass}>יש מספר זיהוי מעסיק (EIN)?</label>
          <div className="space-y-3 mt-2">
            {EIN_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="has_ein"
                  className={radioClass}
                  value={option}
                  checked={data.has_ein === option}
                  onChange={(e) => onChange({ has_ein: e.target.value })}
                />
                <span className="text-[14px] text-slate-700">{EIN_OPTIONS_HE[option]}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessTypeStep;
