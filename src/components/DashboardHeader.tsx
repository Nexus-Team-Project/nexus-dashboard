import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import SearchBar from './SearchBar';
import NotificationsPanel from './NotificationsPanel';
import InboxPanel from './InboxPanel';
import nexusLogoAnimated from '../assets/logos/Nexus_Wide_Logo_Animation_Black_Whithout_Slogan.gif';
import nexusLogoStatic from '../assets/logos/Nexus_wide_logo_blak.png';

interface DashboardHeaderProps {
  onLogout: () => void;
  isChatOpen: boolean;
  onChatToggle: () => void;
}

const DashboardHeader = ({ onLogout, isChatOpen, onChatToggle }: DashboardHeaderProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const notificationsBtnRef = useRef<HTMLButtonElement>(null);
  const inboxBtnRef = useRef<HTMLButtonElement>(null);

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
      <header className="bg-[#d6e0ed] dark:bg-background-dark h-12 flex items-center px-6 sticky top-0 z-50">
        {/* All buttons and user profile at far left */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 me-2 pe-4 border-e border-slate-200 dark:border-slate-700">
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
              <span className="material-symbols-rounded !text-[20px] text-slate-400">person</span>
            </div>
          </div>
          <button
            ref={notificationsBtnRef}
            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsInboxOpen(false); }}
            className={`relative p-1.5 rounded-full transition-colors ${
              isNotificationsOpen
                ? 'text-[#635bff] bg-[#635bff]/10'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title={language === 'he' ? 'התראות' : 'Notifications'}
          >
            <span className="material-symbols-rounded !text-[20px]">notifications</span>
            <span className="absolute top-1 end-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
          <NotificationsPanel
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            anchorRef={notificationsBtnRef}
          />
          <button
            ref={inboxBtnRef}
            onClick={() => { setIsInboxOpen(!isInboxOpen); setIsNotificationsOpen(false); }}
            className={`relative p-1.5 rounded-full transition-colors ${
              isInboxOpen
                ? 'text-[#635bff] bg-[#635bff]/10'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title={language === 'he' ? 'הודעות' : 'Inbox'}
          >
            <span className="material-symbols-rounded !text-[20px]">inbox</span>
          </button>
          <InboxPanel
            isOpen={isInboxOpen}
            onClose={() => setIsInboxOpen(false)}
            anchorRef={inboxBtnRef}
          />
          <button
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
            title={language === 'he' ? 'צוות' : 'Team'}
          >
            <span className="material-symbols-rounded !text-[20px]">group</span>
          </button>
          <button
            onClick={onChatToggle}
            className={`p-1.5 rounded-full transition-colors ${
              isChatOpen
                ? 'text-[#635bff] bg-[#635bff]/10'
                : 'text-slate-400 hover:text-[#635bff]'
            }`}
            title={t('aiAssistant')}
          >
            <span className="material-symbols-rounded !text-[20px]">auto_awesome</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
            title={t('settings')}
          >
            <span className="material-symbols-rounded !text-[20px]">settings</span>
          </button>
          <button className="text-primary text-[12px] font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity leading-none" title={language === 'he' ? 'שדרג' : 'Upgrade'}>
            <span className="material-symbols-rounded !text-[16px]">diamond</span>
            {language === 'he' ? 'שדרג' : 'Upgrade'}
          </button>
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-full transition-colors"
            title={t('logout')}
          >
            <span className="material-symbols-rounded !text-[20px]">logout</span>
          </button>
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
