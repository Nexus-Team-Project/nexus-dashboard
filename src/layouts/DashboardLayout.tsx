import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import Sidebar, { type SidebarState } from '../components/Sidebar';
import AiChatPanel from '../components/AiChatPanel';
import BottomToolbar from '../components/BottomToolbar';
import { useLanguage } from '../i18n/LanguageContext';
import { useDevMode } from '../contexts/DevModeContext';
import BusinessSetupGuide from '../components/business-setup/BusinessSetupGuide';
import SetupBanner from '../components/business-setup/SetupBanner';
import PendingInvitationsPanel from '../components/PendingInvitationsPanel';

interface DashboardLayoutProps {
  onLogout: () => void;
  showBusinessSetup?: boolean;
}

const DashboardLayout = ({ onLogout, showBusinessSetup = false }: DashboardLayoutProps) => {
  const { isRTL } = useLanguage();
  const { isDevMode } = useDevMode();
  const location = useLocation();
  /**
   * Pages that render their own full-bleed shell (hero banner + multi-column
   * layout) opt out of the global `<main>` max-width + padding wrapper so the
   * banner can span the full inner scroll area edge-to-edge.
   */
  const isFullBleedRoute =
    location.pathname === '/supply/create'
    || location.pathname.startsWith('/benefits-partnerships/edit-offer/')
    || location.pathname === '/member-catalog';

  /**
   * Routes that paint their own immersive page background. The scroll
   * shell drops its default `bg-white` (and footer) so the page background
   * reaches every edge with no white gap around it.
   */
  const isImmersiveBgRoute = location.pathname === '/member-catalog';
  /**
   * The /member-catalog page paints its own particle backdrop (grid + gold/
   * silver geometric particles). The layout simply removes the surrounding
   * white shell so that backdrop reaches every edge.
   */
  const immersiveBgStyle: React.CSSProperties = isImmersiveBgRoute
    ? { background: '#ffffff' }
    : {};
  const [sidebarState, setSidebarState] = useState<SidebarState>('open');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Border highlight effect — direct DOM, no re-renders
  const handleContentMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div className={`min-h-screen ${isImmersiveBgRoute ? 'bg-white' : 'bg-[#edf1fc]'} dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200 ${isDevMode ? 'pb-12' : 'pb-0'} ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Top-level flex: page + chat panel side by side */}
      <div className="flex min-h-screen">
        {/* Gray strip near right edge */}
        <div className="hidden w-2 shrink-0 lg:block" />
        {/* Full page (banner + header + sidebar + content) */}
        <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out">
          {showBusinessSetup && <SetupBanner />}
          {/* Stripe-style rounded corners — thin decorative strip that overlaps the orange banner */}
          <div className={`h-2 -mt-2 rounded-t-2xl ${isImmersiveBgRoute ? 'bg-white' : 'bg-[#edf1fc]'} dark:bg-background-dark relative z-[1] shrink-0`} />
          <DashboardHeader
            onLogout={onLogout}
            isChatOpen={isChatOpen}
            onChatToggle={() => setIsChatOpen(!isChatOpen)}
            onMenuToggle={() => setIsMobileSidebarOpen(true)}
          />
          <div className="flex flex-1 min-h-0">
            <div className="hidden lg:block">
              <Sidebar
                onLogout={onLogout}
                state={sidebarState}
                onStateChange={setSidebarState}
              />
            </div>
            {isMobileSidebarOpen && (
              <div className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true">
                <div className={`absolute top-0 h-full w-[min(18rem,calc(100vw-2rem))] ${isRTL ? 'right-0' : 'left-0'}`}>
                  <Sidebar
                    onLogout={onLogout}
                    state="open"
                    onStateChange={() => undefined}
                    isMobile
                    onNavigate={() => setIsMobileSidebarOpen(false)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm`}
                  aria-label="Close navigation"
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </div>
            )}
            {/* Outer wrapper: non-scrollable, holds the border-highlight effect */}
            <div
              className="flex-1 flex flex-col min-h-0 min-w-0 rounded-tr-xl relative border-highlight-card"
              onMouseMove={handleContentMouseMove}
            >
              {/* Inner scrollable area */}
              <div
                className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar dark:bg-card-dark rounded-tr-xl ${isImmersiveBgRoute ? '' : 'bg-white'}`}
                style={immersiveBgStyle}
              >
                {isFullBleedRoute ? (
                  <main className="flex-1 w-full">
                    <Outlet />
                  </main>
                ) : (
                  <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 py-3 sm:px-4 lg:px-6 lg:py-4">
                    <PendingInvitationsPanel />
                    <Outlet />
                  </main>
                )}
                {!isImmersiveBgRoute && (
                <footer className="max-w-[1400px] w-full mx-auto px-3 py-4 sm:px-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-400 font-medium">
                  <p>© 2024 Nexus Admin. All Rights Reserved.</p>
                  <div className="flex flex-wrap gap-4">
                    <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                    <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
                    <a className="hover:text-primary transition-colors" href="#">Help Center</a>
                  </div>
                </footer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - slides in from the end, pushes everything */}
        <div
          className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out sticky top-0 h-screen ${isChatOpen ? 'border-s border-[#e3e8ee]' : ''}`}
          style={{ width: isChatOpen ? 400 : 0 }}
        >
          <AiChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
      </div>
      <BottomToolbar />
      {showBusinessSetup && <BusinessSetupGuide />}
    </div>
  );
};

export default DashboardLayout;
