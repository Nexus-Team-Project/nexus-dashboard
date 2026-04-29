import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MAIN_STEPS, SUB_STEPS, STEP_ORDER, type SubStepId } from './types';
import { useDevMode } from '../../contexts/DevModeContext';
import { useLanguage } from '../../i18n/LanguageContext';

const WIDGET_KEY = 'nexus_bsg_expanded';
const STORAGE_KEY = 'nexus_business_setup';

function loadProgress(): { currentStep: SubStepId; completedSteps: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { currentStep, completedSteps } = JSON.parse(raw);
      return { currentStep, completedSteps: completedSteps ?? [] };
    }
  } catch { /* ignore */ }
  return { currentStep: 'business_type', completedSteps: [] };
}

export default function BusinessSetupGuide() {
  const navigate = useNavigate();
  const { isDevMode } = useDevMode();
  const { t } = useLanguage();

  // When DevMode toolbar is open (h-12 = 48px), sit above it; otherwise hug the bottom
  const bottomClass = isDevMode ? 'bottom-16' : 'bottom-4';

  // First load → expanded; after toggle → persisted
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem(WIDGET_KEY);
    return stored === null ? true : stored === '1';
  });

  // Sync progress from localStorage (in case user completed steps on the setup page)
  const [progress, setProgress] = useState(loadProgress);

  // Poll for updates when the widget is visible (user may navigate back from setup page)
  useEffect(() => {
    const sync = () => setProgress(loadProgress());
    window.addEventListener('focus', sync);
    const timer = setInterval(sync, 2000);
    return () => { window.removeEventListener('focus', sync); clearInterval(timer); };
  }, []);

  // Persist expand/collapse
  useEffect(() => {
    localStorage.setItem(WIDGET_KEY, isExpanded ? '1' : '0');
  }, [isExpanded]);

  const completedSet = new Set(progress.completedSteps);
  const totalSteps = STEP_ORDER.length;
  const doneCount = completedSet.size;
  const progressPct = Math.round((doneCount / totalSteps) * 100);

  // If all done, don't show widget
  if (doneCount >= totalSteps) return null;

  const handleContinue = () => {
    navigate('/business-setup');
  };

  // ─── Collapsed view ────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <div
        className={`fixed z-40 ${bottomClass} end-4 w-80 bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-xl shadow-black/[0.08] cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-black/[0.12]`}
        onClick={() => setIsExpanded(true)}
      >
        <div className="p-4 flex items-center gap-3">
          {/* Rocket icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
            <span className="material-symbols-rounded text-white !text-[20px]">rocket_launch</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-gray-900">{t('bsg_title')}</span>
              <span className="text-xs font-medium text-gray-400">{doneCount}/{totalSteps}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <span className="material-symbols-rounded text-gray-400 !text-[18px] shrink-0">expand_less</span>
        </div>
      </div>
    );
  }

  // ─── Expanded view ─────────────────────────────────────────────
  return (
    <div
      className={`fixed z-40 ${bottomClass} end-4 w-80 bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-xl shadow-black/[0.08] transition-all duration-300`}
    >
      {/* Header */}
      <div className="p-5 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
            <span className="material-symbols-rounded text-white !text-[20px]">rocket_launch</span>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">{t('bsg_activateAccount')}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{doneCount} {t('bsg_outOf')} {totalSteps} {t('bsg_steps')} {t('bsg_completed')}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors -mt-1 -me-1"
        >
          <span className="material-symbols-rounded !text-[18px]">expand_more</span>
        </button>
      </div>

      {/* Circular progress */}
      <div className="flex justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="url(#prog-grad)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPct / 100)}`}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Steps list */}
      <div className="px-5 pb-2 space-y-1 max-h-[260px] overflow-y-auto custom-scrollbar">
        {MAIN_STEPS.map((main, mIdx) => {
          const allDone = main.subSteps.every(s => completedSet.has(s));
          const someDone = main.subSteps.some(s => completedSet.has(s));
          const isCurrentGroup = main.subSteps.includes(progress.currentStep);

          return (
            <div key={main.id}>
              <div className="flex items-center gap-2.5 py-1.5">
                {/* Status icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  allDone
                    ? 'bg-emerald-100 text-emerald-600'
                    : isCurrentGroup
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {allDone ? (
                    <span className="material-symbols-rounded !text-[14px]">check</span>
                  ) : (
                    <span className="text-[10px] font-bold">{mIdx + 1}</span>
                  )}
                </div>
                <span className={`text-[13px] ${
                    allDone
                      ? 'text-emerald-600 font-medium line-through decoration-emerald-300'
                      : isCurrentGroup
                      ? 'text-gray-900 font-semibold'
                      : someDone
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }`}>
                    {t(main.labelKey)}
                  </span>
              </div>

              {/* Sub-steps for verify_business (always show) */}
              {main.id === 'verify_business' && (
                <div className="ms-3 ps-3 border-s border-gray-100 space-y-0.5 mb-1">
                  {main.subSteps.map(subId => {
                    const sub = SUB_STEPS.find(s => s.id === subId)!;
                    const isDone = completedSet.has(subId);
                    const isCurrent = progress.currentStep === subId;
                    return (
                      <div key={subId} className="flex items-center gap-2 py-0.5 pe-1">
                        <div className={`w-[5px] h-[5px] rounded-full ${
                          isDone ? 'bg-emerald-500' : isCurrent ? 'bg-indigo-500' : 'bg-gray-300'
                        }`} />
                        <span className={`text-[12px] ${
                          isDone ? 'text-emerald-600' : isCurrent ? 'text-indigo-700 font-medium' : 'text-gray-400'
                        }`}>
                          {t(sub.labelKey)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="p-4 pt-3">
        <button
          onClick={handleContinue}
          className="w-full py-2.5 bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-rounded !text-[18px] ltr:rotate-180">arrow_back</span>
          <span>{t('bsg_continueSetup')}</span>
        </button>
      </div>
    </div>
  );
}
