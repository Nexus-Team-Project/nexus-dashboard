/**
 * Defines the dashboard application shell, auth gate, and route tree.
 * The shell waits for real website-backed authentication before rendering data.
 */
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
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

const MEMBER_COPY = {
  he: {
    title: 'אזור החבר שלך מוכן',
    body: 'נרשמת כחבר יחיד. אפשר להשתמש בפעולות אישיות, אך ניהול עסקי, אנליטיקות והגדרת עסק זמינים רק לסביבות עבודה של ארגונים.',
    badge: 'חבר',
    signOut: 'התנתקות',
  },
  en: {
    title: 'Your member area is ready',
    body: 'You joined as an individual member. Personal actions are available, while business analytics and business setup are only available for tenant workspaces.',
    badge: 'Member',
    signOut: 'Sign out',
  },
} as const;

const DEFERRED_COPY = {
  he: {
    badge: 'ההקמה ממתינה',
    title: 'השלימו את הקמת סביבת העבודה כדי לפתוח את הדשבורד.',
    body: 'אנליטיקות, נתוני עסק, קטלוג ופעולות ארגון ייפתחו רק אחרי יצירת סביבת עבודה.',
    action: 'המשך הקמת סביבת עבודה',
    signOut: 'התנתקות',
  },
  en: {
    badge: 'Setup deferred',
    title: 'Complete workspace setup to unlock your dashboard.',
    body: 'Analytics, business data, catalog, and tenant actions unlock only after a workspace is created.',
    action: 'Continue workspace setup',
    signOut: 'Sign out',
  },
} as const;

/**
 * Shows the non-tenant member state without mounting tenant analytics.
 * Input: logout callback for ending the authenticated session.
 * Output: member-only dashboard placeholder with no tenant actions.
 */
function MemberDashboardScreen({ onLogout }: { onLogout: () => Promise<void> }) {
  const { language, isRTL } = useLanguage();
  const copy = MEMBER_COPY[language];

  return (
    <main
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#edf1fc] px-6 py-8 text-slate-950"
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {copy.badge}
          </div>
          <h1 className="text-2xl font-bold tracking-normal text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.body}
          </p>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="mt-8 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            {copy.signOut}
          </button>
        </section>
      </div>
    </main>
  );
}

/**
 * Shows a locked state for users who deferred workspace setup.
 * Input: continue callback and logout callback.
 * Output: no tenant data is mounted; user can reopen setup.
 */
function DeferredWorkspaceScreen({
  onContinue,
  onLogout,
}: {
  onContinue: () => void;
  onLogout: () => Promise<void>;
}) {
  const { language, isRTL } = useLanguage();
  const copy = DEFERRED_COPY[language];

  return (
    <main
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#edf1fc] px-6 py-8 text-slate-950"
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {copy.badge}
          </div>
          <h1 className="text-2xl font-bold tracking-normal text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.body}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onContinue}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              {copy.action}
            </button>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {copy.signOut}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Renders routes after authentication state has been resolved.
 * Input: none.
 * Output: authenticated dashboard routes or a loading/redirect route.
 */
function AppRoutes() {
  const { user, isAuthenticated, isLoading, logout, me, reloadMe } = useAuth();
  const [isDeferredSetupOpen, setIsDeferredSetupOpen] = useState(false);
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

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<WebsiteLoginRedirectScreen />} />
      </Routes>
    );
  }

  if (!me) return <AuthLoadingScreen />;

  const requiresWorkspaceSetup = me.onboarding.required === true && me.onboarding.step === 'workspace_setup';
  const isWorkspaceSetupDeferred = me.context.mode === 'workspace_setup_deferred';
  const canUseBusinessSetup = me?.context.isTenant === true;
  const firstName = user?.fullName?.split(/\s+/)[0] ?? me?.user.name?.split(/\s+/)[0];

  if (requiresWorkspaceSetup) {
    return (
      <WorkspaceSetupModal
        onClose={() => undefined}
        onFinished={reloadMe}
        firstName={firstName}
        forceOpen
      />
    );
  }

  if (isWorkspaceSetupDeferred) {
    return (
      <>
        <DeferredWorkspaceScreen
          onContinue={() => setIsDeferredSetupOpen(true)}
          onLogout={logout}
        />
        {isDeferredSetupOpen && (
          <WorkspaceSetupModal
            onClose={() => setIsDeferredSetupOpen(false)}
            onFinished={async () => {
              setIsDeferredSetupOpen(false);
              await reloadMe();
            }}
            firstName={firstName}
          />
        )}
      </>
    );
  }

  if (!canUseBusinessSetup) {
    return (
      <Routes>
        <Route path="*" element={<MemberDashboardScreen onLogout={logout} />} />
      </Routes>
    );
  }

  return (
    <Routes>
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
    </Routes>
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
