import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  avatarColor: string;
  role: string;
  joinedDate: string;
  isCurrentUser?: boolean;
}

const RolesPermissions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const collaborators: Collaborator[] = [
    {
      id: '1',
      name: 'מאיר עזורי',
      email: 'mazuri0675@gmail.com',
      initials: 'מ',
      avatarColor: 'bg-green-700',
      role: 'Admin (Co-Owner)',
      joinedDate: 'Jun 13, 2024'
    },
    {
      id: '2',
      name: 'רז אשל',
      email: 'razeshel123@gmail.com',
      initials: 'ר',
      avatarColor: 'bg-violet-600',
      role: 'Admin (Co-Owner)',
      joinedDate: 'Jun 11, 2024',
      isCurrentUser: true
    },
    {
      id: '3',
      name: 'Adir Digmi',
      email: 'adirdigmi@gmail.com',
      initials: 'A',
      avatarColor: 'bg-purple-600',
      role: 'Admin (Co-Owner)',
      joinedDate: 'Jul 24, 2025'
    },
    {
      id: '4',
      name: 'arikz',
      email: 'arikz@yonipro.com',
      initials: 'A',
      avatarColor: 'bg-teal-600',
      role: 'Marketing Manager',
      joinedDate: 'Feb 1, 2026'
    },
    {
      id: '5',
      name: 'barsossover',
      email: 'barsossover@nexusus.onmicrosoft.com',
      initials: 'B',
      avatarColor: 'bg-orange-500',
      role: 'Marketing Manager',
      joinedDate: 'Jan 25, 2026'
    },
    {
      id: '6',
      name: 'דניאל כהן',
      email: 'daniel@example.com',
      initials: 'ד',
      avatarColor: 'bg-pink-600',
      role: 'Designer',
      joinedDate: 'Dec 15, 2025'
    },
    {
      id: '7',
      name: 'Sarah Miller',
      email: 'sarah.m@example.com',
      initials: 'S',
      avatarColor: 'bg-indigo-600',
      role: 'Content Editor',
      joinedDate: 'Nov 8, 2025'
    },
    {
      id: '8',
      name: 'יוסי לוי',
      email: 'yossi@example.com',
      initials: 'י',
      avatarColor: 'bg-cyan-600',
      role: 'Developer',
      joinedDate: 'Oct 22, 2025'
    }
  ];

  const filteredCollaborators = collaborators.filter(collab => {
    const matchesSearch = collab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collab.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || collab.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        {/* Skeleton Navigation */}
        <nav className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          </div>
        </nav>

        {/* Skeleton Header */}
        <div className="mb-8">
          <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>

        {/* Skeleton Banner */}
        <div className="bg-white dark:bg-card-dark rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-800">
          <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
          <div className="w-full max-w-md h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-3"></div>
          <div className="h-3 w-80 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>

        {/* Skeleton Filters */}
        <div className="flex items-center gap-6 mb-6">
          <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-10 w-44 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg ml-auto"></div>
        </div>

        {/* Skeleton Table */}
        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex gap-6">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="border-b border-slate-200 dark:border-slate-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Navigation */}
      <nav className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <button onClick={() => navigate('/settings')} className="hover:text-primary transition-colors">
            הגדרות
          </button>
          <span className="material-icons text-sm">chevron_left</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">תפקידים והרשאות</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
            <span className="material-icons text-lg ml-2">settings</span>
            ניהול תפקידים
          </button>
          <button
            onClick={() => navigate('/settings/roles-permissions/invite')}
            className="flex items-center px-6 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-md"
          >
            <span className="material-icons text-lg ml-2">add</span>
            הזמן משתפי פעולה
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center mb-1">
          <button
            onClick={() => navigate('/settings')}
            className="ml-3 text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-icons text-2xl">arrow_forward</span>
          </button>
          <h1 className="text-3xl font-bold tracking-tight">תפקידים והרשאות</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm mr-9">
          ראה מי יכול לעבוד באתר זה ואילו תפקידים הוקצו להם. <a className="text-primary hover:underline" href="#">למד עוד</a>
        </p>
      </header>

      {/* Collaborator Seats Banner */}
      <section className="bg-white dark:bg-card-dark rounded-xl p-6 mb-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <h2 className="font-semibold text-slate-800 dark:text-white ml-2">נותרו 2 מקומות למשתפי פעולה</h2>
              <span className="material-icons text-slate-400 text-base cursor-help" title="מבוסס על התוכנית הנוכחית שלך">info</span>
            </div>
            <div className="w-full max-w-md bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
              <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: '80%' }}></div>
            </div>
            <div className="flex items-center justify-between max-w-md text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>התוכנית הנוכחית שלך מאפשרת 10 מקומות למשתפי פעולה. כדי להוסיף עוד, שדרג את התוכנית שלך.</span>
              <span className="mr-4 whitespace-nowrap">8/10</span>
            </div>
          </div>
          <div>
            <button className="px-6 py-2 border-2 border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
              שדרג תוכנית
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-3">סטטוס</label>
            <div className="relative min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 pl-10 text-sm focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="all">הכל</option>
                <option value="active">פעיל</option>
                <option value="pending">ממתין</option>
              </select>
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
            </div>
          </div>
          <div className="flex items-center">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-3">תפקיד</label>
            <div className="relative min-w-[180px]">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 pl-10 text-sm focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="all">הכל</option>
                <option value="Admin (Co-Owner)">מנהל</option>
                <option value="Marketing Manager">מנהל שיווק</option>
                <option value="Designer">מעצב</option>
                <option value="Content Editor">עורך תוכן</option>
                <option value="Developer">מפתח</option>
              </select>
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
            </div>
          </div>
        </div>
        <div className="relative flex-grow max-w-md mr-auto">
          <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="חפש לפי אימייל או שם"
            type="text"
          />
        </div>
      </section>

      {/* Collaborators Table */}
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-violet-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                  שם
                  <span className="material-icons text-sm mr-1 text-primary">arrow_upward</span>
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">תפקידים</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">הצטרף ב</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCollaborators.map(collab => (
              <tr key={collab.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${collab.avatarColor} flex items-center justify-center text-white font-medium ml-4`}>
                      {collab.initials}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{collab.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{collab.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{collab.role}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm text-slate-500 dark:text-slate-400">הצטרף: {collab.joinedDate}</span>
                </td>
                <td className="px-6 py-5 text-left">
                  {collab.isCurrentUser ? (
                    <button className="inline-flex items-center px-4 py-1.5 text-xs font-medium text-primary border border-violet-100 dark:border-violet-900/30 rounded-full bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all">
                      <span className="material-icons text-sm ml-1">person_remove</span>
                      עזוב אתר
                    </button>
                  ) : (
                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
                      <span className="material-icons">more_horiz</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          מציג 1-{filteredCollaborators.length} מתוך {collaborators.length} משתפי פעולה
        </p>
        <div className="flex items-center gap-2">
          <button
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-primary disabled:opacity-50 transition-all"
            disabled
          >
            <span className="material-icons">chevron_right</span>
          </button>
          <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg">1</button>
          <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">2</button>
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-primary transition-all">
            <span className="material-icons">chevron_left</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;
