/**
 * Join-requests settings sub-page, reached from the settings tile grid. Lets a
 * tenant admin choose whether wallet join requests are auto-accepted or held for
 * manual approval. Mirrors the toggle in the /users join-requests panel (same
 * backend setting). Uses the same sub-page shell as RolesPermissions.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../i18n/LanguageContext';
import { tenantJoinRequestsApi } from '../lib/api';
import ToggleSwitch from '../components/ToggleSwitch';

const COPY = {
  he: {
    settings: 'הגדרות',
    title: 'בקשות הצטרפות',
    body: 'נהל כיצד מטופלות בקשות הצטרפות שמגיעות מהארנק.',
    soon: 'בקרוב',
    soonTitle: 'איסוף פרטי הצטרפות מותאמים אישית',
    soonBody:
      'בקרוב תוכלו להחליט אילו פרטים לאסוף ממשתמשים שמבקשים להצטרף לארגון - כדי להכיר אותם טוב יותר ולהתאים את ההטבות והחוויה לצרכים שלכם.',
  },
  en: {
    settings: 'Settings',
    title: 'Join requests',
    body: 'Manage how join requests coming from the wallet are handled.',
    soon: 'Coming soon',
    soonTitle: 'Custom join information',
    soonBody:
      'Soon you will be able to decide which details to collect from people who want to join your organization - so you can get to know your users and better tailor the benefits and experience to your needs.',
  },
} as const;

/**
 * Renders the join-requests sub-page: a breadcrumb header and a single card with
 * the auto-accept toggle. Loads the current setting on mount (skeleton until
 * ready) and persists changes optimistically, reverting + toasting on failure.
 */
export default function JoinRequestsSettings() {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const copy = COPY[language];

  const [autoAccept, setAutoAccept] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the tenant's auto-accept setting once on mount.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const r = await tenantJoinRequestsApi.getSettings();
        if (active) {
          setAutoAccept(r.autoAcceptEnabled);
          setReady(true);
        }
      } catch (err) {
        // Resolve the skeleton even on error; the backend still enforces access.
        console.error('[settings] join-request settings load failed:', err);
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /**
   * Optimistically flips auto-accept, persists it, and reverts on failure
   * (surfacing the error via a Sonner toast - the app-wide pattern).
   */
  const handleToggle = async (next: boolean): Promise<void> => {
    const previous = autoAccept;
    setAutoAccept(next);
    setSaving(true);
    try {
      const r = await tenantJoinRequestsApi.updateSettings(next);
      setAutoAccept(r.autoAcceptEnabled);
    } catch (err) {
      console.error('[settings] join-request settings update failed:', err);
      setAutoAccept(previous);
      toast.error(t('joinRequestsUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

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

      <div className="max-w-md rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-card-dark">
        {!ready ? (
          <div className="h-6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ) : (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('joinRequests')}</span>
            <ToggleSwitch
              checked={autoAccept}
              onChange={(next) => void handleToggle(next)}
              disabled={saving}
              aria-label={t('joinRequestsAriaLabel')}
            />
          </div>
        )}
        <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t('joinRequestsDesc')}</p>
      </div>

      {/* Coming-soon: custom join-information collection (placeholder, disabled). */}
      <div className="max-w-md rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm dark:from-slate-600 dark:to-slate-700">
            <span className="material-icons text-white">assignment</span>
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">{copy.soonTitle}</h3>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {copy.soon}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{copy.soonBody}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
