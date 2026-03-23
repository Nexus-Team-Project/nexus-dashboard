import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import type { Language } from '../i18n/translations';

interface SettingsTile {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const settingsTiles: SettingsTile[] = [
    {
      id: 'roles',
      title: 'תפקידים והרשאות',
      description: 'נהל תפקידי משתמשים והרשאות גישה למערכת',
      icon: 'shield',
      color: 'bg-gradient-to-br from-violet-500 to-violet-600',
      path: '/settings/roles-permissions'
    },
    {
      id: 'general',
      title: 'הגדרות כלליות',
      description: 'שם האתר, תיאור, שפה והגדרות בסיסיות',
      icon: 'tune',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      path: '/settings/general'
    },
    {
      id: 'notifications',
      title: 'התראות',
      description: 'הגדר העדפות התראות אימייל ו-push',
      icon: 'notifications',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      path: '/settings/notifications'
    },
    {
      id: 'security',
      title: 'אבטחה',
      description: 'סיסמאות, אימות דו-שלבי ומכשירים מחוברים',
      icon: 'security',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      path: '/settings/security'
    },
    {
      id: 'appearance',
      title: 'מראה וממשק',
      description: 'ערכות נושא, צבעים ועיצוב הממשק',
      icon: 'palette',
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      path: '/settings/appearance'
    },
    {
      id: 'integrations',
      title: 'אינטגרציות',
      description: 'חיבורים לשירותים חיצוניים ו-APIs',
      icon: 'extension',
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      path: '/settings/integrations'
    },
    {
      id: 'billing',
      title: 'חשבוניות ותשלומים',
      description: 'ניהול מנויים, תשלומים והיסטוריית חשבוניות',
      icon: 'credit_card',
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      path: '/settings/billing'
    },
    {
      id: 'advanced',
      title: 'מתקדם',
      description: 'הגדרות מתקדמות למשתמשים מנוסים',
      icon: 'settings_suggest',
      color: 'bg-gradient-to-br from-slate-600 to-slate-700',
      path: '/settings/advanced'
    }
  ];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  if (loading) {
    return (
      <>
        <div className="mb-8 animate-pulse">
          <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
          <div className="h-5 w-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl mb-4"></div>
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{t('settings')}</h1>
        <p className="text-slate-500 dark:text-slate-400">נהל את הגדרות המערכת והעדפות האפליקציה שלך</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {settingsTiles.map(tile => (
          <button
            key={tile.id}
            onClick={() => navigate(tile.path)}
            className="group bg-white dark:bg-card-dark rounded-3xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-xl hover:shadow-slate-900/5 dark:hover:shadow-slate-900/20 hover:-translate-y-1 transition-all duration-300 text-start"
          >
            <div className={`w-14 h-14 ${tile.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
              <span className="material-icons text-white text-2xl">{tile.icon}</span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
              {tile.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {tile.description}
            </p>
            <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm font-medium">פתח</span>
              <span className="material-icons text-sm ml-1">arrow_back</span>
            </div>
          </button>
        ))}
      </div>

      {/* Language Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('language')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t('languageDesc')}</p>
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-6 max-w-md">
          <div className="flex gap-3">
            <button
              onClick={() => handleLanguageChange('he')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                language === 'he'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <span className="text-lg mb-1 block">🇮🇱</span>
              עברית
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                language === 'en'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <span className="text-lg mb-1 block">🇺🇸</span>
              English
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
