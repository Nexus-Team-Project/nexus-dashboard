/**
 * The scrollable left panel shared by the voucher-import steps (upload / map /
 * match). Centralizes one RTL detail: the vertical scrollbar must sit on the
 * RIGHT in Hebrew. Browsers place the scrollbar on the side opposite the reading
 * direction, so an RTL panel would scroll on the left. We force the scroll box to
 * `ltr` (scrollbar on the right) and restore `rtl` on an inner `display:contents`
 * wrapper so the content itself stays right-aligned. In English nothing changes.
 */
import type { ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';

interface ImportScrollPanelProps {
  children: ReactNode;
  className?: string;
}

export default function ImportScrollPanel({ children, className }: ImportScrollPanelProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  return (
    <div
      dir={isHe ? 'ltr' : undefined}
      className={cn('flex-1 p-8 lg:p-12 flex flex-col overflow-y-auto custom-scrollbar', className)}
    >
      {/* display:contents keeps the flex layout intact while restoring RTL content flow */}
      <div className="contents" dir={isHe ? 'rtl' : undefined}>
        {children}
      </div>
    </div>
  );
}
