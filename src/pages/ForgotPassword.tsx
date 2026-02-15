import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { t, isRTL } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('enterEmail'));
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-background-dark to-slate-900 p-5 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl w-full max-w-md p-10 relative">
        <div className="absolute top-4 end-4">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-primary text-3xl">
              {submitted ? 'mark_email_read' : 'lock_reset'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('appName')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{t('resetYourPassword')}</p>
        </div>

        {!submitted ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t('enterEmailForReset')}
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('email')}</label>
              <div className="relative">
                <span className="material-icons absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/25"
            >
              {t('sendResetLink')}
            </button>

            <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
              {t('rememberPassword')}{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('signIn')}
              </Link>
            </p>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <span className="material-icons text-green-500 text-4xl">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('checkYourEmail')}</h3>
            <p className="text-slate-500 dark:text-slate-400">
              {t('resetLinkSent')} <strong className="text-slate-700 dark:text-slate-300">{email}</strong>
            </p>
            <p className="text-slate-400 text-sm">{t('didntReceiveEmail')}</p>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
            >
              {t('tryAgain')}
            </button>

            <Link to="/login" className="block text-primary hover:underline font-medium">
              {t('backToSignIn')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
