import React from 'react';
import type { BusinessSetupData } from '../types';

interface StepProps {
  data: BusinessSetupData;
  onChange: (updates: Partial<BusinessSetupData>) => void;
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

/** Render a value or a gray dash when empty */
const Val: React.FC<{ value?: string | null }> = ({ value }) =>
  value ? (
    <span className="text-sm text-slate-800">{value}</span>
  ) : (
    <span className="text-sm text-slate-400 italic">—</span>
  );

/** Mask an account number: show only last 4 digits */
function maskAccount(num: string): string {
  if (!num) return '';
  if (num.length <= 4) return num;
  return '****' + num.slice(-4);
}

/** Format the full business address from its parts */
function formatAddress(data: BusinessSetupData, prefix: 'business_address' | 'rep_address'): string {
  const parts = [
    data[`${prefix}_street` as keyof BusinessSetupData],
    data[`${prefix}_house` as keyof BusinessSetupData],
    data[`${prefix}_apt` as keyof BusinessSetupData]
      ? `דירה ${data[`${prefix}_apt` as keyof BusinessSetupData]}`
      : '',
    data[`${prefix}_city` as keyof BusinessSetupData],
    data[`${prefix}_state` as keyof BusinessSetupData],
    data[`${prefix}_postal` as keyof BusinessSetupData],
    data[`${prefix}_country` as keyof BusinessSetupData],
  ].filter(Boolean);
  return parts.join(', ');
}

/** Map security_method key to display label */
function securityLabel(method: string): string {
  const map: Record<string, string> = {
    passkey: 'מפתח גישה',
    security_key: 'מפתח אבטחה',
    authenticator: 'אפליקציית אימות',
    phone: 'טלפון (SMS)',
  };
  return map[method] || method || '';
}

/* ── Section component ───────────────────────────────────────────────────────── */

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-rounded text-slate-500 text-lg">{icon}</span>
        <h3 className="text-[14px] font-semibold text-slate-800">{title}</h3>
      </div>
      <button
        type="button"
        className="text-[13px] font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
      >
        עריכה
      </button>
    </div>
    {/* Rows */}
    <div className="divide-y divide-slate-100">{children}</div>
  </div>
);

/* ── Row component ───────────────────────────────────────────────────────────── */

interface RowProps {
  label: string;
  children: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ label, children }) => (
  <div className="flex items-start justify-between px-5 py-3">
    <div className="flex-shrink-0 w-[40%]">
      <span className="text-[13px] text-slate-500 block">{label}</span>
    </div>
    <div className="text-right w-[58%]">{children}</div>
  </div>
);

/* ── Main component ──────────────────────────────────────────────────────────── */

const ReviewSubmitStep: React.FC<StepProps> = ({ data }) => {
  const businessAddress = formatAddress(data, 'business_address');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">סקירה ושליחה</h1>
        <p className="text-sm text-slate-500 mt-1">בדקו שכל הפרטים נכונים לפני שליחה.</p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* 1 — Business Type */}
        <Section title="סוג עסק" icon="business">
          <Row label="סוג עסק">
            <Val value={data.business_type} />
          </Row>
          <Row label="מבנה עסקי">
            <Val value={data.business_structure} />
          </Row>
          <Row label="מיקום העסק">
            <Val value={data.business_location} />
          </Row>
        </Section>

        {/* 2 — Tax Details */}
        <Section title="פרטי מס" icon="receipt_long">
          <Row label="מספר עוסק">
            <Val value={data.ein} />
          </Row>
          <Row label="שם משפטי (אנגלית)">
            <Val value={data.legal_name_en} />
          </Row>
          <Row label="שם משפטי (עברית)">
            <Val value={data.legal_name_he} />
          </Row>
        </Section>

        {/* 3 — Business Details */}
        <Section title="פרטי העסק" icon="storefront">
          <Row label="שם מסחרי (אנגלית)">
            <Val value={data.dba_name_en} />
          </Row>
          <Row label="כתובת העסק">
            <Val value={businessAddress} />
          </Row>
        </Section>

        {/* 4 — Business Representative */}
        <Section title="נציג העסק" icon="person">
          <Row label="שם">
            <Val
              value={
                data.rep_first_name || data.rep_last_name
                  ? `${data.rep_first_name} ${data.rep_last_name}`.trim()
                  : ''
              }
            />
          </Row>
          <Row label="דוא״ל">
            <Val value={data.rep_email} />
          </Row>
          <Row label="תפקיד">
            <Val value={data.rep_job_title} />
          </Row>
          <Row label="תאריך לידה">
            <Val value={data.rep_dob} />
          </Row>
        </Section>

        {/* 5 — Business Owners */}
        <Section title="בעלי העסק" icon="group">
          {data.owners.length > 0 ? (
            data.owners.map((owner, idx) => (
              <Row key={idx} label={`בעלים ${idx + 1}`}>
                <Val
                  value={
                    owner.first_name || owner.last_name
                      ? `${owner.first_name} ${owner.last_name}`.trim()
                      : ''
                  }
                />
              </Row>
            ))
          ) : (
            <Row label="בעלים">
              <Val value="" />
            </Row>
          )}
        </Section>

        {/* 6 — Products & Services */}
        <Section title="מוצרים ושירותים" icon="category">
          <Row label="קטגוריית מוצר">
            <Val value={data.product_category} />
          </Row>
        </Section>

        {/* 7 — Bank Account */}
        <Section title="חשבון בנק" icon="account_balance">
          <Row label="בנק">
            <Val value={data.bank_selection} />
          </Row>
          <Row label="מספר סניף">
            <Val value={data.routing_number} />
          </Row>
          <Row label="מספר חשבון">
            <Val value={data.account_number ? maskAccount(data.account_number) : ''} />
          </Row>
        </Section>

        {/* 8 — Public Details */}
        <Section title="פרטים ציבוריים" icon="public">
          <Row label="שם עסק ציבורי">
            <Val value={data.public_business_name} />
          </Row>
          <Row label="תיאור בחיוב">
            <Val value={data.statement_descriptor} />
          </Row>
        </Section>

        {/* 9 — Documents */}
        <Section title="מסמכים" icon="upload_file">
          <Row label="תעודה מזהה">
            <Val value={data.doc_government_id?.name} />
          </Row>
          <Row label="מורשי חתימה">
            <Val value={data.doc_signatories?.name} />
          </Row>
          <Row label="אישור בנק">
            <Val value={data.doc_bank_confirmation?.name} />
          </Row>
          <Row label="רישיון עסק">
            <Val value={data.doc_business_registration?.name} />
          </Row>
          <Row label="זכויות יוצרים / סימן מסחרי">
            <Val value={data.doc_copyright?.name} />
          </Row>
        </Section>

        {/* 10 — Security */}
        <Section title="אבטחה" icon="shield">
          <Row label="שיטת אימות דו-שלבי">
            {data.security_method ? (
              <span className="text-sm text-slate-800">{securityLabel(data.security_method)}</span>
            ) : (
              <span className="text-sm text-slate-400 italic">—</span>
            )}
          </Row>
        </Section>
      </div>
    </div>
  );
};

export default ReviewSubmitStep;
