import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  url: string;
  imageUrl?: string;
  isPremium: boolean;
  isPublished: boolean;
}

const Lobby = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sample projects data
  const projects: Project[] = [
    {
      id: '1',
      name: 'Nexus-Online',
      url: 'https://nexus-online.com',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
      isPremium: true,
      isPublished: true
    },
    {
      id: '2',
      name: 'My Site 3',
      url: 'https://nexuswall.com',
      imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=250&fit=crop',
      isPremium: true,
      isPublished: true
    },
    {
      id: '3',
      name: 'SPAR Wallet',
      url: 'https://razeshel123.wi...',
      imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=250&fit=crop',
      isPremium: false,
      isPublished: true
    },
    {
      id: '4',
      name: 'My Site 4',
      url: 'לא פורסם',
      isPremium: false,
      isPublished: false
    },
    {
      id: '5',
      name: 'My Site 2',
      url: 'https://razeshel123.wi...',
      imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=250&fit=crop',
      isPremium: false,
      isPublished: true
    },
    {
      id: '6',
      name: 'Community Center',
      url: 'https://www.669.org.il/',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop',
      isPremium: true,
      isPublished: true
    },
    {
      id: '7',
      name: 'SHWAN MANAGEMENT',
      url: 'https://amitmizrachi2...',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop',
      isPremium: false,
      isPublished: true
    },
    {
      id: '8',
      name: 'Dev Sitex 507564',
      url: 'לא פורסם',
      isPremium: true,
      isPublished: false
    }
  ];

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full animate-pulse">
        {/* Skeleton Header */}
        <div className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 px-8 py-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
              <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Skeleton Filter Bar */}
        <div className="bg-white/50 dark:bg-slate-900/50 px-8 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Skeleton Projects Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-700 rounded-t-2xl"></div>
                <div className="p-4">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 px-8 py-6 flex-shrink-0">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">פרויקטים</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              צפה וניהל את כל הפרויקטים שלך במרחב עבודה אחד.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2">
              <span className="material-icons text-[18px]">create_new_folder</span>
              צור תיקייה חדשה
            </button>
            <button onClick={() => navigate('/projects/new')} className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2">
              <span className="material-icons text-[18px]">add</span>
              צור פרויקט חדש
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:border-slate-300 transition-colors">
                <span>כל הפרויקטים ({filteredProjects.length})</span>
                <span className="material-icons text-[16px]">expand_more</span>
              </button>
            </div>
            <button className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              ניהול תצוגה
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:ring-primary focus:border-primary w-64 outline-none"
                placeholder="חיפוש פרויקטים..."
              />
            </div>
            <button className="p-2 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors">
              <span className="material-icons text-[18px]">filter_alt</span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <span className="material-icons text-[18px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <span className="material-icons text-[18px]">list</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group bg-white dark:bg-card-dark rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {/* Project Preview */}
              <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center">
                    <span className="text-slate-300 dark:text-slate-700 material-icons text-4xl">
                      web_asset
                    </span>
                  </div>
                )}
                {project.isPremium && (
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider rounded">
                    Premium
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="p-4 flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate">{project.name}</h3>
                  <p
                    className={`text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 ${
                      !project.isPublished ? 'italic' : ''
                    }`}
                  >
                    {project.url}
                  </p>
                </div>
                <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <span className="material-icons text-[18px]">more_horiz</span>
                </button>
              </div>
            </div>
          ))}

          {/* New Project Card */}
          <button onClick={() => navigate('/projects/new')} className="group bg-transparent rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center p-8 aspect-[16/13]">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
              <span className="material-icons text-slate-400 group-hover:text-primary">
                add
              </span>
            </div>
            <p className="text-sm font-semibold">פרויקט חדש</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              התחל מתבנית
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
