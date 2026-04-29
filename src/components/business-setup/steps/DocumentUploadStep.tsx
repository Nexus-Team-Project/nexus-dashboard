import React, { useRef } from 'react';
import type { BusinessSetupData } from '../types';

interface StepProps {
  data: BusinessSetupData;
  onChange: (updates: Partial<BusinessSetupData>) => void;
}

const PayMeBadge = () => (
  <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full mr-2">
    ⬅ PayMe
  </span>
);

interface UploadField {
  key: keyof Pick<
    BusinessSetupData,
    'doc_government_id' | 'doc_signatories' | 'doc_bank_confirmation' | 'doc_business_registration' | 'doc_copyright'
  >;
  label: string;
  required: boolean;
}

const UPLOAD_FIELDS: UploadField[] = [
  { key: 'doc_government_id', label: 'תעודה מזהה (צילום)', required: true },
  { key: 'doc_signatories', label: 'מורשי חתימה', required: true },
  { key: 'doc_bank_confirmation', label: 'אישור בנק', required: true },
  { key: 'doc_business_registration', label: 'רישיון עסק', required: true },
  { key: 'doc_copyright', label: 'זכויות יוצרים / סימן מסחרי', required: false },
];

interface UploadZoneProps {
  field: UploadField;
  file: File | null;
  onSelect: (file: File | null) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ field, file, onSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    onSelect(selected);
    // Reset the input so the same file can be re-selected if removed
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files?.[0] ?? null;
    onSelect(dropped);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-slate-700">
        <span className="flex items-center">
          <PayMeBadge />
          {field.label}
          {field.required ? (
            <span className="text-red-400 ml-0.5">*</span>
          ) : (
            <span className="text-slate-400 text-[12px] ml-1.5">(אופציונלי)</span>
          )}
        </span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleChange}
      />

      {file ? (
        <div className="flex items-center justify-between border border-indigo-200 bg-indigo-50/40 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-rounded text-indigo-500 text-xl flex-shrink-0">
              description
            </span>
            <span className="text-sm text-slate-700 truncate">{file.name}</span>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {(file.size / 1024).toFixed(1)} KB
            </span>
            <span className="text-[10px] text-emerald-600 font-medium flex-shrink-0">
              הועלה
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="flex-shrink-0 ml-3 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
            title="הסרה"
          >
            <span className="material-symbols-rounded text-lg">close</span>
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer"
        >
          <span className="material-symbols-rounded text-slate-400 text-3xl mb-2 block">
            upload_file
          </span>
          <p className="text-sm text-slate-500">גררו לכאן או לחצו להעלאה</p>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF עד 10MB</p>
        </div>
      )}
    </div>
  );
};

const DocumentUploadStep: React.FC<StepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">העלאת מסמכים</h1>
        <p className="text-sm text-slate-500 mt-1">מסמכים אלו נדרשים לאימות הזהות והעסק שלכם.</p>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <span className="text-base leading-none mt-0.5">💡</span>
        <div>
          <p className="text-[13px] text-amber-800">
            העלו עותקים ברורים וקריאים של כל מסמך. פורמטים נתמכים: JPG, PNG, PDF.
          </p>
        </div>
      </div>

      {/* Upload fields */}
      <div className="space-y-6">
        {UPLOAD_FIELDS.map((field) => (
          <UploadZone
            key={field.key}
            field={field}
            file={data[field.key]}
            onSelect={(file) => onChange({ [field.key]: file })}
          />
        ))}
      </div>
    </div>
  );
};

export default DocumentUploadStep;
