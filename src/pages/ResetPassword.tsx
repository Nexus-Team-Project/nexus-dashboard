import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError(t('fillAllFields'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsNoMatch'));
      return;
    }

    setSuccess(true);
  };

  const handleGoToLogin = () => {
    navigate('/login');
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
              {success ? 'check_circle' : 'vpn_key'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('appName')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{t('createNewPassword')}</p>
        </div>

        {!success ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t('passwordMinLength')}
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('newPassword')}</label>
              <div className="relative">
                <span className="material-icons absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('confirmNewPassword')}</label>
              <div className="relative">
                <span className="material-icons absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/25"
            >
              {t('resetPassword')}
            </button>

            <p className="text-center">
              <Link to="/login" className="text-primary hover:underline font-medium text-sm">
                {t('backToSignIn')}
              </Link>
            </p>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <span className="material-icons text-green-500 text-4xl">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('passwordResetSuccess')}</h3>
            <p className="text-slate-500 dark:text-slate-400">{t('passwordChangedSuccess')}</p>
            <p className="text-slate-400 text-sm">{t('canSignInNow')}</p>

            <button
              onClick={handleGoToLogin}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/25"
            >
              {t('signIn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
