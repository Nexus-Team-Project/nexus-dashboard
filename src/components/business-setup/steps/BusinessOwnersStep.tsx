import React from 'react';
import type { BusinessSetupData } from '../types';

interface StepProps {
  data: BusinessSetupData;
  onChange: (updates: Partial<BusinessSetupData>) => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all';
const labelClass = 'block text-[13px] font-medium text-slate-700 mb-1.5';

const BusinessOwnersStep: React.FC<StepProps> = ({ data, onChange }) => {
  const handleOwnerChange = (
    index: number,
    field: 'first_name' | 'last_name' | 'email',
    value: string,
  ) => {
    const updated = data.owners.map((owner, i) =>
      i === index ? { ...owner, [field]: value } : owner,
    );
    onChange({ owners: updated });
  };

  const handleAddOwner = () => {
    onChange({
      owners: [...data.owners, { first_name: '', last_name: '', email: '' }],
    });
  };

  const handleRemoveOwner = (index: number) => {
    onChange({
      owners: data.owners.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">בעלי העסק</h1>
        <p className="text-sm text-slate-500 mt-1 mb-8">הוסיפו את כל הבעלים שמחזיקים ב-25% או יותר מהעסק.</p>
      </div>

      {/* Info note */}
      <div className="flex gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
        <span className="text-base leading-none mt-0.5" aria-hidden="true">&#128161;</span>
        <p className="text-[13px] text-slate-600 leading-relaxed">
          נדרש רק אם קיים בעלים נוסף עם 25%+ שאינו הנציג.
        </p>
      </div>

      {/* Owner list */}
      {data.owners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
          <p className="text-[14px] text-slate-500">
            טרם נוספו בעלים. אם אתם הבעלים היחידים, ניתן לדלג על שלב זה.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.owners.map((owner, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[14px] font-semibold text-slate-700">
                  בעלים {index + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => handleRemoveOwner(index)}
                  className="text-[13px] font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  הסרה
                </button>
              </div>

              {/* First name + Last name — 2-column grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>שם פרטי</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="First name"
                    value={owner.first_name}
                    onChange={(e) =>
                      handleOwnerChange(index, 'first_name', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>שם משפחה</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Last name"
                    value={owner.last_name}
                    onChange={(e) =>
                      handleOwnerChange(index, 'last_name', e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>אימייל</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="owner@example.com"
                  value={owner.email}
                  onChange={(e) =>
                    handleOwnerChange(index, 'email', e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add another owner button */}
      <button
        type="button"
        onClick={handleAddOwner}
        className="inline-flex items-center gap-2 text-[14px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-full border border-indigo-300 text-[13px] leading-none">
          +
        </span>
        הוספת בעלים
      </button>
    </div>
  );
};

export default BusinessOwnersStep;
