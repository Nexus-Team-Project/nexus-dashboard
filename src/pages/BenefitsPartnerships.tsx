import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Business {
  id: string;
  isActive: boolean;
  logo: string;
  commercialName: string;
  officialName: string;
  businessId: string;
  locations: { lat: number; lng: number; address: string }[];
  description: string;
  openingHours: string;
  categories: string[];
  phone: string;
  socialMedia: { platform: string; url: string }[];
  rating: number;
  reviews: { author: string; text: string; rating: number }[];
}

interface Benefit {
  id: string;
  isActive: boolean;
  businessId: string;
  businessName: string;
  businessLogo: string;
  backgroundImage?: string;
  implementationMethod: 'voucher' | 'coupon' | 'registration' | 'product' | 'card' | 'service' | 'nexus';
  benefitType: 'percentage' | 'gift' | 'amount';
  usageTerms: string[];
  endDate: string;
  implementationLink: string;
  implementationInstructions: string;
  terms: string;
  description: string;
  categories: string[];
  ribbon?: string;
  // Voucher specific
  voucherAmounts?: number[];
  discountPercentage?: number;
  discountDistribution?: number;
  // Coupon specific
  couponCode?: string;
  // Product specific
  shippingConditions?: string;
  // Display
  featured: boolean;
  image?: string;
  title: string;
  discount: string;
}

type ViewMode = 'benefits' | 'businesses';
type DisplayMode = 'cards' | 'table';

const BenefitsPartnerships = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('benefits');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('cards');
  const [openTagDropdown, setOpenTagDropdown] = useState<string | null>(null);
  const [openUsageTermsDropdown, setOpenUsageTermsDropdown] = useState<string | null>(null);
  const [benefitActiveStates, setBenefitActiveStates] = useState<Record<string, boolean>>({});
  const [businessActiveStates, setBusinessActiveStates] = useState<Record<string, boolean>>({});

  // Predefined tags that can be added
  const availableTags = [
    'מומלץ',
    'חדש',
    'פופולרי',
    'מבצע מוגבל',
    'בלעדי',
    'הכי נמכר',
  ];

  // Predefined usage terms
  const availableUsageTerms = [
    'כולל כפל מבצעים',
    'לא כולל כפל מבצעים',
    'חנויות פיזיות',
    'אתרי סחר',
    'לא עובד באתרי סחר',
    'לא עובד בחנויות פיזיות',
    'הגבלת זמן',
    'ללא הגבלת זמן',
  ];

  // System-defined terms that cannot be removed (show lock icon)
  const systemDefinedTerms = [
    'כולל כפל מבצעים',
    'חנויות פיזיות',
    'אתרי סחר',
  ];

  // Check if a term/tag is system-defined
  const isSystemDefined = (term: string) => systemDefinedTerms.includes(term);

  // Initialize active states from data
  useEffect(() => {
    const benefitStates: Record<string, boolean> = {};
    benefits.forEach(benefit => {
      benefitStates[benefit.id] = benefit.isActive;
    });
    setBenefitActiveStates(benefitStates);

    const businessStates: Record<string, boolean> = {};
    businesses.forEach(business => {
      businessStates[business.id] = business.isActive;
    });
    setBusinessActiveStates(businessStates);
  }, []);

  // Toggle handlers
  const toggleBenefitActive = (benefitId: string) => {
    setBenefitActiveStates(prev => ({
      ...prev,
      [benefitId]: !prev[benefitId]
    }));
  };

  const toggleBusinessActive = (businessId: string) => {
    setBusinessActiveStates(prev => ({
      ...prev,
      [businessId]: !prev[businessId]
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openTagDropdown) {
        setOpenTagDropdown(null);
      }
      if (openUsageTermsDropdown) {
        setOpenUsageTermsDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openTagDropdown, openUsageTermsDropdown]);

  const categories = [
    { id: 'all', label: 'כל הקטגוריות', icon: 'apps' },
    { id: 'food', label: 'אוכל ומסעדות', icon: 'restaurant' },
    { id: 'shopping', label: 'קניות', icon: 'shopping_bag' },
    { id: 'entertainment', label: 'בילויים', icon: 'theater_comedy' },
    { id: 'travel', label: 'טיסות ונופש', icon: 'flight' },
    { id: 'wellness', label: 'בריאות ורווחה', icon: 'spa' },
    { id: 'tech', label: 'טכנולוגיה', icon: 'devices' },
  ];

  // Mock businesses data
  const businesses: Business[] = [
    {
      id: 'b1',
      isActive: true,
      logo: '🍔',
      commercialName: 'Wolt',
      officialName: 'Wolt Israel Ltd.',
      businessId: '515123456',
      locations: [{ lat: 32.0853, lng: 34.7818, address: 'תל אביב, רחוב רוטשילד 1' }],
      description: 'משלוחי אוכל מהירים',
      openingHours: '24/7',
      categories: ['food'],
      phone: '03-1234567',
      socialMedia: [{ platform: 'facebook', url: 'https://facebook.com/wolt' }],
      rating: 4.5,
      reviews: [{ author: 'יוסי כהן', text: 'שירות מעולה', rating: 5 }],
    },
    {
      id: 'b2',
      isActive: true,
      logo: '📦',
      commercialName: 'Amazon',
      officialName: 'Amazon Israel',
      businessId: '520987654',
      locations: [{ lat: 32.0853, lng: 34.7818, address: 'רעננה, פארק תעשייה' }],
      description: 'קניות און-ליין',
      openingHours: 'אתר 24/7',
      categories: ['shopping'],
      phone: '1-800-AMAZON',
      socialMedia: [{ platform: 'facebook', url: 'https://facebook.com/amazon' }],
      rating: 4.8,
      reviews: [],
    },
  ];

  // Mock benefits data
  const benefits: Benefit[] = [
    {
      id: '1',
      isActive: true,
      businessId: 'b1',
      businessName: 'Wolt',
      businessLogo: '🍔',
      backgroundImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
      implementationMethod: 'voucher',
      benefitType: 'percentage',
      usageTerms: ['כולל כפל מבצעים', 'חנויות פיזיות', 'אתרי סחר'],
      endDate: '31/12/2024',
      implementationLink: 'https://wolt.com/promo',
      implementationInstructions: 'הזן את הקוד בקופה',
      terms: 'ההנחה תקפה עד 100 ₪ להזמנה',
      description: 'הנחה על כל הזמנה מעל 50 ₪',
      categories: ['food'],
      voucherAmounts: [200, 300, 500],
      discountPercentage: 25,
      discountDistribution: 80,
      featured: true,
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
      title: 'הנחה על ארוחות',
      discount: '25% הנחה',
    },
    {
      id: '2',
      isActive: true,
      businessId: 'b2',
      businessName: 'Amazon',
      businessLogo: '📦',
      backgroundImage: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&h=600&fit=crop',
      implementationMethod: 'coupon',
      benefitType: 'gift',
      usageTerms: ['אתרי סחר', 'ללא הגבלת זמן'],
      endDate: '31/12/2025',
      implementationLink: 'https://amazon.com',
      implementationInstructions: 'השתמש בקוד באתר',
      terms: 'תקף לכל ההזמנות ללא מינימום',
      description: 'משלוח חינם ללא הגבלה למשך שנה',
      categories: ['shopping'],
      couponCode: 'NEXUS2024FREE',
      featured: true,
      image: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&h=600&fit=crop',
      title: 'משלוח חינם',
      discount: 'משלוח חינם',
    },
    {
      id: '3',
      isActive: false,
      businessId: 'b1',
      businessName: 'Wolt',
      businessLogo: '🍔',
      implementationMethod: 'product',
      benefitType: 'amount',
      usageTerms: ['חנויות פיזיות'],
      endDate: '30/06/2024',
      implementationLink: 'https://wolt.com',
      implementationInstructions: 'הזמן דרך האפליקציה',
      terms: 'למנויים חדשים בלבד',
      description: 'ארוחה במתנה',
      categories: ['food'],
      shippingConditions: 'משלוח חינם',
      featured: false,
      title: 'ארוחה חינם',
      discount: 'ארוחה במתנה',
    },
  ];

  const filteredBenefits = benefits.filter((benefit) => {
    const matchesSearch =
      benefit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      benefit.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      benefit.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || benefit.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const featuredBenefits = filteredBenefits.filter((b) => b.featured);
  const regularBenefits = filteredBenefits.filter((b) => !b.featured);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      shopping: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      entertainment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      travel: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      wellness: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
      tech: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    };
    return colors[category] || 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400';
  };

  const handleBenefitClick = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowBenefitModal(true);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="max-w-7xl mx-auto px-6 pb-12">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 flex flex-col items-center text-center overflow-hidden">
          {/* Floating Logos */}
          <div className="absolute inset-0 pointer-events-auto">
            {/* Brand 1 - Samsung */}
            <div className="group absolute top-10 left-10 md:left-20 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center p-4 animate-[float_6s_ease-in-out_infinite] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/samsung.png" alt="Samsung" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Samsung
              </div>
            </div>

            {/* Brand 2 - Mango */}
            <div className="group absolute bottom-20 left-4 md:left-40 w-12 h-12 md:w-20 md:h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center p-4 animate-[float_6s_ease-in-out_infinite] [animation-delay:-2s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/mango.png" alt="Mango" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Mango
              </div>
            </div>

            {/* Brand 3 - Carrefour */}
            <div className="group absolute top-1/2 left-0 w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center p-3 animate-[float_6s_ease-in-out_infinite] [animation-delay:-4s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/carrefour.png" alt="Carrefour" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Carrefour
              </div>
            </div>

            {/* Brand 4 - Foot Locker */}
            <div className="group absolute top-12 right-10 md:right-20 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center p-4 animate-[float_6s_ease-in-out_infinite] [animation-delay:-1s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/foot-locker.png" alt="Foot Locker" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Foot Locker
              </div>
            </div>

            {/* Brand 5 - Magnolia */}
            <div className="group absolute bottom-24 right-4 md:right-40 w-14 h-14 md:w-22 md:h-22 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center p-5 animate-[float_6s_ease-in-out_infinite] [animation-delay:-3.5s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/magnolia.png" alt="Magnolia" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Magnolia
              </div>
            </div>

            {/* Brand 6 - Golf */}
            <div className="group absolute top-1/2 right-0 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center p-3 animate-[float_6s_ease-in-out_infinite] [animation-delay:-5s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/golf.png" alt="Golf" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Golf
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
              הטבות ושיתופי פעולה עם המותגים האהובים עליכם
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
              גלו הנחות בלעדיות, קאשבק ותגמולים מיוחדים כשאתם קונים דרך Nexus
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <span className="material-icons absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-14 pl-6 py-5 rounded-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-black dark:focus:border-white focus:ring-0 transition-all text-lg outline-none"
                placeholder="חיפוש עסקים והטבות..."
              />
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((category) => (
              <div key={category.id} className="group relative">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-5 py-2.5 rounded-full border transition-all text-sm font-medium flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  {category.id === 'all' && <span className="material-icons text-sm">{category.icon}</span>}
                  {category.label}
                  {category.id === 'all' && selectedCategory === 'all' && (
                    <span className="material-icons text-sm">expand_more</span>
                  )}
                </button>
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                  סנן לפי {category.label}
                </div>
              </div>
            ))}

            {/* View Mode Toggle */}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <div className="group relative">
              <button
                onClick={() => setViewMode('benefits')}
                className={`px-5 py-2.5 rounded-full border transition-all text-sm font-medium ${
                  viewMode === 'benefits'
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                טבלת הטבות
              </button>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                נהל הטבות לבתי עסק
              </div>
            </div>
            <div className="group relative">
              <button
                onClick={() => setViewMode('businesses')}
                className={`px-5 py-2.5 rounded-full border transition-all text-sm font-medium ${
                  viewMode === 'businesses'
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                טבלת בתי עסק
              </button>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                נהל בתי עסק
              </div>
            </div>

            {/* Display Mode Toggle */}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <div className="group relative">
              <button
                onClick={() => setDisplayMode('cards')}
                className={`p-2.5 rounded-full border transition-all ${
                  displayMode === 'cards'
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <span className="material-icons text-lg">grid_view</span>
              </button>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                תצוגת כרטיסיות
              </div>
            </div>
            <div className="group relative">
              <button
                onClick={() => setDisplayMode('table')}
                className={`p-2.5 rounded-full border transition-all ${
                  displayMode === 'table'
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <span className="material-icons text-lg">view_list</span>
              </button>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                תצוגת טבלה
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            {viewMode === 'benefits' ? `מציג ${filteredBenefits.length}+ הטבות` : `מציג ${businesses.length}+ בתי עסק`}
          </div>
        </section>

        {/* Admin Table View */}
        {displayMode === 'table' && (
          <section className="py-12">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                {/* Benefits Table */}
                {viewMode === 'benefits' && (
                  <table className="w-full min-w-max">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider sticky right-0 bg-slate-50 dark:bg-slate-800/50 z-10">
                          סטטוס
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          לוגו
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          תמונת רקע
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20">
                          שם בית העסק
                          <span className="block text-[10px] font-normal text-slate-500 mt-0.5">קריאה בלבד</span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20">
                          אופן מימוש
                          <span className="block text-[10px] font-normal text-slate-500 mt-0.5">קריאה בלבד</span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          סוג הטבה
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          תנאי שימוש
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          תאריך סיום
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          לינק למימוש
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20">
                          הנחיות מימוש
                          <span className="block text-[10px] font-normal text-slate-500 mt-0.5">קריאה בלבד</span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20">
                          תקנון
                          <span className="block text-[10px] font-normal text-slate-500 mt-0.5">קריאה בלבד</span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-green-50 dark:bg-green-900/20">
                          תיאור
                          <span className="block text-[10px] font-normal text-emerald-600 dark:text-emerald-400 mt-0.5">ניתן לעריכה</span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          קטגוריות
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          תג
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          פעולות
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredBenefits.map((benefit) => (
                        <tr key={benefit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 sticky right-0 bg-white dark:bg-slate-900 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBenefitActive(benefit.id);
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all hover:ring-2 hover:ring-cyan-400 hover:ring-offset-1 ${
                                benefitActiveStates[benefit.id]
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  benefitActiveStates[benefit.id] ? '-translate-x-1' : '-translate-x-5'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-2xl">
                              {benefit.businessLogo}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {benefit.backgroundImage ? (
                              <img src={benefit.backgroundImage} alt="" className="w-20 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                            ) : (
                              <div className="w-20 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></div>
                            )}
                          </td>
                          <td className="px-4 py-4 bg-blue-50/50 dark:bg-blue-900/10">
                            <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                              {benefit.businessName}
                            </button>
                          </td>
                          <td className="px-4 py-4 bg-blue-50/50 dark:bg-blue-900/10">
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {benefit.implementationMethod === 'voucher' && 'שובר'}
                              {benefit.implementationMethod === 'coupon' && 'קוד קופון'}
                              {benefit.implementationMethod === 'product' && 'מוצר'}
                              {benefit.implementationMethod === 'card' && 'כרטיס'}
                              {benefit.implementationMethod === 'service' && 'שירות'}
                              {benefit.implementationMethod === 'registration' && 'טופס הרשמה'}
                              {benefit.implementationMethod === 'nexus' && 'Nexus'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                                {benefit.benefitType === 'percentage' && 'אחוז הנחה'}
                                {benefit.benefitType === 'gift' && 'מתנה'}
                                {benefit.benefitType === 'amount' && 'סכום קבוע'}
                              </span>
                              <button className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <span className="material-icons text-xs">add</span>
                                הוסף סוג
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs relative">
                              {/* Usage terms - system-defined (lock) or user-defined (removable) */}
                              {benefit.usageTerms.map((term, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
                                    isSystemDefined(term)
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {isSystemDefined(term) && (
                                    <span className="material-icons text-[10px]">lock</span>
                                  )}
                                  {term}
                                  {!isSystemDefined(term) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                      className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors -mr-1.5 flex items-center justify-center w-2.5 h-2.5"
                                    >
                                      <span className="material-icons text-[6px] leading-none">close</span>
                                    </button>
                                  )}
                                </span>
                              ))}

                              {/* Add usage term button with dropdown */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenUsageTermsDropdown(openUsageTermsDropdown === benefit.id ? null : benefit.id);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <span className="material-icons text-xs">add</span>
                                  הוסף תנאי
                                </button>

                                {/* Dropdown menu */}
                                {openUsageTermsDropdown === benefit.id && (
                                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                                    <div className="py-1 max-h-60 overflow-y-auto">
                                      {/* Predefined usage terms */}
                                      {availableUsageTerms.map((term, idx) => (
                                        <button
                                          key={idx}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenUsageTermsDropdown(null);
                                          }}
                                          className="w-full text-right px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                          {term}
                                        </button>
                                      ))}

                                      {/* Divider */}
                                      <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>

                                      {/* Define new term option */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenUsageTermsDropdown(null);
                                        }}
                                        className="w-full text-right px-4 py-2 text-sm text-primary font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                      >
                                        <span className="material-icons text-sm">edit</span>
                                        הגדר תנאי חדש
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{benefit.endDate}</span>
                          </td>
                          <td className="px-4 py-4">
                            <a href={benefit.implementationLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-xs">
                              {benefit.implementationLink}
                            </a>
                          </td>
                          <td className="px-4 py-4 bg-blue-50/50 dark:bg-blue-900/10">
                            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">{benefit.implementationInstructions}</p>
                          </td>
                          <td className="px-4 py-4 bg-blue-50/50 dark:bg-blue-900/10">
                            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">{benefit.terms}</p>
                          </td>
                          <td className="px-4 py-4 bg-green-50/50 dark:bg-green-900/10">
                            <input
                              type="text"
                              defaultValue={benefit.description}
                              className="text-sm px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent max-w-xs"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {benefit.categories.map((cat, idx) => (
                                <span key={idx} className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(cat)}`}>
                                  {categories.find(c => c.id === cat)?.label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs relative">
                              {/* User-defined tags - can be removed */}
                              {benefit.ribbon && (
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                                  {benefit.ribbon}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors -mr-1.5 flex items-center justify-center w-2.5 h-2.5"
                                  >
                                    <span className="material-icons text-[6px] leading-none">close</span>
                                  </button>
                                </span>
                              )}

                              {/* Add tag button with dropdown */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenTagDropdown(openTagDropdown === benefit.id ? null : benefit.id);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <span className="material-icons text-xs">add</span>
                                  הוסף תג
                                </button>

                                {/* Dropdown menu */}
                                {openTagDropdown === benefit.id && (
                                  <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                                    <div className="py-1 max-h-60 overflow-y-auto">
                                      {/* Predefined tags */}
                                      {availableTags.map((tag, idx) => (
                                        <button
                                          key={idx}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenTagDropdown(null);
                                          }}
                                          className="w-full text-right px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                          {tag}
                                        </button>
                                      ))}

                                      {/* Divider */}
                                      <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>

                                      {/* Define new tag option */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenTagDropdown(null);
                                        }}
                                        className="w-full text-right px-4 py-2 text-sm text-primary font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                      >
                                        <span className="material-icons text-sm">edit</span>
                                        הגדר תג חדש
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/benefits-partnerships/edit-benefit/${benefit.id}`);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <span className="material-icons text-lg text-slate-600 dark:text-slate-400">more_vert</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Businesses Table */}
                {viewMode === 'businesses' && (
                  <table className="w-full min-w-max">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider sticky right-0 bg-slate-50 dark:bg-slate-800/50 z-10">
                          סטטוס
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          לוגו
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          שם מסחרי
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          שם רשמי
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          ח.פ / עוסק
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          מיקומים
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          תיאור
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          שעות פתיחה
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          קטגוריות
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          טלפון
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          רשתות חברתיות
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          דירוג
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          ביקורות
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          פעולות
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {businesses.map((business) => (
                        <tr key={business.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 sticky right-0 bg-white dark:bg-slate-900 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBusinessActive(business.id);
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all hover:ring-2 hover:ring-cyan-400 hover:ring-offset-1 ${
                                businessActiveStates[business.id]
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  businessActiveStates[business.id] ? '-translate-x-1' : '-translate-x-5'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-2xl">
                              {business.logo}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{business.commercialName}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{business.officialName}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">{business.businessId}</span>
                          </td>
                          <td className="px-4 py-4">
                            <button className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                              <span className="material-icons text-sm">location_on</span>
                              {business.locations.length} סניפים
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">{business.description}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{business.openingHours}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {business.categories.map((cat, idx) => (
                                <span key={idx} className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(cat)}`}>
                                  {categories.find(c => c.id === cat)?.label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <a href={`tel:${business.phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                              {business.phone}
                            </a>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1">
                              {business.socialMedia.map((social, idx) => (
                                <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                                  <span className="material-icons text-sm text-slate-600 dark:text-slate-400">{social.platform}</span>
                                </a>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <span className="material-icons text-sm text-yellow-500">star</span>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">{business.rating}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                              {business.reviews.length} ביקורות
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/benefits-partnerships/edit-business/${business.id}`);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <span className="material-icons text-lg text-slate-600 dark:text-slate-400">more_vert</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Empty State */}
              {((viewMode === 'businesses' && businesses.length === 0) ||
                (viewMode === 'benefits' && filteredBenefits.length === 0)) && (
                <div className="py-20 text-center">
                  <span className="material-icons text-slate-300 dark:text-slate-600 text-6xl mb-4">
                    search_off
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {viewMode === 'businesses' ? 'לא נמצאו בתי עסק' : 'לא נמצאו הטבות'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">נסה לשנות את החיפוש או הסינון</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Businesses View */}
        {displayMode === 'cards' && viewMode === 'businesses' && businesses.length > 0 && (
          <section className="py-12 space-y-8">
            {/* All Businesses - Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 p-2.5 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-2xl">
                      {business.logo}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{business.commercialName}</h3>
                      <p className="text-xs text-slate-500">{business.officialName}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-2">
                      <span className="material-icons text-sm">location_on</span>
                      {business.locations.length} סניפים
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-icons text-sm">phone</span>
                      {business.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-icons text-sm">schedule</span>
                      {business.openingHours}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {business.categories.map((cat, idx) => (
                      <span key={idx} className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(cat)}`}>
                        {categories.find(c => c.id === cat)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Benefits View */}
        {displayMode === 'cards' && viewMode === 'benefits' && (
          <section className="py-12 space-y-8">
            {/* Featured Benefits */}
            {featuredBenefits.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredBenefits.map((benefit) => (
                  <div
                    key={benefit.id}
                    className="group bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col cursor-pointer"
                    onClick={() => handleBenefitClick(benefit)}
                  >
                    {/* Image */}
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                      {benefit.backgroundImage ? (
                        <>
                          <img
                            src={benefit.backgroundImage}
                            alt={benefit.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          {benefit.businessLogo}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 p-2 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-2xl">
                          {benefit.businessLogo}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{benefit.businessName}</h3>
                          <p className="text-sm text-slate-500">{benefit.title}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                          {benefit.discount}
                        </div>
                      </div>
                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-medium text-slate-400">{benefit.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Regular Benefits */}
            {regularBenefits.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {regularBenefits.map((benefit) => (
                  <div
                    key={benefit.id}
                    className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                    onClick={() => handleBenefitClick(benefit)}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 p-2.5 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-2xl">
                        {benefit.businessLogo}
                      </div>
                      <div>
                        <h3 className="font-bold">{benefit.businessName}</h3>
                        <p className="text-xs text-slate-500">{benefit.title}</p>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 pt-4 border-t border-slate-50 dark:border-slate-800">
                      {benefit.discount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Empty State for Cards */}
        {displayMode === 'cards' && ((viewMode === 'benefits' && filteredBenefits.length === 0) ||
          (viewMode === 'businesses' && businesses.length === 0)) && (
          <div className="py-20 text-center">
            <span className="material-icons text-slate-300 dark:text-slate-600 text-6xl mb-4">
              search_off
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {viewMode === 'businesses' ? 'לא נמצאו עסקים' : 'לא נמצאו הטבות'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">נסה לשנות את החיפוש או הסינון</p>
          </div>
        )}

        {/* Load More Button */}
        {displayMode === 'cards' && filteredBenefits.length > 0 && (
          <section className="py-16 text-center">
            <button className="px-10 py-4 rounded-full border-2 border-slate-200 dark:border-slate-800 font-semibold hover:border-black dark:hover:border-white transition-all">
              טען עוד {viewMode === 'businesses' ? 'עסקים' : 'הטבות'}
            </button>
          </section>
        )}
      </main>

      {/* Benefit Details Modal */}
      {showBenefitModal && selectedBenefit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{selectedBenefit.businessLogo}</div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedBenefit.businessName}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {selectedBenefit.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBenefitModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-icons text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Discount */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 text-center border border-emerald-100 dark:border-emerald-900/30">
                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {selectedBenefit.discount}
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-300">{selectedBenefit.description}</p>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-icons text-slate-400">category</span>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">קטגוריות</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedBenefit.categories.map((cat, idx) => (
                        <span key={idx} className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(cat)}`}>
                          {categories.find((c) => c.id === cat)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-icons text-slate-400">schedule</span>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">תוקף</div>
                    <div className="font-semibold text-slate-900 dark:text-white">עד {selectedBenefit.endDate}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-icons text-slate-400">description</span>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">תנאים</div>
                    <div className="text-slate-700 dark:text-slate-300">{selectedBenefit.terms}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-icons text-slate-400">link</span>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">אופן מימוש</div>
                    <div className="text-slate-700 dark:text-slate-300">{selectedBenefit.implementationInstructions}</div>
                  </div>
                </div>
              </div>

              {/* How to Use */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="material-icons text-blue-600 dark:text-blue-400 text-xl">info</span>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">איך משתמשים בהטבה?</p>
                    <a href={selectedBenefit.implementationLink} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                      לחץ כאן למימוש ההטבה
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowBenefitModal(false)}
                className="flex-1 px-6 py-3 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-full transition-all"
              >
                סגור
              </button>
              <button className="flex-1 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <span className="material-icons">open_in_new</span>
                עבור לאתר
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenefitsPartnerships;
