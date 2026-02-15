import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface RoleCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  roles?: string[];
}

const InviteCollaborators = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const roleCategories: RoleCategory[] = [
    {
      id: 'cms',
      title: 'CMS Roles',
      description: 'Manage site content, blog posts, and dynamic data',
      icon: 'description',
      iconColor: 'text-primary',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'general',
      title: 'General Roles',
      description: 'Admin, Owner, and basic site contributor access',
      icon: 'dashboard',
      iconColor: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-800'
    },
    {
      id: 'billing',
      title: 'Billing Roles',
      description: 'Manage subscriptions, invoices, and payment methods',
      icon: 'payments',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      id: 'marketing',
      title: 'Marketing & Customer Management',
      description: 'SEO, analytics, and customer communication tools',
      icon: 'campaign',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      id: 'stores',
      title: 'Stores Roles',
      description: 'Product management, orders, and fulfillment',
      icon: 'storefront',
      iconColor: 'text-sky-600',
      bgColor: 'bg-sky-50 dark:bg-sky-900/20'
    }
  ];

  const handleSendInvite = () => {
    // Handle send invite logic here
    console.log('Sending invite to:', emails);
    navigate('/settings/roles-permissions');
  };

  const handleCancel = () => {
    navigate('/settings/roles-permissions');
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        {/* Skeleton Header */}
        <header className="mb-8">
          {/* Skeleton Breadcrumb */}
          <nav className="flex items-center gap-2 mb-4">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div>
                <div className="h-9 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Skeleton Banner */}
          <section className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
            <div className="w-full md:max-w-md h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-2"></div>
            <div className="h-3 w-80 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </section>

          {/* Skeleton Emails Section */}
          <section className="bg-white dark:bg-card-dark p-8 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="h-14 w-full bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </section>

          {/* Skeleton Select Roles Section */}
          <section className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Skeleton Header */}
            <div className="p-8 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 w-full max-w-lg bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 w-full max-w-md bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
            </div>

            {/* Skeleton Role Categories */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div>
                      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                      <div className="h-3 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>

            {/* Skeleton Create Custom Role */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 w-full max-w-md bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
          <button onClick={() => navigate('/settings')} className="hover:text-primary transition-colors">
            הגדרות
          </button>
          <span className="material-icons text-sm">chevron_left</span>
          <button onClick={() => navigate('/settings/roles-permissions')} className="hover:text-primary transition-colors">
            תפקידים והרשאות
          </button>
          <span className="material-icons text-sm">chevron_left</span>
          <span className="text-slate-900 dark:text-white">הזמן משתפי פעולה</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <span className="material-icons">arrow_forward</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">הזמן משתפי פעולה לאתר</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                הזמן משתפי פעולה לעבוד באתר זה והקצה את התפקידים וההרשאות שלהם.{' '}
                <a className="text-primary hover:underline" href="#">למד עוד</a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
            >
              ביטול
            </button>
            <button
              onClick={handleSendInvite}
              className="px-8 py-2.5 text-sm font-semibold bg-primary text-white rounded-full hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
            >
              שלח הזמנה
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Collaborator Seats Banner */}
        <section className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold">נותרו 2 מקומות למשתפי פעולה</span>
              <span className="material-icons text-slate-500 text-sm cursor-help">info</span>
            </div>
            <div className="w-full md:max-w-md bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '80%' }}></div>
            </div>
            <div className="flex justify-between md:max-w-md mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">התוכנית הנוכחית שלך מאפשרת 10 מקומות למשתפי פעולה.</p>
              <span className="text-xs font-medium text-slate-500">8/10</span>
            </div>
          </div>
          <button className="px-5 py-2 text-sm font-medium border border-purple-200 dark:border-purple-900 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
            שדרג תוכנית
          </button>
        </section>

        {/* Emails Section */}
        <section className="bg-white dark:bg-card-dark p-8 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">כתובות אימייל</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">0/10 אימיילים</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">הזן את כתובות האימייל של משתפי הפעולה שלך:</p>
          <div className="relative">
            <input
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
              placeholder="name@example.com"
              type="text"
            />
          </div>
        </section>

        {/* Select Roles Section */}
        <section className="bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">בחר תפקידים</h2>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-md transition-colors">
                    <span className="material-icons text-base">auto_awesome</span>
                    עזור לי לבחור תפקיד
                  </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  בחר תפקיד אחד או יותר עבור האנשים שאתה מזמין. לכל תפקיד יש הרשאות שונות.<br />
                  <span className="text-xs opacity-75">אינך יכול להקצות תפקידים הכוללים הרשאות שאין לך. <a className="text-primary hover:underline" href="#">למד עוד</a></span>
                </p>
              </div>
              <div className="relative">
                <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 pl-4 py-2.5 w-full md:w-64 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="חפש תפקידים"
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Role Categories */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {roleCategories.map((category) => (
              <div key={category.id} className="accordion-item">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-right group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${category.bgColor} flex items-center justify-center`}>
                      <span className={`material-icons ${category.iconColor}`}>{category.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{category.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{category.description}</p>
                    </div>
                  </div>
                  <span className={`material-icons text-slate-500 group-hover:text-primary transition-all ${expandedCategory === category.id ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>
            ))}
          </div>

          {/* Create Custom Role */}
          <div className="p-8 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
            <button className="flex items-start gap-3 text-right group">
              <div className="mt-0.5 w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <span className="material-icons text-sm font-bold">add</span>
              </div>
              <div>
                <span className="text-sm font-bold text-primary block group-hover:underline">צור תפקיד מותאם אישית</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">תפקידים מותאמים אישית מאפשרים לך ליצור תפקיד עם כל שילוב של הרשאות שאתה צריך.</p>
              </div>
            </button>
          </div>
        </section>
      </div>

      {/* Mobile Fixed Bottom Buttons */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-3 shadow-2xl">
        <button
          onClick={handleCancel}
          className="flex-1 py-3 text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-full"
        >
          ביטול
        </button>
        <button
          onClick={handleSendInvite}
          className="flex-1 py-3 text-sm font-semibold bg-primary text-white rounded-full shadow-lg"
        >
          שלח הזמנה
        </button>
      </div>
    </div>
  );
};

export default InviteCollaborators;
