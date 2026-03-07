import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Users from './pages/Users';
import Content from './pages/Content';
import Settings from './pages/Settings';
import RolesPermissions from './pages/RolesPermissions';
import InviteCollaborators from './pages/InviteCollaborators';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AddTeamMembers from './pages/AddTeamMembers';
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

// Minimal spinner shown while session is being restored from cookie
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: '#000',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid #222',
          borderTopColor: '#fff',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Signup is handled by nexus-website — redirect there
function SignupRedirect() {
  const url = `${import.meta.env.VITE_WEBSITE_URL ?? 'http://localhost:5173'}/signup`;
  window.location.replace(url);
  return null;
}

function AppRoutes() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return <PageLoader />;

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupRedirect />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/add-team-members" element={<AddTeamMembers onComplete={() => {}} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/" element={<DashboardLayout onLogout={logout} />}>
            <Route index element={<Home />} />
            <Route path="projects" element={<Lobby />} />
            <Route path="users" element={<Users />} />
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
            <Route path="content" element={<Content />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/roles-permissions" element={<RolesPermissions />} />
            <Route path="settings/roles-permissions/invite" element={<InviteCollaborators />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
