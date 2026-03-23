import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type PaymentMethod = 'credit' | 'balance' | null;

const SendGiftSummary = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Mock summary data - in production this would come from state/context
  const summaryData = {
    event: {
      name: 'חגיגת סוף שנה',
      date: '31/12/2024',
      type: 'אירוע חברה'
    },
    gift: {
      brand: 'Amazon',
      type: 'גיפט קארד דיגיטלי'
    },
    recipients: {
      count: 15,
      totalAmount: 3750
    },
    greeting: {
      type: 'אימייל',
      hasCustomMessage: true
    }
  };

  const steps = [
    { number: 1, label: 'אירוע', active: false },
    { number: 2, label: 'מתנה', active: false },
    { number: 3, label: 'ברכה', active: false },
    { number: 4, label: 'נמענים', active: false },
    { number: 5, label: 'סיכום', active: true },
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedPayment(method);
    if (method === 'credit') {
      setShowPaymentModal(true);
    }
  };

  const handleComplete = () => {
    if (selectedPayment) {
      // Navigate to confirmation or process payment
      alert('Processing payment...');
    }
  };

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

        {/* Skeleton Content */}
        <div className="bg-white dark:bg-card-dark rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
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
            onClick={() => navigate('/send-gift/recipients')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-icons text-slate-400">arrow_forward</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">סיכום והשלמת תשלום</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">שלב 5 מתוך 5 - סקירה אחרונה לפני השליחה</p>
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
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            איך תרצו לשלם על המתנות?
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-medium">
            בחרו את שיטת התשלום שנוחה לכם – ויאללה, מתחילים להפיץ אושר!
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
            <span className="text-slate-600 dark:text-slate-400">סכום לתשלום</span>
            <span className="text-2xl font-bold text-primary">
              ₪{summaryData.recipients.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="w-full max-w-2xl mb-12">
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">סיכום ההזמנה</h2>

            {/* Event Details */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="material-icons text-primary">event</span>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-white">אירוע</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{summaryData.event.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">{summaryData.event.date}</div>
              </div>
            </div>

            {/* Gift Details */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="material-icons text-primary">card_giftcard</span>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-white">מתנה</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{summaryData.gift.brand}</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">{summaryData.gift.type}</div>
              </div>
            </div>

            {/* Recipients Details */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="material-icons text-primary">people</span>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-white">נמענים</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {summaryData.recipients.count} נמענים
                </div>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  ₪{summaryData.recipients.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Greeting Details */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="material-icons text-primary">mail</span>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-white">ברכה</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{summaryData.greeting.type}</div>
                {summaryData.greeting.hasCustomMessage && (
                  <div className="text-xs text-green-600 dark:text-green-400">✓ הודעה מותאמת אישית</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="w-full max-w-lg space-y-4">
          <h2 className="text-xl font-bold text-center mb-6">בחרו אמצעי תשלום</h2>

          {/* Credit Card Option */}
          <button
            onClick={() => handlePaymentSelect('credit')}
            className={`group w-full bg-white dark:bg-card-dark border-2 p-6 rounded-2xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
              selectedPayment === 'credit'
                ? 'border-primary'
                : 'border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selectedPayment === 'credit'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary'
              }`}>
                <span className="material-icons text-2xl">credit_card</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">כרטיס אשראי</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">תשלום מאובטח</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedPayment === 'credit' && (
                <span className="material-icons text-primary">check_circle</span>
              )}
              <span className="material-icons text-slate-300 dark:text-slate-600 group-hover:text-primary transform rotate-180 transition-colors">
                chevron_right
              </span>
            </div>
          </button>

          {/* Balance Option */}
          <button
            onClick={() => handlePaymentSelect('balance')}
            className={`group w-full bg-white dark:bg-card-dark border-2 p-6 rounded-2xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
              selectedPayment === 'balance'
                ? 'border-primary'
                : 'border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selectedPayment === 'balance'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary'
              }`}>
                <span className="material-icons text-2xl">account_balance_wallet</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">יתרת חשבון</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">יתרה זמינה: ₪5,200</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedPayment === 'balance' && (
                <span className="material-icons text-primary">check_circle</span>
              )}
              <span className="material-icons text-slate-300 dark:text-slate-600 group-hover:text-primary transform rotate-180 transition-colors">
                chevron_right
              </span>
            </div>
          </button>

          {selectedPayment === 'credit' && (
            <p className="mt-4 text-center text-sm text-slate-400 dark:text-slate-500 leading-relaxed px-4">
              שימו לב – אישור תשלום באשראי לוקח עד יומיים. המתנות ישלחו מיד לאחר האישור
            </p>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="w-full p-6 md:p-8 flex flex-col sm:flex-row items-center justify-center gap-4 bg-background-light dark:bg-background-dark border-t border-slate-100 dark:border-slate-900">
        <button
          onClick={() => navigate('/send-gift/recipients')}
          className="w-full sm:w-48 py-4 px-8 border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors"
        >
          חזרה
        </button>
        <button
          onClick={handleComplete}
          disabled={!selectedPayment}
          className={`w-full sm:w-48 py-4 px-8 font-bold rounded-xl shadow-lg transition-all ${
            selectedPayment
              ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          אישור ותשלום
        </button>
      </footer>

      {/* Credit Card Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">פרטי כרטיס אשראי</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">תשלום מאובטח</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-icons text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  מספר כרטיס
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    תוקף
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  שם בעל הכרטיס
                </label>
                <input
                  type="text"
                  placeholder="שם מלא באנגלית"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  תעודת זהות
                </label>
                <input
                  type="text"
                  placeholder="123456789"
                  maxLength={9}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="material-icons text-violet-600 text-xl">lock</span>
                  <div className="text-sm text-violet-700 dark:text-violet-300">
                    <p className="font-semibold mb-1">תשלום מאובטח</p>
                    <p>כל המידע מוצפן ומאובטח בהתאם לתקני אבטחה בינלאומיים</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  handleComplete();
                }}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
              >
                אישור תשלום
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendGiftSummary;
