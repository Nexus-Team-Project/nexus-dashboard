import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
}

interface AiChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiChatPanel = ({ isOpen, onClose }: AiChatPanelProps) => {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<'ai' | 'human'>('ai');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Auto-resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: mode === 'ai' ? 'ai' : 'system',
        text: mode === 'ai'
          ? (isHe
            ? 'תודה על פנייתך! אני מעבד את הבקשה שלך. האם יש משהו נוסף שאוכל לעזור בו?'
            : 'Thanks for reaching out! I\'m processing your request. Is there anything else I can help with?')
          : (isHe
            ? 'הודעתך הועברה לנציג תמיכה אנושי. נציג יחזור אליך בהקדם.'
            : 'Your message has been forwarded to a human support agent. An agent will get back to you shortly.'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const switchToHuman = () => {
    setMode('human');
    const systemMessage: Message = {
      id: Date.now().toString(),
      sender: 'system',
      text: isHe
        ? 'מעביר אותך לנציג תמיכה אנושי...'
        : 'Connecting you to a human support agent...',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, systemMessage]);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsTyping(true);

      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: isHe
            ? 'תודה על פנייתך! אני מעבד את הבקשה שלך. האם יש משהו נוסף שאוכל לעזור בו?'
            : 'Thanks for reaching out! I\'m processing your request. Is there anything else I can help with?',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsTyping(false);
      }, 1500);
    }, 100);
  };

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const hasMessages = messages.length > 0;
  const userName = 'דניאל';

  const suggestions = isHe
    ? ['איפה הדוחות שלי?', 'סטטוס האימות שלי', 'עזרה בהגדרות']
    : ['Where are my reports?', 'My verification status', 'Help with settings'];

  if (!isOpen) return null;

  return (
    <div className="w-[400px] min-w-[400px] bg-white flex flex-col h-screen shrink-0">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#e3e8ee] bg-white z-10">
        <div className="flex items-center gap-2">
          <span className="material-icons text-[#635bff] !text-xl">auto_awesome</span>
          <h1 className="font-bold text-[17px] text-[#1a1f36]">Assistant</h1>
        </div>
        <div className="flex items-center gap-3 text-[#697386]">
          <button
            onClick={() => setMode(mode === 'ai' ? 'human' : 'ai')}
            className="hover:text-[#3c4257] transition-colors"
            title={isHe ? (mode === 'ai' ? 'עבור לנציג אנושי' : 'עבור לעוזר AI') : (mode === 'ai' ? 'Switch to human agent' : 'Switch to AI')}
          >
            <span className="material-icons !text-xl">{mode === 'ai' ? 'support_agent' : 'smart_toy'}</span>
          </button>
          <button className="hover:text-[#3c4257] transition-colors" title={isHe ? 'אפשרויות' : 'Options'}>
            <span className="material-icons !text-xl">more_horiz</span>
          </button>
          <button onClick={onClose} className="hover:text-[#3c4257] transition-colors" title={isHe ? 'סגור' : 'Close'}>
            <span className="material-icons !text-xl font-bold">close</span>
          </button>
        </div>
      </header>

      {/* Mode indicator */}
      {mode === 'human' && (
        <div className="px-5 py-2 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
          <span className="material-icons !text-[16px] text-orange-500">support_agent</span>
          <span className="text-[12px] text-orange-700 font-medium">
            {isHe ? 'מחובר לנציג תמיכה אנושי' : 'Connected to human support'}
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-y-auto" style={{
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(circle at 2px 2px, #f7f8f9 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}>
        {/* Subtle topo lines */}
        <div className="absolute top-0 left-0 right-0 h-[400px] opacity-[0.15] pointer-events-none" style={{
          backgroundImage: 'repeating-radial-gradient(circle at 50% -20%, transparent, transparent 20px, #635bff 21px, transparent 22px)',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }} />

        <div className="relative z-10 p-6 space-y-6">
          {!hasMessages ? (
            <>
              {/* Greeting */}
              <div className="max-w-[85%]">
                <p className="text-[15px] leading-relaxed text-[#4f566b]">
                  {isHe ? (
                    <>היי <span className="font-bold text-[#1a1f36]">{userName}</span>, איך אוכל לעזור לך? ככל שתספק יותר פרטים, כך אוכל לעזור טוב יותר.</>
                  ) : (
                    <>Hi <span className="font-bold text-[#1a1f36]">{userName}</span>, how can I help you? The more details you provide, the better.</>
                  )}
                </p>
              </div>

              {/* Suggestion pills */}
              <div className="flex flex-col items-end gap-3 pt-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestion(suggestion)}
                    className="px-5 py-2.5 rounded-full text-[14px] text-[#4f566b] shadow-sm hover:opacity-80 transition-opacity bg-white"
                    style={{
                      border: '1px solid transparent',
                      backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #a389f4, #4db7f5)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Messages */
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.sender === 'system' ? (
                    <div className="text-center">
                      <span className="text-[11px] text-[#697386] bg-[#f7f8f9] px-3 py-1 rounded-full">
                        {msg.text}
                      </span>
                    </div>
                  ) : msg.sender === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-[#635bff] text-white text-[14px] leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-[85%]">
                        <p className="text-[14px] leading-relaxed text-[#4f566b]">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-1.5 px-4 py-3">
                    <span className="w-2 h-2 bg-[#697386] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#697386] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#697386] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Footer / Input Area */}
      <div className="p-5 bg-white space-y-3">
        <div className="w-full min-h-[100px] p-4 rounded-2xl border-[1.5px] border-[#635bff]/40 bg-white focus-within:border-[#635bff] transition-all flex flex-col justify-between">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaResize}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isHe ? 'כתוב הודעה...' : 'Type your message...'}
            rows={2}
            className="w-full bg-transparent border-none focus:ring-0 text-[15px] resize-none p-0 placeholder:text-[#697386] text-[#3c4257] outline-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full bg-[#f4f6f8] text-[#a3acb9] flex items-center justify-center hover:bg-[#635bff] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#f4f6f8] disabled:hover:text-[#a3acb9]"
            >
              <span className="material-icons !text-xl">arrow_upward</span>
            </button>
          </div>
        </div>
        <p className="text-[12px] text-center text-[#697386] px-4">
          {isHe ? 'AI עלול לטעות. ודא מידע חשוב.' : 'AI may make mistakes. Verify important information.'}
        </p>
      </div>
    </div>
  );
};

export default AiChatPanel;
