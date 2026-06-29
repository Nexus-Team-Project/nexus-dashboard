/**
 * Defines the dashboard application shell, auth gate, and route tree.
 * The shell waits for real website-backed authentication before rendering data.
 */
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { DevModeProvider } from './contexts/DevModeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Content from './pages/Content';
import Settings from './pages/Settings';
import Members from './pages/Members';
import RolesPermissions from './pages/RolesPermissions';
import AppearanceSettings from './pages/AppearanceSettings';
import JoinRequestsSettings from './pages/JoinRequestsSettings';
import InviteCollaborators from './pages/InviteCollaborators';
import MemberInviteAccept from './pages/MemberInviteAccept';
import Lobby from './pages/Lobby';
import PointsGifts from './pages/PointsGifts';
import SendGiftEvent from './pages/SendGiftEvent';
import SendGiftBrands from './pages/SendGiftBrands';
import SendGiftGreeting from './pages/SendGiftGreeting';
import SendGiftRecipients from './pages/SendGiftRecipients';
import SendGiftSummary from './pages/SendGiftSummary';
import BenefitsPartnerships from './pages/BenefitsPartnerships';
import EditOffer from './pages/EditOffer';
import ApiDocs from './pages/ApiDocs';
import Organizations from './pages/Organizations';
import OrgDetail from './pages/OrgDetail';
import SmsCampaign from './pages/SmsCampaign';
import Inbox from './pages/Inbox';
import CreateProject from './pages/CreateProject';
import Transactions from './pages/Transactions';
import DevPlaygroundRoute from './pages/DevPlaygroundRoute';
import BusinessSetupPage from './pages/BusinessSetupPage';
import WorkspaceSetupModal from './components/workspace/WorkspaceSetupModal';
import CreateOffer from './pages/CreateOffer';
import ProductCatalog from './pages/ProductCatalog';

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
  const url = new URL('/login', WEBSITE_URL);
  const dashboardRedirect = `${window.location.pathname}${window.location.search}`;
  if (dashboardRedirect !== '/') {
    url.searchParams.set('dashboardRedirect', dashboardRedirect);
  }
  return url.toString();
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
 * Shows a locked state for users who deferred workspace setup.
 * Input: continue callback and logout callback.
 * Output: no tenant data is mounted; user can reopen setup.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<WebsiteLoginRedirectScreen />} />
      </Routes>
    );
  }

  if (!me) return <AuthLoadingScreen />;

  // During the SSO handoff the browser sits briefly on /auth/callback while
  // AuthContext swaps in the real redirect path (replaceState + popstate). That
  // path-swap and the isLoading flip race each other; if isLoading clears first
  // the authenticated tree would render against the stale /auth/callback path
  // and flash the workspace-setup wizard for a user who is actually mid
  // invite-accept. Keep showing the loading screen until the redirect lands.
  if (location.pathname === '/auth/callback') {
    return <AuthLoadingScreen />;
  }

  // The invite-accept page must always render standalone — never behind the forced
  // workspace-setup wizard. It accepts the token, then routes the user onward
  // (members → Nexus Wallet, staff roles → dashboard). Without this guard the forced
  // wizard overlay covered the accept page and trapped invited members on the wizard.
  if (location.pathname === '/member-invite/accept') {
    return (
      <Routes>
        <Route path="/member-invite/accept" element={<MemberInviteAccept />} />
      </Routes>
    );
  }

  const requiresWorkspaceSetup = me.onboarding.required === true && me.onboarding.step === 'workspace_setup';
  const isWorkspaceSetupDeferred = me.context.mode === 'workspace_setup_deferred';
  const hasTenantWorkspace = me.context.isTenant === true;
  const isTenantAdmin = hasTenantWorkspace && (me.context.role === 'admin' || me.context.role === 'owner');
  // Pure members and skipped-setup users no longer get a member dashboard. They are offered
  // the workspace-setup wizard so they can still create their own workspace if they want.
  const isPureMember = hasTenantWorkspace && me.context.role === 'member';
  const isRegularUser = me.context.mode === 'regular_user';
  // Show the onboarding wizard for: new users, deferred setup, pure members, skipped-setup
  // users, and any authenticated user that has no tenant workspace at all.
  const showWorkspaceOnboarding =
    requiresWorkspaceSetup || isWorkspaceSetupDeferred || isPureMember || isRegularUser || !hasTenantWorkspace;
  // The wizard is force-open (no dismiss) for every entry except the deferred case, which keeps
  // its transparent click-interceptor so the header sign-out stays reachable.
  // A user who chose "complete later" has NO tenant yet, so `!hasTenantWorkspace` would otherwise
  // keep the wizard force-open and loop them right back after skipping — explicitly exclude the
  // deferred state so the skip actually escapes to the (dismissible) deferred dashboard.
  const forceWorkspaceWizardOpen =
    !isWorkspaceSetupDeferred &&
    (requiresWorkspaceSetup || isPureMember || isRegularUser || !hasTenantWorkspace);
  const canViewMembers = me.authorization.canViewMembers === true || me.authorization.canManageMembers === true;
  const canManageMembers = me.authorization.canManageMembers === true;
  /** True when the authenticated user is a NEXUS platform admin.
   *  Platform admins can access supply creation regardless of tenant context. */
  const isPlatformAdmin = me.authorization.isPlatformAdmin === true;
  /** True when the user may view/manage their tenant's own uploaded offers
   *  (Product Catalog page). Backed by supply.manage_offers / supply.ingest, so
   *  it resolves to owner, admin, and supply_manager (plus platform admins).
   *  This is UX only - the backend enforces the same gate on the ownedOnly view
   *  of GET /api/v1/offers/platform. */
  const canManageCatalog = me.authorization.canManageSupply === true || isPlatformAdmin;
  const firstName = user?.fullName?.split(/\s+/)[0] ?? me?.user.name?.split(/\s+/)[0];

  // Setup states: always show the full tenant admin dashboard behind a wizard overlay.
  // For requiresWorkspaceSetup: wizard is always visible (modal backdrop blurs the dashboard).
  // For isWorkspaceSetupDeferred: transparent interceptor catches all dashboard clicks and
  // opens the wizard. User sees the full dashboard but can't act until setup is complete.
  if (showWorkspaceOnboarding) {
    return (
      <>
        {/* Full tenant admin dashboard always visible in background */}
        <Routes>
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/business-setup" element={<BusinessSetupPage />} />
          <Route path="/" element={<DashboardLayout onLogout={logout} showBusinessSetup />}>
            <Route index element={<Home />} />
            <Route path="projects" element={<Lobby />} />
            <Route path="projects/new" element={<CreateProject />} />
            <Route path="users" element={<Members />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="points-gifts" element={<PointsGifts />} />
            <Route path="benefits-partnerships" element={<BenefitsPartnerships />} />
            <Route path="benefits-partnerships/edit-offer/:offerId" element={<EditOffer />} />
            <Route path="product-catalog" element={canManageCatalog ? <ProductCatalog /> : <Navigate to="/" replace />} />
            <Route
              path="supply/create"
              element={isTenantAdmin || isPlatformAdmin ? <CreateOffer /> : <Navigate to="/" replace />}
            />
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
            <Route path="settings/appearance" element={<AppearanceSettings />} />
            <Route path="settings/join-requests" element={<JoinRequestsSettings />} />
            <Route path="dev" element={<DevPlaygroundRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>

        {/* Transparent click interceptor for deferred state — opens wizard on any click.
            zIndex: 40 keeps it below the sticky header (z-50) so the user avatar
            and logout button remain clickable even while setup is pending. */}
        {isWorkspaceSetupDeferred && !isDeferredSetupOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40, cursor: 'default' }}
            onClick={() => setIsDeferredSetupOpen(true)}
            aria-hidden="true"
          />
        )}

        {/* Wizard overlay — force-open for new/member/regular/tenant-less users, toggled for deferred */}
        {(forceWorkspaceWizardOpen || isDeferredSetupOpen) && (
          <WorkspaceSetupModal
            onClose={forceWorkspaceWizardOpen ? () => undefined : () => setIsDeferredSetupOpen(false)}
            onFinished={async () => {
              setIsDeferredSetupOpen(false);
              await reloadMe();
            }}
            firstName={firstName}
            forceOpen={forceWorkspaceWizardOpen}
            skipToWallet={isPureMember || isRegularUser}
          />
        )}
      </>
    );
  }

  return (
    <Routes>
      <Route path="/api-docs" element={<ApiDocs />} />
      <Route path="/business-setup" element={isTenantAdmin ? <BusinessSetupPage /> : <Navigate to="/" replace />} />
      <Route path="/" element={<DashboardLayout onLogout={logout} showBusinessSetup={isTenantAdmin} />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<Lobby />} />
        <Route path="projects/new" element={<CreateProject />} />
        <Route path="users" element={canViewMembers ? <Members /> : <Navigate to="/" replace />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="points-gifts" element={<PointsGifts />} />
        <Route path="benefits-partnerships" element={<BenefitsPartnerships />} />
        <Route path="benefits-partnerships/edit-offer/:offerId" element={<EditOffer />} />
        <Route path="product-catalog" element={canManageCatalog ? <ProductCatalog /> : <Navigate to="/" replace />} />
        <Route
          path="supply/create"
          element={isTenantAdmin || isPlatformAdmin ? <CreateOffer /> : <Navigate to="/" replace />}
        />
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
        <Route path="settings/roles-permissions" element={canViewMembers ? <RolesPermissions /> : <Navigate to="/" replace />} />
        <Route path="settings/roles-permissions/invite" element={canManageMembers ? <InviteCollaborators /> : <Navigate to="/" replace />} />
        <Route path="settings/appearance" element={<AppearanceSettings />} />
        <Route path="settings/join-requests" element={canManageMembers ? <JoinRequestsSettings /> : <Navigate to="/" replace />} />
        <Route path="dev" element={<DevPlaygroundRoute />} />
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
      <Toaster richColors position="top-center" expand visibleToasts={5} />
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
