import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingWizard from './OnboardingWizard';
import SetupAnimation from './SetupAnimation';
import ScheduleStep from './ScheduleStep';
import type { OnboardingData } from './OnboardingWizard';

interface WorkspaceSetupModalProps {
  onClose: () => void;
}

type Phase = 'wizard' | 'animation' | 'schedule';

const WorkspaceSetupModal = ({ onClose }: WorkspaceSetupModalProps) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('wizard');
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  const handleWizardComplete = (data: OnboardingData) => {
    setOnboardingData(data);
    console.log('📦 Workspace setup data:', data);
    // In production: POST /api/user/workspace/setup
    setPhase('animation');
  };

  const handleAnimationComplete = () => {
    setPhase('schedule');
  };

  const handleExplore = () => {
    onClose();
    navigate('/');
  };

  const handleSchedule = () => {
    // In production: open Calendly link
    onClose();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={phase === 'wizard' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-card-dark rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-violet-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-rounded text-white !text-xl">domain_add</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Workspace Setup</h1>
              <p className="text-xs text-slate-400">
                {phase === 'wizard' && 'הגדרת בית עסק חדש'}
                {phase === 'animation' && 'מכינים הכל בשבילכם...'}
                {phase === 'schedule' && 'הכל מוכן!'}
              </p>
            </div>
          </div>

          {phase === 'wizard' && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <span className="material-symbols-rounded text-slate-400 !text-xl">close</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-8 pb-8 overflow-y-auto max-h-[calc(90vh-80px)]">
          {phase === 'wizard' && (
            <OnboardingWizard
              onComplete={handleWizardComplete}
              onBack={onClose}
            />
          )}

          {phase === 'animation' && (
            <SetupAnimation onComplete={handleAnimationComplete} />
          )}

          {phase === 'schedule' && (
            <ScheduleStep
              onExplore={handleExplore}
              onSchedule={handleSchedule}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSetupModal;
