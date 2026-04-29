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

const PayMeBadge: React.FC = () => (
  <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full mr-2">
    &#11013; PayMe
  </span>
);

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

const BusinessRepresentativeStep: React.FC<StepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">נציג העסק</h1>
        <p className="text-sm text-slate-500 mt-1 mb-8">ספרו לנו על האדם שמנהל את החשבון הזה.</p>
      </div>

      {/* Name fields — 2-column grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>שם פרטי</label>
          <input
            type="text"
            className={inputClass}
            placeholder="First name"
            value={data.rep_first_name}
            onChange={(e) => onChange({ rep_first_name: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>שם משפחה</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Last name"
            value={data.rep_last_name}
            onChange={(e) => onChange({ rep_last_name: e.target.value })}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>כתובת אימייל</label>
        <input
          type="email"
          className={inputClass}
          placeholder="email@example.com"
          value={data.rep_email}
          onChange={(e) => onChange({ rep_email: e.target.value })}
        />
      </div>

      {/* Job title */}
      <div>
        <label className={labelClass}>תפקיד</label>
        <input
          type="text"
          className={inputClass}
          placeholder="CEO / Manager / Partner"
          value={data.rep_job_title}
          onChange={(e) => onChange({ rep_job_title: e.target.value })}
        />
      </div>

      {/* Date of birth */}
      <div>
        <label className={labelClass}>תאריך לידה</label>
        <input
          type="date"
          className={inputClass}
          placeholder="MM/DD/YYYY"
          value={data.rep_dob}
          onChange={(e) => onChange({ rep_dob: e.target.value })}
        />
      </div>

      {/* PayMe: National ID & ID issue date — 2-column grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            <PayMeBadge />
            מספר זהות
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="9 digits"
            maxLength={9}
            value={data.rep_national_id}
            onChange={(e) => onChange({ rep_national_id: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>
            <PayMeBadge />
            תאריך הנפקת ת.ז.
          </label>
          <input
            type="date"
            className={inputClass}
            placeholder="MM/DD/YYYY"
            value={data.rep_id_issue_date}
            onChange={(e) => onChange({ rep_id_issue_date: e.target.value })}
          />
        </div>
      </div>

      {/* PayMe: Gender */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          מגדר
        </label>
        <select
          className={selectClass}
          value={data.rep_gender}
          onChange={(e) => onChange({ rep_gender: e.target.value })}
        >
          <option value="">בחירת מגדר</option>
          <option value="Male">זכר</option>
          <option value="Female">נקבה</option>
          <option value="Other">אחר</option>
        </select>
      </div>

      {/* Home address section */}
      <div className="space-y-4">
        <h2 className="text-[15px] font-semibold text-slate-800">כתובת מגורים</h2>

        {/* Country */}
        <div>
          <label className={labelClass}>מדינה</label>
          <select
            className={selectClass}
            value={data.rep_address_country}
            onChange={(e) => onChange({ rep_address_country: e.target.value })}
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Street + House no. — 2-column grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>רחוב</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Street address"
              value={data.rep_address_street}
              onChange={(e) => onChange({ rep_address_street: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>מספר בית</label>
            <input
              type="text"
              className={inputClass}
              placeholder="123"
              value={data.rep_address_house}
              onChange={(e) => onChange({ rep_address_house: e.target.value })}
            />
          </div>
        </div>

        {/* Apt/Unit */}
        <div>
          <label className={labelClass}>דירה / יחידה (לא חובה)</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Apt, suite, unit, etc."
            value={data.rep_address_apt}
            onChange={(e) => onChange({ rep_address_apt: e.target.value })}
          />
        </div>

        {/* City + State + Postal — 3-column grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>עיר</label>
            <input
              type="text"
              className={inputClass}
              placeholder="City"
              value={data.rep_address_city}
              onChange={(e) => onChange({ rep_address_city: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>מדינה / מחוז</label>
            <select
              className={selectClass}
              value={data.rep_address_state}
              onChange={(e) => onChange({ rep_address_state: e.target.value })}
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
              value={data.rep_address_postal}
              onChange={(e) => onChange({ rep_address_postal: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Phone number */}
      <div>
        <label className={labelClass}>מספר טלפון</label>
        <input
          type="tel"
          className={inputClass}
          placeholder="+1 (555) 000-0000"
          value={data.rep_phone}
          onChange={(e) => onChange({ rep_phone: e.target.value })}
        />
      </div>

      {/* Ownership checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="rep_owns_25_plus"
          className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          checked={data.rep_owns_25_plus}
          onChange={(e) => onChange({ rep_owns_25_plus: e.target.checked })}
        />
        <label htmlFor="rep_owns_25_plus" className="text-[14px] text-slate-700 cursor-pointer">
          <span className="text-[14px] text-slate-700">אדם זה מחזיק ב-25% או יותר מהעסק</span>
        </label>
      </div>
    </div>
  );
};

export default BusinessRepresentativeStep;
