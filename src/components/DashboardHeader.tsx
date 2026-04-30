/**
 * Renders the dashboard top bar and account controls.
 * The user avatar button reads from the live dashboard auth context.
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from './SearchBar';
import NotificationsPanel from './NotificationsPanel';
import InboxPanel from './InboxPanel';
import UserPanel from './UserPanel';
import LanguageSwitcher from './LanguageSwitcher';
import nexusLogoAnimated from '../assets/logos/Nexus_Wide_Logo_Animation_Black_Whithout_Slogan.gif';
import nexusLogoStatic from '../assets/logos/Nexus_wide_logo_blak.png';
import orgLogo from '../assets/logos/Nexus_Logo_only_Icon_Black.png';

interface DashboardHeaderProps {
  onLogout: () => void;
  isChatOpen: boolean;
  onChatToggle: () => void;
}

/**
 * Returns a compact display name for user-facing labels.
 * Input: optional full name and email from the authenticated user.
 * Output: full name, email, or a neutral fallback.
 */
function getDisplayName(fullName?: string, email?: string): string {
  return fullName?.trim() || email?.trim() || 'User';
}

/**
 * Returns the first visible character for an avatar fallback.
 * Input: display name or email.
 * Output: uppercase single-character avatar text.
 */
function getDisplayInitial(label: string): string {
  return label.trim().charAt(0).toUpperCase() || '?';
}

const DashboardHeader = ({ onLogout, isChatOpen, onChatToggle }: DashboardHeaderProps) => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const notificationsBtnRef = useRef<HTMLButtonElement>(null);
  const inboxBtnRef = useRef<HTMLButtonElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const displayName = getDisplayName(user?.fullName, user?.email);
  const displayInitial = getDisplayInitial(displayName);
  const userAvatarLabel = isRTL ? `פרופיל ${displayName}` : `${displayName} profile`;
  const avatarUrl = user?.avatarUrl?.trim();
  const shouldShowAvatarImage = Boolean(avatarUrl) && !hasAvatarError;

  useEffect(() => {
    setHasAvatarError(false);
  }, [avatarUrl]);

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
      <header className="bg-[#edf1fc] dark:bg-background-dark h-12 flex items-center px-6 sticky top-0 z-50">
        {/* All buttons and user profile at far left */}
        <div className="flex items-center gap-1">
          <div className="relative me-1 shrink-0">
            <div className="absolute -start-1.5 -bottom-1 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 overflow-hidden">
              <img src={orgLogo} alt="Organization" className="w-3 h-3 object-contain" />
            </div>
            <button
              ref={userBtnRef}
              onClick={() => { setIsUserPanelOpen(!isUserPanelOpen); setIsNotificationsOpen(false); setIsInboxOpen(false); }}
              className={`w-7 h-7 rounded-full flex items-center justify-center overflow-hidden transition-all shrink-0 ${
                isUserPanelOpen
                  ? 'ring-2 ring-[#635bff]'
                  : 'hover:ring-2 hover:ring-slate-300'
              } bg-gradient-to-br from-primary to-violet-400`}
              title={userAvatarLabel}
              aria-label={userAvatarLabel}
            >
              {shouldShowAvatarImage ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setHasAvatarError(true)}
                />
              ) : (
                <span className="text-white font-semibold text-[12px]">{displayInitial}</span>
              )}
            </button>
          </div>
          <UserPanel
            isOpen={isUserPanelOpen}
            onClose={() => setIsUserPanelOpen(false)}
            onLogout={onLogout}
            anchorRef={userBtnRef}
          />
          <SearchBar />
          <button
            ref={notificationsBtnRef}
            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsInboxOpen(false); }}
            className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
              isNotificationsOpen
                ? 'text-[#635bff] bg-[#635bff]/10'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-slate-300'
            }`}
            title={t('notificationsTitle')}
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
            className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
              isInboxOpen
                ? 'text-[#635bff] bg-[#635bff]/10'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-slate-300'
            }`}
            title={t('inbox')}
          >
            <span className="material-symbols-rounded !text-[20px]">inbox</span>
          </button>
          <InboxPanel
            isOpen={isInboxOpen}
            onClose={() => setIsInboxOpen(false)}
            anchorRef={inboxBtnRef}
          />
          <button
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-slate-300 rounded-md transition-colors"
            title={t('headerTeam')}
          >
            <span className="material-symbols-rounded !text-[20px]">group</span>
          </button>
          <button
            onClick={onChatToggle}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
              isChatOpen
                ? 'text-[#635bff] bg-[#635bff]/10'
                : 'text-slate-400 hover:text-[#635bff] hover:bg-slate-200'
            }`}
            title={t('aiAssistant')}
          >
            <span className="material-symbols-rounded !text-[20px]">auto_awesome</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-slate-300 rounded-md transition-colors"
            title={t('settings')}
          >
            <span className="material-symbols-rounded !text-[20px]">settings</span>
          </button>
          <button className="text-primary hover:text-white hover:bg-primary text-[12px] font-semibold flex items-center gap-1 px-2 py-1 rounded-md transition-colors leading-none" title={t('headerUpgrade')}>
            <span className="material-symbols-rounded !text-[16px]">diamond</span>
            {t('headerUpgrade')}
          </button>
          <LanguageSwitcher />
        </div>

        {/* Logo at far right */}
        <div className="flex items-center ms-auto -me-2">
          <div
            className="cursor-pointer transition-transform duration-300 hover:scale-105"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            style={{
              width: 140,
              height: 40,
              backgroundImage: `url(${isLogoHovered ? nexusLogoAnimated : nexusLogoStatic})`,
              backgroundColor: '#edf1fc',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundBlendMode: 'multiply',
            }}
            role="img"
            aria-label="Nexus"
          />
        </div>
      </header>
    </>
  );
};

export default DashboardHeader;
