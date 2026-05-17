/**
 * MemberSidebar: slim navigation sidebar for tenant members.
 * Shows only the service pages the member was granted access to.
 * Platform-admin nav items are never shown here.
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

/** Props for the member sidebar component. */
interface MemberSidebarProps {
  /** Called when a nav item is tapped on mobile to close the drawer. */
  onNavigate?: () => void;
  /** Called when the user clicks the sign-out button. */
  onLogout: () => void;
}

/**
 * Renders the member-scoped navigation sidebar.
 * Input: onNavigate (optional mobile close callback), onLogout.
 * Output: sidebar with Home, service links, and sign-out.
 */
export default function MemberSidebar({ onNavigate, onLogout }: MemberSidebarProps) {
  const { me } = useAuth();
  const { t } = useLanguage();

  // Show catalog link if the member was granted catalog service, or if they
  // can already purchase (handles sessions that pre-date the memberServices field).
  const showCatalog =
    me?.authorization.memberServices?.includes('benefits_catalog') === true ||
    me?.authorization.canPurchaseCatalog === true ||
    (me?.authorization.catalogMode !== undefined && me.authorization.catalogMode !== 'inactive');

  /**
   * Computes nav link class based on active state.
   * Input: isActive - whether the route is currently active.
   * Output: Tailwind class string for the link element.
   */
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 ps-4 pe-3 py-2 rounded-md text-[13px] transition-all duration-150 ${
      isActive
        ? 'text-primary font-medium hover:bg-violet-50'
        : 'text-[#676879] hover:bg-slate-200'
    }`;

  return (
    <aside className="w-56 bg-gradient-to-b from-[#fdfeff] to-[#edf1fc] border-e border-slate-200 flex flex-col h-[calc(100vh-48px)] sticky top-[48px] shrink-0">
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {/* Home - always visible */}
        <NavLink to="/" end className={linkClass} onClick={onNavigate}>
          <span className="material-symbols-rounded !text-[16px]">home</span>
          <span>{t('dashboard')}</span>
        </NavLink>

        {/* Benefits Catalog - shown when member has access to catalog service */}
        {showCatalog && (
          <NavLink to="/member-catalog" className={linkClass} onClick={onNavigate}>
            <span className="material-symbols-rounded !text-[16px]">local_offer</span>
            <span>{t('ms_benefitsCatalog')}</span>
          </NavLink>
        )}
      </nav>

      {/* Sign out anchored at bottom */}
      <div className="px-3 py-3 border-t border-slate-200">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 ps-4 pe-3 py-2 rounded-md text-[13px] text-[#676879] hover:bg-slate-200 transition-colors"
        >
          <span className="material-symbols-rounded !text-[16px]">logout</span>
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
