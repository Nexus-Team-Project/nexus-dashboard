import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import nexusLoaderAnimation from '../assets/logos/Nexus_Main_Loader_Animation.gif';

interface LoaderProps {
  onComplete?: () => void;
  userName?: string;
  userImage?: string;
}

const Loader = ({ onComplete }: LoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const { isRTL } = useLanguage();

  useEffect(() => {
    // Define messages inside useEffect to avoid dependency issues
    const messages = isRTL ? [
      'מכינים את סביבת העבודה שלך...',
      'טוענים את הפרויקטים שלך...',
      'מעדכנים את הנתונים...',
      'כמעט מוכן...',
    ] : [
      'Preparing your workspace...',
      'Loading your projects...',
      'Updating your data...',
      'Almost ready...',
    ];

    // Animate progress from 0 to 100 over 5 seconds using requestAnimationFrame
    const duration = 5000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(newProgress);

      // Update message based on progress
      if (newProgress < 25) {
        setCurrentMessage(messages[0]);
      } else if (newProgress < 50) {
        setCurrentMessage(messages[1]);
      } else if (newProgress < 75) {
        setCurrentMessage(messages[2]);
      } else if (newProgress < 100) {
        setCurrentMessage(messages[3]);
      }

      if (newProgress < 100) {
        requestAnimationFrame(animate);
      } else {
        // Start exit animation
        setIsExiting(true);
        // Call onComplete callback after exit animation
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 600);
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete, isRTL]);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
      <div className="flex min-h-screen bg-slate-50 items-start justify-center cursor-default transition-colors duration-1000 pt-32">
        <div
          className={`flex flex-col items-center select-none transition-all duration-500 ease-in-out ${
            isExiting ? 'opacity-0 -translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          {/* Loader Animation - Cropped 15% from bottom */}
          <div className="relative pointer-events-none w-[480px] h-[408px] overflow-hidden">
            <img
              src={nexusLoaderAnimation}
              alt="Loading..."
              className="w-[480px] h-[480px] object-contain absolute top-0 left-0"
              draggable="false"
            />
          </div>

          {/* Loading Message */}
          <div className="-mt-8 mb-6 text-center text-slate-600 font-medium text-base min-h-[24px] transition-all duration-300">
            {currentMessage}
          </div>

          {/* Linear Progress Bar */}
          <div className="w-[400px] max-w-full px-4 pointer-events-none">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-slate-600 to-slate-800 rounded-full shadow-lg relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    backgroundSize: '200% 100%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loader;
