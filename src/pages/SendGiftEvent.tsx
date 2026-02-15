import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  name: string;
  imageUrl: string;
}

const SendGiftEvent = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string>('wedding');
  const [showCustomEventModal, setShowCustomEventModal] = useState(false);
  const [customEventName, setCustomEventName] = useState('');
  const [customEventImage, setCustomEventImage] = useState<string>('');

  const [events, setEvents] = useState<Event[]>([
    {
      id: 'holidays',
      name: 'חגים',
      imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop',
    },
    {
      id: 'first-grade',
      name: 'כיתה א\'',
      imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
    },
    {
      id: 'wedding',
      name: 'חתונה',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    },
    {
      id: 'incentives',
      name: 'תמריצים',
      imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
    },
    {
      id: 'seniority',
      name: 'ותק',
      imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop',
    },
    {
      id: 'bar-bat-mitzvah',
      name: 'בני/בנות מצווה',
      imageUrl: 'https://images.unsplash.com/photo-1464047736614-af63643285bf?w=400&h=300&fit=crop',
    },
    {
      id: 'birth-gifts',
      name: 'מתנות לידה',
      imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop',
    },
    {
      id: 'any-occasion',
      name: 'מתנה לכל אירוע',
      imageUrl: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400&h=300&fit=crop',
    },
    {
      id: 'birthday-18',
      name: 'יום הולדת 18',
      imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
    },
    {
      id: 'from-the-heart',
      name: 'עם כל הלב',
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
    },
  ]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (selectedEvent) {
      navigate('/send-gift/brands');
    }
  };

  const handleCreateCustomEvent = () => {
    if (customEventName && customEventImage) {
      const newEvent: Event = {
        id: `custom-${Date.now()}`,
        name: customEventName,
        imageUrl: customEventImage,
      };
      setEvents([...events, newEvent]);
      setSelectedEvent(newEvent.id);
      setShowCustomEventModal(false);
      setCustomEventName('');
      setCustomEventImage('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomEventImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const steps = [
    { number: 1, label: 'אירוע', active: true },
    { number: 2, label: 'מתנה', active: false },
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

        {/* Skeleton Main Content */}
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center mb-12">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-3"></div>
            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 mx-auto rounded-full"></div>
          </div>

          {/* Skeleton Events Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i}>
                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700 rounded-2xl mb-3"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Footer Actions */}
        <div className="flex items-center justify-between">
          <div className="h-12 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-12 w-40 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
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
            onClick={() => navigate('/points-gifts')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-icons text-slate-400">arrow_forward</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">שליחת מתנה</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">שלב 1 מתוך 5 - בחירת אירוע</p>
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

      {/* Main Content */}
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">ליצירת חוויה אישית</h2>
          <div className="w-12 h-1 bg-primary/20 mx-auto rounded-full"></div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event.id)}
              className="group cursor-pointer"
            >
              <div
                className={`relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-all duration-300 ${
                  selectedEvent === event.id
                    ? 'ring-2 ring-primary shadow-lg shadow-primary/10'
                    : 'border border-slate-200 dark:border-slate-800'
                }`}
              >
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                {/* Selection Circle */}
                <div
                  className={`absolute top-3 left-3 w-6 h-6 rounded-full border-2 transition-all ${
                    selectedEvent === event.id
                      ? 'border-primary bg-primary'
                      : 'border-white/80 bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  {selectedEvent === event.id && (
                    <span className="material-icons text-white text-[14px] flex items-center justify-center h-full">
                      check
                    </span>
                  )}
                </div>
              </div>
              <p
                className={`text-center font-medium text-sm transition-colors ${
                  selectedEvent === event.id
                    ? 'font-bold text-primary'
                    : 'text-slate-700 dark:text-slate-300 group-hover:text-primary'
                }`}
              >
                {event.name}
              </p>
            </div>
          ))}

          {/* Create Custom Event Card */}
          <div
            onClick={() => setShowCustomEventModal(true)}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[4/3] rounded-2xl mb-3 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
                <span className="material-icons text-slate-400 group-hover:text-primary text-3xl">
                  add
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                אירוע מותאם אישית
              </p>
            </div>
            <p className="text-center font-medium text-sm text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
              צור אירוע חדש
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/points-gifts')}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-full transition-colors"
        >
          ביטול
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedEvent}
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg shadow-primary/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          המשך לשלב הבא
        </button>
      </div>

      {/* Custom Event Modal */}
      {showCustomEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">צור אירוע מותאם אישית</h3>
              <button
                onClick={() => setShowCustomEventModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-icons text-slate-400">close</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">שם האירוע</label>
                <input
                  type="text"
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  placeholder="לדוגמה: יום נישואין, סיום קורס..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Event Image */}
              <div>
                <label className="block text-sm font-semibold mb-2">תמונת האירוע</label>
                <div className="space-y-3">
                  {customEventImage ? (
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                      <img
                        src={customEventImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setCustomEventImage('')}
                        className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                      >
                        <span className="material-icons text-white text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <label className="relative aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <span className="material-icons text-slate-400 text-3xl">
                          add_photo_alternate
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        העלה תמונה
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        JPG, PNG עד 5MB
                      </p>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => setShowCustomEventModal(false)}
                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-full transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleCreateCustomEvent}
                disabled={!customEventName || !customEventImage}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg shadow-primary/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                צור אירוע
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendGiftEvent;
