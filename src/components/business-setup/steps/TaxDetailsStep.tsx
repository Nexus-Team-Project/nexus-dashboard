import React from 'react';
import type { BusinessSetupData } from '../types';

interface StepProps {
  data: BusinessSetupData;
  onChange: (updates: Partial<BusinessSetupData>) => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all';
const labelClass = 'block text-[13px] font-medium text-slate-700 mb-1.5';

const PayMeBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mr-1.5">
    &#11013; PayMe
  </span>
);

const TaxDetailsStep: React.FC<StepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">הזינו את פרטי המס</h1>
        <p className="text-sm text-slate-500 mt-1">נוודא שזה תואם את המידע שרשום ב-IRS עבור העסק שלכם.</p>
      </div>

      {/* Business structure info card */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <span className="text-[13px] text-slate-500">מבנה עסקי</span>
          <p className="text-[14px] font-medium text-slate-800">
            {data.business_structure || 'Multi-member LLC'}
          </p>
        </div>
        <button
          type="button"
          className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          עריכה
        </button>
      </div>

      {/* EIN / Company Reg. No. */}
      <div>
        <label className={labelClass}>מספר עוסק / ח.פ.</label>
        <input
          type="text"
          className={inputClass}
          placeholder="XX-XXXXXXX"
          value={data.ein}
          onChange={(e) => onChange({ ein: e.target.value })}
        />
      </div>

      {/* Legal business name (EN) */}
      <div>
        <label className={labelClass}>שם עסק רשמי (EN)</label>
        <input
          type="text"
          className={inputClass}
          placeholder="Business Name LLC"
          value={data.legal_name_en}
          onChange={(e) => onChange({ legal_name_en: e.target.value })}
        />
      </div>

      {/* PayMe: Legal business name (HE) */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          שם עסק רשמי (HE)
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder='שם עסק בע"מ'
          dir="rtl"
          value={data.legal_name_he}
          onChange={(e) => onChange({ legal_name_he: e.target.value })}
        />
      </div>
    </div>
  );
};

export default TaxDetailsStep;
