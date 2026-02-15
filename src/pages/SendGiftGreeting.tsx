import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import nexusLogo from '../assets/logos/Nexus_Main_Logo_G.png';

type MessageType = 'email' | 'sms';
type LayoutStyle = 'classic' | 'minimal' | 'overlay' | 'custom';

interface CardElement {
  id: string;
  type: 'image' | 'greeting' | 'message' | 'footer';
  content?: string;
}

const SendGiftGreeting = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [messageType, setMessageType] = useState<MessageType>('email');
  const [subjectLine, setSubjectLine] = useState('הפתעה מיוחדת מחכה לך! 🎁');

  // Project name would be loaded from project settings/context in production
  const projectName = 'Nexus Team'; // This would come from actual project data
  const [senderName, setSenderName] = useState(projectName);
  const [senderNameError, setSenderNameError] = useState('');
  const [greetingText, setGreetingText] = useState('שלום @firstName,');
  const [greetingMessage, setGreetingMessage] = useState(
    'רציתי לנצל את ההזדמנות להודות לך על כל העבודה הקשה והמסירות שלך. היית חלק כל כך מדהים בצוות, ואנחנו באמת מעריכים את כל מה שאת עושה! תיהני מהמתנה הקטנה הזו כאות התודה שלנו. ✨'
  );
  const [selectedLayout, setSelectedLayout] = useState<LayoutStyle>('classic');
  const [cardImageUrl, setCardImageUrl] = useState(
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&h=600&fit=crop'
  );
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [showDynamicFields, setShowDynamicFields] = useState(false);
  const [clientLogo, setClientLogo] = useState<string | null>(null); // Will be loaded from client settings
  const [showImageModal, setShowImageModal] = useState(false);

  // Preset background images
  const presetImages = [
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1532452119098-a3650b3c46d3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1482731215275-a1f151646268?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1487700160041-babef9c3cb55?w=800&h=600&fit=crop',
  ];

  const [cardElements, setCardElements] = useState<CardElement[]>([
    { id: 'image', type: 'image' },
    { id: 'greeting', type: 'greeting', content: 'שלום @firstName,' },
    { id: 'message', type: 'message', content: 'רציתי לנצל את ההזדמנות להודות לך על כל העבודה הקשה והמסירות שלך. היית חלק כל כך מדהים בצוות, ואנחנו באמת מעריכים את כל מה שאת עושה! תיהני מהמתנה הקטנה הזו כאות התודה שלנו. ✨' },
    { id: 'sender', type: 'greeting', content: 'בברכה,' },
    { id: 'footer', type: 'footer' },
  ]);

  const dynamicFields = [
    { value: '@firstName', label: 'שם פרטי' },
    { value: '@lastName', label: 'שם משפחה' },
  ];

  const steps = [
    { number: 1, label: 'אירוע', active: false },
    { number: 2, label: 'מתנה', active: false },
    { number: 3, label: 'ברכה', active: true },
    { number: 4, label: 'נמענים', active: false },
    { number: 5, label: 'סיכום', active: false },
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardImageUrl(reader.result as string);
        setShowImageModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetImageSelect = (imageUrl: string) => {
    setCardImageUrl(imageUrl);
    setShowImageModal(false);
  };

  const handleNext = () => {
    navigate('/send-gift/recipients');
  };

  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedElement || draggedElement === targetId) return;

    const draggedIndex = cardElements.findIndex(el => el.id === draggedElement);
    const targetIndex = cardElements.findIndex(el => el.id === targetId);

    const newElements = [...cardElements];
    const [removed] = newElements.splice(draggedIndex, 1);
    newElements.splice(targetIndex, 0, removed);

    setCardElements(newElements);
    setDraggedElement(null);
  };

  const updateElementContent = (elementId: string, content: string) => {
    // Apply character limit for message elements
    if (elementId === 'message' && content.length > 201) {
      return;
    }

    setCardElements(cardElements.map(el =>
      el.id === elementId ? { ...el, content } : el
    ));
  };

  const validateSenderName = (name: string) => {
    if (messageType === 'sms') {
      // SMS validation: 2-30 characters, English only
      if (name.length < 2 || name.length > 30) {
        setSenderNameError('שם השולח חייב להיות בין 2-30 תווים');
        return false;
      }
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        setSenderNameError('שם השולח חייב להיות באנגלית בלבד');
        return false;
      }
    }
    setSenderNameError('');
    return true;
  };

  const handleSenderNameChange = (value: string) => {
    setSenderName(value);
    validateSenderName(value);
  };

  const insertDynamicField = (field: string, elementId: string) => {
    const element = cardElements.find(el => el.id === elementId);
    if (element && element.content !== undefined) {
      const newContent = element.content + field;
      updateElementContent(elementId, newContent);
    }
    setShowDynamicFields(false);
  };

  const renderTextWithDynamicFields = (text: string) => {
    return text.split(/(@\w+)/).map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="bg-primary/20 text-primary px-2 py-0.5 rounded font-semibold">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
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

        {/* Skeleton Toggle */}
        <div className="flex justify-center">
          <div className="h-12 w-80 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>

        {/* Skeleton Content - Adapts to message type */}
        <div className={`grid grid-cols-1 ${messageType === 'email' ? 'lg:grid-cols-12' : ''} gap-8`}>
          <div className={`${messageType === 'email' ? 'lg:col-span-9' : ''} bg-white dark:bg-card-dark rounded-3xl p-8 border border-slate-200 dark:border-slate-800`}>
            <div className="space-y-8">
              {/* Sender Name Skeleton */}
              <div className="h-14 w-full bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>

              {/* Subject Line Skeleton - only for email */}
              {messageType === 'email' && (
                <div className="h-14 w-full bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
              )}

              {/* Message/Card Skeleton */}
              {messageType === 'sms' ? (
                <div className="h-64 w-full bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
              ) : (
                <div className="h-96 w-full bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
              )}
            </div>
          </div>

          {/* Layout Sidebar Skeleton - only for email */}
          {messageType === 'email' && (
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                ))}
              </div>
            </div>
          )}
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
            onClick={() => navigate('/send-gift/brands')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-icons text-slate-400">arrow_forward</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">הוסף נגיעה אישית</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">שלב 3 מתוך 5 - עריכת ברכות לאימייל ו-SMS</p>
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

      {/* Message Type Toggle */}
      <div className="flex justify-center">
        <div className="bg-white dark:bg-card-dark p-1 rounded-full border border-slate-200 dark:border-slate-800 flex shadow-sm">
          <button
            onClick={() => setMessageType('email')}
            className={`px-8 py-2.5 rounded-full font-medium text-sm transition-all ${
              messageType === 'email'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            אימייל
          </button>
          <button
            onClick={() => setMessageType('sms')}
            className={`px-8 py-2.5 rounded-full font-medium text-sm transition-all ${
              messageType === 'sms'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            הודעת טקסט
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`grid grid-cols-1 ${messageType === 'email' ? 'lg:grid-cols-12' : ''} gap-8 items-start`}>
        {/* Card Editor */}
        <div className={`${messageType === 'email' ? 'lg:col-span-9' : ''} bg-white dark:bg-card-dark rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800`}>
          <div className="space-y-8">
            {/* Sender Name */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mr-1">
                שם השולח {messageType === 'sms' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => handleSenderNameChange(e.target.value)}
                  placeholder={messageType === 'sms' ? 'English only, 2-30 characters' : 'הקלד שם השולח'}
                  className={`w-full bg-slate-50 dark:bg-slate-800/50 border ${
                    senderNameError ? 'border-red-500' : 'border-transparent'
                  } rounded-2xl py-4 px-5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary transition-all outline-none`}
                />
                {senderNameError && (
                  <p className="text-red-500 text-xs mt-2">{senderNameError}</p>
                )}
                {messageType === 'sms' && senderName.length > 0 && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {senderName.length}/30
                  </span>
                )}
              </div>
            </div>

            {/* Subject Line */}
            {messageType === 'email' && (
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mr-1">
                  שורת נושא
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={subjectLine}
                    onChange={(e) => setSubjectLine(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-4 px-5 pl-12 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary transition-all outline-none"
                  />
                  <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors cursor-pointer">
                    edit
                  </span>
                </div>
              </div>
            )}

            {/* SMS Simple Text Editor */}
            {messageType === 'sms' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                    הודעת טקסט
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowDynamicFields(!showDynamicFields)}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-2"
                    >
                      <span className="material-icons text-sm">add</span>
                      שדות דינמיים
                    </button>
                    {showDynamicFields && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-50 min-w-[200px]">
                        <p className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                          לחץ להוספה לטקסט
                        </p>
                        {dynamicFields.map((field) => (
                          <button
                            key={field.value}
                            onClick={() => {
                              const currentMessage = cardElements.find(el => el.id === 'message')?.content || '';
                              updateElementContent('message', currentMessage + field.value);
                              setShowDynamicFields(false);
                            }}
                            className="w-full text-right px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <span className="text-primary font-mono text-sm">{field.value}</span>
                            <span className="text-slate-600 dark:text-slate-400 text-sm">{field.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SMS Text Area */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                  <div className="relative">
                    <textarea
                      value={cardElements.find(el => el.id === 'message')?.content || ''}
                      onChange={(e) => updateElementContent('message', e.target.value)}
                      maxLength={201}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-800 dark:text-slate-100 leading-relaxed resize-none outline-none p-4 focus:ring-2 focus:ring-primary"
                      rows={8}
                      placeholder="הקלד את הודעת ה-SMS כאן..."
                    />
                    <div className="absolute bottom-4 left-4 text-xs text-slate-400">
                      {cardElements.find(el => el.id === 'message')?.content?.length || 0}/201
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Email Card Design & Message */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                    עיצוב כרטיס והודעה
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowDynamicFields(!showDynamicFields)}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-2"
                    >
                      <span className="material-icons text-sm">add</span>
                      שדות דינמיים
                    </button>
                    {showDynamicFields && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-50 min-w-[200px]">
                        <p className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                          לחץ להוספה לטקסט
                        </p>
                        {dynamicFields.map((field) => (
                          <button
                            key={field.value}
                            onClick={() => {
                              if (editingElement) {
                                insertDynamicField(field.value, editingElement);
                              }
                            }}
                            className="w-full text-right px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <span className="text-primary font-mono text-sm">{field.value}</span>
                            <span className="text-slate-600 dark:text-slate-400 text-sm">{field.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                {/* Classic Layout */}
                {selectedLayout === 'classic' && (
                  <div className="space-y-0">
                    {/* Client Logo Section */}
                    <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 py-6 px-10">
                      {clientLogo ? (
                        <div className="flex justify-center">
                          <img
                            src={clientLogo}
                            alt="Company Logo"
                            className="h-12 w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center justify-center w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                            <span className="material-icons text-3xl text-slate-400">business</span>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                              לא נמצא לוגו חברה
                            </p>
                            <button
                              onClick={() => navigate('/settings')}
                              className="text-sm text-primary hover:text-primary/80 font-semibold flex items-center gap-1 mx-auto transition-colors"
                            >
                              <span className="material-icons text-sm">settings</span>
                              הוסף לוגו בהגדרות
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {cardElements.map((element) => (
                      <div
                        key={element.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, element.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, element.id)}
                        className={`relative group/element ${
                          draggedElement === element.id ? 'opacity-50' : ''
                        } transition-opacity`}
                      >
                        {/* Drag Handle */}
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/element:opacity-100 transition-opacity">
                          <div className="bg-slate-900/80 backdrop-blur-sm p-2 rounded-lg cursor-move flex items-center gap-1">
                            <span className="material-icons text-white text-sm">drag_indicator</span>
                            <span className="text-xs text-white/80">גרור לסידור מחדש</span>
                          </div>
                        </div>

                        {element.type === 'image' && (
                          <div className="relative group">
                            <img
                              src={cardImageUrl}
                              alt="Greeting card"
                              className="w-full h-72 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <button
                                onClick={() => setShowImageModal(true)}
                                className="bg-white/90 dark:bg-slate-900/90 px-6 py-2.5 rounded-full flex items-center gap-2 text-slate-900 dark:text-white font-medium hover:bg-white transition-all cursor-pointer"
                              >
                                <span className="material-icons text-xl">image</span>
                                <span>שנה תמונה</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {element.type === 'greeting' && (
                          <div className="p-6 pt-10 text-center">
                            {editingElement === element.id ? (
                              <input
                                type="text"
                                value={element.content}
                                onChange={(e) => updateElementContent(element.id, e.target.value)}
                                onBlur={() => setEditingElement(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingElement(null)}
                                autoFocus
                                className="w-full text-2xl font-bold text-slate-800 dark:text-white text-center bg-transparent border-2 border-primary rounded-lg px-4 py-2 outline-none"
                              />
                            ) : (
                              <h2
                                onClick={() => setEditingElement(element.id)}
                                className="text-2xl font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg px-4 py-2 transition-colors inline-block"
                              >
                                {renderTextWithDynamicFields(element.content || '')}
                                <span className="material-icons text-sm align-middle mr-2 opacity-0 group-hover/element:opacity-100">edit</span>
                              </h2>
                            )}
                          </div>
                        )}

                        {element.type === 'message' && (
                          <div className="px-10 pb-10 text-center">
                            {editingElement === element.id ? (
                              <div className="relative">
                                <textarea
                                  value={element.content}
                                  onChange={(e) => updateElementContent(element.id, e.target.value)}
                                  onBlur={() => setEditingElement(null)}
                                  autoFocus
                                  maxLength={201}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-lg text-lg text-slate-600 dark:text-slate-400 leading-relaxed resize-none outline-none p-4 text-center"
                                  rows={6}
                                />
                                <div className="absolute bottom-2 left-2 text-xs text-slate-400">
                                  {element.content?.length || 0}/201
                                </div>
                              </div>
                            ) : (
                              <p
                                onClick={() => setEditingElement(element.id)}
                                className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg p-4 transition-colors relative"
                              >
                                {renderTextWithDynamicFields(element.content || '')}
                                <span className="material-icons text-sm absolute top-2 left-2 opacity-0 group-hover/element:opacity-100">edit</span>
                              </p>
                            )}
                          </div>
                        )}

                        {element.type === 'footer' && (
                          <div className="px-10 pb-10">
                            <div className="pt-8 border-t border-slate-100 dark:border-slate-700 flex flex-col items-center">
                              <img
                                src={nexusLogo}
                                alt="Nexus Logo"
                                className="h-10 w-auto opacity-40"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'block';
                                }}
                              />
                              <span className="hidden text-xl font-bold tracking-tighter text-slate-400">NEXUS</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Minimal Layout */}
                {selectedLayout === 'minimal' && (
                  <div className="space-y-0">
                    {/* Client Logo Section */}
                    <div className="py-6 px-10 border-b border-slate-100 dark:border-slate-700">
                      {clientLogo ? (
                        <div className="flex justify-center">
                          <img
                            src={clientLogo}
                            alt="Company Logo"
                            className="h-10 w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                            <span className="material-icons text-2xl text-slate-400">business</span>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              לא נמצא לוגו חברה
                            </p>
                            <button
                              onClick={() => navigate('/settings')}
                              className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 mx-auto transition-colors"
                            >
                              <span className="material-icons text-xs">settings</span>
                              הוסף לוגו בהגדרות
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {cardElements.map((element) => (
                      <div
                        key={element.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, element.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, element.id)}
                        className={`relative group/element ${
                          draggedElement === element.id ? 'opacity-50' : ''
                        } transition-opacity`}
                      >
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/element:opacity-100 transition-opacity">
                          <div className="bg-slate-900/80 backdrop-blur-sm p-2 rounded-lg cursor-move flex items-center gap-1">
                            <span className="material-icons text-white text-sm">drag_indicator</span>
                            <span className="text-xs text-white/80">גרור לסידור מחדש</span>
                          </div>
                        </div>

                        {element.type === 'image' && (
                          <div className="relative group p-8">
                            <div className="w-full h-48 rounded-xl overflow-hidden">
                              <img
                                src={cardImageUrl}
                                alt="Greeting card"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] rounded-xl">
                                <button
                                  onClick={() => setShowImageModal(true)}
                                  className="bg-white/90 dark:bg-slate-900/90 px-6 py-2.5 rounded-full flex items-center gap-2 text-slate-900 dark:text-white font-medium hover:bg-white transition-all cursor-pointer"
                                >
                                  <span className="material-icons text-xl">image</span>
                                  <span>שנה תמונה</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {element.type === 'greeting' && (
                          <div className="px-10 text-center">
                            {editingElement === element.id ? (
                              <input
                                type="text"
                                value={element.content}
                                onChange={(e) => updateElementContent(element.id, e.target.value)}
                                onBlur={() => setEditingElement(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingElement(null)}
                                autoFocus
                                className="w-full text-xl font-bold text-slate-800 dark:text-white text-center bg-transparent border-2 border-primary rounded-lg px-4 py-2 outline-none"
                              />
                            ) : (
                              <h2
                                onClick={() => setEditingElement(element.id)}
                                className="text-xl font-bold text-slate-800 dark:text-white mb-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg px-4 py-2 transition-colors inline-block"
                              >
                                {element.content}
                                <span className="material-icons text-sm align-middle mr-2 opacity-0 group-hover/element:opacity-100">edit</span>
                              </h2>
                            )}
                          </div>
                        )}

                        {element.type === 'message' && (
                          <div className="px-10 pb-6 text-center">
                            {editingElement === element.id ? (
                              <div className="relative">
                                <textarea
                                  value={element.content}
                                  onChange={(e) => updateElementContent(element.id, e.target.value)}
                                  onBlur={() => setEditingElement(null)}
                                  autoFocus
                                  maxLength={201}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-primary rounded-lg text-base text-slate-600 dark:text-slate-400 leading-relaxed resize-none outline-none p-4 text-center"
                                  rows={4}
                                />
                                <div className="absolute bottom-2 left-2 text-xs text-slate-400">
                                  {element.content?.length || 0}/201
                                </div>
                              </div>
                            ) : (
                              <p
                                onClick={() => setEditingElement(element.id)}
                                className="text-base text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg p-4 transition-colors relative"
                              >
                                {renderTextWithDynamicFields(element.content || '')}
                                <span className="material-icons text-sm absolute top-2 left-2 opacity-0 group-hover/element:opacity-100">edit</span>
                              </p>
                            )}
                          </div>
                        )}

                        {element.type === 'footer' && (
                          <div className="px-10 pb-10">
                            <div className="mt-6 flex justify-center">
                              <img
                                src={nexusLogo}
                                alt="Nexus Logo"
                                className="h-8 w-auto opacity-40"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Overlay Layout */}
                {selectedLayout === 'overlay' && (
                  <div className="space-y-0">
                    {/* Client Logo Section */}
                    <div className="bg-white dark:bg-slate-800 py-4 px-10 border-b border-slate-200 dark:border-slate-700">
                      {clientLogo ? (
                        <div className="flex justify-center">
                          <img
                            src={clientLogo}
                            alt="Company Logo"
                            className="h-10 w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                            <span className="material-icons text-2xl text-slate-400">business</span>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              לא נמצא לוגו חברה
                            </p>
                            <button
                              onClick={() => navigate('/settings')}
                              className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 mx-auto transition-colors"
                            >
                              <span className="material-icons text-xs">settings</span>
                              הוסף לוגו בהגדרות
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative h-96 overflow-hidden">
                      {/* Background Image - Always at the back */}
                      <img
                        src={cardImageUrl}
                        alt="Greeting card"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                    {/* Upload overlay - only visible on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10">
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="bg-white/90 dark:bg-slate-900/90 px-6 py-2.5 rounded-full flex items-center gap-2 text-slate-900 dark:text-white font-medium hover:bg-white transition-all cursor-pointer"
                      >
                        <span className="material-icons text-xl">image</span>
                        <span>שנה תמונה</span>
                      </button>
                    </div>

                    {/* Draggable Text Elements */}
                    <div className="absolute inset-0 flex flex-col justify-end">
                      {cardElements.filter(el => el.type !== 'image').map((element, index) => (
                        <div
                          key={element.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, element.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, element.id)}
                          className={`relative group/element ${
                            draggedElement === element.id ? 'opacity-50' : ''
                          } transition-opacity z-20`}
                        >
                          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/element:opacity-100 transition-opacity">
                            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg cursor-move flex items-center gap-1">
                              <span className="material-icons text-slate-900 text-sm">drag_indicator</span>
                              <span className="text-xs text-slate-900">גרור</span>
                            </div>
                          </div>

                          {element.type === 'greeting' && (
                            <div className="p-4 text-center">
                              {editingElement === element.id ? (
                                <input
                                  type="text"
                                  value={element.content}
                                  onChange={(e) => updateElementContent(element.id, e.target.value)}
                                  onBlur={() => setEditingElement(null)}
                                  onKeyDown={(e) => e.key === 'Enter' && setEditingElement(null)}
                                  autoFocus
                                  className="w-full text-2xl font-bold text-white text-center bg-black/50 border-2 border-white rounded-lg px-4 py-2 outline-none backdrop-blur-sm"
                                />
                              ) : (
                                <h2
                                  onClick={() => setEditingElement(element.id)}
                                  className="text-2xl font-bold text-white drop-shadow-lg cursor-pointer hover:bg-white/20 rounded-lg px-4 py-2 transition-colors inline-block"
                                >
                                  {renderTextWithDynamicFields(element.content || '')}
                                  <span className="material-icons text-sm align-middle mr-2 opacity-0 group-hover/element:opacity-100">edit</span>
                                </h2>
                              )}
                            </div>
                          )}

                          {element.type === 'message' && (
                            <div className="px-10 pb-4 text-center">
                              {editingElement === element.id ? (
                                <div className="relative">
                                  <textarea
                                    value={element.content}
                                    onChange={(e) => updateElementContent(element.id, e.target.value)}
                                    onBlur={() => setEditingElement(null)}
                                    autoFocus
                                    maxLength={201}
                                    className="w-full bg-black/50 border-2 border-white rounded-lg text-base text-white leading-relaxed resize-none outline-none p-4 text-center backdrop-blur-sm"
                                    rows={3}
                                  />
                                  <div className="absolute bottom-2 left-2 text-xs text-white/70">
                                    {element.content?.length || 0}/201
                                  </div>
                                </div>
                              ) : (
                                <p
                                  onClick={() => setEditingElement(element.id)}
                                  className="text-base text-white/90 drop-shadow-lg leading-relaxed cursor-pointer hover:bg-white/20 rounded-lg p-4 transition-colors relative"
                                >
                                  {renderTextWithDynamicFields(element.content || '')}
                                  <span className="material-icons text-sm absolute top-2 left-2 opacity-0 group-hover/element:opacity-100">edit</span>
                                </p>
                              )}
                            </div>
                          )}

                          {element.type === 'footer' && (
                            <div className="pb-6 flex justify-center">
                              <img
                                src={nexusLogo}
                                alt="Nexus Logo"
                                className="h-8 w-auto brightness-0 invert opacity-60 drop-shadow-lg"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                )}

                {/* Custom Layout */}
                {selectedLayout === 'custom' && (
                  <div className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <div className="w-20 h-20 border-4 border-dashed border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                        <span className="material-icons text-4xl text-slate-400">add_photo_alternate</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                          צור עיצוב מותאם אישית
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          העלה תבנית משלך או התחל מאפס
                        </p>
                      </div>
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-semibold cursor-pointer hover:bg-primary/90 transition-all"
                      >
                        בחר תמונה
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Layout Styles Sidebar - Only for Email */}
        {messageType === 'email' && (
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
              סגנון פריסה
            </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Classic Layout */}
            <button
              onClick={() => setSelectedLayout('classic')}
              className={`group relative bg-white dark:bg-card-dark p-2 rounded-xl border-2 transition-all ${
                selectedLayout === 'classic'
                  ? 'border-primary shadow-lg'
                  : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col p-2 overflow-hidden">
                <div className="w-full h-1/2 bg-slate-200 dark:bg-slate-700 rounded-sm mb-2"></div>
                <div className="w-3/4 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-1"></div>
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-1"></div>
                <div className="w-1/2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
              {selectedLayout === 'classic' && (
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                  <span className="material-icons text-white text-xs">check</span>
                </div>
              )}
            </button>

            {/* Minimal Layout */}
            <button
              onClick={() => setSelectedLayout('minimal')}
              className={`group relative bg-white dark:bg-card-dark p-2 rounded-xl border-2 transition-all ${
                selectedLayout === 'minimal'
                  ? 'border-primary shadow-lg'
                  : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              <div className={`aspect-[3/4] bg-slate-50 dark:bg-slate-800 rounded-lg flex flex-col p-2 overflow-hidden ${selectedLayout !== 'minimal' ? 'opacity-60' : ''}`}>
                <div className="w-full h-1/3 bg-slate-200 dark:bg-slate-700 rounded-sm mb-2"></div>
                <div className="w-1/2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2"></div>
                <div className="w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
              </div>
              {selectedLayout === 'minimal' && (
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                  <span className="material-icons text-white text-xs">check</span>
                </div>
              )}
            </button>

            {/* Overlay Layout */}
            <button
              onClick={() => setSelectedLayout('overlay')}
              className={`group relative bg-white dark:bg-card-dark p-2 rounded-xl border-2 transition-all ${
                selectedLayout === 'overlay'
                  ? 'border-primary shadow-lg'
                  : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              <div className={`aspect-[3/4] bg-slate-50 dark:bg-slate-800 rounded-lg flex flex-col p-2 overflow-hidden ${selectedLayout !== 'overlay' ? 'opacity-60' : ''}`}>
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-sm flex flex-col justify-end p-2">
                  <div className="w-2/3 h-1 bg-white/50 rounded-full mb-1"></div>
                  <div className="w-full h-1 bg-white/50 rounded-full"></div>
                </div>
              </div>
              {selectedLayout === 'overlay' && (
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                  <span className="material-icons text-white text-xs">check</span>
                </div>
              )}
            </button>

            {/* Custom Layout */}
            <button
              onClick={() => setSelectedLayout('custom')}
              className={`group relative bg-white dark:bg-card-dark p-2 rounded-xl border-2 transition-all ${
                selectedLayout === 'custom'
                  ? 'border-primary shadow-lg'
                  : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              <div className={`aspect-[3/4] bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center p-2 overflow-hidden ${selectedLayout !== 'custom' ? 'opacity-60' : ''}`}>
                <div className="w-6 h-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                  <span className="material-icons text-slate-400 text-sm">add</span>
                </div>
              </div>
              {selectedLayout === 'custom' && (
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                  <span className="material-icons text-white text-xs">check</span>
                </div>
              )}
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate('/send-gift/brands')}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-full transition-colors flex items-center gap-2"
        >
          <span className="material-icons text-xl">arrow_forward</span>
          חזור לבחירה
        </button>

        <button
          onClick={handleNext}
          className="px-10 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5"
        >
          המשך לתצוגה מקדימה
        </button>
      </div>

      {/* Image Selection Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">בחר תמונת רקע</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">בחר מהגלריה או העלה תמונה משלך</p>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-icons text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Preset Images Grid */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
                  תמונות מוכנות
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {presetImages.map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => handlePresetImageSelect(imageUrl)}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg ${
                        cardImageUrl === imageUrl
                          ? 'border-primary ring-4 ring-primary/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Background ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {cardImageUrl === imageUrl && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-icons text-white text-sm">check</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Custom Image */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
                  תמונה מותאמת אישית
                </h3>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <span className="material-icons text-3xl text-slate-400 group-hover:text-primary transition-colors">file_upload</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    לחץ להעלאת תמונה משלך
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    JPG, PNG או GIF (מומלץ 1200x800 פיקסלים)
                  </p>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendGiftGreeting;
