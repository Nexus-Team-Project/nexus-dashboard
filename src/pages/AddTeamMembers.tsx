import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface TeamMember {
  id: string;
  email: string;
}

interface AddTeamMembersProps {
  onComplete?: () => void;
}

const AddTeamMembers = ({ onComplete }: AddTeamMembersProps) => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', email: '' }
  ]);

  const addMember = () => {
    const newId = (teamMembers.length + 1).toString();
    setTeamMembers([...teamMembers, { id: newId, email: '' }]);
  };

  const removeMember = (id: string) => {
    if (teamMembers.length > 1) {
      setTeamMembers(teamMembers.filter(member => member.id !== id));
    }
  };

  const updateMemberEmail = (id: string, email: string) => {
    setTeamMembers(teamMembers.map(member =>
      member.id === id ? { ...member, email } : member
    ));
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/');
    }
  };

  const handleInvite = () => {
    // Filter out empty emails
    const validEmails = teamMembers.filter(member => member.email.trim() !== '');

    if (validEmails.length > 0) {
      // Here you would send the invites to your backend
      console.log('Inviting team members:', validEmails);
    }

    if (onComplete) {
      onComplete();
    } else {
      navigate('/');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-background-dark to-slate-900 p-5 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl w-full max-w-2xl p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-primary text-3xl">group_add</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">הזמן את הצוות שלך</h1>
          <p className="text-slate-500 dark:text-slate-400">
            הוסף חברי צוות מהארגון שלך. כל משתמש יקבל הרשאות בסיסיות שניתן לשנות מאוחר יותר.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
              <span className="material-icons text-sm">check</span>
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">פרטי חשבון</span>
          </div>
          <div className="w-12 h-0.5 bg-primary"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">2</div>
            <span className="text-xs font-medium text-slate-900 dark:text-white">הזמן צוות</span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Team Members List */}
          <div className="space-y-3">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="flex gap-3 items-start">
                <div className="flex-1 relative">
                  <span className="material-icons absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">email</span>
                  <input
                    type="email"
                    value={member.email}
                    onChange={(e) => updateMemberEmail(member.id, e.target.value)}
                    className="w-full ps-12 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder={`דוא"ל של חבר צוות ${index + 1}`}
                  />
                </div>
                {teamMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    title="הסר משתמש"
                  >
                    <span className="material-icons">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <button
            type="button"
            onClick={addMember}
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <span className="material-icons">add</span>
            הוסף עוד חבר צוות
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <span className="material-icons text-violet-600 dark:text-violet-400 text-xl">info</span>
            <div className="flex-1">
              <p className="text-sm text-violet-900 dark:text-violet-100 font-medium mb-1">הרשאות ברירת מחדל</p>
              <p className="text-xs text-violet-700 dark:text-violet-300">
                כל חברי הצוות שתזמין יקבלו הרשאות צפייה בלבד. תוכל לשנות את ההרשאות בכל עת מהגדרות הצוות.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            דלג לעכשיו
          </button>
          <button
            onClick={handleInvite}
            className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/25"
          >
            שלח הזמנות
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
          תוכל להזמין חברי צוות נוספים בכל עת מהגדרות החשבון
        </p>
      </div>
    </div>
  );
};

export default AddTeamMembers;
