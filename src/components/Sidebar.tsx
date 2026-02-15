import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import ProjectSwitcher from './ProjectSwitcher';

export type SidebarState = 'open' | 'collapsed' | 'closed';

interface SidebarProps {
  onLogout: () => void;
  state: SidebarState;
  onStateChange: (state: SidebarState) => void;
}

interface NavItem {
  to?: string;
  icon: string;
  label: string;
  submenu?: { to: string; label: string }[];
}

const Sidebar = ({ onLogout, state, onStateChange }: SidebarProps) => {
  const { t } = useLanguage();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 64 * 4 = 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle resize - bar is now on the right side
  useEffect(() => {
    if (!isResizing) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return; // Skip if animation frame is already scheduled

      rafId = requestAnimationFrame(() => {
        // Calculate width from the right edge
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 200 && newWidth <= 500) {
          setSidebarWidth(newWidth);
        }
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isResizing]);

  const navItems: NavItem[] = [
    { to: '/', icon: 'dashboard', label: t('dashboard') },
    { to: '/users', icon: 'people_alt', label: t('users') },
    { to: '/points-gifts', icon: 'card_giftcard', label: 'נקודות ומתנות' },
    { to: '/benefits-partnerships', icon: 'local_offer', label: 'הטבות ושיתופי פעולה' },
    { to: '/content', icon: 'article', label: t('content') },
    { to: '/reports', icon: 'assessment', label: 'דוחות' },
    { to: '/marketing', icon: 'campaign', label: 'שיווק' },

    { to: '/updates', icon: 'sync', label: 'עדכונים' },
    { to: '/chat', icon: 'chat', label: "צ'אט" },
    {
      icon: 'code',
      label: t('developerTools'),
      submenu: [{ to: '/api-docs', label: t('apiDocumentation') }],
    },
    { to: '/settings', icon: 'settings', label: t('settings') },
  ];

  const isOpen = state === 'open';
  const isCollapsed = state === 'collapsed';
  const isClosed = state === 'closed';

  // Cycle through states: open -> collapsed -> closed -> open
  const cycleState = () => {
    if (isOpen) onStateChange('collapsed');
    else if (isCollapsed) onStateChange('closed');
    else onStateChange('open');
  };

  // Get next state icon
  const getToggleIcon = () => {
    if (isOpen) return 'chevron_left';
    if (isCollapsed) return 'close';
    return 'menu';
  };

  // Get tooltip text
  const getToggleTooltip = () => {
    if (isOpen) return 'כווץ תפריט';
    if (isCollapsed) return 'סגור תפריט';
    return 'פתח תפריט';
  };

  if (isClosed) {
    return (
      <button
        onClick={() => onStateChange('open')}
        className="fixed top-20 right-4 z-50 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
        title="פתח תפריט"
      >
        <span className="material-icons text-[18px]">menu</span>
      </button>
    );
  }

  return (
    <aside
      style={isOpen ? { width: `${sidebarWidth}px` } : undefined}
      className={`bg-white border-s border-[#e1e4e8] min-h-[calc(100vh-73px)] sticky top-[73px] flex flex-col shrink-0 z-40 relative group/sidebar ${
        isOpen ? '' : 'w-16 transition-all duration-300'
      } ${isResizing ? '' : 'transition-all duration-300'}`}
    >
      {/* Resize Handle - Blue bar on right edge for dragging */}
      {isOpen && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 end-0 w-3 h-full cursor-ew-resize z-20 group translate-x-1"
        >
          <div className={`absolute end-0 top-0 h-full transition-all duration-150 ease-out ${
            isResizing
              ? 'bg-[#0073ea] w-0.5 shadow-lg shadow-primary/50'
              : 'bg-transparent w-0 group-hover:bg-[#0073ea] group-hover:w-0.5 group-hover:shadow-md group-hover:shadow-primary/30'
          }`} />
        </div>
      )}

      {/* Toggle Button - Shows only on hover */}
      <button
        onClick={cycleState}
        className="absolute -end-3 top-6 w-6 h-6 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all z-10 opacity-0 group-hover/sidebar:opacity-100"
        title={getToggleTooltip()}
      >
        <span className="material-icons !text-sm">{getToggleIcon()}</span>
      </button>

      {/* Project Switcher - Open State */}
      <div className={`px-3 py-3 border-b border-slate-200 ${isOpen ? 'block' : 'hidden'}`}>
        <ProjectSwitcher />
      </div>

      {/* Project Icon - Collapsed State */}
      {isCollapsed && (
        <div className="p-3 border-b border-slate-200 flex justify-center">
          <button className="w-8 h-8 bg-slate-200/60 rounded flex items-center justify-center text-primary hover:bg-slate-300/60 transition-colors">
            <span className="material-icons !text-[18px]">web</span>
          </button>
        </div>
      )}

      {/* Navigation - Monday.com style */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) =>
          item.submenu ? (
            <div key={item.label}>
              <button
                onClick={() => toggleSubmenu(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-[#676879] hover:bg-slate-200/50 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="material-icons !text-[18px]">{item.icon}</span>
                {isOpen && (
                  <>
                    <span className="text-[13px] flex-1 text-start">{item.label}</span>
                    <span
                      className={`material-icons !text-sm transition-transform ${
                        expandedMenus.includes(item.label) ? 'rotate-90' : ''
                      }`}
                    >
                      chevron_right
                    </span>
                  </>
                )}
              </button>
              {isOpen && expandedMenus.includes(item.label) && (
                <div className="ms-9 mt-0.5 space-y-0.5">
                  {item.submenu.map((subItem) => (
                    <NavLink
                      key={subItem.to}
                      to={subItem.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-[13px] ${
                          isActive
                            ? 'bg-slate-200/60 text-[#323338] font-medium'
                            : 'text-[#676879] hover:bg-slate-200/50'
                        }`
                      }
                    >
                      {subItem.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to!}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-slate-200/60 text-[#323338]'
                    : 'text-[#676879] hover:bg-slate-200/50'
                }`
              }
              end={item.to === '/'}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="material-icons !text-[18px]">{item.icon}</span>
              {isOpen && <span className="text-[13px]">{item.label}</span>}
            </NavLink>
          )
        )}
      </nav>

      {/* Upgrade Banner - Monday.com style */}
      {isOpen && (
        <div className="px-3 pb-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons !text-[14px] text-primary">diamond</span>
              <span className="text-primary text-[11px] font-semibold">Upgrade</span>
            </div>
            <p className="text-[11px] text-slate-600 mb-2 leading-tight">שדרג לפרימיום וקבל גישה לכל התכונות</p>
            <button className="w-full py-1.5 bg-primary hover:bg-primary/90 text-white text-[11px] font-semibold rounded transition-colors">
              שדרג עכשיו
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Upgrade Icon */}
      {isCollapsed && (
        <div className="p-3 flex justify-center">
          <button
            className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm"
            title="שדרג לפרימיום"
          >
            <span className="material-icons !text-[14px] text-primary">diamond</span>
          </button>
        </div>
      )}

      {/* User Info & Logout - Monday.com style */}
      <div className="p-3 border-t border-slate-200">
        <div className={`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-200/50 cursor-pointer transition-colors mb-1 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
            ד
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate text-[#323338]">דניאל רביב</p>
              <p className="text-[11px] text-[#676879] truncate">daniel@nexus.com</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-200/50 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? t('logout') : undefined}
        >
          <span className="material-icons !text-[18px]">logout</span>
          {isOpen && <span className="text-[13px]">{t('logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
