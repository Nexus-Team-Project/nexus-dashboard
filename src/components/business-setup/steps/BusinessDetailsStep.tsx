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

const COUNTRIES = ['United States', 'Israel'] as const;

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
] as const;


const BusinessDetailsStep: React.FC<StepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ספרו לנו על העסק שלכם</h1>
        <p className="text-sm text-slate-500 mt-1">מידע זה עוזר לנו לאמת את העסק שלכם ולעמוד ברגולציה.</p>
      </div>

      {/* Business name / DBA (EN) */}
      <div>
        <label className={labelClass}>שם עסק / שם מסחרי (EN)</label>
        <input
          type="text"
          className={inputClass}
          placeholder="Business name"
          value={data.dba_name_en}
          onChange={(e) => onChange({ dba_name_en: e.target.value })}
        />
      </div>

      {/* PayMe: Business name / DBA (HE) */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          שם עסק / שם מסחרי (HE)
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="שם עסק"
          dir="rtl"
          value={data.dba_name_he}
          onChange={(e) => onChange({ dba_name_he: e.target.value })}
        />
      </div>

      {/* ── Address section ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-[15px] font-semibold text-slate-800">כתובת העסק</h2>

        {/* Country */}
        <div>
          <label className={labelClass}>מדינה</label>
          <select
            className={inputClass}
            value={data.business_address_country}
            onChange={(e) => onChange({ business_address_country: e.target.value })}
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Street + House no. (2-col) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>רחוב</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Street address"
              value={data.business_address_street}
              onChange={(e) => onChange({ business_address_street: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>
              <PayMeBadge />
              מספר בית
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="House number"
              value={data.business_address_house}
              onChange={(e) => onChange({ business_address_house: e.target.value })}
            />
          </div>
        </div>

        {/* Apt/Unit */}
        <div>
          <label className={labelClass}>דירה / יחידה <span className="text-slate-400 font-normal">(לא חובה)</span></label>
          <input
            type="text"
            className={inputClass}
            placeholder="Apt, suite, unit, etc."
            value={data.business_address_apt}
            onChange={(e) => onChange({ business_address_apt: e.target.value })}
          />
        </div>

        {/* City + State (2-col) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>עיר</label>
            <input
              type="text"
              className={inputClass}
              placeholder="City"
              value={data.business_address_city}
              onChange={(e) => onChange({ business_address_city: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>מדינה / מחוז</label>
            <select
              className={inputClass}
              value={data.business_address_state}
              onChange={(e) => onChange({ business_address_state: e.target.value })}
            >
              <option value="">בחרו מדינה</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Postal code */}
        <div className="max-w-[200px]">
          <label className={labelClass}>מיקוד</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Postal code"
            value={data.business_address_postal}
            onChange={(e) => onChange({ business_address_postal: e.target.value })}
          />
        </div>
      </div>

      {/* Note: business_phone, business_website, has_website, business_activity_desc
           are omitted here — they were already collected in the onboarding wizard. */}
    </div>
  );
};

export default BusinessDetailsStep;
