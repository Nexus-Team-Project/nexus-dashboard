import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import Sidebar, { type SidebarState } from '../components/Sidebar';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardLayoutProps {
  onLogout: () => void;
}

const DashboardLayout = ({ onLogout }: DashboardLayoutProps) => {
  const { isRTL } = useLanguage();
  const [sidebarState, setSidebarState] = useState<SidebarState>('open');

  return (
    <div className={`min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200 ${isRTL ? 'rtl' : 'ltr'}`}>
      <DashboardHeader onLogout={onLogout} />
      <div className="flex">
        <Sidebar
          onLogout={onLogout}
          state={sidebarState}
          onStateChange={setSidebarState}
        />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-73px)]">
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
  );
};

export default DashboardLayout;
