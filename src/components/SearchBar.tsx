import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface SearchResult {
  id: string;
  type: 'page' | 'feature' | 'section';
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  path: string;
  breadcrumb: string;
  breadcrumbHe: string;
  icon?: string;
  relevanceScore: number;
}

const SearchBar = () => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Search content database
  const searchDatabase: SearchResult[] = [
    // Main Pages
    {
      id: 'home',
      type: 'page',
      title: 'Home',
      titleHe: 'בית',
      description: 'Main dashboard with overview and statistics',
      descriptionHe: 'דף הבית הראשי עם סקירה כללית וסטטיסטיקות',
      path: '/',
      breadcrumb: 'Home',
      breadcrumbHe: 'בית',
      icon: 'home',
      relevanceScore: 0
    },
    {
      id: 'projects',
      type: 'page',
      title: 'Projects',
      titleHe: 'פרויקטים',
      description: 'Manage and view all projects',
      descriptionHe: 'ניהול וצפייה בכל הפרויקטים',
      path: '/projects',
      breadcrumb: 'Projects',
      breadcrumbHe: 'פרויקטים',
      icon: 'work',
      relevanceScore: 0
    },
    {
      id: 'users',
      type: 'page',
      title: 'Users',
      titleHe: 'משתמשים',
      description: 'Manage users, roles, and permissions',
      descriptionHe: 'ניהול משתמשים, תפקידים והרשאות',
      path: '/users',
      breadcrumb: 'Users',
      breadcrumbHe: 'משתמשים',
      icon: 'people',
      relevanceScore: 0
    },
    {
      id: 'points-gifts',
      type: 'page',
      title: 'Points & Gifts',
      titleHe: 'נקודות ומתנות',
      description: 'Manage points system and gift sending',
      descriptionHe: 'ניהול מערכת נקודות ושליחת מתנות',
      path: '/points-gifts',
      breadcrumb: 'Points & Gifts',
      breadcrumbHe: 'נקודות ומתנות',
      icon: 'card_giftcard',
      relevanceScore: 0
    },
    {
      id: 'benefits',
      type: 'page',
      title: 'Benefits & Partnerships',
      titleHe: 'הטבות ושותפויות',
      description: 'Manage benefits, partnerships, and business relationships',
      descriptionHe: 'ניהול הטבות, שותפויות וקשרים עסקיים',
      path: '/benefits-partnerships',
      breadcrumb: 'Benefits & Partnerships',
      breadcrumbHe: 'הטבות ושותפויות',
      icon: 'handshake',
      relevanceScore: 0
    },
    {
      id: 'content',
      type: 'page',
      title: 'Content',
      titleHe: 'תוכן',
      description: 'Manage content and media',
      descriptionHe: 'ניהול תוכן ומדיה',
      path: '/content',
      breadcrumb: 'Content',
      breadcrumbHe: 'תוכן',
      icon: 'article',
      relevanceScore: 0
    },
    {
      id: 'settings',
      type: 'page',
      title: 'Settings',
      titleHe: 'הגדרות',
      description: 'Application settings and configuration',
      descriptionHe: 'הגדרות ותצורת האפליקציה',
      path: '/settings',
      breadcrumb: 'Settings',
      breadcrumbHe: 'הגדרות',
      icon: 'settings',
      relevanceScore: 0
    },
    {
      id: 'transactions',
      type: 'page',
      title: 'Transactions',
      titleHe: 'עסקאות',
      description: 'View and manage all transactions',
      descriptionHe: 'צפייה וניהול כל העסקאות',
      path: '/transactions',
      breadcrumb: 'Transactions',
      breadcrumbHe: 'עסקאות',
      icon: 'receipt_long',
      relevanceScore: 0
    },
    {
      id: 'product-catalog',
      type: 'page',
      title: 'Product Catalog',
      titleHe: 'קטלוג מוצרים',
      description: 'Browse and manage product catalog',
      descriptionHe: 'עיון וניהול קטלוג המוצרים',
      path: '/product-catalog',
      breadcrumb: 'Product Catalog',
      breadcrumbHe: 'קטלוג מוצרים',
      icon: 'inventory_2',
      relevanceScore: 0
    },
    {
      id: 'balances',
      type: 'page',
      title: 'Balances',
      titleHe: 'יתרות',
      description: 'View account balances and funds',
      descriptionHe: 'צפייה ביתרות חשבון וכספים',
      path: '/balances',
      breadcrumb: 'Balances',
      breadcrumbHe: 'יתרות',
      icon: 'account_balance_wallet',
      relevanceScore: 0
    },
    // Features
    {
      id: 'send-gift',
      type: 'feature',
      title: 'Send Gift',
      titleHe: 'שלח מתנה',
      description: 'Send gifts to users with customizable options',
      descriptionHe: 'שליחת מתנות למשתמשים עם אפשרויות מותאמות אישית',
      path: '/send-gift/event',
      breadcrumb: 'Points & Gifts > Send Gift',
      breadcrumbHe: 'נקודות ומתנות > שלח מתנה',
      icon: 'send',
      relevanceScore: 0
    },
    {
      id: 'roles-permissions',
      type: 'feature',
      title: 'Roles & Permissions',
      titleHe: 'תפקידים והרשאות',
      description: 'Manage user roles and access permissions',
      descriptionHe: 'ניהול תפקידי משתמשים והרשאות גישה',
      path: '/settings/roles-permissions',
      breadcrumb: 'Settings > Roles & Permissions',
      breadcrumbHe: 'הגדרות > תפקידים והרשאות',
      icon: 'admin_panel_settings',
      relevanceScore: 0
    },
    {
      id: 'invite-collaborators',
      type: 'feature',
      title: 'Invite Collaborators',
      titleHe: 'הזמן משתפי פעולה',
      description: 'Invite new team members and collaborators',
      descriptionHe: 'הזמנת חברי צוות ומשתפי פעולה חדשים',
      path: '/settings/roles-permissions/invite',
      breadcrumb: 'Settings > Roles & Permissions > Invite',
      breadcrumbHe: 'הגדרות > תפקידים והרשאות > הזמן',
      icon: 'person_add',
      relevanceScore: 0
    },
    {
      id: 'edit-benefit',
      type: 'feature',
      title: 'Edit Benefit',
      titleHe: 'עריכת הטבה',
      description: 'Edit and manage benefit details',
      descriptionHe: 'עריכה וניהול פרטי הטבה',
      path: '/benefits-partnerships',
      breadcrumb: 'Benefits & Partnerships > Edit',
      breadcrumbHe: 'הטבות ושותפויות > עריכה',
      icon: 'edit',
      relevanceScore: 0
    }
  ];

  // Fuzzy search algorithm
  const fuzzySearch = (searchTerm: string, text: string): number => {
    searchTerm = searchTerm.toLowerCase();
    text = text.toLowerCase();

    if (text.includes(searchTerm)) return 100;

    let score = 0;
    let termIndex = 0;

    for (let i = 0; i < text.length && termIndex < searchTerm.length; i++) {
      if (text[i] === searchTerm[termIndex]) {
        score++;
        termIndex++;
      }
    }

    return (score / searchTerm.length) * 50;
  };

  // Search function
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const searchResults = searchDatabase.map(item => {
      const isHebrew = language === 'he';
      const title = isHebrew ? item.titleHe : item.title;
      const description = isHebrew ? item.descriptionHe : item.description;
      const breadcrumb = isHebrew ? item.breadcrumbHe : item.breadcrumb;

      const titleScore = fuzzySearch(searchQuery, title) * 3;
      const descScore = fuzzySearch(searchQuery, description) * 1.5;
      const breadcrumbScore = fuzzySearch(searchQuery, breadcrumb);

      return {
        ...item,
        relevanceScore: titleScore + descScore + breadcrumbScore
      };
    })
    .filter(item => item.relevanceScore > 10)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8);

    setResults(searchResults);
    setSelectedIndex(0);
  };

  // Handle search input
  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(query);
    }, 150);

    return () => clearTimeout(debounce);
  }, [query, language]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if input is focused or search is open
      if (document.activeElement !== inputRef.current && !isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          if (isOpen && results.length > 0) {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          }
          break;
        case 'ArrowUp':
          if (isOpen && results.length > 0) {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
          }
          break;
        case 'Enter':
          if (isOpen && results.length > 0 && results[selectedIndex]) {
            e.preventDefault();
            handleNavigate(results[selectedIndex].path);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setQuery('');
          setIsExpanded(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsExpanded(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search when route changes
  useEffect(() => {
    setIsOpen(false);
    setQuery('');
    setIsExpanded(false);
  }, [location.pathname]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
    setIsExpanded(false);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      en: { page: 'Page', feature: 'Feature', section: 'Section' },
      he: { page: 'דף', feature: 'תכונה', section: 'קטע' }
    };
    return labels[language as 'en' | 'he'][type as 'page' | 'feature' | 'section'] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'page': return 'bg-primary/10 text-primary';
      case 'feature': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'section': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div
      ref={searchRef}
      className="relative"
    >
      {/* Collapsed state: plain icon button — takes zero extra space */}
      {!isExpanded && (
        <button
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          onClick={() => {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          title={language === 'he' ? 'חיפוש' : 'Search'}
        >
          <span className="material-symbols-rounded !text-[20px]">search</span>
        </button>
      )}

      {/* Expanded state: full input */}
      {isExpanded && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query) setIsOpen(true);
            }}
            className="w-64 ps-10 pe-10 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder={t('searchUsers')}
            autoFocus
          />
          {/* Search icon — start side (right in RTL, left in LTR) */}
          <div className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <span className="material-symbols-rounded text-slate-400 !text-[18px]">search</span>
          </div>
          {/* X button — end side (left in RTL, right in LTR) */}
          <div className="absolute end-3 top-1/2 -translate-y-1/2 z-10">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                if (query) {
                  setQuery('');
                  setIsOpen(false);
                  inputRef.current?.focus();
                } else {
                  setIsExpanded(false);
                  setIsOpen(false);
                  setQuery('');
                }
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center"
              tabIndex={-1}
            >
              <span className="material-symbols-rounded !text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full start-0 mt-2 w-[400px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[150]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'he' ? 'תוצאות חיפוש' : 'Search Results'}
            </span>
            <span className="text-xs text-slate-400">
              {results.length} {language === 'he' ? 'תוצאות' : 'results'}
            </span>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={result.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleNavigate(result.path);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-start gap-3 px-4 py-3 sm:px-6 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-start border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                  index === selectedIndex ? 'bg-slate-50 dark:bg-slate-700/50' : ''
                }`}
              >
                {result.icon && (
                  <span className="material-symbols-rounded !text-[20px] text-slate-400 dark:text-slate-500 mt-0.5 shrink-0">
                    {result.icon}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {language === 'he' ? result.titleHe : result.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getTypeColor(result.type)} shrink-0`}>
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {language === 'he' ? result.descriptionHe : result.description}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    {language === 'he' ? result.breadcrumbHe : result.breadcrumb}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↓</kbd>
                {language === 'he' ? 'נווט' : 'Navigate'}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↵</kbd>
                {language === 'he' ? 'בחר' : 'Select'}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">Esc</kbd>
              {language === 'he' ? 'סגור' : 'Close'}
            </span>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full start-0 mt-2 w-[400px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[150] p-8 text-center">
          <span className="material-symbols-rounded text-slate-300 dark:text-slate-700 !text-[48px] mb-3">search_off</span>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {language === 'he' ? 'לא נמצאו תוצאות' : 'No results found'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {language === 'he' ? 'נסה מונח חיפוש אחר' : 'Try a different search term'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
