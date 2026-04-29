import type { ReactNode } from 'react';

interface SetupFormLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function SetupFormLayout({ title, subtitle, children }: SetupFormLayoutProps) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-8" dir="rtl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1.5">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
