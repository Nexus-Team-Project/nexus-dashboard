import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface Project {
  id: string;
  name: string;
  url: string;
}

const ProjectSwitcher = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Current project (this would come from context/state in real app)
  const currentProject = {
    id: '1',
    name: 'Nexus-Online',
    url: 'https://nexus-online.com'
  };

  // Recent projects (would come from API/state in real app)
  const recentProjects: Project[] = [
    {
      id: '2',
      name: 'My Site 3',
      url: 'https://nexuswall.com'
    },
    {
      id: '3',
      name: 'SPAR Wallet',
      url: 'https://razeshel123.wi...'
    },
    {
      id: '6',
      name: 'Community Center',
      url: 'https://www.669.org.il/'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleProjectClick = (projectId: string) => {
    // In real app, this would switch the current project
    console.log('Switching to project:', projectId);
    setIsOpen(false);
  };

  const handleViewAllProjects = () => {
    setIsOpen(false);
    navigate('/projects');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="material-icons text-primary text-[18px]">web</span>
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex-1 truncate text-start">
          {currentProject.name}
        </span>
        <span className={`material-icons text-slate-500 text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-0 start-full ms-2 w-80 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-[9999]">
          {/* Current Project Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t('ps_currentProject')}
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {currentProject.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentProject.url}
            </p>
          </div>

          {/* Recent Projects */}
          <div className="py-2">
            <p className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('ps_recentProjects')}
            </p>
            {recentProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-start"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-icons text-slate-400 dark:text-slate-600 text-[18px]">
                    web_asset
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {project.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {project.url}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* View All Projects Button */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-2">
            <button
              onClick={handleViewAllProjects}
              className="w-full px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <span className="material-icons text-[18px]">grid_view</span>
              <span>{t('ps_allProjects')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;
