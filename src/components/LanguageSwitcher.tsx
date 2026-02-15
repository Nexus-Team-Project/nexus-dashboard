import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
      <button
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          language === 'he'
            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
        onClick={() => setLanguage('he')}
      >
        עב
      </button>
      <button
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          language === 'en'
            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
