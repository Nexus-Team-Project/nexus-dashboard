import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface CompanySetupProps {
  onComplete: () => void;
}

const CompanySetup = ({ onComplete }: CompanySetupProps) => {
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [role, setRole] = useState('');
  const [goal, setGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const goalOptions = [
    { value: 'manage_content', label: 'ניהול תוכן' },
    { value: 'user_management', label: 'ניהול משתמשים' },
    { value: 'analytics', label: 'מעקב וניתוח נתונים' },
    { value: 'team_collaboration', label: 'שיתוף פעולה צוותי' },
    { value: 'project_management', label: 'ניהול פרויקטים' },
    { value: 'customer_service', label: 'שירות לקוחות' },
    { value: 'other', label: 'אחר' },
  ];

  const employeeCountOptions = [
    { value: '1-10', label: '1-10 עובדים' },
    { value: '11-50', label: '11-50 עובדים' },
    { value: '51-200', label: '51-200 עובדים' },
    { value: '201-500', label: '201-500 עובדים' },
    { value: '501+', label: '501+ עובדים' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!companyName || !companyId || !employeeCount || !role || !goal) {
      setError('יש למלא את כל השדות');
      return;
    }

    if (goal === 'other' && !customGoal.trim()) {
      setError('יש להזין את המטרה שלך במערכת');
      return;
    }

    // Company setup complete
    onComplete();
    navigate('/add-team-members');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-background-dark to-slate-900 p-5 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl w-full max-w-2xl p-10 relative">
        <div className="absolute top-4 end-4">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-primary text-3xl">business</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">הגדרת החברה</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">ספר לנו קצת על החברה שלך</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                שם החברה <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-icons absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">business</span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="שם החברה"
                />
              </div>
            </div>

            {/* Company ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ח.פ / ע.מ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-icons absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">tag</span>
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="123456789"
                />
              </div>
            </div>

            {/* Number of Employees */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                מספר עובדים <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-icons absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">groups</span>
                <select
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">בחר...</option>
                  {employeeCountOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                תפקידך בחברה <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-icons absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">work</span>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="מנהל מוצר, מפתח, מעצב..."
                />
              </div>
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              מה המטרה שלך במערכת? <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="material-icons absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">flag</span>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">בחר מטרה...</option>
                {goalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Custom Goal Input - Shows when "Other" is selected */}
          {goal === 'other' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                פרט את המטרה שלך <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-icons absolute start-4 top-4 text-slate-400 text-xl">edit_note</span>
                <textarea
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  rows={3}
                  className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  placeholder="תאר את המטרה שלך במערכת..."
                />
              </div>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/25"
            >
              המשך להוספת חברי צוות
            </button>

            <button
              type="button"
              onClick={() => {
                onComplete();
                navigate('/add-team-members');
              }}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
            >
              דלג
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySetup;
