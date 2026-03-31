import { useState, useEffect } from 'react';

interface SetupAnimationProps {
  onComplete: () => void;
}

const STEPS = [
  { icon: '⚙️', text: 'מגדירים את סביבת העבודה...' },
  { icon: '🔗', text: 'מחברים הטבות ושותפויות...' },
  { icon: '📦', text: 'מכינים את הכלים שלכם...' },
  { icon: '✨', text: 'מייצרים את הדאשבורד...' },
];

const SetupAnimation = ({ onComplete }: SetupAnimationProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= STEPS.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [onComplete]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-500">
      {/* Animated icon */}
      <div className="text-6xl mb-8 animate-bounce">
        {STEPS[currentStep].icon}
      </div>

      {/* Step text */}
      <p
        key={currentStep}
        className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {STEPS[currentStep].text}
      </p>

      {/* Progress bar */}
      <div className="w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-violet-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step counter */}
      <p className="text-xs text-slate-400 mt-3">
        {currentStep + 1} / {STEPS.length}
      </p>
    </div>
  );
};

export default SetupAnimation;
