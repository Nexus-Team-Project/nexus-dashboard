/**
 * The scrollable left panel shared by the voucher-import steps (upload / map /
 * match). Centralizes scrollbar placement: it must sit on the RIGHT in Hebrew and
 * on the LEFT in English. Browsers put the vertical scrollbar on the side opposite
 * the reading direction, so we set the scroll box's `dir` to the OPPOSITE of the
 * language (he -> ltr -> scrollbar right; en -> rtl -> scrollbar left) and restore
 * the real content direction on an inner `display:contents` wrapper.
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
      dir={isHe ? 'ltr' : 'rtl'}
      className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar', className)}
    >
      {/* Real inner box (not display:contents) carries the padding, flex layout, and
          the true content direction; the outer box only owns the scroll + scrollbar side. */}
      <div dir={isHe ? 'rtl' : 'ltr'} className="p-8 lg:p-12 flex flex-col min-h-full">
        {children}
      </div>
    </div>
  );
}
