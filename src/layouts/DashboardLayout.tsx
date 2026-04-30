import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import Sidebar, { type SidebarState } from '../components/Sidebar';
import AiChatPanel from '../components/AiChatPanel';
import BottomToolbar from '../components/BottomToolbar';
import { useLanguage } from '../i18n/LanguageContext';
import { useDevMode } from '../contexts/DevModeContext';
import BusinessSetupGuide from '../components/business-setup/BusinessSetupGuide';
import SetupBanner from '../components/business-setup/SetupBanner';

interface DashboardLayoutProps {
  onLogout: () => void;
  showBusinessSetup?: boolean;
}

const DashboardLayout = ({ onLogout, showBusinessSetup = false }: DashboardLayoutProps) => {
  const { isRTL } = useLanguage();
  const { isDevMode } = useDevMode();
  const [sidebarState, setSidebarState] = useState<SidebarState>('open');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Border highlight effect — direct DOM, no re-renders
  const handleContentMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div className={`min-h-screen bg-[#edf1fc] dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200 ${isDevMode ? 'pb-12' : 'pb-0'} ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Top-level flex: page + chat panel side by side */}
      <div className="flex min-h-screen">
        {/* Gray strip near right edge */}
        <div className="w-2 shrink-0" />
        {/* Full page (banner + header + sidebar + content) */}
        <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out">
          {showBusinessSetup && <SetupBanner />}
          {/* Stripe-style rounded corners — thin decorative strip that overlaps the orange banner */}
          <div className="h-2 -mt-2 rounded-t-2xl bg-[#edf1fc] dark:bg-background-dark relative z-[1] shrink-0" />
          <DashboardHeader onLogout={onLogout} isChatOpen={isChatOpen} onChatToggle={() => setIsChatOpen(!isChatOpen)} />
          <div className="flex flex-1 min-h-0">
            <Sidebar
              onLogout={onLogout}
              state={sidebarState}
              onStateChange={setSidebarState}
            />
            {/* Outer wrapper: non-scrollable, holds the border-highlight effect */}
            <div
              className="flex-1 flex flex-col min-h-0 min-w-0 rounded-tr-xl relative border-highlight-card"
              onMouseMove={handleContentMouseMove}
            >
              {/* Inner scrollable area */}
              <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-white dark:bg-card-dark rounded-tr-xl">
                <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-4">
                  <Outlet />
                </main>
                <footer className="max-w-[1400px] w-full mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <p>© 2024 Nexus Admin. All Rights Reserved.</p>
                  <div className="flex gap-4">
                    <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                    <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
                    <a className="hover:text-primary transition-colors" href="#">Help Center</a>
                  </div>
                </footer>
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
