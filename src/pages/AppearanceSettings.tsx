/**
 * Appearance settings sub-page ("מראה וממשק"), reached from the settings tile
 * grid. Hosts the organization branding editors - logo (Cloudinary) and brand
 * color (the wallet first-login accent). Uses the same sub-page shell as
 * RolesPermissions (breadcrumb + title + max-w-7xl container).
 */
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LogoSettingsCard from '../components/settings/LogoSettingsCard';
import BrandColorCard from '../components/settings/BrandColorCard';

const COPY = {
  he: {
    settings: 'הגדרות',
    title: 'מראה וממשק',
    body: 'צבע הארגון ולוגו הארגון - מה שחברי הארגון רואים באפליקציה ובארנק.',
  },
  en: {
    settings: 'Settings',
    title: 'Appearance',
    body: 'Your organization color and logo - what members see in the app and the wallet.',
  },
} as const;

/**
 * Renders the appearance sub-page: a breadcrumb header followed by the logo
 * and brand-color editor cards (each self-contained, admin-gated server-side).
 */
export default function AppearanceSettings() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const copy = COPY[language];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl space-y-6">
      <header>
        <nav className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="cursor-pointer hover:text-primary"
          >
            {copy.settings}
          </button>
          <span className="material-icons text-sm">{isRTL ? 'chevron_left' : 'chevron_right'}</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{copy.title}</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-normal text-slate-950 dark:text-white">{copy.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{copy.body}</p>
      </header>

      <LogoSettingsCard />
      <BrandColorCard />
    </div>
  );
}
