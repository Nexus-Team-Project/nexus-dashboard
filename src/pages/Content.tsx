import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { mockContent } from '../data/mockData';
import type { ContentItem } from '../types';

const Content = () => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>(mockContent);
  const [filterType, setFilterType] = useState<string>('all');
  const { t } = useLanguage();

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredContent = filterType === 'all'
    ? content
    : content.filter(item => item.type === filterType);

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDeleteContent'))) {
      setContent(content.filter(item => item.id !== id));
    }
  };

  const filters = [
    { key: 'all', label: t('all'), icon: 'apps' },
    { key: 'page', label: t('pages'), icon: 'description' },
    { key: 'post', label: t('posts'), icon: 'article' },
    { key: 'media', label: t('media'), icon: 'perm_media' },
  ];

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between flex-wrap gap-4 animate-pulse">
          <div>
            <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="h-12 w-36 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        </div>

        <div className="flex gap-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
              </div>
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="flex items-center justify-between">
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{t('content')}</h1>
          <p className="text-slate-500 dark:text-slate-400">ניהול תוכן האתר</p>
        </div>
        <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/25 flex items-center gap-2">
          <span className="material-icons text-xl">add</span>
          {t('addContent')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterType(filter.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
              filterType === filter.key
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-icons text-xl">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map(item => (
          <div key={item.id} className="bg-white dark:bg-card-dark rounded-3xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                item.type === 'page'
                  ? 'bg-violet-100 dark:bg-violet-900/30'
                  : item.type === 'post'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-purple-100 dark:bg-purple-900/30'
              }`}>
                <span className={`material-icons text-2xl ${
                  item.type === 'page'
                    ? 'text-violet-600'
                    : item.type === 'post'
                    ? 'text-green-600'
                    : 'text-purple-600'
                }`}>
                  {item.type === 'page' ? 'description' : item.type === 'post' ? 'article' : 'perm_media'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                  <span className="material-icons text-xl">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-slate-400 hover:text-red-600"
                >
                  <span className="material-icons text-xl">delete</span>
                </button>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('by')} {item.author} · {item.updatedAt}
            </p>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                item.status === 'published'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
              }`}>
                {t(item.status as 'published' | 'draft')}
              </span>
              <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                צפייה
                <span className="material-icons text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Content;
