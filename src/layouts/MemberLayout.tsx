/**
 * MemberLayout: shell for all tenant-member routes.
 * Combines DashboardHeader, MemberSidebar, and a scrollable content outlet.
 * Mobile: MemberSidebar rendered as a drawer, closed by default.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import MemberSidebar from '../components/MemberSidebar';
import { useLanguage } from '../i18n/LanguageContext';

/** Props for the member layout shell. */
interface MemberLayoutProps {
  /** Callback to log the user out, passed down from App.tsx. */
  onLogout: () => void;
}

/**
 * Renders the member layout shell (header + sidebar + content).
 * Input: onLogout callback passed down from App.tsx.
 * Output: full-page layout with sidebar navigation and content area.
 */
export default function MemberLayout({ onLogout }: MemberLayoutProps) {
  const { isRTL } = useLanguage();
  // Controls mobile drawer visibility - closed by default on page load.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className={`min-h-screen bg-[#edf1fc] text-slate-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex min-h-screen">
        {/* Gray strip matching DashboardLayout structure */}
        <div className="hidden w-2 shrink-0 lg:block" />
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Rounded corner strip - same decorative element as DashboardLayout */}
          <div className="h-2 -mt-2 rounded-t-2xl bg-[#edf1fc] relative z-[1] shrink-0" />
          <DashboardHeader
            onLogout={onLogout}
            isChatOpen={false}
            onChatToggle={() => undefined}
            onMenuToggle={() => setIsMobileOpen(true)}
          />
          <div className="flex flex-1 min-h-0">
            {/* Desktop sidebar - hidden on mobile */}
            <div className="hidden lg:block">
              <MemberSidebar onLogout={onLogout} />
            </div>

            {/* Mobile sidebar drawer - visible only when hamburger is tapped */}
            {isMobileOpen && (
              <div
                className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-sm lg:hidden"
                role="dialog"
                aria-modal="true"
              >
                {/* Drawer panel - narrower than admin (14rem vs 18rem) */}
                <div
                  className={`absolute top-0 h-full w-[min(14rem,calc(100vw-2rem))] ${
                    isRTL ? 'right-0' : 'left-0'
                  }`}
                >
                  <MemberSidebar
                    onLogout={onLogout}
                    onNavigate={() => setIsMobileOpen(false)}
                  />
                </div>
                {/* Close button positioned opposite the drawer edge */}
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className={`absolute top-3 ${
                    isRTL ? 'left-3' : 'right-3'
                  } flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm`}
                  aria-label="Close navigation"
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </div>
            )}

            {/* Main content area - scrollable, white rounded card */}
            <main className="flex-1 min-w-0 overflow-y-auto">
              <div className="rounded-tl-2xl bg-white min-h-full p-5 sm:p-7">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
