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
  <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full mr-2">
    &#11013; PayMe
  </span>
);

const BankAccountStep: React.FC<StepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">הוסיפו חשבון בנק</h1>
        <p className="text-sm text-slate-500 mt-1">נשתמש בחשבון זה כדי לשלוח לכם תשלומים.</p>
      </div>

      {/* Info note */}
      <div className="flex gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
        <span className="text-base leading-none mt-0.5" aria-hidden="true">&#128161;</span>
        <p className="text-[13px] text-slate-600 leading-relaxed">
          חשבון בנק נדרש מספקים בלבד &mdash; דייר אינו מקבל תשלומים דרך המערכת.
        </p>
      </div>

      {/* Bank selection */}
      <div>
        <label className={labelClass}>בנק</label>
        <input
          type="text"
          className={inputClass}
          placeholder="חיפוש בנק..."
          value={data.bank_selection}
          onChange={(e) => onChange({ bank_selection: e.target.value })}
        />
      </div>

      {/* PayMe: Branch number */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          סניף
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="3 ספרות"
          maxLength={3}
          value={data.bank_branch}
          onChange={(e) => onChange({ bank_branch: e.target.value })}
        />
      </div>

      {/* Routing number */}
      <div>
        <label className={labelClass}>מספר ניתוב</label>
        <input
          type="text"
          className={inputClass}
          placeholder="XXXXXXXXX"
          maxLength={9}
          value={data.routing_number}
          onChange={(e) => onChange({ routing_number: e.target.value })}
        />
        <p className="text-[12px] text-slate-400 mt-1.5">9 ספרות</p>
      </div>

      {/* Account number */}
      <div>
        <label className={labelClass}>מספר חשבון</label>
        <input
          type="password"
          className={inputClass}
          placeholder="מספר חשבון"
          value={data.account_number}
          onChange={(e) => onChange({ account_number: e.target.value })}
        />
      </div>

      {/* Confirm account number */}
      <div>
        <label className={labelClass}>אימות מספר חשבון</label>
        <input
          type="password"
          className={inputClass}
          placeholder="הזינו שוב מספר חשבון"
          value={data.confirm_account_number}
          onChange={(e) => onChange({ confirm_account_number: e.target.value })}
        />
      </div>
    </div>
  );
};

export default BankAccountStep;
