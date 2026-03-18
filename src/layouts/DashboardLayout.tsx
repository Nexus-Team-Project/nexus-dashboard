import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import Sidebar, { type SidebarState } from '../components/Sidebar';
import AiChatPanel from '../components/AiChatPanel';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardLayoutProps {
  onLogout: () => void;
}

const DashboardLayout = ({ onLogout }: DashboardLayoutProps) => {
  const { isRTL } = useLanguage();
  const [sidebarState, setSidebarState] = useState<SidebarState>('open');
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className={`min-h-screen bg-[#d6e0ed] dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Top-level flex: page + chat panel side by side */}
      <div className="flex min-h-screen">
        {/* Gray strip near right edge */}
        <div className="w-2 shrink-0" />
        {/* Full page (header + sidebar + content) */}
        <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out">
          <DashboardHeader onLogout={onLogout} isChatOpen={isChatOpen} onChatToggle={() => setIsChatOpen(!isChatOpen)} />
          <div className="flex flex-1">
            <Sidebar
              onLogout={onLogout}
              state={sidebarState}
              onStateChange={setSidebarState}
            />
            <div className="flex-1 flex flex-col min-h-[calc(100vh-48px)] min-w-0 bg-white dark:bg-card-dark rounded-tr-xl">
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

        {/* Chat Panel - slides in from the end, pushes everything */}
        <div
          className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out sticky top-0 h-screen ${isChatOpen ? 'border-s border-[#e3e8ee]' : ''}`}
          style={{ width: isChatOpen ? 400 : 0 }}
        >
          <AiChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
