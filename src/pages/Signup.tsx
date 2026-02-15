import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import RisingBubbles from '../components/RisingBubbles';
import nexusWideLogo from '../assets/logos/Nexus_wide_logo_blak.png';

interface SignupProps {
  onSignup: () => void;
}

type SignupStep = 1 | 2 | 3 | 4 | 5;
type UserType = 'individual' | 'organization' | '';

const Signup = ({ onSignup }: SignupProps) => {
  const [step, setStep] = useState<SignupStep>(1);
  const [darkMode, setDarkMode] = useState(false);

  // Step 1: Email
  const [email, setEmail] = useState('');

  // Step 2: Verification Code
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);

  // Step 3: Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Step 4: Personal Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 5: Usage Preferences
  const [userType, setUserType] = useState<UserType>('');
  const [usageGoals, setUsageGoals] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  // Step 1: Email Submit
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('יש להזין כתובת אימייל');
      return;
    }

    if (!agreeToTerms) {
      setError('יש לאשר את תנאי השימוש על מנת להמשיך');
      return;
    }

    setStep(2);
  };

  // Step 2: Verification Code Submit
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = verificationCode.join('');

    if (code.length !== 6) {
      setError('יש להזין קוד בן 6 ספרות');
      return;
    }

    if (code !== '111111') {
      setError('קוד אימות שגוי');
      return;
    }

    setStep(3);
  };

  // Step 3: Password Submit
  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('יש למלא את כל השדות');
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsNoMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    setStep(4);
  };

  // Step 4: Personal Details Submit
  const handleStep4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !phone) {
      setError('יש למלא את כל השדות');
      return;
    }

    setStep(5);
  };

  // Step 5: Usage Preferences Submit
  const handleStep5Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userType) {
      setError('יש לבחור סוג משתמש');
      return;
    }

    if (usageGoals.length === 0) {
      setError('יש לבחור לפחות מטרה אחת');
      return;
    }

    onSignup();

    if (userType === 'organization') {
      navigate('/company-setup');
    } else {
      navigate('/add-team-members');
    }
  };

  const toggleUsageGoal = (goal: string) => {
    setUsageGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
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

        {/* Left Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center px-8 sm:px-12 lg:px-24 xl:px-32 py-12 overflow-y-auto pt-16">
          <div className="w-full max-w-md">

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s === step
                      ? 'w-8 bg-[#111111] dark:bg-white'
                      : s < step
                      ? 'w-2 bg-[#111111]/50 dark:bg-white/50'
                      : 'w-2 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Email */}
            {step === 1 && (
              <>
                <div className="mb-10">
                  <h1 className="text-4xl font-semibold mb-3 tracking-tight text-[#111111] dark:text-white">
                    צור חשבון חדש
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    הצטרף אלינו והתחל ליצור היום
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleStep1Submit}>
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Google Sign Up Button */}
                  <button
                    type="button"
                    onClick={() => console.log('Google sign up')}
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

                  {/* Terms Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#111111] focus:ring-[#111111] dark:border-slate-600"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      אני מאשר/ת את{' '}
                      <a href="#" className="underline hover:text-[#111111] dark:hover:text-white font-medium">
                        תנאי השימוש
                      </a>
                      {' '}ו
                      <a href="#" className="underline hover:text-[#111111] dark:hover:text-white font-medium">
                        מדיניות הפרטיות
                      </a>
                      {' '}<span className="text-red-500">*</span>
                    </span>
                  </label>

                  {/* Continue Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                  >
                    המשך
                  </button>

                  {/* Sign In Link */}
                  <div className="mt-8 text-center">
                    <p className="text-slate-600 dark:text-slate-400">
                      {t('alreadyHaveAccount')}{' '}
                      <Link to="/login" className="font-semibold text-[#111111] dark:text-white hover:underline">
                        {t('signIn')}
                      </Link>
                    </p>
                  </div>
                </form>
              </>
            )}

            {/* Step 2: Verification Code */}
            {step === 2 && (
              <>
                <div className="mb-10">
                  <h1 className="text-4xl font-semibold mb-3 tracking-tight text-[#111111] dark:text-white">
                    אימות מייל
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    הזן את קוד האימות שנשלח ל<br />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleStep2Submit}>
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-center gap-3" dir="ltr">
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold bg-[#f7f7f7] dark:bg-[#1a1a1a] border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#111111] dark:focus:ring-white focus:border-[#111111] dark:focus:border-white outline-none transition-all"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                  >
                    אמת קוד
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => console.log('Resend code')}
                      className="text-sm text-[#111111] dark:text-white hover:underline font-medium"
                    >
                      שלח קוד שוב
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-3.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200"
                  >
                    חזור
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <>
                <div className="mb-10">
                  <h1 className="text-4xl font-semibold mb-3 tracking-tight text-[#111111] dark:text-white">
                    הגדרת סיסמה
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    צור סיסמה חזקה לאבטחת החשבון שלך
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleStep3Submit}>
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

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

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('confirmPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        className={`w-full px-4 py-3.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border-2 rounded-lg focus:ring-2 outline-none transition-all placeholder:text-slate-400 dark:text-white ${
                          confirmPasswordTouched && confirmPassword
                            ? password === confirmPassword
                              ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                              : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-800 focus:ring-[#111111] dark:focus:ring-white focus:border-transparent'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2 ${
                          isRTL ? 'left-2' : 'right-2'
                        }`}
                      >
                        <span className="material-icons text-lg">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {confirmPasswordTouched && confirmPassword && password !== confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {t('passwordsNoMatch')}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                  >
                    המשך
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200"
                  >
                    חזור
                  </button>
                </form>
              </>
            )}

            {/* Step 4: Personal Details */}
            {step === 4 && (
              <>
                <div className="mb-10">
                  <h1 className="text-4xl font-semibold mb-3 tracking-tight text-[#111111] dark:text-white">
                    פרטים אישיים
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    השלם את הפרטים האישיים שלך
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleStep4Submit}>
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      שם פרטי
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#111111] dark:focus:ring-white focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                      placeholder="דניאל"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      שם משפחה
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#111111] dark:focus:ring-white focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                      placeholder="רביב"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      טלפון
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#111111] dark:focus:ring-white focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                      placeholder="050-1234567"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                  >
                    המשך
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full py-3.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200"
                  >
                    חזור
                  </button>
                </form>
              </>
            )}

            {/* Step 5: Usage Preferences */}
            {step === 5 && (
              <>
                <div className="mb-10">
                  <h1 className="text-4xl font-semibold mb-3 tracking-tight text-[#111111] dark:text-white">
                    ספר לנו עליך
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    מה תרצה לעשות במערכת?
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleStep5Submit}>
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      אני רוצה ל: <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'loyalty_club', label: 'לבנות מועדון הטבות', icon: 'loyalty' },
                        { value: 'digital_wallet', label: 'לבנות ארנק דיגיטלי', icon: 'account_balance_wallet' },
                        { value: 'give_gifts', label: 'לתת מתנות', icon: 'card_giftcard' },
                        { value: 'manage_members', label: 'לנהל חברים', icon: 'groups' },
                      ].map((goal) => (
                        <label
                          key={goal.value}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            usageGoals.includes(goal.value)
                              ? 'border-[#111111] dark:border-white bg-[#111111]/5 dark:bg-white/5'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={usageGoals.includes(goal.value)}
                            onChange={() => toggleUsageGoal(goal.value)}
                            className="w-5 h-5 rounded border-slate-300 text-[#111111] focus:ring-[#111111] dark:border-slate-600"
                          />
                          <span className={`material-icons text-2xl ${usageGoals.includes(goal.value) ? 'text-[#111111] dark:text-white' : 'text-slate-400'}`}>
                            {goal.icon}
                          </span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">
                            {goal.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      סוג משתמש <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label
                        className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-all ${
                          userType === 'individual'
                            ? 'border-[#111111] dark:border-white bg-[#111111]/5 dark:bg-white/5'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="userType"
                          value="individual"
                          checked={userType === 'individual'}
                          onChange={(e) => setUserType(e.target.value as UserType)}
                          className="sr-only"
                        />
                        <span className={`material-icons text-4xl ${userType === 'individual' ? 'text-[#111111] dark:text-white' : 'text-slate-400'}`}>
                          person
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          משתמש פרטי
                        </span>
                      </label>

                      <label
                        className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-all ${
                          userType === 'organization'
                            ? 'border-[#111111] dark:border-white bg-[#111111]/5 dark:bg-white/5'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="userType"
                          value="organization"
                          checked={userType === 'organization'}
                          onChange={(e) => setUserType(e.target.value as UserType)}
                          className="sr-only"
                        />
                        <span className={`material-icons text-4xl ${userType === 'organization' ? 'text-[#111111] dark:text-white' : 'text-slate-400'}`}>
                          business
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          ארגון / חברה
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                  >
                    {t('signUp')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-full py-3.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200"
                  >
                    חזור
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Showcase */}
        <div className="hidden lg:flex w-1/2 bg-[#f7f7f7] dark:bg-[#1a1a1a] items-center justify-center p-24 overflow-hidden relative">
          {/* Rising Bubbles Animation - Only on Step 1 */}
          {step === 1 && <RisingBubbles />}

          {/* Background blur circles */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-200/40 dark:bg-slate-800/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-300/30 dark:bg-slate-800/30 blur-3xl rounded-full"></div>

          {/* Main Card - Changes per step */}
          <div className="relative z-10 w-full max-w-lg">
            {step === 1 && (
              <div className="text-center space-y-6">
                <h2 className="text-4xl font-bold text-[#111111] dark:text-white">
                  מותגים מובילים
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
                  אלפי מותגים מובילים זמינים במערכת שלנו
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-[#111111] dark:bg-white rounded-3xl flex items-center justify-center mx-auto">
                  <span className="material-icons text-white dark:text-black" style={{ fontSize: '48px' }}>
                    mark_email_read
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-[#111111] dark:text-white">
                  אימות בטוח
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
                  אנחנו שומרים על החשבון שלך מאובטח עם אימות דו-שלבי
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-[#111111] dark:bg-white rounded-3xl flex items-center justify-center mx-auto">
                  <span className="material-icons text-white dark:text-black" style={{ fontSize: '48px' }}>
                    lock
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-[#111111] dark:text-white">
                  אבטחה מתקדמת
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
                  צור סיסמה חזקה כדי לשמור על החשבון שלך מאובטח לחלוטין
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-[#111111] dark:bg-white rounded-3xl flex items-center justify-center mx-auto">
                  <span className="material-icons text-white dark:text-black" style={{ fontSize: '48px' }}>
                    person
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-[#111111] dark:text-white">
                  הכר אותנו
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
                  ספר לנו קצת עליך כדי שנוכל להתאים את החוויה בשבילך
                </p>
              </div>
            )}

            {step === 5 && (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-[#111111] dark:bg-white rounded-3xl flex items-center justify-center mx-auto">
                  <span className="material-icons text-white dark:text-black" style={{ fontSize: '48px' }}>
                    tune
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-[#111111] dark:text-white">
                  התאמה אישית
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
                  בחר את המטרות שלך ונתחיל לבנות את הפתרון המושלם עבורך
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
