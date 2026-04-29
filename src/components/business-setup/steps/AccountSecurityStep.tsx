import React from 'react';
import type { BusinessSetupData } from '../types';

interface StepProps {
  data: BusinessSetupData;
  onChange: (updates: Partial<BusinessSetupData>) => void;
}

interface SecurityMethod {
  value: string;
  icon: string;
  title: string;
  description: string;
  warning?: string;
  recommended?: boolean;
}

const SECURITY_METHODS: SecurityMethod[] = [
  {
    value: 'passkey',
    icon: 'passkey',
    title: 'מפתח גישה',
    description: 'האפשרות הבטוחה ביותר. השתמשו בזיהוי ביומטרי של המכשיר.',
    recommended: true,
  },
  {
    value: 'security_key',
    icon: 'key',
    title: 'מפתח אבטחה',
    description: 'השתמשו במפתח אבטחה פיזי לאימות.',
  },
  {
    value: 'authenticator',
    icon: 'smartphone',
    title: 'אפליקציית אימות',
    description: 'השתמשו באפליקציה כמו Google Authenticator או Authy.',
  },
  {
    value: 'phone',
    icon: 'phone',
    title: 'טלפון (SMS)',
    description: 'קבלו קודים באמצעות SMS.',
    warning: 'פחות מאובטח',
  },
];

const AccountSecurityStep: React.FC<StepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">אבטחת החשבון</h1>
        <p className="text-sm text-slate-500 mt-1">הוסיפו שכבת אבטחה נוספת לחשבון שלכם.</p>
      </div>

      {/* Security method cards */}
      <div className="space-y-3">
        {SECURITY_METHODS.map((method) => {
          const isSelected = data.security_method === method.value;

          return (
            <button
              key={method.value}
              type="button"
              onClick={() => onChange({ security_method: method.value })}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 ${
                  isSelected
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span className="material-symbols-rounded text-2xl">{method.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[14px] font-semibold ${
                      isSelected ? 'text-indigo-900' : 'text-slate-800'
                    }`}
                  >
                    {method.title}
                  </span>
                  {method.recommended && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                      מומלץ
                    </span>
                  )}
                  {method.warning && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      {method.warning}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-slate-500 mt-0.5">{method.description}</p>
              </div>

              {/* Selection indicator */}
              <div className="flex-shrink-0">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && (
                    <span className="material-symbols-rounded text-white text-sm">check</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AccountSecurityStep;
