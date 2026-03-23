import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PointsGifts = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'סה"כ נקודות שחולקו', value: '12,450', icon: 'trending_up', color: 'text-violet-600' },
    { label: 'מתנות שנשלחו', value: '86', icon: 'card_giftcard', color: 'text-green-600' },
    { label: 'יתרה נוכחית', value: '5,200 ₪', icon: 'account_balance_wallet', color: 'text-primary' },
    { label: 'משתמשים פעילים', value: '234', icon: 'people', color: 'text-purple-600' },
  ];

  const recentGifts = [
    { id: 1, recipient: 'דניאל רביב', event: 'חתונה', amount: '500 ₪', date: '22/01/2026', status: 'נשלח' },
    { id: 2, recipient: 'שרה כהן', event: 'יום הולדת', amount: '200 ₪', date: '20/01/2026', status: 'נשלח' },
    { id: 3, recipient: 'יוסי לוי', event: 'ותק', amount: '350 ₪', date: '18/01/2026', status: 'נשלח' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
            <div className="h-5 w-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="h-12 w-40 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>

        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Table */}
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">נקודות ומתנות</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            נהל והעבר מתנות ונקודות למשתמשים שלך
          </p>
        </div>
        <button
          onClick={() => navigate('/send-gift/event')}
          className="px-6 py-3 bg-primary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
        >
          <span className="material-icons text-[20px]">card_giftcard</span>
          <span>שלח מתנה</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                <span className="material-icons text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Gifts */}
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">מתנות אחרונות</h2>
          <button className="text-sm text-primary hover:underline font-medium">
            הצג הכל
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 text-right">נמען</th>
                <th className="px-6 py-4 text-right">אירוע</th>
                <th className="px-6 py-4 text-right">סכום</th>
                <th className="px-6 py-4 text-right">תאריך</th>
                <th className="px-6 py-4 text-right">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentGifts.map((gift) => (
                <tr key={gift.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-violet-400 rounded-full flex items-center justify-center text-white font-bold">
                        {gift.recipient.charAt(0)}
                      </div>
                      <span className="font-medium">{gift.recipient}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-sm font-medium">
                      {gift.event}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{gift.amount}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{gift.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                      {gift.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 p-6 rounded-2xl border border-violet-200 dark:border-violet-800">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-violet-600 mb-4">
            <span className="material-icons text-2xl">history</span>
          </div>
          <h3 className="font-bold text-lg mb-2">היסטוריית מתנות</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            צפה בכל המתנות שנשלחו בעבר
          </p>
          <button className="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium">
            עבור להיסטוריה →
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6 rounded-2xl border border-green-200 dark:border-green-800">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-green-600 mb-4">
            <span className="material-icons text-2xl">analytics</span>
          </div>
          <h3 className="font-bold text-lg mb-2">דוחות וניתוח</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            קבל תובנות על השימוש במתנות
          </p>
          <button className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium">
            צפה בדוחות →
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6 rounded-2xl border border-purple-200 dark:border-purple-800">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-purple-600 mb-4">
            <span className="material-icons text-2xl">settings</span>
          </div>
          <h3 className="font-bold text-lg mb-2">הגדרות מתנות</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            נהל סוגי מתנות וערכים מותרים
          </p>
          <button className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium">
            עבור להגדרות →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointsGifts;
