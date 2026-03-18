import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  submenu?: { to: string; icon: string; label: string }[];
  isSectionHeader?: boolean;
  moreButton?: boolean;
}

const Sidebar = ({ onLogout, state, onStateChange }: SidebarProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['products']);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const [showMoreProducts, setShowMoreProducts] = useState(false);

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

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
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

  // Main navigation items (before Products section)
  const mainNavItems: NavItem[] = [
    { to: '/', icon: 'home', label: t('dashboard') },
    { to: '/users', icon: 'people_alt', label: t('users') },
{ to: '/transactions', icon: 'receipt_long', label: t('transactions') },
    { to: '/product-catalog', icon: 'inventory_2', label: t('productCatalog') },
    { to: '/balances', icon: 'account_balance_wallet', label: t('balances') },
  ];

  // Products section items
  const productItems: { to: string; icon: string; label: string }[] = [
    { to: '/benefits-partnerships', icon: 'local_offer', label: t('benefitsPartnerships') },
    { to: '/points-gifts', icon: 'card_giftcard', label: t('gifts') },
    { to: '/payments', icon: 'payment', label: t('payments') },
    { to: '/charges', icon: 'request_quote', label: t('charges') },
  ];

  // Extra products shown when "More" is clicked
  const moreProductItems: { to: string; icon: string; label: string }[] = [
    { to: '/content', icon: 'article', label: t('content') },
    { to: '/reports', icon: 'assessment', label: 'דוחות' },
    { to: '/marketing', icon: 'campaign', label: t('marketing') },
    { to: '/updates', icon: 'sync', label: 'עדכונים' },
  ];

  // Marketing sub-items (nested under שיווק in moreProductItems)
  const marketingSubItems = [
    { to: '/marketing/sms', icon: 'sms', label: 'SMS' },
    { to: '/marketing/email', icon: 'mail', label: t('emailCampaigns') },
    { to: '/marketing/push', icon: 'notifications_active', label: t('pushCampaigns') },
  ];

  // Bottom navigation items
  const bottomNavItems: NavItem[] = [
    {
      icon: 'code',
      label: t('developerTools'),
      submenu: [{ to: '/api-docs', icon: 'description', label: t('apiDocumentation') }],
    },
  ];

  const isOpen = state === 'open';
  const isCollapsed = state === 'collapsed';
  const isClosed = state === 'closed';

  const cycleState = () => {
    if (isOpen) onStateChange('collapsed');
    else if (isCollapsed) onStateChange('closed');
    else onStateChange('open');
  };

  const getToggleIcon = () => {
    if (isOpen) return 'chevron_left';
    if (isCollapsed) return 'close';
    return 'menu';
  };

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
        <span className="material-symbols-rounded text-[18px]">menu</span>
      </button>
    );
  }

  const renderNavLink = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to!}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 ${
          isCollapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-blue-50 text-primary font-medium'
            : 'text-[#676879] hover:bg-slate-200'
        }`
      }
      end={item.to === '/'}
      title={isCollapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          <span className={`material-symbols-rounded !text-[18px] ${isActive ? 'text-primary' : ''}`}>
            {item.icon}
          </span>
          {isOpen && <span className="text-[13px]">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  const renderSubmenu = (item: NavItem) => (
    <div key={item.label}>
      <button
        onClick={() => toggleSubmenu(item.label)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-[#676879] hover:bg-slate-200 ${
          isCollapsed ? 'justify-center' : ''
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="material-symbols-rounded !text-[18px]">{item.icon}</span>
        {isOpen && (
          <>
            <span className="text-[13px] flex-1 text-start">{item.label}</span>
            <span
              className={`material-symbols-rounded !text-sm transition-transform ${
                expandedMenus.includes(item.label) ? 'rotate-90' : ''
              }`}
            >
              chevron_right
            </span>
          </>
        )}
      </button>
      {isOpen && expandedMenus.includes(item.label) && item.submenu && (
        <div className="ms-9 mt-0.5 space-y-0.5">
          {item.submenu.map((subItem) => (
            <NavLink
              key={subItem.to}
              to={subItem.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-150 text-[13px] ${
                  isActive
                    ? 'bg-blue-50 text-primary font-medium'
                    : 'text-[#676879] hover:bg-slate-200'
                }`
              }
            >
              {subItem.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );

  const isProductsExpanded = expandedMenus.includes('products');

  return (
    <aside
      style={isOpen ? { width: `${sidebarWidth}px` } : undefined}
      className={`bg-[#e8eef6] dark:bg-background-dark min-h-[calc(100vh-48px)] sticky top-[48px] flex flex-col shrink-0 z-40 relative group/sidebar rounded-tr-xl ${
        isOpen ? '' : 'w-16 transition-all duration-300'
      } ${isResizing ? '' : 'transition-all duration-300'}`}
    >
      {/* Resize Handle */}
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

      {/* Toggle Button */}
      <button
        onClick={cycleState}
        className="absolute -end-3 top-6 w-6 h-6 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all z-10 opacity-0 group-hover/sidebar:opacity-100"
        title={getToggleTooltip()}
      >
        <span className="material-symbols-rounded !text-sm">{getToggleIcon()}</span>
      </button>

      {/* Project Switcher - Open State */}
      <div className={`px-3 py-3 border-b border-slate-200 ${isOpen ? 'block' : 'hidden'}`}>
        <ProjectSwitcher />
      </div>

      {/* Project Icon - Collapsed State */}
      {isCollapsed && (
        <div className="p-3 border-b border-slate-200 flex justify-center">
          <button className="w-8 h-8 bg-slate-200/60 rounded flex items-center justify-center text-primary hover:bg-slate-300/60 transition-colors" title="פרויקטים">
            <span className="material-symbols-rounded !text-[18px]">web</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {/* Main nav items */}
        {mainNavItems.map((item) => renderNavLink(item))}

        {/* Separator + Products Section */}
        <div className="pt-3 mt-3 border-t border-slate-200">
          <button
            onClick={() => toggleSubmenu('products')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-[#676879] hover:bg-slate-200 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? t('products') : undefined}
          >
            <span className="material-symbols-rounded !text-[18px]">widgets</span>
            {isOpen && (
              <>
                <span className="text-[13px] flex-1 text-start font-semibold text-[#323338]">{t('products')}</span>
                <span
                  className={`material-symbols-rounded !text-sm transition-transform ${
                    isProductsExpanded ? 'rotate-90' : ''
                  }`}
                >
                  chevron_right
                </span>
              </>
            )}
          </button>

          {/* Product sub-items */}
          {isOpen && isProductsExpanded && (
            <div className="ms-4 mt-0.5 space-y-0.5">
              {productItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150 text-[13px] ${
                      isActive
                        ? 'bg-blue-50 text-primary font-medium'
                        : 'text-[#676879] hover:bg-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`material-symbols-rounded !text-[16px] ${isActive ? 'text-primary' : 'text-[#676879]'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              {/* More products */}
              {showMoreProducts && moreProductItems.map((item) => (
                item.to === '/marketing' ? (
                  <div key={item.to}>
                    <button
                      onClick={() => toggleSubmenu('marketing')}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150 text-[13px] text-[#676879] hover:bg-slate-200"
                    >
                      <span className="material-symbols-rounded !text-[16px]">{item.icon}</span>
                      <span className="flex-1 text-start">{item.label}</span>
                      <span className={`material-symbols-rounded !text-sm transition-transform ${expandedMenus.includes('marketing') ? 'rotate-90' : ''}`}>
                        chevron_right
                      </span>
                    </button>
                    {expandedMenus.includes('marketing') && (
                      <div className="ms-6 mt-0.5 space-y-0.5">
                        {marketingSubItems.map((sub) => (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150 text-[13px] ${
                                isActive
                                  ? 'bg-blue-50 text-primary font-medium'
                                  : 'text-[#676879] hover:bg-slate-200'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span className={`material-symbols-rounded !text-[16px] ${isActive ? 'text-primary' : 'text-[#676879]'}`}>
                                  {sub.icon}
                                </span>
                                <span>{sub.label}</span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150 text-[13px] ${
                        isActive
                          ? 'bg-blue-50 text-primary font-medium'
                          : 'text-[#676879] hover:bg-slate-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`material-symbols-rounded !text-[16px] ${isActive ? 'text-primary' : 'text-[#676879]'}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              ))}

              {/* More button */}
              <button
                onClick={() => setShowMoreProducts(!showMoreProducts)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150 text-[13px] text-[#676879] hover:bg-slate-200 w-full"
              >
                <span className="material-symbols-rounded !text-[16px]">more_horiz</span>
                <span>{showMoreProducts ? '' : t('more')}</span>
              </button>
            </div>
          )}

          {/* Collapsed products icon */}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-1 mt-1">
              {productItems.slice(0, 3).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `w-8 h-8 rounded-md flex items-center justify-center transition-all duration-150 ${
                      isActive ? 'bg-blue-50 text-primary' : 'text-[#676879] hover:bg-slate-200'
                    }`
                  }
                  title={item.label}
                >
                  <span className="material-symbols-rounded !text-[16px]">{item.icon}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Separator + Bottom nav items */}
        <div className="pt-3 mt-3 border-t border-slate-200">
          {bottomNavItems.map((item) =>
            item.submenu ? renderSubmenu(item) : renderNavLink(item)
          )}
        </div>
      </nav>

      {/* Upgrade Banner */}
      {isOpen && (
        <div className="px-3 pb-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-rounded !text-[14px] text-primary">diamond</span>
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
            <span className="material-symbols-rounded !text-[14px] text-primary">diamond</span>
          </button>
        </div>
      )}

      {/* User Info & Logout */}
      <div className="p-3 border-t border-slate-200">
        <div className={`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-200 cursor-pointer transition-colors mb-1 ${isCollapsed ? 'justify-center' : ''}`}>
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
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-200 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? t('logout') : t('logout')}
        >
          <span className="material-symbols-rounded !text-[18px]">logout</span>
          {isOpen && <span className="text-[13px]">{t('logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
