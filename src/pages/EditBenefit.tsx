import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EditBenefit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [trackInventory, setTrackInventory] = useState(true);
  const [onSale, setOnSale] = useState(true);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Banner with Background Image - Full Width */}
      <div className="relative h-[250px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&h=400&fit=crop)',
            filter: 'blur(8px)',
            transform: 'scale(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />

        {/* Header Content on Banner */}
        <div className="relative h-full">
          {/* Top Bar with Breadcrumbs and Actions */}
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/benefits-partnerships')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="material-icons text-white">arrow_forward</span>
              </button>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <span>הטבות ושיתופי פעולה</span>
                <span className="material-icons text-xs">chevron_left</span>
                <span className="font-medium text-white">עריכת הטבה</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/benefits-partnerships')}
                className="px-6 py-2.5 text-sm font-medium border-2 border-white/30 text-white rounded-xl hover:bg-white/10 backdrop-blur-sm transition-colors"
              >
                ביטול
              </button>
              <button className="px-8 py-2.5 text-sm font-medium bg-white text-slate-900 rounded-xl hover:bg-white/90 transition-opacity shadow-lg">
                שמירה
              </button>
            </div>
          </div>

          {/* Business Logo and Info - Top Right */}
          <div className="absolute top-6 right-8 flex items-center gap-6">
            <div className="w-24 h-24 bg-white dark:bg-card-dark rounded-2xl shadow-2xl flex items-center justify-center text-5xl border-4 border-white">
              🍔
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">Wolt</h1>
              <p className="text-white/95 text-base drop-shadow">הנחה על ארוחות</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative px-8 -mt-16 pb-10">
        <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Images Section */}
          <section className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">תמונות ומדיה</h2>
              <button className="text-slate-500 hover:text-primary transition-colors">
                <span className="material-icons">more_horiz</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden group relative border border-slate-200 dark:border-slate-700">
                <div className="w-full h-full flex items-center justify-center text-6xl">🍔</div>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-icons text-white">edit</span>
                </div>
              </div>
              <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden group relative border border-slate-200 dark:border-slate-700">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop"
                  alt="רקע"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-icons text-white">edit</span>
                </div>
              </div>
              <button className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-all">
                <span className="material-icons text-3xl mb-1">add</span>
                <span className="text-xs font-medium">הוסף מדיה</span>
              </button>
            </div>
          </section>

          {/* Benefit Info */}
          <section className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-8">פרטי ההטבה</h2>
            <div className="space-y-6">
              <div className="uppercase text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-4">מידע בסיסי</div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">שם בית העסק</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all px-4 py-3"
                    type="text"
                    value="Wolt"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">כותרת</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all px-4 py-3"
                    type="text"
                    defaultValue="הנחה על ארוחות"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">אופן מימוש</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all px-4 py-3">
                    <option value="voucher">שובר</option>
                    <option value="coupon">קוד קופון</option>
                    <option value="product">מוצר</option>
                    <option value="card">כרטיס</option>
                    <option value="service">שירות</option>
                    <option value="registration">טופס הרשמה</option>
                    <option value="nexus">Nexus</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">סוג הטבה</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all px-4 py-3">
                    <option value="percentage">אחוז הנחה</option>
                    <option value="gift">מתנה</option>
                    <option value="amount">סכום קבוע</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">תיאור</label>
                  <button className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    <span className="material-icons text-sm">auto_awesome</span>
                    יצירת טקסט באמצעות AI
                  </button>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <button className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md material-icons text-lg">format_bold</button>
                    <button className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md material-icons text-lg">format_italic</button>
                    <button className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md material-icons text-lg">format_underlined</button>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                    <button className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md material-icons text-lg text-primary">format_color_text</button>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                    <button className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md material-icons text-lg">link</button>
                    <button className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md material-icons text-lg">format_list_bulleted</button>
                    <button className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md material-icons text-lg">format_list_numbered</button>
                  </div>
                  <textarea
                    className="w-full bg-white dark:bg-card-dark border-none focus:ring-0 p-6 min-h-[150px] text-right"
                    dir="rtl"
                    defaultValue="הנחה על כל הזמנה מעל 50 ₪"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Discount & Pricing */}
          <section className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-8">פרטי הנחה</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">אחוז הנחה</label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-8"
                    type="text"
                    defaultValue="25"
                  />
                  <span className="absolute right-4 top-3.5 text-slate-500 text-sm">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">חלוקה</label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-8"
                    type="text"
                    defaultValue="80"
                  />
                  <span className="absolute right-4 top-3.5 text-slate-500 text-sm">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">תאריך סיום</label>
                <input
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3"
                  type="date"
                  defaultValue="2024-12-31"
                />
              </div>
            </div>
          </section>

          {/* Terms & Implementation */}
          <section className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-8">תנאים ומימוש</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">לינק למימוש</label>
                <input
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3"
                  type="url"
                  defaultValue="https://wolt.com/promo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">הנחיות מימוש</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 min-h-[100px]"
                  defaultValue="הזן את הקוד בקופה"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">תקנון</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 min-h-[100px]"
                  defaultValue="ההנחה תקפה עד 100 ₪ להזמנה"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Status */}
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">סטטוס</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 border-slate-300 dark:border-slate-700 rounded-md checked:bg-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">פעיל</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 border-slate-300 dark:border-slate-700 rounded-md checked:bg-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">מומלץ</span>
              </label>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">קטגוריות</h3>
            <div className="max-h-[220px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="h-4 w-4 border-slate-300 dark:border-slate-700 rounded checked:bg-primary" />
                <span className="text-sm">אוכל ומסעדות</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="h-4 w-4 border-slate-300 dark:border-slate-700 rounded checked:bg-primary" />
                <span className="text-sm">קניות</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="h-4 w-4 border-slate-300 dark:border-slate-700 rounded checked:bg-primary" />
                <span className="text-sm">בילויים</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="h-4 w-4 border-slate-300 dark:border-slate-700 rounded checked:bg-primary" />
                <span className="text-sm">טיסות ונופש</span>
              </label>
            </div>
            <button className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <span className="material-icons text-sm">add</span>
              יצירת קטגוריה
            </button>
          </div>

          {/* Usage Terms */}
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">תנאי שימוש</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="h-4 w-4 border-slate-300 dark:border-slate-700 rounded checked:bg-primary" />
                <span className="text-sm">כולל כפל מבצעים</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="h-4 w-4 border-slate-300 dark:border-slate-700 rounded checked:bg-primary" />
                <span className="text-sm">חנויות פיזיות</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="h-4 w-4 border-slate-300 dark:border-slate-700 rounded checked:bg-primary" />
                <span className="text-sm">אתרי סחר</span>
              </label>
            </div>
            <button className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <span className="material-icons text-sm">add</span>
              הוספת תנאי
            </button>
          </div>

          {/* Performance */}
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold">ביצועי ההטבה</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">30 ימים אחרונים</p>
              </div>
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <span className="material-icons text-sm">show_chart</span>
              </button>
            </div>
            <div className="mb-6 h-12 flex items-end gap-1">
              <div className="w-full h-3 bg-primary/10 rounded-t-sm"></div>
              <div className="w-full h-5 bg-primary/10 rounded-t-sm"></div>
              <div className="w-full h-8 bg-primary/10 rounded-t-sm"></div>
              <div className="w-full h-6 bg-primary/10 rounded-t-sm"></div>
              <div className="w-full h-10 bg-primary rounded-t-sm"></div>
              <div className="w-full h-7 bg-primary/10 rounded-t-sm"></div>
              <div className="w-full h-4 bg-primary/10 rounded-t-sm"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">מימושים</div>
                <div className="text-xl font-bold">347</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">צפיות</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold">2,134</span>
                  <span className="text-xs font-bold text-green-500 flex items-center">
                    <span className="material-icons text-xs">north</span>
                    45%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        </div>
      </main>
    </div>
  );
};

export default EditBenefit;
