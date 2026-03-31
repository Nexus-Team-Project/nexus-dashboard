interface ScheduleStepProps {
  onExplore: () => void;
  onSchedule: () => void;
}

const ScheduleStep = ({ onExplore, onSchedule }: ScheduleStepProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-500">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200/50 dark:shadow-green-900/20">
        <span className="material-symbols-rounded text-green-600 dark:text-green-400 !text-[40px]">check_circle</span>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        סביבת העבודה שלכם מוכנה! 🎉
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-10">
        הכל מוגדר ומוכן לשימוש. בחרו איך תרצו להמשיך.
      </p>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {/* Explore Dashboard */}
        <button
          onClick={onExplore}
          className="group p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 hover:border-primary rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 text-right"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-rounded !text-2xl">dashboard</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">עבור לדאשבורד</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">התחילו לחקור את סביבת העבודה</p>
        </button>

        {/* Schedule Call */}
        <button
          onClick={onSchedule}
          className="group p-6 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 rounded-2xl transition-all duration-200 hover:shadow-lg text-right"
        >
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-800 rounded-xl flex items-center justify-center text-violet-600 mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-rounded !text-2xl">calendar_month</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">קבעו שיחת הדרכה</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">15 דקות אינטרו עם הצוות שלנו</p>
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-400 mt-6">
        תמיד אפשר לקבוע שיחה מאוחר יותר דרך הדאשבורד
      </p>
    </div>
  );
};

export default ScheduleStep;
