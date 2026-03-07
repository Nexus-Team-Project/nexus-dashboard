import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';
import nexusWideLogo from '../assets/logos/Nexus_wide_logo_blak.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, isRTL } = useLanguage();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError(t('enterBothFields')); return; }
    setIsSubmitting(true);
    try {
      await login(email, password);
      // Auth state update triggers App.tsx to render dashboard routes
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      setError(e.message || t('invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex min-h-screen bg-white dark:bg-[#0a0a0a] ${isRTL ? 'rtl' : 'ltr'} relative`}>
      <div className={`absolute top-8 z-30 ${isRTL ? 'left-8' : 'right-8 lg:left-1/2 lg:ml-8'}`}>
        <img src={nexusWideLogo} alt="Nexus" className="h-24 w-auto" />
      </div>
      <div className="absolute bottom-8 left-8 z-30"><LanguageSwitcher /></div>

      {/* Left Side — Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center px-8 sm:px-12 lg:px-24 xl:px-32 pt-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-4xl font-semibold mb-3 tracking-tight text-[#111111] dark:text-white">
              {t('welcomeBack')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">{t('signInToAccount')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#111111] focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#111111] focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors p-2 ${isRTL ? 'left-2' : 'right-2'}`}
                >
                  <span className="material-icons text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-[#111111] dark:text-white hover:underline font-medium"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('signIn')}...
                </span>
              ) : (
                t('signIn')
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              {t('dontHaveAccount')}{' '}
              <a
                href={`${import.meta.env.VITE_WEBSITE_URL ?? 'http://localhost:5173'}/signup`}
                className="font-semibold text-[#111111] dark:text-white hover:underline"
              >
                {t('signUp')}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side — Showcase */}
      <div className="hidden lg:flex w-1/2 bg-[#f7f7f7] dark:bg-[#1a1a1a] items-center justify-center p-24 overflow-hidden relative">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-200/40 blur-3xl rounded-full"></div>
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-100 dark:border-slate-800 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-bold rounded uppercase">
                  {t('active')}
                </div>
              </div>
              <div className="h-32 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-end p-4 gap-2">
                <div className="flex-1 bg-[#111111] dark:bg-white h-2/3 rounded-sm opacity-20"></div>
                <div className="flex-1 bg-[#111111] dark:bg-white h-full rounded-sm opacity-40"></div>
                <div className="flex-1 bg-[#111111] dark:bg-white h-1/2 rounded-sm opacity-10"></div>
                <div className="flex-1 bg-[#111111] dark:bg-white h-3/4 rounded-sm opacity-30"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
