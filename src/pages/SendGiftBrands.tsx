import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Brand {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  backgroundColor?: string;
  minPrice: number;
  selected: boolean;
}

const SendGiftBrands = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [giftAmount, setGiftAmount] = useState(250);
  const [selectionMode, setSelectionMode] = useState<'collections' | 'manual'>('collections');
  const [localInternational, setLocalInternational] = useState<'local' | 'international'>('local');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);

  const [brands, setBrands] = useState<Brand[]>([
    {
      id: '1',
      name: 'ArmyZone',
      category: 'ספורט וטיולים',
      imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=250&fit=crop',
      minPrice: 10,
      selected: false,
    },
    {
      id: '2',
      name: 'JoyZone',
      category: 'בידור ופנאי',
      imageUrl: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?w=400&h=250&fit=crop',
      minPrice: 10,
      selected: true,
    },
    {
      id: '3',
      name: 'MAC Cosmetics',
      category: 'יופי וקוסמטיקה',
      imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=250&fit=crop',
      minPrice: 10,
      selected: false,
    },
    {
      id: '4',
      name: "L'OCCITANE",
      category: 'טיפוח וספא',
      backgroundColor: 'bg-amber-400',
      minPrice: 10,
      selected: true,
    },
    {
      id: '5',
      name: 'Opticana',
      category: 'משקפיים ואופטיקה',
      backgroundColor: 'bg-lime-400',
      minPrice: 10,
      selected: false,
    },
    {
      id: '6',
      name: 'Kravitz',
      category: 'כלי כתיבה ומשרד',
      backgroundColor: 'bg-orange-500',
      minPrice: 10,
      selected: false,
    },
    {
      id: '7',
      name: 'HomeStyle',
      category: 'בית ועיצוב',
      imageUrl: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=250&fit=crop',
      minPrice: 10,
      selected: true,
    },
    {
      id: '8',
      name: 'TechHub',
      category: 'טכנולוגיה',
      imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=250&fit=crop',
      minPrice: 10,
      selected: false,
    },
    {
      id: '9',
      name: 'FoodieParadise',
      category: 'אוכל ומסעדות',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop',
      minPrice: 10,
      selected: true,
    },
  ]);

  const categories = [
    { id: 'all', label: 'כל הקטגוריות' },
    { id: 'food', label: 'אוכל ומסעדות' },
    { id: 'fashion', label: 'אופנה וסטייל' },
    { id: 'attractions', label: 'אטרקציות' },
    { id: 'home', label: 'בית ועיצוב' },
    { id: 'kids', label: 'ילדים' },
    { id: 'spa', label: 'בריאות וספא' },
    { id: 'experiences', label: 'חוויות' },
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    const selectedBrands = brands.filter(b => b.selected);
    if (selectedBrands.length > 0) {
      navigate('/send-gift/greeting');
    }
  };

  const toggleBrandSelection = (brandId: string) => {
    setBrands(brands.map(brand =>
      brand.id === brandId ? { ...brand, selected: !brand.selected } : brand
    ));
  };

  const toggleCategory = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategories(['all']);
    } else {
      const newCategories = selectedCategories.filter(c => c !== 'all');
      if (selectedCategories.includes(categoryId)) {
        const filtered = newCategories.filter(c => c !== categoryId);
        setSelectedCategories(filtered.length === 0 ? ['all'] : filtered);
      } else {
        setSelectedCategories([...newCategories, categoryId]);
      }
    }
  };

  const selectedCount = brands.filter(b => b.selected).length;

  const steps = [
    { number: 1, label: 'אירוע', active: false },
    { number: 2, label: 'מתנה', active: true },
    { number: 3, label: 'ברכה', active: false },
    { number: 4, label: 'נמענים', active: false },
    { number: 5, label: 'סיכום', active: false },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div>
              <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
              <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>

        {/* Skeleton Step Progress */}
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                {i < 5 && <div className="w-12 lg:w-20 h-[2px] bg-slate-200 dark:bg-slate-700 mx-2"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Amount Selection */}
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mx-auto"></div>
            <div className="h-16 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl mx-auto"></div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>

        {/* Skeleton Content */}
        <div className="flex gap-6">
          {/* Skeleton Sidebar */}
          <div className="w-64 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>

          {/* Skeleton Brands Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-700 rounded-t-2xl"></div>
                  <div className="p-4">
                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/send-gift/event')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-icons text-slate-400">arrow_forward</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">בחירת מתנות</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">שלב 2 מתוך 5 - בחירת ערך ומותגים</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium">
            יתרה: 5,200 ₪
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all ${
                    step.active
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.number}
                </div>
                <span
                  className={`text-xs font-medium ${
                    step.active ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-12 lg:w-20 h-[2px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gift Amount Selection */}
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">פרטי המתנה</h2>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-8">בחר ערך מתנה וסוג החוויה</p>

          {/* Amount Input */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₪</span>
              <input
                type="number"
                value={giftAmount}
                onChange={(e) => setGiftAmount(Number(e.target.value))}
                className="w-48 pr-10 pl-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xl font-semibold focus:ring-primary focus:border-primary outline-none transition-all text-center"
              />
            </div>
            <label className="text-slate-600 dark:text-slate-400 font-medium">בחר סכום</label>
          </div>

          {/* Slider */}
          <div className="px-4 mb-10">
            <input
              type="range"
              min="10"
              max="10000"
              value={giftAmount}
              onChange={(e) => setGiftAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>₪10</span>
              <span>₪10,000</span>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              onClick={() => setSelectionMode('collections')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                selectionMode === 'collections'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              אוספים
            </button>
            <button
              onClick={() => setSelectionMode('manual')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                selectionMode === 'manual'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              בחירה ידנית
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
              קטגוריה
            </h3>
            <div className="space-y-4">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="w-5 h-5 rounded text-primary border-slate-300 focus:ring-primary"
                  />
                  <span className="mr-3 text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Brands Grid */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setLocalInternational('local')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  localInternational === 'local'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                מותגים מקומיים
              </button>
              <button
                onClick={() => setLocalInternational('international')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  localInternational === 'international'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                בינלאומי
              </button>
            </div>

            <div className="relative max-w-sm w-full">
              <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary outline-none"
                placeholder="חיפוש מותגים..."
              />
            </div>
          </div>

          {/* Brands Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <div
                key={brand.id}
                onClick={() => toggleBrandSelection(brand.id)}
                className="group bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer relative"
              >
                <input
                  type="checkbox"
                  checked={brand.selected}
                  onChange={() => {}}
                  className="absolute top-4 right-4 z-10 w-6 h-6 rounded text-primary border-white/20 bg-black/20 backdrop-blur-sm focus:ring-primary cursor-pointer pointer-events-none"
                />
                <div
                  className={`aspect-[16/10] flex items-center justify-center p-8 overflow-hidden ${
                    brand.backgroundColor || 'bg-slate-100 dark:bg-slate-900'
                  }`}
                >
                  {brand.imageUrl ? (
                    <img
                      src={brand.imageUrl}
                      alt={brand.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-lg"
                    />
                  ) : (
                    <span className={`text-2xl font-bold ${brand.backgroundColor?.includes('amber') || brand.backgroundColor?.includes('lime') ? 'text-slate-900' : 'text-white'}`}>
                      {brand.name}
                    </span>
                  )}
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{brand.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{brand.category}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">₪{brand.minPrice}+</span>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-12 flex justify-center">
            <button className="px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              הצג מותגים נוספים
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate('/send-gift/event')}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-full transition-colors flex items-center gap-2"
        >
          <span className="material-icons text-xl">arrow_forward</span>
          חזור
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{selectedCount} מותגים נבחרו</span>
          </div>
          <button
            onClick={handleNext}
            disabled={selectedCount === 0}
            className="px-10 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg shadow-primary/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            המשך לשלב הבא
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendGiftBrands;
