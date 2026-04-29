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
  const [, setOnboardingData] = useState<OnboardingData | null>(null);

  const handleWizardComplete = (data: OnboardingData) => {
    setOnboardingData(data);
    console.log('📦 Workspace setup data:', data);
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
    onClose();
    navigate('/');
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
          <OnboardingWizard
            onComplete={handleWizardComplete}
            onBack={onClose}
            firstName="רז"
          />
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
