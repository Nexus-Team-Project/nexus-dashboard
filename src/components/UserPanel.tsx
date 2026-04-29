import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface UserPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

const UserPanel = ({ isOpen, onClose, onLogout, anchorRef }: UserPanelProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const PANEL_WIDTH = 260;
  const PANEL_HEIGHT = 220;

  const getPosition = useCallback(() => {
    if (!anchorRef?.current) return { top: 0, left: 0 };
    const rect = anchorRef.current.getBoundingClientRect();
    const margin = 8;

    // Open above the button
    let top = rect.top - PANEL_HEIGHT - margin;
    if (top < margin) top = rect.bottom + margin;

    let left = rect.left;
    if (left + PANEL_WIDTH > window.innerWidth - margin) {
      left = window.innerWidth - PANEL_WIDTH - margin;
    }
    if (left < margin) left = margin;

    return { top, left };
  }, [anchorRef]);

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

  const pos = getPosition();

  const menuItems = [
    { icon: 'manage_accounts', label: t('up_accountSettings'), action: () => { navigate('/settings'); onClose(); } },
    { icon: 'notifications', label: t('notifications'), action: () => { navigate('/settings'); onClose(); } },
    { icon: 'language', label: t('language'), action: () => { navigate('/settings'); onClose(); } },
  ];

  return (
    <div
      ref={panelRef}
      className="fixed bg-white dark:bg-card-dark rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 z-[60] animate-in zoom-in overflow-hidden"
      style={{ top: pos.top, left: pos.left, width: PANEL_WIDTH }}
    >
      {/* User info */}
      <div className="p-4 flex items-center gap-3 bg-gradient-to-b from-violet-50 to-white">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-violet-400 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {t('headerUserInitial')}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 truncate">{t('headerUserName')}</p>
          <p className="text-[11px] text-slate-500 truncate">{t('up_userEmail')}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Menu items */}
      <div className="py-1">
        {menuItems.map((item) => (
          <button
            key={item.icon}
            onClick={item.action}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-rounded !text-[16px] text-slate-400">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Logout */}
      <div className="py-1">
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
        >
          <span className="material-symbols-rounded !text-[16px]">logout</span>
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default UserPanel;
