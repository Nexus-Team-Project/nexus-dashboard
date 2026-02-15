import { NavLink } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const NavTiles = () => {
  const { t } = useLanguage();

  const navItems = [
    { to: '/', icon: 'dashboard', label: t('dashboard') },
    { to: '/users', icon: 'people_alt', label: t('users') },
    { to: '/content', icon: 'article', label: t('content') },
    { to: '/reports', icon: 'assessment', label: 'דוחות' },
    { to: '/marketing', icon: 'campaign', label: 'שיווק' },
    { to: '/premium', icon: 'diamond', label: 'פרימיום' },
    { to: '/updates', icon: 'sync', label: 'עדכונים' },
    { to: '/chat', icon: 'chat', label: 'צ\'אט' },
    { to: '/settings', icon: 'settings', label: t('settings') },
  ];

  return (
    <nav className="flex flex-wrap gap-4 items-center">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-3 rounded-xl w-24 h-24 transition-colors ${
              isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`
          }
          end={item.to === '/'}
        >
          <span className="material-icons mb-1">{item.icon}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-center">{item.label}</span>
        </NavLink>
      ))}
      <div className="flex-grow bg-slate-200 dark:bg-slate-800 rounded-xl h-24 flex items-center justify-center px-6 min-w-[200px]">
        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">רוצה תוצאות טובות יותר? שדרג עכשיו!</p>
      </div>
    </nav>
  );
};

export default NavTiles;
