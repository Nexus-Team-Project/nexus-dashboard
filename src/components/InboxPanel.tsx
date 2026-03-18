import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface InboxPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

const conversations = [
  {
    id: '1',
    name: 'ג\'ני רוזן',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqSRH2EBY-VPz7jMJ8pNYEcT2ylPTMVbTRZDTgG_CUgBH50HppFxeckTOHNzKEv32YLTvonQBvI6dmuSSggK4iab2miNQ3o8zhGtXLTyo9mzhMn9mCgRIGO42CpIYLtbzFfr8HVEqQ9roS9n-P29ovtrYUgc27xniG6Fjom_BrSjbN-O5zPwdUfYghs36Nkq7jziks9MBeOz7VPKif6d1snJV13kh6fiIl9WDFpBFvL8vMm8SXcZlQeRnpqFMNQfqj1OceiX6pCKdW',
    lastMessage: 'רגע, שמתי לב שיש חיוב כפול...',
    time: '12:45',
    online: true,
    unread: 0,
  },
  {
    id: '2',
    name: 'דוד מילר',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDox953tWVjdjsyTFywLL_9ymgji7wkWnWhjky-d6YgA_GPR59j2T8867HtUR7PMqZTXornMr9Cxfr_1kZZr4YlBwBULDZpkN6TrM62HdCsF_rCOb8qkSm9Q3Q2Ew-U7TVCWMYms7JyKSVqvCIF8YU74NiUBX1G9hxSF1p0kjcZii9qTlGkJToskKnue3Umi27c2huiywTmERQPyIHPAAXdVImupOHPCzgVcILCkWrmyFD73ffrpTA2E-L8br-NM79qFlJlWT2lWVDm',
    lastMessage: 'תודה על העזרה!',
    time: '9:12',
    online: false,
    unread: 0,
  },
  {
    id: '3',
    name: 'שרה וילסון',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDy96JeOdvoKK0MwA0BtOsXyv3u0s_n0_ipHn_SZcaVlZiB1mZuIBDRFr1aICp4UzJ4rYnXcVEbZn2gQdtlXk2sTtqxnNc33UaAKOC-anrVEHfDIC0K6Ly8-tAe4mndkjz6iTzSbW-TuRRBI625jNZ2i5sI1sBgfSMkHdh17KmHcgvTr5H-x4EZh9EvSCRiCGEuVynV7rkJDiAwPWpUaFpdGmlHJOLAG5ogzxTVWEKVyKtELGmb45DW4BPGVX92PgN8cOHss2K0dQSK',
    lastMessage: 'אפשר לשדרג את התוכנית?',
    time: 'אתמול',
    online: false,
    unread: 2,
  },
  {
    id: '4',
    name: 'מרקוס קינג',
    initials: 'מק',
    lastMessage: 'בעיה עם מפתחות API...',
    time: 'אתמול',
    online: false,
    unread: 0,
  },
];

const InboxPanel = ({ isOpen, onClose, anchorRef }: InboxPanelProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const panelWidth = 380;
    const margin = 8;

    let left = rect.left;
    if (left + panelWidth > window.innerWidth - margin) {
      left = window.innerWidth - panelWidth - margin;
    }
    if (left < margin) left = margin;

    setPosition({ top: rect.bottom + 8, left });
  }, [anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef?.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleConversationClick = (id: string) => {
    onClose();
    navigate('/inbox', { state: { chatId: id } });
  };

  if (!isOpen) return null;

  const filtered = activeTab === 'unread'
    ? conversations.filter(c => c.unread > 0)
    : conversations;

  return (
    <div
      ref={panelRef}
      className="fixed bg-white dark:bg-card-dark rounded-xl shadow-lg w-[380px] border border-gray-100 dark:border-slate-700 overflow-y-auto z-[60] animate-in zoom-in"
      style={{ top: position.top, left: position.left, maxHeight: window.innerHeight - position.top - 8 }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('inbox')}
        </h2>
        <button className="p-1.5 rounded-lg bg-[#635bff]/10 text-[#635bff] hover:bg-[#635bff]/20 transition-colors">
          <span className="material-symbols-rounded !text-[18px]">edit_square</span>
        </button>
      </div>

      {/* Tabs */}
      <nav className="px-4 mb-2 flex gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-center transition-colors ${
            activeTab === 'all'
              ? 'border-2 border-[#635bff] text-[#635bff]'
              : 'border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          {t('all')}
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-center transition-colors ${
            activeTab === 'unread'
              ? 'border-2 border-[#635bff] text-[#635bff]'
              : 'border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          {t('unread')}
        </button>
      </nav>

      {/* Conversations List */}
      <div className="max-h-[360px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                {t('allUpToDate')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('noNewNotifications')}
              </p>
            </div>
          </div>
        ) : (
          filtered.map(conv => (
            <div
              key={conv.id}
              onClick={() => handleConversationClick(conv.id)}
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-b-0"
            >
              <div className="relative h-10 w-10 shrink-0">
                {conv.avatar ? (
                  <img src={conv.avatar} alt={conv.name} className="rounded-full w-10 h-10 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">{conv.initials}</span>
                  </div>
                )}
                {conv.online && (
                  <div className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-green-500"></div>
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
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 flex justify-end">
        <button
          onClick={() => { onClose(); navigate('/inbox'); }}
          className="text-sm font-semibold text-[#635bff] hover:underline"
        >
          {t('viewAll')}
        </button>
      </div>
    </div>
  );
};

export default InboxPanel;
