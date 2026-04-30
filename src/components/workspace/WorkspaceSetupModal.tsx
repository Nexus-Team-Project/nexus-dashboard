/**
 * Hosts the workspace setup flow and persists onboarding choices to backend APIs.
 * The backend remains the source of truth for tenant/member status.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingWizard from './OnboardingWizard';
import SetupAnimation from './SetupAnimation';
import ScheduleStep from './ScheduleStep';
import type { OnboardingData } from './OnboardingWizard';
import nexusBlackLogo from '../../assets/logos/Nexus_wide_logo_blak.png';
import { onboardingApi, type SkipReason } from '../../lib/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface WorkspaceSetupModalProps {
  onClose: () => void;
  onFinished?: () => Promise<unknown> | unknown;
  firstName?: string;
  forceOpen?: boolean;
}

type Phase = 'wizard' | 'skip_choice' | 'animation' | 'schedule';

const SKIP_COPY = {
  he: {
    title: 'איך תרצו להמשיך?',
    body: 'אפשר להמשיך כמשתמש רגיל או לשמור את הקמת סביבת העבודה להמשך.',
    regularUser: 'אני רוצה להמשיך כמשתמש רגיל',
    completeLater: 'אני רוצה להשלים את הקמת העסק / הארגון מאוחר יותר',
    back: 'חזרה',
  },
  en: {
    title: 'How would you like to continue?',
    body: 'You can continue as a regular user or come back to workspace setup later.',
    regularUser: 'I want to continue as a regular user',
    completeLater: 'I want to complete business/workspace setup later',
    back: 'Back',
  },
} as const;

const WorkspaceSetupModal = ({ onClose, onFinished, firstName, forceOpen = false }: WorkspaceSetupModalProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const savingText = language === 'he' ? 'שומר...' : 'Saving...';
  const setupErrorText = language === 'he' ? 'שמירת סביבת העבודה נכשלה' : 'Workspace setup failed';
  const skipErrorText = language === 'he' ? 'הדילוג נכשל' : 'Skip failed';
  const skipCopy = SKIP_COPY[language];
  const [phase, setPhase] = useState<Phase>('wizard');
  const [, setOnboardingData] = useState<OnboardingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Creates a tenant workspace through the protected backend API.
   * Input: validated wizard data.
   * Output: tenant onboarding context is persisted and animation begins.
   */
  const handleWizardComplete = async (data: OnboardingData) => {
    setIsSubmitting(true);
    setError(null);
    setOnboardingData(data);
    try {
      await onboardingApi.createWorkspace({
        organizationName: data.org_name,
        website: data.website,
        businessDescription: data.business_desc,
        selectedUseCases: data.primary_use_cases,
        contactPhone: data.phone,
        contactRole: data.role,
      });
      await onFinished?.();
      setPhase('animation');
    } catch (err) {
      setError(err instanceof Error ? err.message : setupErrorText);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Advances from setup animation to the optional schedule screen.
   * Input: none.
   * Output: local modal phase changes.
   */
  const handleAnimationComplete = () => {
    setPhase('schedule');
  };

  /**
   * Closes onboarding and keeps the user in the dashboard.
   * Input: none.
   * Output: modal closes and dashboard route is selected.
   */
  const handleExplore = () => {
    onClose();
    navigate('/');
  };

  /**
   * Closes onboarding after the schedule step.
   * Input: none.
   * Output: modal closes and dashboard route is selected.
   */
  const handleSchedule = () => {
    onClose();
    navigate('/');
  };

  /**
   * Persists the explicit skip choice selected by the user.
   * Input: skip reason chosen in the localized choice screen.
   * Output: backend onboarding state is updated and the modal closes.
   */
  const handleSkipChoice = async (skipReason: SkipReason) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onboardingApi.skipWorkspace(skipReason);
      await onFinished?.();
      onClose();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : skipErrorText);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Opens the explicit skip choice screen instead of choosing a mode for the user.
   * Input: none.
   * Output: local modal phase changes.
   */
  const handleSkip = () => {
    setError(null);
    setPhase('skip_choice');
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={phase === 'wizard' ? onClose : undefined}
      />

      {/* Modal content — centered with padding */}
      <div
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7vh 1rem', overflowY: 'auto' }}
      >
        {phase === 'wizard' && (
          <div className="relative w-full flex justify-center">
            <OnboardingWizard
              onComplete={handleWizardComplete}
              onBack={onClose}
              onSkip={handleSkip}
              firstName={firstName}
            />
            {(isSubmitting || error) && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[120] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
                {isSubmitting ? savingText : <span className="text-red-600">{error}</span>}
              </div>
            )}
          </div>
        )}

        {phase === 'skip_choice' && (
          <div className="ws-modal" dir={language === 'he' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-4" dir="ltr">
              <img src={nexusBlackLogo} alt="Nexus" className="h-10 w-auto object-contain" />
            </div>
            <div className="ws-content flex items-center justify-center">
              <section className="w-full max-w-2xl">
                <h1 className="text-[24px] font-bold text-slate-950">{skipCopy.title}</h1>
                <p className="mt-2 text-[14px] leading-6 text-slate-500">{skipCopy.body}</p>
                <div className="mt-8 grid gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSkipChoice('regular_user')}
                    disabled={isSubmitting}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-start text-sm font-semibold text-slate-900 transition-colors hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60"
                  >
                    {skipCopy.regularUser}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSkipChoice('complete_later')}
                    disabled={isSubmitting}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-start text-sm font-semibold text-slate-900 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
                  >
                    {skipCopy.completeLater}
                  </button>
                </div>
                {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
              </section>
            </div>
            <div className="ws-footer-between">
              <button
                type="button"
                onClick={() => setPhase('wizard')}
                className="text-[14px] text-slate-400 transition-colors hover:text-slate-600"
              >
                {skipCopy.back}
              </button>
              {isSubmitting && <span className="text-sm text-slate-500">{savingText}</span>}
            </div>
          </div>
        )}

        {phase === 'animation' && (
          <SetupAnimation onComplete={handleAnimationComplete} />
        )}

        {phase === 'schedule' && (
          <ScheduleStep
            onBackToSite={handleSchedule}
            onExplore={handleExplore}
          />
        )}
      </div>

      {/* ── Shared modal card styles ──────────────────────────────────── */}
      <style>{`
        ${forceOpen ? '.ws-modal { pointer-events: auto; }' : ''}
        .ws-modal {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: min(92vw, 1100px);
          min-height: 600px;
          max-height: 86vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 32px 64px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06);
          animation: wsIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .ws-content {
          flex: 1;
          overflow-y: auto;
          padding: 2.5rem 3rem;
        }
        .ws-footer {
          border-top: 1px solid #f1f5f9;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }
        .ws-footer-between {
          border-top: 1px solid #f1f5f9;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }
        @keyframes wsIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
};

export default WorkspaceSetupModal;
