import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RecipientColumnMapping from '../components/RecipientColumnMapping';
import excelLogo from '../assets/logos/excel_logo.png';
import nexusLogo from '../assets/logos/nexus_logo.png';

interface Recipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  giftAmount: number;
  personalGreeting?: string;
  source: 'manual' | 'contact' | 'excel';
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'contact' | 'member';
  address?: string;
  company?: string;
  position?: string;
  notes?: string;
  birthday?: string;
}

const SendGiftRecipients = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [differentAmounts, setDifferentAmounts] = useState(false);
  const [lockSite, setLockSite] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [defaultGiftAmount, setDefaultGiftAmount] = useState(250);
  const [sendTiming, setSendTiming] = useState<'now' | 'scheduled'>('now');

  // Modal states
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showColumnMapping, setShowColumnMapping] = useState(false);

  // Manual add form states
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAmount, setManualAmount] = useState(defaultGiftAmount);
  const [manualGreeting, setManualGreeting] = useState('');

  // Contacts modal states
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'contacts' | 'members'>('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [showContactFilterPanel, setShowContactFilterPanel] = useState(false);
  const [hasEmailFilter, setHasEmailFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [hasPhoneFilter, setHasPhoneFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [hasCompanyFilter, setHasCompanyFilter] = useState<'all' | 'yes' | 'no'>('all');

  // Excel modal states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Selection and editing states
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ recipientId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    giftAmount?: string;
    personalGreeting?: string;
  }>({});

  // Mock contacts data
  const mockContacts: Contact[] = [
    {
      id: '1',
      name: 'יוסי כהן',
      email: 'yossi@example.com',
      phone: '050-1234567',
      type: 'member',
      address: 'רחוב הרצל 25, תל אביב',
      company: 'חברת הייטק בע"מ',
      position: 'מנהל פיתוח',
      birthday: '15/03/1985',
      notes: 'לקוח VIP, מעדיף תקשורת במייל'
    },
    {
      id: '2',
      name: 'שרה לוי',
      email: 'sara@example.com',
      phone: '052-2345678',
      type: 'contact',
      address: 'שדרות רוטשילד 10, תל אביב',
      company: 'לוי ושות׳',
      position: 'עורכת דין',
      birthday: '22/07/1990',
      notes: 'זמינה לפגישות רק בצהריים'
    },
    {
      id: '3',
      name: 'דוד מזרחי',
      email: 'david@example.com',
      phone: '054-3456789',
      type: 'member',
      address: 'רחוב ז\'בוטינסקי 50, רמת גן',
      company: 'מזרחי טכנולוגיות',
      position: 'מנכ"ל',
      birthday: '10/11/1978',
      notes: 'שותף עסקי מרכזי'
    },
    {
      id: '4',
      name: 'רחל אברהם',
      email: 'rachel@example.com',
      phone: '053-4567890',
      type: 'contact',
      address: 'רחוב בן יהודה 8, ירושלים',
      company: 'אברהם שיווק',
      position: 'מנהלת שיווק',
      birthday: '05/01/1988',
      notes: 'מתעניינת בפתרונות דיגיטל'
    },
    {
      id: '5',
      name: 'משה ישראלי',
      email: 'moshe@example.com',
      phone: '050-5678901',
      type: 'member',
      address: 'רחוב ויצמן 15, חיפה',
      company: 'ישראלי ייעוץ',
      position: 'יועץ עסקי',
      birthday: '30/09/1982',
      notes: 'מומלץ מאוד, רמת שירות גבוהה'
    },
  ];

  // Calculate active filters count
  const activeContactFilterCount =
    (contactFilter !== 'all' ? 1 : 0) +
    (contactSearch ? 1 : 0) +
    (hasEmailFilter !== 'all' ? 1 : 0) +
    (hasPhoneFilter !== 'all' ? 1 : 0) +
    (hasCompanyFilter !== 'all' ? 1 : 0);

  // Clear all contact filters
  const clearContactFilters = () => {
    setContactFilter('all');
    setContactSearch('');
    setHasEmailFilter('all');
    setHasPhoneFilter('all');
    setHasCompanyFilter('all');
  };

  // Select all filtered contacts
  const selectAllFilteredContacts = () => {
    setSelectedContacts(filteredContacts.map(c => c.id));
  };

  const filteredContacts = mockContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                         contact.email?.toLowerCase().includes(contactSearch.toLowerCase()) ||
                         contact.phone?.toLowerCase().includes(contactSearch.toLowerCase());
    const matchesType = contactFilter === 'all' ||
                       (contactFilter === 'contacts' && contact.type === 'contact') ||
                       (contactFilter === 'members' && contact.type === 'member');
    const matchesEmail = hasEmailFilter === 'all' ||
                        (hasEmailFilter === 'yes' && contact.email) ||
                        (hasEmailFilter === 'no' && !contact.email);
    const matchesPhone = hasPhoneFilter === 'all' ||
                        (hasPhoneFilter === 'yes' && contact.phone) ||
                        (hasPhoneFilter === 'no' && !contact.phone);
    const matchesCompany = hasCompanyFilter === 'all' ||
                          (hasCompanyFilter === 'yes' && contact.company) ||
                          (hasCompanyFilter === 'no' && !contact.company);
    return matchesSearch && matchesType && matchesEmail && matchesPhone && matchesCompany;
  });

  const steps = [
    { number: 1, label: 'אירוע', active: false },
    { number: 2, label: 'מתנה', active: false },
    { number: 3, label: 'ברכה', active: false },
    { number: 4, label: 'נמענים', active: true },
    { number: 5, label: 'סיכום', active: false },
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (recipients.length > 0) {
      navigate('/send-gift/summary');
    }
  };

  // Manual add handlers
  const handleManualAdd = () => {
    if (!manualName || (!manualEmail && !manualPhone)) {
      alert('נא למלא שם ואימייל או טלפון');
      return;
    }

    const newRecipient: Recipient = {
      id: Date.now().toString(),
      name: manualName,
      email: manualEmail || undefined,
      phone: manualPhone || undefined,
      giftAmount: manualAmount,
      personalGreeting: manualGreeting || undefined,
      source: 'manual',
    };

    setRecipients([...recipients, newRecipient]);
    setShowManualAddModal(false);
    // Reset form
    setManualName('');
    setManualEmail('');
    setManualPhone('');
    setManualAmount(defaultGiftAmount);
    setManualGreeting('');
  };

  // Contacts modal handlers
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleAddFromContacts = () => {
    const contactsToAdd = mockContacts
      .filter(contact => selectedContacts.includes(contact.id))
      .map(contact => ({
        id: Date.now().toString() + contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        giftAmount: defaultGiftAmount,
        source: 'contact' as const,
      }));

    setRecipients([...recipients, ...contactsToAdd]);
    setShowContactsModal(false);
    setSelectedContacts([]);
    setContactSearch('');
  };

  // Excel handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = validTypes.includes(file.type) || ['xlsx', 'xls', 'csv'].includes(fileExtension || '');

    if (!isValidType) {
      alert('אנא העלה קובץ Excel או CSV בלבד');
      return;
    }

    setUploadedFile(file);
    // Simulate upload delay then show column mapping
    setTimeout(() => {
      setShowExcelModal(false);
      setShowColumnMapping(true);
    }, 1500);
  };

  const handleColumnMappingComplete = () => {
    // Mock imported recipients after column mapping
    const importedRecipients: Recipient[] = [
      {
        id: Date.now().toString() + '1',
        name: 'משתמש מיובא 1',
        email: 'imported1@example.com',
        giftAmount: defaultGiftAmount,
        source: 'excel',
      },
      {
        id: Date.now().toString() + '2',
        name: 'משתמש מיובא 2',
        email: 'imported2@example.com',
        giftAmount: defaultGiftAmount,
        source: 'excel',
      },
      {
        id: Date.now().toString() + '3',
        name: 'משתמש מיובא 3',
        email: 'imported3@example.com',
        phone: '050-9876543',
        giftAmount: defaultGiftAmount,
        source: 'excel',
      },
    ];
    setRecipients([...recipients, ...importedRecipients]);
    setShowColumnMapping(false);
    setUploadedFile(null);
    alert('ייבוא הושלם בהצלחה! 3 נמענים התווספו.');
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDeleteRecipient = (recipientId: string) => {
    setRecipients(recipients.filter(r => r.id !== recipientId));
  };

  // Selection handlers
  const toggleRecipientSelection = (recipientId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map(r => r.id));
    }
  };

  // Inline editing handlers
  const startEditing = (recipientId: string, field: string, currentValue: any) => {
    setEditingCell({ recipientId, field });
    setEditValue(currentValue?.toString() || '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (!editingCell) return;

    setRecipients(recipients.map(r => {
      if (r.id === editingCell.recipientId) {
        if (editingCell.field === 'giftAmount') {
          return { ...r, [editingCell.field]: Number(editValue) || 0 };
        }
        return { ...r, [editingCell.field]: editValue || undefined };
      }
      return r;
    }));

    cancelEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Bulk edit handlers
  const handleBulkEdit = () => {
    const updates: any = {};
    if (bulkEditData.name) updates.name = bulkEditData.name;
    if (bulkEditData.email) updates.email = bulkEditData.email;
    if (bulkEditData.phone) updates.phone = bulkEditData.phone;
    if (bulkEditData.giftAmount) updates.giftAmount = Number(bulkEditData.giftAmount);
    if (bulkEditData.personalGreeting) updates.personalGreeting = bulkEditData.personalGreeting;

    setRecipients(recipients.map(r => {
      if (selectedRecipients.includes(r.id)) {
        return { ...r, ...updates };
      }
      return r;
    }));

    setShowBulkEditModal(false);
    setBulkEditData({});
    setSelectedRecipients([]);
  };

  const handleDeleteSelected = () => {
    if (confirm(`האם למחוק ${selectedRecipients.length} נמענים?`)) {
      setRecipients(recipients.filter(r => !selectedRecipients.includes(r.id)));
      setSelectedRecipients([]);
    }
  };

  const totalValue = recipients.reduce((sum, r) => sum + r.giftAmount, 0);

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
            onClick={() => navigate('/send-gift/greeting')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-icons text-slate-400">arrow_forward</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">למי לשלוח את המתנה ומתי?</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">שלב 4 מתוך 5 - הוספת נמענים</p>
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

      {/* Action Bar */}
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="bg-primary text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                הוספת נמענים
                <span className="material-icons text-xl">expand_more</span>
              </button>

              {/* Add Recipients Dropdown */}
              {showAddMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-50 min-w-[240px]">
                  <button
                    onClick={() => {
                      setShowManualAddModal(true);
                      setShowAddMenu(false);
                    }}
                    className="w-full text-right px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <span className="material-icons text-primary">person_add</span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">הוסף ידנית</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">הזן פרטי נמען בודד</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowContactsModal(true);
                      setShowAddMenu(false);
                    }}
                    className="w-full text-right px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <span className="material-icons text-primary">contacts</span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">מאנשי קשר</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">בחר מרשימת אנשי הקשר</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowExcelModal(true);
                      setShowAddMenu(false);
                    }}
                    className="w-full text-right px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <span className="material-icons text-primary">upload_file</span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">ייבא מ-Excel</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">העלה קובץ אקסל</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <button className="border border-primary text-primary px-6 py-2.5 rounded-full font-bold hover:bg-primary/5 transition-all">
              תצוגה מקדימה
            </button>
          </div>

          <div className="flex items-center gap-6">
            {/* Timing */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">תזמון שליחה</label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={sendTiming}
                    onChange={(e) => setSendTiming(e.target.value as 'now' | 'scheduled')}
                    className="appearance-none bg-slate-50 dark:bg-slate-800 border-none rounded-lg pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 min-w-[140px] cursor-pointer"
                  >
                    <option value="now">שליחה כעת</option>
                    <option value="scheduled">שליחה מתוזמנת</option>
                  </select>
                  <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">
                    schedule
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="תוקף המתנה"
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 w-40"
                  />
                  <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    calendar_today
                  </span>
                </div>
              </div>
            </div>

            <div className="border-r border-slate-200 dark:border-slate-700 h-10 mx-2"></div>

            {/* Summary */}
            <div className="text-left">
              <div className="text-xs text-slate-400">סה״כ שווי {totalValue.toLocaleString()} ₪</div>
              <div className="font-bold text-lg">{recipients.length} נמענים</div>
            </div>
          </div>
        </div>
      </div>

      {/* Options Row */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={differentAmounts}
              onChange={(e) => setDifferentAmounts(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
              סכומים שונים
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={lockSite}
              onChange={(e) => setLockSite(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
              נעילת אתר בחירה בקוד
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">פריטים בעמוד</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-3 text-sm"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="relative ml-4 flex items-center gap-2">
            <span className="text-sm text-slate-500">סכום המתנה</span>
            <input
              type="number"
              value={defaultGiftAmount}
              onChange={(e) => setDefaultGiftAmount(Number(e.target.value))}
              className="w-24 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 text-sm focus:ring-primary"
            />
            <span className="text-sm text-slate-500">₪</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedRecipients.length > 0 && (
        <div className="bg-primary text-white rounded-2xl p-4 mb-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg">{selectedRecipients.length} נבחרו</span>
            <button
              onClick={() => setSelectedRecipients([])}
              className="text-sm hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
            >
              נקה בחירה
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBulkEditModal(true)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <span className="material-icons text-lg">edit</span>
              עריכה קבוצתית
            </button>
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <span className="material-icons text-lg">delete</span>
              מחק נבחרים
            </button>
          </div>
        </div>
      )}

      {/* Recipients Table */}
      <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[60px_minmax(180px,1fr)_minmax(200px,1fr)_140px_minmax(150px,1fr)_100px] bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 text-sm font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800 items-center">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={recipients.length > 0 && selectedRecipients.length === recipients.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
            />
          </div>
          <div>שם</div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xs whitespace-nowrap">אימייל</span>
            <button
              onClick={() => setContactMethod(contactMethod === 'email' ? 'phone' : 'email')}
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors flex-shrink-0 ${
                contactMethod === 'email' ? 'bg-primary/20' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-primary rounded-full transition-all ${
                  contactMethod === 'email' ? 'right-0.5' : 'left-0.5'
                }`}
              ></div>
            </button>
            <span className="text-xs whitespace-nowrap">טלפון</span>
          </div>
          <div className="text-center">סכום המתנה</div>
          <div className="text-center">ברכה אישית</div>
          <div className="text-center">פעולות</div>
        </div>

        {/* Empty State */}
        {recipients.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="mb-8 relative">
              <div className="flex items-center justify-center gap-[-10px]">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center transform -rotate-6">
                  <span className="material-icons text-4xl text-purple-500">face</span>
                </div>
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center z-10 -mx-4">
                  <span className="material-icons text-5xl text-orange-500">face</span>
                </div>
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center transform rotate-6">
                  <span className="material-icons text-4xl text-amber-500">face</span>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 animate-bounce">
                <span className="material-icons text-primary text-4xl transform rotate-180">
                  south_west
                </span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">3 דרכים קלות להוספת נמענים</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              התחילו בהוספת נמען ראשון באופן ידני או ייבוא רשימה מקובץ אקסל
            </p>
          </div>
        )}

        {/* Recipients List */}
        {recipients.map((recipient) => {
          const isEditing = (field: string) =>
            editingCell?.recipientId === recipient.id && editingCell?.field === field;

          return (
            <div
              key={recipient.id}
              className={`grid grid-cols-[60px_minmax(180px,1fr)_minmax(200px,1fr)_140px_minmax(150px,1fr)_100px] px-6 py-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors items-center ${
                selectedRecipients.includes(recipient.id) ? 'bg-primary/5' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(recipient.id)}
                  onChange={() => toggleRecipientSelection(recipient.id)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                />
              </div>

              {/* Name - Editable */}
              <div className="flex items-center min-w-0">
                {isEditing('name') ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span
                    onClick={() => startEditing(recipient.id, 'name', recipient.name)}
                    className="cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                  >
                    {recipient.name}
                  </span>
                )}
              </div>

              {/* Email/Phone - Editable */}
              <div className="flex items-center justify-center min-w-0">
                {contactMethod === 'email' ? (
                  isEditing('email') ? (
                    <input
                      type="email"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <span
                      onClick={() => startEditing(recipient.id, 'email', recipient.email)}
                      className="cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                    >
                      {recipient.email || '-'}
                    </span>
                  )
                ) : isEditing('phone') ? (
                  <input
                    type="tel"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span
                    onClick={() => startEditing(recipient.id, 'phone', recipient.phone)}
                    className="cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {recipient.phone || '-'}
                  </span>
                )}
              </div>

              {/* Gift Amount - Editable */}
              <div className="flex items-center justify-center">
                {isEditing('giftAmount') ? (
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
                  />
                ) : (
                  <span
                    onClick={() => startEditing(recipient.id, 'giftAmount', recipient.giftAmount)}
                    className="cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
                  >
                    {recipient.giftAmount} ₪
                  </span>
                )}
              </div>

              {/* Personal Greeting - Editable */}
              <div className="flex items-center justify-center min-w-0">
                {isEditing('personalGreeting') ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span
                    onClick={() => startEditing(recipient.id, 'personalGreeting', recipient.personalGreeting)}
                    className="cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-500 truncate"
                  >
                    {recipient.personalGreeting || '-'}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDeleteRecipient(recipient.id)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="מחק נמען"
                >
                  <span className="material-icons text-sm text-red-400">delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/send-gift/greeting')}
            className="px-12 py-3 border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-all"
          >
            חזרה
          </button>
          <button
            onClick={handleNext}
            disabled={recipients.length === 0}
            className={`px-12 py-3 font-bold rounded-xl shadow-lg transition-all ${
              recipients.length === 0
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
            }`}
          >
            הבא
          </button>
        </div>
      </div>

      {/* MODAL 1: Manual Add Modal */}
      {showManualAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">הוסף נמען ידנית</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">הזן את פרטי הנמען</p>
              </div>
              <button
                onClick={() => setShowManualAddModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-icons text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    שם מלא <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="הזן שם מלא"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    אימייל {contactMethod === 'email' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    טלפון {contactMethod === 'phone' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="050-1234567"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Gift Amount */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    סכום מתנה (₪)
                  </label>
                  <input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Personal Greeting */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    ברכה אישית (אופציונלי)
                  </label>
                  <textarea
                    value={manualGreeting}
                    onChange={(e) => setManualGreeting(e.target.value)}
                    placeholder="הזן ברכה אישית..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowManualAddModal(false)}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all"
              >
                ביטול
              </button>
              <button
                onClick={handleManualAdd}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
              >
                הוסף נמען
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Contacts Selection Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
            {/* Filter Panel Sidebar */}
            {showContactFilterPanel && (
              <aside className="w-[380px] border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-left flex flex-col max-h-[90vh]">
                <div className="flex-1 overflow-y-auto">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold">סינון אנשי קשר</h2>
                      <button
                        onClick={() => setShowContactFilterPanel(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">סנן אנשי קשר לפי קריטריונים שונים</p>
                  </div>

                  {/* Filter Content */}
                  <div className="p-6 space-y-6">
                    {/* Select All Button */}
                    <button
                      onClick={selectAllFilteredContacts}
                      className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <span className="material-icons text-lg">done_all</span>
                      סמן הכל ({filteredContacts.length})
                    </button>

                    {/* Active Filters Count */}
                    {activeContactFilterCount > 0 && (
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                        <span className="text-sm font-medium text-primary">{activeContactFilterCount} סינונים פעילים</span>
                        <button
                          onClick={clearContactFilters}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          נקה הכל
                        </button>
                      </div>
                    )}

                    {/* Search Input */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                        חיפוש חופשי
                      </label>
                      <div className="relative">
                        <span className="material-icons absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                          search
                        </span>
                        <input
                          type="text"
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          placeholder="שם, אימייל או טלפון..."
                          className="w-full ps-10 pe-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                        סוג איש קשר
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="contactType"
                            checked={contactFilter === 'all'}
                            onChange={() => setContactFilter('all')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">הכל</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="contactType"
                            checked={contactFilter === 'contacts'}
                            onChange={() => setContactFilter('contacts')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                            אנשי קשר
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="contactType"
                            checked={contactFilter === 'members'}
                            onChange={() => setContactFilter('members')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            חברים רשומים
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Has Email Filter */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                        יש אימייל
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="hasEmail"
                            checked={hasEmailFilter === 'all'}
                            onChange={() => setHasEmailFilter('all')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">הכל</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="hasEmail"
                            checked={hasEmailFilter === 'yes'}
                            onChange={() => setHasEmailFilter('yes')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">כן</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="hasEmail"
                            checked={hasEmailFilter === 'no'}
                            onChange={() => setHasEmailFilter('no')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">לא</span>
                        </label>
                      </div>
                    </div>

                    {/* Has Phone Filter */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                        יש טלפון
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="hasPhone"
                            checked={hasPhoneFilter === 'all'}
                            onChange={() => setHasPhoneFilter('all')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">הכל</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="hasPhone"
                            checked={hasPhoneFilter === 'yes'}
                            onChange={() => setHasPhoneFilter('yes')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">כן</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="hasPhone"
                            checked={hasPhoneFilter === 'no'}
                            onChange={() => setHasPhoneFilter('no')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">לא</span>
                        </label>
                      </div>
                    </div>

                    {/* Has Company Filter */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                        יש חברה
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="hasCompany"
                            checked={hasCompanyFilter === 'all'}
                            onChange={() => setHasCompanyFilter('all')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">הכל</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="hasCompany"
                            checked={hasCompanyFilter === 'yes'}
                            onChange={() => setHasCompanyFilter('yes')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">כן</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <input
                            type="radio"
                            name="hasCompany"
                            checked={hasCompanyFilter === 'no'}
                            onChange={() => setHasCompanyFilter('no')}
                            className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">לא</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      תוצאות
                    </div>
                    <div className="text-sm text-slate-900 dark:text-white font-bold">
                      {filteredContacts.length} מתוך {mockContacts.length}
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">בחר מאנשי קשר</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {selectedContacts.length} נבחרו
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowContactsModal(false);
                    setSelectedContacts([]);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-icons text-slate-500">close</span>
                </button>
              </div>

              {/* Search and Filter Button */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="חפש לפי שם או אימייל..."
                      className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                    <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                  </div>

                  {/* Filter Button */}
                  <button
                    onClick={() => setShowContactFilterPanel(!showContactFilterPanel)}
                    className={`px-4 py-3 border rounded-xl text-sm font-medium flex items-center gap-2 transition-colors flex-shrink-0 ${
                      activeContactFilterCount > 0
                        ? 'bg-primary text-white border-primary'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="material-icons text-sm">filter_list</span>
                    סינון
                    {activeContactFilterCount > 0 && (
                      <span className="bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {activeContactFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Contacts List */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`rounded-xl border-2 transition-all overflow-hidden ${
                      selectedContacts.includes(contact.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Main Contact Row */}
                    <div className="flex items-center gap-4 p-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleContactSelection(contact.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          selectedContacts.includes(contact.id)
                            ? 'bg-primary border-primary'
                            : 'border-slate-300 dark:border-slate-600 hover:border-primary'
                        }`}
                      >
                        {selectedContacts.includes(contact.id) && (
                          <span className="material-icons text-white text-sm">check</span>
                        )}
                      </button>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">
                          {contact.name.charAt(0)}
                        </span>
                      </div>

                      {/* Info */}
                      <div
                        onClick={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)}
                        className="flex-1 cursor-pointer hover:text-primary transition-colors"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {contact.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {contact.email || contact.phone}
                        </div>
                      </div>

                      {/* Badge */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        contact.type === 'member'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                      }`}>
                        {contact.type === 'member' ? 'חבר' : 'איש קשר'}
                      </div>

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all flex-shrink-0"
                      >
                        <span className={`material-icons text-slate-400 transition-transform ${
                          expandedContact === contact.id ? 'rotate-180' : ''
                        }`}>
                          expand_more
                        </span>
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {expandedContact === contact.id && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {contact.company && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">חברה</div>
                              <div className="font-medium text-slate-700 dark:text-slate-300">{contact.company}</div>
                            </div>
                          )}
                          {contact.position && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">תפקיד</div>
                              <div className="font-medium text-slate-700 dark:text-slate-300">{contact.position}</div>
                            </div>
                          )}
                          {contact.phone && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">טלפון</div>
                              <div className="font-medium text-slate-700 dark:text-slate-300">{contact.phone}</div>
                            </div>
                          )}
                          {contact.email && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">אימייל</div>
                              <div className="font-medium text-slate-700 dark:text-slate-300 truncate">{contact.email}</div>
                            </div>
                          )}
                          {contact.address && (
                            <div className="col-span-2">
                              <div className="text-xs text-slate-400 mb-1">כתובת</div>
                              <div className="font-medium text-slate-700 dark:text-slate-300">{contact.address}</div>
                            </div>
                          )}
                          {contact.birthday && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">תאריך לידה</div>
                              <div className="font-medium text-slate-700 dark:text-slate-300">{contact.birthday}</div>
                            </div>
                          )}
                          {contact.notes && (
                            <div className="col-span-2">
                              <div className="text-xs text-slate-400 mb-1">הערות</div>
                              <div className="font-medium text-slate-700 dark:text-slate-300 italic">{contact.notes}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  ))}

                  {filteredContacts.length === 0 && (
                    <div className="text-center py-12">
                      <span className="material-icons text-slate-300 dark:text-slate-600 text-5xl mb-3">
                        search_off
                      </span>
                      <p className="text-slate-500 dark:text-slate-400">לא נמצאו אנשי קשר</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                <button
                  onClick={() => {
                    if (selectedContacts.length === filteredContacts.length) {
                      setSelectedContacts([]);
                    } else {
                      setSelectedContacts(filteredContacts.map(c => c.id));
                    }
                  }}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  {selectedContacts.length === filteredContacts.length ? 'נקה הכל' : 'בחר הכל'}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowContactsModal(false);
                      setSelectedContacts([]);
                    }}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleAddFromContacts}
                    disabled={selectedContacts.length === 0}
                    className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all ${
                      selectedContacts.length === 0
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                    }`}
                  >
                    הוסף {selectedContacts.length > 0 && `(${selectedContacts.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Excel Import Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl max-w-6xl w-full h-[85vh] flex overflow-hidden">
            {/* Left Side - Content */}
            <div className="flex-1 flex flex-col p-8 md:p-12 relative overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
                    <span className="material-icons text-sm">table_view</span>
                    <span className="material-icons text-xs">chevron_left</span>
                    <span className="material-icons text-sm text-emerald-600">drive_folder_upload</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">ייבוא נמענים</span>
                  <button
                    onClick={() => {
                      setShowExcelModal(false);
                      setUploadedFile(null);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <span className="material-icons text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      close
                    </span>
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="max-w-xl">
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">
                  ייבוא נמענים מאקסל
                </h1>
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8">
                  העלה קובץ Excel או CSV עם רשימת הנמענים. הנמענים יתווספו אוטומטית לרשימת אנשי הקשר שלך.
                </p>

                {/* Upload Area */}
                <label
                  htmlFor="recipient-file-upload"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl group cursor-pointer transition-all duration-300 block ${
                    isDragging
                      ? 'border-primary bg-primary/5 scale-105'
                      : 'border-slate-300 dark:border-slate-600 hover:border-primary'
                  }`}
                >
                  <input
                    id="recipient-file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {!uploadedFile ? (
                    <div className="py-16 md:py-20 flex flex-col items-center justify-center text-center px-6">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform border border-slate-200 dark:border-slate-700">
                        <span className="material-icons text-3xl">upload_file</span>
                      </div>
                      <p className="text-lg text-slate-900 dark:text-white font-medium">
                        <span className="text-violet-600 hover:underline cursor-pointer">עיין בקבצים שלך</span> או גרור ושחרר כאן
                      </p>
                      <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                        וודא שזה קובץ CSV, XLS, או XLSX.
                      </p>
                    </div>
                  ) : (
                    <div className="py-16 md:py-20 flex items-center justify-center gap-3">
                      <span className="material-icons text-green-600 text-3xl">check_circle</span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500">מעבד קובץ...</p>
                      </div>
                    </div>
                  )}
                </label>

                {/* Help Section */}
                <div className="mt-8 md:mt-12">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">צריך עזרה להתחיל?</h3>
                  <div className="flex flex-col gap-3">
                    <a className="flex items-center gap-2 text-violet-600 hover:underline text-sm font-medium" href="#">
                      קרא ולמד <span className="text-slate-500 dark:text-slate-400 font-normal">על ייבוא נמענים</span>
                    </a>
                    <a className="flex items-center gap-2 text-violet-600 hover:underline text-sm font-medium" href="#">
                      הורד <span className="text-slate-500 dark:text-slate-400 font-normal">קובץ Excel לדוגמה</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Animation */}
            <div className="hidden lg:flex w-[42%] bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col items-center justify-center p-12 overflow-hidden relative">
              {/* Floating Logos */}
              <div className="flex items-center justify-center gap-8 relative z-10">
                {/* Excel Logo */}
                <div className="w-24 h-24 md:w-28 md:h-28 bg-white dark:bg-slate-700 rounded-3xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-600 p-3">
                  <img src={excelLogo} alt="Excel" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-[3px] bg-gradient-to-l from-teal-400 to-green-500 rounded-full"></div>
                  <span className="material-icons text-teal-500 dark:text-teal-400 mt-2 text-2xl">arrow_back</span>
                </div>
                {/* Nexus Logo */}
                <div className="w-24 h-24 md:w-28 md:h-28 bg-white dark:bg-slate-700 rounded-3xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-600 p-4">
                  <img src={nexusLogo} alt="Nexus" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Description */}
              <div className="mt-16 text-center max-w-[280px] relative z-10">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  ייבא נמענים באופן אוטומטי והם יתווספו גם לרשימת אנשי הקשר שלך
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapping Component */}
      {showColumnMapping && (
        <RecipientColumnMapping
          onClose={() => {
            setShowColumnMapping(false);
            setUploadedFile(null);
          }}
          onComplete={handleColumnMappingComplete}
          fileName={uploadedFile?.name}
        />
      )}

      {/* MODAL: Bulk Edit */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">עריכה קבוצתית</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  עדכן {selectedRecipients.length} נמענים בבת אחת
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBulkEditModal(false);
                  setBulkEditData({});
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-icons text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="material-icons text-violet-600 text-xl">info</span>
                  <div className="text-sm text-violet-700 dark:text-violet-300">
                    <p className="font-semibold mb-1">עצה:</p>
                    <p>מלא רק את השדות שברצונך לעדכן. שדות ריקים לא ישתנו.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    שם מלא
                  </label>
                  <input
                    type="text"
                    value={bulkEditData.name || ''}
                    onChange={(e) => setBulkEditData({ ...bulkEditData, name: e.target.value })}
                    placeholder="השאר ריק כדי לא לשנות"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    אימייל
                  </label>
                  <input
                    type="email"
                    value={bulkEditData.email || ''}
                    onChange={(e) => setBulkEditData({ ...bulkEditData, email: e.target.value })}
                    placeholder="השאר ריק כדי לא לשנות"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    value={bulkEditData.phone || ''}
                    onChange={(e) => setBulkEditData({ ...bulkEditData, phone: e.target.value })}
                    placeholder="השאר ריק כדי לא לשנות"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Gift Amount */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    סכום מתנה (₪)
                  </label>
                  <input
                    type="number"
                    value={bulkEditData.giftAmount || ''}
                    onChange={(e) => setBulkEditData({ ...bulkEditData, giftAmount: e.target.value })}
                    placeholder="השאר ריק כדי לא לשנות"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Personal Greeting */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    ברכה אישית
                  </label>
                  <textarea
                    value={bulkEditData.personalGreeting || ''}
                    onChange={(e) => setBulkEditData({ ...bulkEditData, personalGreeting: e.target.value })}
                    placeholder="השאר ריק כדי לא לשנות"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowBulkEditModal(false);
                  setBulkEditData({});
                }}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all"
              >
                ביטול
              </button>
              <button
                onClick={handleBulkEdit}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
              >
                החל על {selectedRecipients.length} נמענים
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendGiftRecipients;
