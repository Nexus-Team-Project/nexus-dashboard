import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceSetupModal from '../components/workspace/WorkspaceSetupModal';

interface DevCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  action: () => void;
}

const DevPlayground = () => {
  const navigate = useNavigate();
  const [showWorkspaceSetup, setShowWorkspaceSetup] = useState(false);

  const devCards: DevCard[] = [
    {
      id: 'workspace-setup',
      title: 'Workspace Setup',
      description: 'תהליך האונבורדינג להגדרת בית עסק חדש — Wizard עם 3 שלבים, אנימציה, ומסך סיום',
      icon: 'domain_add',
      color: 'text-violet-600',
      bgGradient: 'from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 border-violet-200 dark:border-violet-800',
      action: () => setShowWorkspaceSetup(true),
    },
    {
      id: 'send-gift',
      title: 'Send Gift Flow',
      description: 'אשף שליחת מתנות — 5 שלבים: אירוע, מותג, ברכה, נמענים, תשלום',
      icon: 'card_giftcard',
      color: 'text-green-600',
      bgGradient: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800',
      action: () => navigate('/send-gift/event'),
    },
    {
      id: 'company-setup',
      title: 'Company Setup (Legacy)',
      description: 'הגדרת חברה ישנה — CompanySetup + AddTeamMembers',
      icon: 'business',
      color: 'text-amber-600',
      bgGradient: 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800',
      action: () => navigate('/company-setup'),
    },
    {
      id: 'business-setup',
      title: 'Business Setup',
      description: 'תהליך הפעלת חשבון בסגנון Stripe — 5 שלבי ראשי, 11 תת-שלבים, 91 שדות',
      icon: 'verified',
      color: 'text-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800',
      action: () => navigate('/business-setup'),
    },
    {
      id: 'loader',
      title: 'Loader Animation',
      description: 'אנימציית הטעינה שמופיעה אחרי התחברות',
      icon: 'hourglass_top',
      color: 'text-sky-600',
      bgGradient: 'from-sky-50 to-sky-100 dark:from-sky-950 dark:to-sky-900 border-sky-200 dark:border-sky-800',
      action: () => navigate('/loader'),
    },
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
              <span className="material-symbols-rounded text-white !text-xl">code_blocks</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dev Playground</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">בחר פלואו לתצוגה מקדימה ובדיקה</p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {devCards.map((card) => (
            <button
              key={card.id}
              onClick={card.action}
              className={`group text-right bg-gradient-to-br ${card.bgGradient} border p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className={`w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center ${card.color} mb-4 shadow-sm group-hover:shadow-md transition-shadow`}>
                <span className="material-symbols-rounded !text-[28px]">{card.icon}</span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">{card.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{card.description}</p>
              <div className={`mt-4 flex items-center gap-1 ${card.color} text-sm font-medium`}>
                <span>הפעל</span>
                <span className="material-symbols-rounded !text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Setup Modal */}
      {showWorkspaceSetup && (
        <WorkspaceSetupModal onClose={() => setShowWorkspaceSetup(false)} />
      )}
    </>
  );
};

export default DevPlayground;
