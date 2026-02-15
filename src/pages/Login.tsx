import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import nexusWideLogo from '../assets/logos/Nexus_wide_logo_blak.png';

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('enterBothFields'));
      return;
    }

    onLogin();
    navigate('/');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={`flex min-h-screen bg-white dark:bg-[#0a0a0a] ${isRTL ? 'rtl' : 'ltr'} relative`}>
        {/* Logo - Position based on language */}
        <div className={`absolute top-8 z-30 ${isRTL ? 'left-8' : 'right-8 lg:left-1/2 lg:ml-8'}`}>
          <img src={nexusWideLogo} alt="Nexus" className="h-24 w-auto" />
        </div>

        {/* Language Switcher - Bottom Left Corner */}
        <div className="absolute bottom-8 left-8 z-30">
          <LanguageSwitcher />
        </div>

        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center px-8 sm:px-12 lg:px-24 xl:px-32 pt-16">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl font-semibold mb-3 tracking-tight text-[#111111] dark:text-white">
                {t('welcomeBack')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                {t('signInToAccount')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={() => console.log('Google sign in')}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 font-medium text-slate-700 dark:text-slate-200"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t('continueWithGoogle')}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium uppercase tracking-wider">
                  {t('or')}
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#111111] dark:focus:ring-white focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                  placeholder="name@company.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#111111] dark:focus:ring-white focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2 ${
                      isRTL ? 'left-2' : 'right-2'
                    }`}
                  >
                    <span className="material-icons text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-[#111111] focus:ring-[#111111] dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('rememberMe')}</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#111111] dark:text-white hover:underline font-medium"
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200"
              >
                {t('signIn')}
              </button>
            </form>

            {/* Terms */}
            <p className="mt-8 text-center text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {t('byProceeding')}
              <br/>
              <a className="underline hover:text-[#111111] dark:hover:text-white" href="#">
                {t('termsOfService')}
              </a>
              {' '}{t('and')}{' '}
              <a className="underline hover:text-[#111111] dark:hover:text-white" href="#">
                {t('privacyPolicy')}
              </a>
            </p>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                {t('dontHaveAccount')}{' '}
                <Link to="/signup" className="font-semibold text-[#111111] dark:text-white hover:underline">
                  {t('signUp')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Showcase */}
        <div className="hidden lg:flex w-1/2 bg-[#f7f7f7] dark:bg-[#1a1a1a] items-center justify-center p-24 overflow-hidden relative">
          {/* Background blur circles */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-200/40 dark:bg-slate-800/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-300/30 dark:bg-slate-800/30 blur-3xl rounded-full"></div>

          {/* Main Card */}
          <div className="relative z-10 w-full max-w-lg">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
              </div>

              {/* Card Content */}
              <div className="space-y-4">
                {/* Active Item */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold rounded uppercase">
                    {t('active')}
                  </div>
                </div>

                {/* Pending Item */}
                <div className="border-t border-slate-50 dark:border-slate-800 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="h-2 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                  </div>
                  <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded uppercase">
                    {t('pending')}
                  </div>
                </div>

                {/* Chart */}
                <div className="h-32 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-end p-4 gap-2">
                  <div className="flex-1 bg-[#111111] dark:bg-white h-2/3 rounded-sm opacity-20"></div>
                  <div className="flex-1 bg-[#111111] dark:bg-white h-full rounded-sm opacity-40"></div>
                  <div className="flex-1 bg-[#111111] dark:bg-white h-1/2 rounded-sm opacity-10"></div>
                  <div className="flex-1 bg-[#111111] dark:bg-white h-3/4 rounded-sm opacity-30"></div>
                  <div className="flex-1 bg-[#111111] dark:bg-white h-1/3 rounded-sm opacity-15"></div>
                </div>
              </div>
            </div>

            {/* Floating Card - Project Deployed */}
            <div
              className="absolute -top-12 -right-12 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 animate-bounce"
              style={{ animationDuration: '3s' }}
            >
              <span className="material-icons text-green-500">check_circle</span>
              <span className="text-xs font-semibold dark:text-white">
                {t('projectDeployed')}
              </span>
            </div>

            {/* Floating Card - Collaborators */}
            <div className="absolute -bottom-8 -left-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 transform rotate-3">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white dark:border-slate-800"></div>
                <div className="w-6 h-6 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"></div>
                <div className="w-6 h-6 rounded-full bg-slate-500 border-2 border-white dark:border-slate-800"></div>
              </div>
              <span className="text-xs font-medium dark:text-slate-300">
                {t('collaborators')}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
