import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const recentUsers: never[] = [];
  const recentContent: never[] = [];

  // Determine time of day and get appropriate styling
  const getTimeBasedTheme = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      // Morning (5am-12pm)
      return {
        period: isRTL ? 'בוקר טוב' : 'Good morning',
        emoji: '☀️',
        textColor: 'text-amber-900',
        subTextColor: 'text-amber-700',
        bannerClass: 'morning-banner-bg border-amber-200/50',
        isDark: false,
      };
    } else if (hour >= 12 && hour < 17) {
      // Afternoon (12pm-5pm)
      return {
        period: isRTL ? 'אחר צהריים טובים' : 'Good afternoon',
        emoji: '🌤️',
        textColor: 'text-blue-900',
        subTextColor: 'text-blue-700',
        bannerClass: 'afternoon-banner-bg border-blue-200/50',
        isDark: false,
      };
    } else if (hour >= 17 && hour < 21) {
      // Evening (5pm-9pm)
      return {
        period: isRTL ? 'ערב טוב' : 'Good evening',
        emoji: '🌆',
        textColor: 'text-purple-900',
        subTextColor: 'text-purple-700',
        bannerClass: 'evening-banner-bg border-purple-200/50',
        isDark: false,
      };
    } else {
      // Night (9pm-5am)
      return {
        period: isRTL ? 'לילה טוב' : 'Good night',
        emoji: '🌙',
        textColor: 'text-white',
        subTextColor: 'text-slate-200',
        bannerClass: 'night-banner-bg border-slate-700/40',
        isDark: true,
      };
    }
  };

  const theme = getTimeBasedTheme();
  const userName = user?.fullName ?? '';
  const userImage = user?.avatarUrl;

  return (
    <>
      <style>{`
        @keyframes bannerEntrance {
          0% {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          60% {
            transform: translateY(5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .banner-entrance {
          opacity: 0;
          animation: bannerEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards;
        }
        .morning-banner-bg {
          background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }
        .morning-banner-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 251, 235, 0.75) 0%, rgba(254, 243, 199, 0.7) 100%);
        }
        .afternoon-banner-bg {
          background-image: url('https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }
        .afternoon-banner-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(240, 249, 255, 0.8) 0%, rgba(224, 242, 254, 0.75) 100%);
        }
        .evening-banner-bg {
          background-image: url('https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }
        .evening-banner-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(250, 245, 255, 0.8) 0%, rgba(252, 231, 243, 0.75) 100%);
        }
        .night-banner-bg {
          background-image: url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }
        .night-banner-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.6) 100%);
        }
      `}</style>
      <div className="page-content">
        {/* Time-based greeting banner */}
        <div className="w-full mb-4 banner-entrance">
          <div className={`${theme.bannerClass} rounded-xl px-6 py-4 shadow-lg border-2 transition-all duration-300 hover:shadow-xl`}>
            <div className="flex items-center justify-center gap-4 relative z-10">
              {userImage && (
                <img
                  src={userImage}
                  alt={userName}
                  className={`w-16 h-16 rounded-full border-3 shadow-md object-cover ${
                    theme.isDark ? 'border-white/20' : 'border-white/70'
                  }`}
                />
              )}
              <div className="text-center space-y-1">
                <h1 className={`text-2xl font-bold ${theme.textColor} flex items-center justify-center gap-2`}>
                  <span className="text-3xl">{theme.emoji}</span>
                  <span>{theme.period}, {userName}</span>
                </h1>
                <p className={`text-sm ${theme.subTextColor} font-medium`}>
                  {isRTL ? 'שמחים לראות אותך שוב' : 'Happy to see you again'}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* TODO: event-based org stats will go here */}
      </div>
    </>
  );
};

export default Dashboard;
