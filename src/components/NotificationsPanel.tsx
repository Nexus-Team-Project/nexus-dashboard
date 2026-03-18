import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

const NotificationsPanel = ({ isOpen, onClose, anchorRef }: NotificationsPanelProps) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position based on anchor button
  const updatePosition = useCallback(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const panelWidth = 380;
    const margin = 8;

    let left = rect.left;
    // Keep within viewport horizontally
    if (left + panelWidth > window.innerWidth - margin) {
      left = window.innerWidth - panelWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }

    setPosition({
      top: rect.bottom + 8,
      left,
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef?.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bg-white dark:bg-card-dark rounded-xl shadow-lg w-[380px] border border-gray-100 dark:border-slate-700 overflow-y-auto z-[60] animate-in zoom-in"
      style={{ top: position.top, left: position.left, maxHeight: window.innerHeight - position.top - 8 }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('notificationsTitle')}
        </h2>
        <button
          className="px-3 py-1.5 border-2 border-sky-100 dark:border-sky-900 rounded-lg text-sm font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
        >
          {t('viewPreferences')}
        </button>
      </div>

      {/* Tabs */}
      <nav className="px-4 mb-2 flex gap-2">
        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-center transition-colors ${
            activeTab === 'unread'
              ? 'border-2 border-[#635bff] text-[#635bff]'
              : 'border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          {t('unread')}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-center transition-colors ${
            activeTab === 'all'
              ? 'border-2 border-[#635bff] text-[#635bff]'
              : 'border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          {t('all')}
        </button>
      </nav>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            {t('allUpToDate')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('noNewNotifications')}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 flex justify-end">
        <button className="text-sm font-semibold text-[#635bff] hover:underline">
          {t('viewAll')}
        </button>
      </div>
    </div>
  );
};

export default NotificationsPanel;
