import React from 'react';
import type { BusinessSetupData } from '../types';

interface StepProps {
  data: BusinessSetupData;
  onChange: (updates: Partial<BusinessSetupData>) => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all';
const labelClass = 'block text-[13px] font-medium text-slate-700 mb-1.5';
const selectClass =
  'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white';

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

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

const PublicDetailsStep: React.FC<StepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">פרטים ציבוריים</h1>
        <p className="text-sm text-slate-500 mt-1">מידע זה יופיע ללקוחות שלכם בדפי חיוב ובקבלות.</p>
      </div>

      {/* Business name (public) */}
      <div>
        <label className={labelClass}>שם עסק ציבורי</label>
        <input
          type="text"
          className={inputClass}
          placeholder="שם העסק הציבורי"
          value={data.public_business_name}
          onChange={(e) => onChange({ public_business_name: e.target.value })}
        />
      </div>

      {/* Statement descriptor */}
      <div>
        <label className={labelClass}>תיאור בדף חשבון</label>
        <input
          type="text"
          className={inputClass}
          placeholder="תיאור בדף חשבון"
          maxLength={22}
          value={data.statement_descriptor}
          onChange={(e) => onChange({ statement_descriptor: e.target.value })}
        />
        <p className="text-[12px] text-slate-400 mt-1.5">
          5&ndash;22 תווים, מופיע בדפי חיוב
        </p>
      </div>

      {/* Shortened descriptor */}
      <div>
        <label className={labelClass}>תיאור מקוצר (לא חובה)</label>
        <input
          type="text"
          className={inputClass}
          placeholder="תיאור מקוצר"
          maxLength={10}
          value={data.shortened_descriptor}
          onChange={(e) => onChange({ shortened_descriptor: e.target.value })}
        />
        <p className="text-[12px] text-slate-400 mt-1.5">
          2&ndash;10 תווים
        </p>
      </div>

      {/* Customer support phone */}
      <div>
        <label className={labelClass}>טלפון תמיכה</label>
        <input
          type="tel"
          className={inputClass}
          placeholder="+1 (555) 000-0000"
          value={data.support_phone}
          onChange={(e) => onChange({ support_phone: e.target.value })}
        />
      </div>

      {/* Show phone on receipts — toggle switch */}
      <div className="flex items-center justify-between">
        <label htmlFor="show_phone_receipts" className="text-[14px] text-slate-700 cursor-pointer">
          הצגת טלפון בקבלות
        </label>
        <button
          id="show_phone_receipts"
          type="button"
          role="switch"
          aria-checked={data.show_phone_receipts}
          onClick={() => onChange({ show_phone_receipts: !data.show_phone_receipts })}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-2 ${
            data.show_phone_receipts ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              data.show_phone_receipts ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Support address section */}
      <div className="space-y-4">
        <h2 className="text-[15px] font-semibold text-slate-800">כתובת תמיכה</h2>

        {/* Country */}
        <div>
          <label className={labelClass}>מדינה</label>
          <select
            className={selectClass}
            value={data.support_address_country}
            onChange={(e) => onChange({ support_address_country: e.target.value })}
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Street */}
        <div>
          <label className={labelClass}>רחוב</label>
          <input
            type="text"
            className={inputClass}
            placeholder="כתובת רחוב"
            value={data.support_address_street}
            onChange={(e) => onChange({ support_address_street: e.target.value })}
          />
        </div>

        {/* Apt/Unit */}
        <div>
          <label className={labelClass}>דירה / יחידה (לא חובה)</label>
          <input
            type="text"
            className={inputClass}
            placeholder="דירה, יחידה וכו׳"
            value={data.support_address_apt}
            onChange={(e) => onChange({ support_address_apt: e.target.value })}
          />
        </div>

        {/* City + State + Postal — 3-column grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>עיר</label>
            <input
              type="text"
              className={inputClass}
              placeholder="עיר"
              value={data.support_address_city}
              onChange={(e) => onChange({ support_address_city: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>מדינה / מחוז</label>
            <select
              className={selectClass}
              value={data.support_address_state}
              onChange={(e) => onChange({ support_address_state: e.target.value })}
            >
              <option value="">בחרו מדינה</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>מיקוד</label>
            <input
              type="text"
              className={inputClass}
              placeholder="12345"
              value={data.support_address_postal}
              onChange={(e) => onChange({ support_address_postal: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDetailsStep;
