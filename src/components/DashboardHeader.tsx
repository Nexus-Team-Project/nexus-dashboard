import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import SearchBar from './SearchBar';
import nexusLogoAnimated from '../assets/logos/Nexus_Wide_Logo_Animation_Black_Whithout_Slogan.gif';
import nexusLogoStatic from '../assets/logos/Nexus_wide_logo_blak.png';

interface DashboardHeaderProps {
  onLogout: () => void;
}

const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <>
      <style>{`
        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes logoGlow {
          0%, 100% {
            filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
          }
        }

        .logo-animated {
          animation: logoFloat 3s ease-in-out infinite, logoGlow 2s ease-in-out infinite;
          transition: all 0.3s ease;
        }

        .logo-animated:hover {
          transform: scale(1.1) rotate(5deg);
          filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8));
        }
      `}</style>
      <header className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 h-16 flex items-center px-6 sticky top-0 z-50">
        {/* Profile + logout + actions at far left */}
        <div className="flex items-center gap-4">
          {/* Profile + signout grouped together */}
          <div className="flex items-center gap-1 pe-4 border-e border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                <span className="material-icons text-slate-500">person</span>
              </div>
              {user?.fullName && (
                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                  {user.fullName}
                </span>
              )}
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 rounded-full transition-colors"
              title={t('logout')}
            >
              <span className="material-icons text-[18px]">logout</span>
            </button>
          </div>
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons">notifications</span>
            <span className="absolute top-2 end-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-card-dark"></span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons">group</span>
          </button>
          <LanguageSwitcher />
        </div>

        {/* Search bar and Logo at far right */}
        <div className="flex items-center gap-4 ms-auto">
          <div className="max-w-md">
            <SearchBar />
          </div>
          <div
            className="flex items-center cursor-pointer transition-transform duration-300 hover:scale-105"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <img
              src={isLogoHovered ? nexusLogoAnimated : nexusLogoStatic}
              alt="Nexus"
              className="h-10 w-auto object-contain transition-all duration-300"
            />
          </div>
        </div>
    </header>
    </>
  );
};

export default DashboardHeader;
