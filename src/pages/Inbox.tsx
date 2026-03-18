import { useState, useRef, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  lastMessage: string;
  time: string;
  online: boolean;
  unread: number;
  email: string;
  location: string;
  joined: string;
  tags: string[];
}

interface Message {
  id: string;
  sender: 'customer' | 'agent';
  text: string;
  time: string;
  read?: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────────

const conversations: Conversation[] = [
  {
    id: '1',
    name: 'ג\'ני רוזן',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqSRH2EBY-VPz7jMJ8pNYEcT2ylPTMVbTRZDTgG_CUgBH50HppFxeckTOHNzKEv32YLTvonQBvI6dmuSSggK4iab2miNQ3o8zhGtXLTyo9mzhMn9mCgRIGO42CpIYLtbzFfr8HVEqQ9roS9n-P29ovtrYUgc27xniG6Fjom_BrSjbN-O5zPwdUfYghs36Nkq7jziks9MBeOz7VPKif6d1snJV13kh6fiIl9WDFpBFvL8vMm8SXcZlQeRnpqFMNQfqj1OceiX6pCKdW',
    lastMessage: 'רגע, שמתי לב שיש חיוב כפול...',
    time: '12:45',
    online: true,
    unread: 0,
    email: 'jenny@global-designs.com',
    location: 'תל אביב, ישראל',
    joined: '12 באוקטובר 2021',
    tags: ['לקוח פרו', 'מאומת'],
  },
  {
    id: '2',
    name: 'דוד מילר',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDox953tWVjdjsyTFywLL_9ymgji7wkWnWhjky-d6YgA_GPR59j2T8867HtUR7PMqZTXornMr9Cxfr_1kZZr4YlBwBULDZpkN6TrM62HdCsF_rCOb8qkSm9Q3Q2Ew-U7TVCWMYms7JyKSVqvCIF8YU74NiUBX1G9hxSF1p0kjcZii9qTlGkJToskKnue3Umi27c2huiywTmERQPyIHPAAXdVImupOHPCzgVcILCkWrmyFD73ffrpTA2E-L8br-NM79qFlJlWT2lWVDm',
    lastMessage: 'תודה על העזרה!',
    time: '9:12',
    online: false,
    unread: 0,
    email: 'david@startup.io',
    location: 'חיפה, ישראל',
    joined: '3 בינואר 2023',
    tags: ['לקוח רגיל'],
  },
  {
    id: '3',
    name: 'שרה וילסון',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDy96JeOdvoKK0MwA0BtOsXyv3u0s_n0_ipHn_SZcaVlZiB1mZuIBDRFr1aICp4UzJ4rYnXcVEbZn2gQdtlXk2sTtqxnNc33UaAKOC-anrVEHfDIC0K6Ly8-tAe4mndkjz6iTzSbW-TuRRBI625jNZ2i5sI1sBgfSMkHdh17KmHcgvTr5H-x4EZh9EvSCRiCGEuVynV7rkJDiAwPWpUaFpdGmlHJOLAG5ogzxTVWEKVyKtELGmb45DW4BPGVX92PgN8cOHss2K0dQSK',
    lastMessage: 'אפשר לשדרג את התוכנית?',
    time: 'אתמול',
    online: false,
    unread: 2,
    email: 'sarah@enterprise.com',
    location: 'ירושלים, ישראל',
    joined: '15 ביוני 2022',
    tags: ['לקוח עסקי', 'מאומת'],
  },
  {
    id: '4',
    name: 'מרקוס קינג',
    initials: 'מק',
    lastMessage: 'בעיה עם מפתחות API...',
    time: 'אתמול',
    online: false,
    unread: 0,
    email: 'marcus@devteam.co',
    location: 'באר שבע, ישראל',
    joined: '28 במרץ 2024',
    tags: ['מפתח'],
  },
];

const messagesByChat: Record<string, Message[]> = {
  '1': [
    { id: 'm1', sender: 'customer', text: 'היי! אני רואה שני חיובים בדף החשבון שלי על מנוי \'Pro Plan\'. נרשמתי רק פעם אחת. אפשר לבדוק?', time: '12:38' },
    { id: 'm2', sender: 'agent', text: 'שלום ג\'ני! אשמח לבדוק את זה בשבילך. תני לי רגע לבדוק את היסטוריית העסקאות. את יכולה לשלוח את 4 הספרות האחרונות של הכרטיס?', time: '12:40', read: true },
    { id: 'm3', sender: 'customer', text: 'בטח, מסתיים ב-4242. רגע, שמתי לב שהחיוב הכפול אולי מחשבון ישן שהיה לי. תני לי לבדוק.', time: '12:45' },
  ],
  '2': [
    { id: 'm1', sender: 'customer', text: 'היי, רציתי לשאול לגבי אפשרויות התשלום', time: '8:55' },
    { id: 'm2', sender: 'agent', text: 'בוקר טוב דוד! אשמח לעזור. מה בדיוק תרצה לדעת?', time: '9:00', read: true },
    { id: 'm3', sender: 'customer', text: 'תודה על העזרה!', time: '9:12' },
  ],
  '3': [
    { id: 'm1', sender: 'customer', text: 'שלום, אנחנו מעוניינים לשדרג את התוכנית שלנו', time: 'אתמול' },
    { id: 'm2', sender: 'customer', text: 'אפשר לשדרג את התוכנית?', time: 'אתמול' },
  ],
  '4': [
    { id: 'm1', sender: 'customer', text: 'יש לי בעיה עם מפתחות ה-API, הם לא עובדים', time: 'אתמול' },
  ],
};

const recentPayments = [
  { amount: '₪49.00', status: 'הצליח', statusColor: 'text-green-600 bg-green-50 dark:bg-green-900/20', date: '01 במרץ, 2024', method: 'ויזה 4242' },
  { amount: '₪49.00', status: 'במחלוקת', statusColor: 'text-[#635bff] bg-[#635bff]/10', date: '01 בפברואר, 2024', method: 'ויזה 4242' },
];

// ─── Component ───────────────────────────────────────────────────

const Inbox = () => {
  const [activeChat, setActiveChat] = useState<string>('1');
  const [sidebarTab, setSidebarTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConv = conversations.find(c => c.id === activeChat) || conversations[0];
  const messages = messagesByChat[activeChat] || [];

  // Make parent chain position:relative and overflow:hidden so we can fill it with absolute
  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    const wrapper = main?.parentElement as HTMLElement | null;
    if (!main || !wrapper) return;
    main.style.position = 'relative';
    main.style.overflow = 'hidden';
    main.style.padding = '0';
    main.style.maxWidth = 'none';
    wrapper.style.overflow = 'hidden';
    return () => {
      main.style.position = '';
      main.style.overflow = '';
      main.style.padding = '';
      main.style.maxWidth = '';
      wrapper.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [messageText]);

  const filteredConversations = sidebarTab === 'unread'
    ? conversations.filter(c => c.unread > 0)
    : conversations;

  return (
    <div ref={containerRef} className="flex -mx-6 -my-4 overflow-hidden h-[calc(100vh-48px)]">
      {/* ── Left Sidebar: Conversation List ── */}
      <aside className="flex w-72 flex-col border-e border-[#e3e8ee] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shrink-0">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">תיבת הודעות</h3>
            <button className="rounded-lg bg-[#635bff]/10 p-1.5 text-[#635bff] hover:bg-[#635bff]/20 transition-colors">
              <span className="material-symbols-rounded !text-[18px]">edit_square</span>
            </button>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSidebarTab('all')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                sidebarTab === 'all' ? 'bg-[#635bff] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setSidebarTab('unread')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                sidebarTab === 'unread' ? 'bg-[#635bff] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              לא נקראו
            </button>
            <button
              onClick={() => setSidebarTab('archived')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                sidebarTab === 'archived' ? 'bg-[#635bff] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              ארכיון
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveChat(conv.id)}
              className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors ${
                activeChat === conv.id
                  ? 'border-s-4 border-[#635bff] bg-[#635bff]/5'
                  : 'border-s-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="relative h-11 w-11 shrink-0">
                {conv.avatar ? (
                  <img src={conv.avatar} alt={conv.name} className="rounded-full w-11 h-11 object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-slate-400 font-bold text-sm">{conv.initials}</span>
                  </div>
                )}
                {conv.online && (
                  <div className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-green-500"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold text-sm text-slate-900 dark:text-white">{conv.name}</p>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0 ms-2">{conv.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#635bff] text-[10px] font-bold text-white shrink-0 ms-2">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <section className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-900/40 overflow-hidden min-w-0">
        {/* Chat Header */}
        <header className="flex h-14 items-center justify-between border-b border-[#e3e8ee] dark:border-slate-700 bg-white dark:bg-slate-900 px-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full shrink-0">
              {currentConv.avatar ? (
                <img src={currentConv.avatar} alt={currentConv.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-400 font-bold text-xs">{currentConv.initials}</span>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{currentConv.name}</h4>
              <div className="flex items-center gap-1.5">
                {currentConv.online && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
                <span className="text-[11px] font-medium text-slate-500 tracking-wider">
                  {currentConv.online ? 'פעיל/ה כעת' : 'לא מחובר/ת'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              העבר
            </button>
            <button className="rounded-lg bg-[#635bff] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
              סמן כטופל
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <span className="material-symbols-rounded !text-[20px]">more_vert</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Day separator */}
          <div className="flex justify-center">
            <span className="rounded-full bg-slate-200/50 dark:bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              היום
            </span>
          </div>

          {messages.map(msg => (
            msg.sender === 'customer' ? (
              /* Received Message */
              <div key={msg.id} className="flex items-start gap-3 max-w-2xl">
                <div className="h-8 w-8 rounded-full overflow-hidden mt-1 shrink-0">
                  {currentConv.avatar ? (
                    <img src={currentConv.avatar} alt={currentConv.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-slate-400 font-bold text-[10px]">{currentConv.initials}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-2xl rounded-tr-none bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 me-1">{msg.time}</span>
                </div>
              </div>
            ) : (
              /* Sent Message */
              <div key={msg.id} className="flex flex-row-reverse items-start gap-3">
                <div className="flex flex-col items-start gap-1.5 max-w-2xl">
                  <div className="rounded-2xl rounded-tl-none bg-[#635bff] p-4 shadow-sm">
                    <p className="text-sm leading-relaxed text-white">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                    {msg.read && <span className="material-symbols-rounded text-sm text-[#635bff]">done_all</span>}
                  </div>
                </div>
              </div>
            )
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-[#e3e8ee] dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shrink-0">
          <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#635bff]/20 transition-all">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 border-b border-slate-100 dark:border-slate-800 px-2 py-1.5">
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded">
                <span className="material-symbols-rounded !text-[20px]">format_bold</span>
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded">
                <span className="material-symbols-rounded !text-[20px]">format_italic</span>
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded">
                <span className="material-symbols-rounded !text-[20px]">link</span>
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded">
                <span className="material-symbols-rounded !text-[20px]">mood</span>
              </button>
            </div>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full border-none bg-transparent p-4 text-sm focus:ring-0 min-h-[80px] resize-none dark:text-white placeholder:text-slate-400 outline-none"
              placeholder={`כתוב הודעה ל${currentConv.name}...`}
            />
            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3">
              <button className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <span className="material-symbols-rounded !text-[18px]">attach_file</span>
                צרף קובץ
              </button>
              <div className="flex gap-2">
                <button className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  טיוטה
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-[#635bff] px-5 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity">
                  שלח הודעה
                  <span className="material-symbols-rounded !text-[16px]">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Right Sidebar: Contact Details ── */}
      <aside className="hidden xl:flex w-72 flex-col border-s border-[#e3e8ee] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto shrink-0">
        <div className="p-5">
          {/* Profile */}
          <div className="flex flex-col items-center text-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="h-20 w-20 overflow-hidden rounded-full ring-4 ring-slate-50 dark:ring-slate-800">
              {currentConv.avatar ? (
                <img src={currentConv.avatar} alt={currentConv.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-400 font-bold text-xl">{currentConv.initials}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentConv.name}</h3>
              <p className="text-sm font-medium text-slate-500">{currentConv.email}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {currentConv.tags.map(tag => (
                <span key={tag} className="rounded-full bg-[#635bff]/10 px-2.5 py-1 text-[10px] font-bold text-[#635bff] uppercase">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Customer Details */}
          <div className="mt-5 space-y-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">פרטי לקוח</h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">מזהה לקוח</span>
                  <span className="text-xs text-slate-800 dark:text-slate-200 font-mono">cus_O9p2X...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">מיקום</span>
                  <span className="text-xs text-slate-800 dark:text-slate-200">{currentConv.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">הצטרף/ה</span>
                  <span className="text-xs text-slate-800 dark:text-slate-200">{currentConv.joined}</span>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">תשלומים אחרונים</h4>
              <div className="space-y-2.5">
                {recentPayments.map((p, i) => (
                  <div key={i} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{p.amount}</span>
                      <span className={`text-[10px] font-bold ${p.statusColor} px-1.5 rounded uppercase`}>{p.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{p.date} • {p.method}</p>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full text-xs font-bold text-[#635bff] hover:underline">
                הצג את כל 12 התשלומים
              </button>
            </div>

            {/* Restrict Button */}
            <div className="pt-3">
              <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-rounded !text-[16px]">block</span>
                הגבל משתמש
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Inbox;
