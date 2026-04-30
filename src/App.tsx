/**
 * Defines the dashboard application shell, auth gate, and route tree.
 * The shell waits for real website-backed authentication before rendering data.
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { DevModeProvider } from './contexts/DevModeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Users from './pages/Users';
import Content from './pages/Content';
import Settings from './pages/Settings';
import RolesPermissions from './pages/RolesPermissions';
import InviteCollaborators from './pages/InviteCollaborators';
import Lobby from './pages/Lobby';
import PointsGifts from './pages/PointsGifts';
import SendGiftEvent from './pages/SendGiftEvent';
import SendGiftBrands from './pages/SendGiftBrands';
import SendGiftGreeting from './pages/SendGiftGreeting';
import SendGiftRecipients from './pages/SendGiftRecipients';
import SendGiftSummary from './pages/SendGiftSummary';
import BenefitsPartnerships from './pages/BenefitsPartnerships';
import EditBenefit from './pages/EditBenefit';
import ApiDocs from './pages/ApiDocs';
import Organizations from './pages/Organizations';
import OrgDetail from './pages/OrgDetail';
import SmsCampaign from './pages/SmsCampaign';
import Inbox from './pages/Inbox';
import CreateProject from './pages/CreateProject';
import Transactions from './pages/Transactions';
import DevPlayground from './pages/DevPlayground';
import BusinessSetupPage from './pages/BusinessSetupPage';
import WorkspaceSetupModal from './components/workspace/WorkspaceSetupModal';

const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL ?? 'http://localhost:3000';

/**
 * Shows a small neutral loading surface while the dashboard restores auth.
 * Input: none.
 * Output: full-screen loading indicator.
 */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#edf1fc] flex items-center justify-center text-slate-700">
      <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
      </div>
    </div>
  );
}

/**
 * Builds the external website login URL used by dashboard auth redirects.
 * Input: none.
 * Output: absolute website login URL.
 */
function getWebsiteLoginUrl(): string {
  return new URL('/login', WEBSITE_URL).toString();
}

/**
 * Shows a branded transition while unauthenticated dashboard visitors leave.
 * Input: none.
 * Output: full-screen redirect state and a browser navigation to website login.
 */
function WebsiteLoginRedirectScreen() {
  useEffect(() => {
    window.location.replace(getWebsiteLoginUrl());
  }, []);

  return (
    <div className="min-h-screen bg-[#edf1fc] flex items-center justify-center px-6 text-slate-800">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-950 text-white flex items-center justify-center font-semibold">
            N
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">Redirecting to sign in</p>
            <p className="mt-1 text-xs text-slate-500">Your session needs to be restored on Nexus.</p>
          </div>
          <div className="ml-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        </div>
      </div>
    </div>
  );
}

/**
 * Renders routes after authentication state has been resolved.
 * Input: none.
 * Output: authenticated dashboard routes or a loading/redirect route.
 */
function AppRoutes() {
  const { user, isAuthenticated, isLoading, logout, me, reloadMe } = useAuth();
  // Convert title attributes to data-tooltip for modern black tooltips
  useEffect(() => {
    const convertTitles = () => {
      document.querySelectorAll('[title]:not([data-tooltip])').forEach(el => {
        const title = el.getAttribute('title');
        if (title) {
          el.setAttribute('data-tooltip', title);
          el.removeAttribute('title');
        }
      });
    };
    convertTitles();
    const observer = new MutationObserver(convertTitles);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['title'] });
    return () => observer.disconnect();
  }, []);

  if (isLoading) return <AuthLoadingScreen />;

  const requiresWorkspaceSetup = me?.onboarding.required === true && me.onboarding.step === 'workspace_setup';
  const canUseBusinessSetup = me?.context.isTenant === true;
  const firstName = user?.fullName?.split(/\s+/)[0] ?? me?.user.name?.split(/\s+/)[0];

  return (
    <>
      {requiresWorkspaceSetup && (
        <WorkspaceSetupModal
          onClose={() => undefined}
          onFinished={reloadMe}
          firstName={firstName}
          forceOpen
        />
      )}
      <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="*" element={<WebsiteLoginRedirectScreen />} />
            </>
          ) : (
            <>
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/business-setup" element={canUseBusinessSetup ? <BusinessSetupPage /> : <Navigate to="/" replace />} />
              <Route path="/" element={<DashboardLayout onLogout={logout} showBusinessSetup={canUseBusinessSetup} />}>
                <Route index element={<Home />} />
                <Route path="projects" element={<Lobby />} />
                <Route path="projects/new" element={<CreateProject />} />
                <Route path="users" element={<Users />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="points-gifts" element={<PointsGifts />} />
                <Route path="benefits-partnerships" element={<BenefitsPartnerships />} />
                <Route path="benefits-partnerships/edit-benefit/:id" element={<EditBenefit />} />
                <Route path="benefits-partnerships/edit-business/:id" element={<EditBenefit />} />
                <Route path="send-gift/event" element={<SendGiftEvent />} />
                <Route path="send-gift/brands" element={<SendGiftBrands />} />
                <Route path="send-gift/greeting" element={<SendGiftGreeting />} />
                <Route path="send-gift/recipients" element={<SendGiftRecipients />} />
                <Route path="send-gift/summary" element={<SendGiftSummary />} />
                <Route path="organizations" element={<Organizations />} />
                <Route path="organizations/:slug" element={<OrgDetail />} />
                <Route path="marketing/sms" element={<SmsCampaign />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="content" element={<Content />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/roles-permissions" element={<RolesPermissions />} />
                <Route path="settings/roles-permissions/invite" element={<InviteCollaborators />} />
                <Route path="dev" element={<DevPlayground />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </>
          )}
      </Routes>
    </>
  );
}

/**
 * Mounts global providers for the dashboard app.
 * Input: none.
 * Output: complete dashboard application.
 */
function App() {
  return (
    <DevModeProvider>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
    </DevModeProvider>
  );
}

export default App;
