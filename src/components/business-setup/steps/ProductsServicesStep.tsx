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

const CATEGORIES = [
  'Retail',
  'Digital goods',
  'Food & beverage',
  'Professional services',
  'Membership & subscriptions',
  'Other',
] as const;

const CATEGORIES_HE: Record<string, string> = {
  Retail: 'קמעונאות',
  'Digital goods': 'מוצרים דיגיטליים',
  'Food & beverage': 'מזון ומשקאות',
  'Professional services': 'שירותים מקצועיים',
  'Membership & subscriptions': 'מנויים ומינויים',
  Other: 'אחר',
};

const PRODUCT_SOURCES = [
  'Own production',
  'Import',
  'Local supplier',
  'Online',
] as const;

const PRODUCT_SOURCES_HE: Record<string, string> = {
  'Own production': 'ייצור עצמי',
  Import: 'ייבוא',
  'Local supplier': 'ספק מקומי',
  Online: 'מקוון',
};

const SALES_METHODS = [
  'Online',
  'Payment requests',
  'Physical branch',
] as const;

const SALES_METHODS_HE: Record<string, string> = {
  Online: 'מקוון',
  'Payment requests': 'בקשות תשלום',
  'Physical branch': 'סניף פיזי',
};

const CUSTOMER_TYPES = [
  'Local private',
  'International private',
  'Local business',
  'International business',
] as const;

const CUSTOMER_TYPES_HE: Record<string, string> = {
  'Local private': 'פרטי מקומי',
  'International private': 'פרטי בינלאומי',
  'Local business': 'עסקי מקומי',
  'International business': 'עסקי בינלאומי',
};

const TOURIST_VOLUMES = [
  '0\u201325%',
  '25\u201350%',
  '50\u2013100%',
  'No tourist processing',
] as const;

const TOURIST_VOLUMES_HE: Record<string, string> = {
  '0\u201325%': '0\u201325%',
  '25\u201350%': '25\u201350%',
  '50\u2013100%': '50\u2013100%',
  'No tourist processing': 'ללא עיבוד תיירים',
};

const ProductsServicesStep: React.FC<StepProps> = ({ data, onChange }) => {
  const handleCustomerTypeToggle = (type: string) => {
    const current = data.customer_type ?? [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange({ customer_type: updated });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">מוצרים, שירותים ותאימות</h1>
        <p className="text-sm text-slate-500 mt-1">ספרו לנו על מה שאתם מוכרים כדי שנוכל להפעיל את תכונות התשלום המתאימות.</p>
      </div>

      {/* Note card */}
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <p className="text-[13px] text-indigo-800 leading-relaxed">
          <span className="mr-1.5">&#128161;</span>
          שדות KYC ומוצרים נדרשים מספקים בלבד — שוכר רגיל לא צריך לענות עליהם.
        </p>
      </div>

      {/* Category */}
      <div>
        <label className={labelClass}>קטגוריית מוצר</label>
        <select
          className={inputClass}
          value={data.product_category}
          onChange={(e) => onChange({ product_category: e.target.value })}
        >
          <option value="">בחרו קטגוריה</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORIES_HE[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* PayMe: What products/services are offered? */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          מוצרים/שירותים מוצעים
        </label>
        <textarea
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="תארו את המוצרים או השירותים שהעסק מציע..."
          minLength={30}
          value={data.products_offered}
          onChange={(e) => onChange({ products_offered: e.target.value })}
        />
        {data.products_offered.length > 0 && data.products_offered.length < 30 && (
          <p className="text-[12px] text-amber-600 mt-1">
            נדרשים לפחות 30 תווים ({data.products_offered.length}/30)
          </p>
        )}
      </div>

      {/* PayMe: What transaction types will be processed? */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          סוגי עסקאות
        </label>
        <textarea
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="תארו את סוגי העסקאות שאתם מצפים לעבד..."
          minLength={30}
          value={data.transaction_types}
          onChange={(e) => onChange({ transaction_types: e.target.value })}
        />
        {data.transaction_types.length > 0 && data.transaction_types.length < 30 && (
          <p className="text-[12px] text-amber-600 mt-1">
            נדרשים לפחות 30 תווים ({data.transaction_types.length}/30)
          </p>
        )}
      </div>

      {/* PayMe: Source of products/services? */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          מקור מוצרים
        </label>
        <select
          className={inputClass}
          value={data.product_source}
          onChange={(e) => onChange({ product_source: e.target.value })}
        >
          <option value="">בחרו מקור</option>
          {PRODUCT_SOURCES.map((src) => (
            <option key={src} value={src}>
              {PRODUCT_SOURCES_HE[src]}
            </option>
          ))}
        </select>
      </div>

      {/* PayMe: How is the product/service sold? */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          שיטת מכירה
        </label>
        <select
          className={inputClass}
          value={data.sales_method}
          onChange={(e) => onChange({ sales_method: e.target.value })}
        >
          <option value="">בחרו שיטה</option>
          {SALES_METHODS.map((method) => (
            <option key={method} value={method}>
              {SALES_METHODS_HE[method]}
            </option>
          ))}
        </select>
      </div>

      {/* PayMe: Customer type — multi-select checkboxes */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          סוג לקוח
        </label>
        <div className="space-y-3 mt-2">
          {CUSTOMER_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                checked={data.customer_type?.includes(type) ?? false}
                onChange={() => handleCustomerTypeToggle(type)}
              />
              <span className="text-[14px] text-slate-700">{CUSTOMER_TYPES_HE[type]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* PayMe: Expected tourist card volume */}
      <div>
        <label className={labelClass}>
          <PayMeBadge />
          היקף כרטיסי תיירים
        </label>
        <select
          className={inputClass}
          value={data.tourist_card_volume}
          onChange={(e) => onChange({ tourist_card_volume: e.target.value })}
        >
          <option value="">בחרו טווח</option>
          {TOURIST_VOLUMES.map((vol) => (
            <option key={vol} value={vol}>
              {TOURIST_VOLUMES_HE[vol]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProductsServicesStep;
