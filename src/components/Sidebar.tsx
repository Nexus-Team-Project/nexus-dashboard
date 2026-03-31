import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useRecentPages, PAGE_META } from '../hooks/useRecentPages';
import { useDevMode } from '../contexts/DevModeContext';

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
  const [shortcutsExpanded, setShortcutsExpanded] = useState(false);
  const { recentPages, togglePin } = useRecentPages();
  const { isDevMode, toggleDevMode } = useDevMode();

  const DEFAULT_SHORTCUTS_COUNT = 5;
  const visibleShortcuts = shortcutsExpanded
    ? recentPages
    : recentPages.slice(0, DEFAULT_SHORTCUTS_COUNT);

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
        className="fixed top-[56px] right-[20px] z-50 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
        title="פתח תפריט"
      >
        <span className="material-symbols-rounded !text-sm">menu</span>
      </button>
    );
  }

  const renderNavLink = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to!}
      className={({ isActive }) =>
        `flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 ${
          isCollapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'hover:bg-violet-50 text-primary font-medium'
            : 'text-[#676879] hover:bg-slate-200'
        }`
      }
      end={item.to === '/'}
      title={isCollapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          <span className={`material-symbols-rounded !text-[16px] ${isActive ? 'text-primary' : ''}`}>
            {item.icon}
          </span>
          {isOpen && <span className="text-[13px] flex-1 truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  const renderSubmenu = (item: NavItem) => (
    <div key={item.label}>
      <button
        onClick={() => toggleSubmenu(item.label)}
        className={`w-full flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 text-[#676879] hover:bg-slate-200 ${
          isCollapsed ? 'justify-center' : ''
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="material-symbols-rounded !text-[16px]">{item.icon}</span>
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
                    ? 'hover:bg-violet-50 text-primary font-medium'
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
      className={`bg-gradient-to-b from-[#fdfeff] to-[#edf1fc] dark:bg-background-dark h-[calc(100vh-48px)] sticky top-[48px] flex flex-col shrink-0 z-40 relative group/sidebar border-e border-slate-200 rounded-tr-xl rounded-br-xl ${
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
        className="!absolute top-6 w-6 h-6 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all z-10 opacity-0 group-hover/sidebar:opacity-100"
        style={{ left: '-12px' }}
        title={getToggleTooltip()}
      >
        <span className="material-symbols-rounded !text-sm">{getToggleIcon()}</span>
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {/* Main nav items */}
        {mainNavItems.map((item) => renderNavLink(item))}

        {/* Shortcuts Section */}
        {recentPages.length > 0 && (
          <div className="pt-4 mt-3">
            {isOpen && (
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[11px] font-semibold text-[#676879] uppercase tracking-wide">
                  {t('shortcuts')}
                </span>
                {recentPages.length > DEFAULT_SHORTCUTS_COUNT && (
                  <button
                    onClick={() => setShortcutsExpanded(!shortcutsExpanded)}
                    className="text-[11px] text-primary hover:text-primary/80 transition-colors"
                  >
                    {shortcutsExpanded ? t('showLess') : t('showMore')}
                  </button>
                )}
              </div>
            )}
            {isCollapsed && (
              <div className="flex justify-center mb-1">
                <span className="material-symbols-rounded !text-[14px] text-[#676879]" title={t('shortcuts')}>
                  bolt
                </span>
              </div>
            )}
            <div>
              {visibleShortcuts.map((page) => {
                const meta = PAGE_META[page.path];
                if (!meta) return null;
                return (
                  <div key={page.path} className="group/shortcut">
                    <NavLink
                      to={page.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 text-[13px] ${
                          isCollapsed ? 'justify-center' : ''
                        } ${
                          isActive
                            ? 'hover:bg-violet-50 text-primary font-medium'
                            : 'text-[#676879] hover:bg-slate-200'
                        }`
                      }
                      title={isCollapsed ? t(meta.labelKey as any) : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`material-symbols-rounded !text-[16px] ${isActive ? 'text-primary' : 'text-[#676879]'}`}>
                            {meta.icon}
                          </span>
                          {isOpen && (
                            <span className="flex-1 truncate">{t(meta.labelKey as any)}</span>
                          )}
                          {isOpen && (
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                togglePin(page.path);
                              }}
                              className={`shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all ${
                                page.pinned
                                  ? 'text-primary hover:text-red-400'
                                  : 'opacity-0 group-hover/shortcut:opacity-100 text-[#676879] hover:text-primary'
                              }`}
                              title={page.pinned ? 'בטל נעיצה' : 'נעץ'}
                            >
                              <span className="material-symbols-rounded !text-[13px]">push_pin</span>
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="pt-4 mt-3">
          {isOpen && (
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[11px] font-semibold text-[#676879] uppercase tracking-wide">
                {t('products')}
              </span>
              <button
                onClick={() => setShowMoreProducts(!showMoreProducts)}
                className="text-[11px] text-primary hover:text-primary/80 transition-colors"
              >
                {showMoreProducts ? t('showLess') : t('more')}
              </button>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center mb-1">
              <span className="material-symbols-rounded !text-[14px] text-[#676879]" title={t('products')}>
                widgets
              </span>
            </div>
          )}
          <div>
            {productItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 text-[13px] ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'hover:bg-violet-50 text-primary font-medium'
                      : 'text-[#676879] hover:bg-slate-200'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-rounded !text-[16px] ${isActive ? 'text-primary' : 'text-[#676879]'}`}>
                      {item.icon}
                    </span>
                    {isOpen && <span className="flex-1 truncate">{item.label}</span>}
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
                    className={`w-full flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 text-[13px] text-[#676879] hover:bg-slate-200 ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="material-symbols-rounded !text-[16px]">{item.icon}</span>
                    {isOpen && (
                      <>
                        <span className="flex-1 text-start">{item.label}</span>
                        <span className={`material-symbols-rounded !text-[13px] transition-transform ${expandedMenus.includes('marketing') ? 'rotate-90' : ''}`}>
                          chevron_right
                        </span>
                      </>
                    )}
                  </button>
                  {isOpen && expandedMenus.includes('marketing') && (
                    <div className="ms-4">
                      {marketingSubItems.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 text-[13px] ${
                              isActive
                                ? 'hover:bg-violet-50 text-primary font-medium'
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
                    `flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 text-[13px] ${
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'hover:bg-violet-50 text-primary font-medium'
                        : 'text-[#676879] hover:bg-slate-200'
                    }`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <span className={`material-symbols-rounded !text-[16px] ${isActive ? 'text-primary' : 'text-[#676879]'}`}>
                        {item.icon}
                      </span>
                      {isOpen && <span className="flex-1 truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              )
            ))}

            {/* New Product button */}
            {isOpen && (
              <button onClick={() => navigate('/projects')} className="w-full flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 text-[13px] text-[#676879] hover:bg-slate-200 mt-0.5">
                <span className="material-symbols-rounded !text-[16px]">add</span>
                <span>צור מוצר</span>
              </button>
            )}
          </div>
        </div>

        {/* Dev Mode Toggle */}
        <div className="pt-4 mt-3">
          <button
            onClick={toggleDevMode}
            className={`w-full flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 ${
              isCollapsed ? 'justify-center' : ''
            } ${isDevMode ? 'text-purple-600 hover:bg-purple-50' : 'text-[#676879] hover:bg-slate-200'}`}
            title={isCollapsed ? 'Dev Mode' : undefined}
          >
            <span className={`material-symbols-rounded !text-[16px] transition-colors ${isDevMode ? 'text-purple-500' : ''}`}>
              code_blocks
            </span>
            {isOpen && (
              <>
                <span className="text-[13px] flex-1 text-start">Dev Mode</span>
                <div className={`relative inline-flex h-4 w-8 shrink-0 items-center rounded-full px-0.5 transition-colors duration-300 ${isDevMode ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400' : 'bg-slate-200'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isDevMode ? 'translate-x-0' : '-translate-x-4'}`} />
                </div>
              </>
            )}
          </button>

          {/* Dev Playground Link — visible only when Dev Mode is on */}
          {isDevMode && (
            <NavLink
              to="/dev"
              className={({ isActive }) =>
                `flex items-center gap-2.5 ps-3 pe-2 py-1 rounded-md transition-all duration-150 mt-1 ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 font-medium'
                    : 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`
              }
              title={isCollapsed ? 'Dev Playground' : undefined}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-rounded !text-[16px] ${isActive ? 'text-purple-600' : 'text-purple-400'}`}>
                    science
                  </span>
                  {isOpen && <span className="text-[13px] flex-1 truncate">Dev Playground</span>}
                </>
              )}
            </NavLink>
          )}
        </div>
      </nav>


    </aside>
  );
};

export default Sidebar;
