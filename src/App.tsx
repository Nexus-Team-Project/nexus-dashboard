import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { DevModeProvider } from './contexts/DevModeContext';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Users from './pages/Users';
import Content from './pages/Content';
import Settings from './pages/Settings';
import RolesPermissions from './pages/RolesPermissions';
import InviteCollaborators from './pages/InviteCollaborators';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AddTeamMembers from './pages/AddTeamMembers';
import Lobby from './pages/Lobby';
import CompanySetup from './pages/CompanySetup';
import PointsGifts from './pages/PointsGifts';
import SendGiftEvent from './pages/SendGiftEvent';
import SendGiftBrands from './pages/SendGiftBrands';
import SendGiftGreeting from './pages/SendGiftGreeting';
import SendGiftRecipients from './pages/SendGiftRecipients';
import SendGiftSummary from './pages/SendGiftSummary';
import BenefitsPartnerships from './pages/BenefitsPartnerships';
import EditBenefit from './pages/EditBenefit';
import Loader from './pages/Loader';
import ApiDocs from './pages/ApiDocs';
import Organizations from './pages/Organizations';
import OrgDetail from './pages/OrgDetail';
import SmsCampaign from './pages/SmsCampaign';
import Inbox from './pages/Inbox';
import CreateProject from './pages/CreateProject';
import Transactions from './pages/Transactions';
import DevPlayground from './pages/DevPlayground';

function App() {
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

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('Sarah');
  const [userImage, setUserImage] = useState('https://lh3.googleusercontent.com/a/default-user');

  const handleLogin = () => {
    setIsLoading(true);
  };

  const handleSignup = () => {
    setIsOnboarding(true);
  };

  const handleCompleteOnboarding = () => {
    setIsOnboarding(false);
    setIsLoading(true);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <DevModeProvider>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {isLoading ? (
            <>
              <Route path="/loader" element={<Loader onComplete={handleLoadingComplete} userName={userName} userImage={userImage} />} />
              <Route path="*" element={<Navigate to="/loader" replace />} />
            </>
          ) : !isAuthenticated && !isOnboarding ? (
            <>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : isOnboarding ? (
            <>
              <Route path="/company-setup" element={<CompanySetup onComplete={() => {}} />} />
              <Route path="/add-team-members" element={<AddTeamMembers onComplete={handleCompleteOnboarding} />} />
              <Route path="*" element={<Navigate to="/company-setup" replace />} />
            </>
          ) : (
            <>
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/" element={<DashboardLayout onLogout={handleLogout} />}>
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
      </BrowserRouter>
    </LanguageProvider>
    </DevModeProvider>
  );
}

export default App;
