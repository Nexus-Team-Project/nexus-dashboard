import { MAIN_STEPS, SUB_STEPS, type SubStepId } from './types';
import { useLanguage } from '../../i18n/LanguageContext';

interface SetupSidebarProps {
  currentStep: SubStepId;
  completedSteps: Set<string>;
  onStepClick: (stepId: SubStepId) => void;
}

export default function SetupSidebar({ currentStep, completedSteps, onStepClick }: SetupSidebarProps) {
  const { t } = useLanguage();
  // Find which main step is active
  const activeMainStep = MAIN_STEPS.find(m => m.subSteps.includes(currentStep));

  return (
    <nav className="w-[280px] shrink-0 border-e border-gray-200 bg-white h-full overflow-y-auto py-8 px-5">
      <div className="space-y-1">
        {MAIN_STEPS.map((main, mIdx) => {
          const isActive = activeMainStep?.id === main.id;
          const allSubsDone = main.subSteps.every(s => completedSteps.has(s));
          const someSubsDone = main.subSteps.some(s => completedSteps.has(s));

          return (
            <div key={main.id}>
              {/* Main step row */}
              <div className="flex items-start gap-3 py-2.5 relative">
                {/* Vertical line */}
                {mIdx < MAIN_STEPS.length - 1 && (
                  <div
                    className={`absolute top-10 w-[2px] h-[calc(100%-20px)] ${
                      allSubsDone ? 'bg-emerald-400' : 'bg-gray-200'
                    }`}
                    style={{ insetInlineStart: '14px' }}
                  />
                )}

                {/* Icon circle */}
                <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                  allSubsDone
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                  {allSubsDone ? (
                    <span className="material-symbols-rounded !text-[18px]">check</span>
                  ) : (
                    <span className="material-symbols-rounded !text-[18px]">{main.icon}</span>
                  )}
                </div>

                {/* Label */}
                <div className="pt-1">
                  <span className={`text-[13px] font-semibold leading-tight ${
                    allSubsDone
                      ? 'text-emerald-700'
                      : isActive
                      ? 'text-gray-900'
                      : someSubsDone
                      ? 'text-gray-700'
                      : 'text-gray-400'
                  }`}>
                    {t(main.labelKey)}
                  </span>
                </div>
              </div>

              {/* Sub-steps (only expand for "Verify your business" or active main step) */}
              {(main.id === 'verify_business' || isActive) && main.subSteps.length > 1 && (
                <div className="ms-[14px] ps-[16px] border-s-2 border-transparent space-y-0.5 pb-2">
                  {main.subSteps.map(subId => {
                    const sub = SUB_STEPS.find(s => s.id === subId)!;
                    const isSubActive = currentStep === subId;
                    const isSubDone = completedSteps.has(subId);

                    return (
                      <button
                        key={subId}
                        onClick={() => onStepClick(subId)}
                        className={`flex items-center gap-2.5 w-full text-start py-1.5 pe-2 rounded-md transition-colors text-[13px] ${
                          isSubActive
                            ? 'text-indigo-700 font-semibold bg-indigo-50/60'
                            : isSubDone
                            ? 'text-emerald-600 hover:bg-gray-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {/* Dot indicator */}
                        <div className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                          isSubDone
                            ? 'bg-emerald-500'
                            : isSubActive
                            ? 'bg-indigo-600 ring-2 ring-indigo-200'
                            : 'bg-gray-300'
                        }`} />
                        <span>{t(sub.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
