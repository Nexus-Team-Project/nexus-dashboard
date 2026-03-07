import { useState, useEffect, useRef, useCallback } from 'react';
import ColumnMapping from '../components/ColumnMapping';
import excelLogo from '../assets/logos/excel_logo.png';
import nexusLogo from '../assets/logos/nexus_logo.png';
import { usersApi, type AdminUser, type UserRole } from '../lib/api';

// ─── Types ───────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  address: string;
  lastActivity: string;
  firstJoined: string;
  userType: 'contact' | 'member';
  systemRole: UserRole;
  orgs: AdminUser['orgMemberships'];
}

// ─── Constants ───────────────────────────────────────────────────

const SYSTEM_ROLE_LABELS: Record<UserRole, string> = {
  USER:  'משתמש',
  ADMIN: 'מנהל מערכת',
  AGENT: 'סוכן',
};

const SYSTEM_ROLE_COLORS: Record<UserRole, string> = {
  USER:  'bg-slate-100 text-slate-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  AGENT: 'bg-blue-100 text-blue-700',
};

const ORG_ROLE_LABELS: Record<string, string> = {
  OWNER:  'בעלים',
  ADMIN:  'מנהל',
  MEMBER: 'חבר',
};

// ─── Helpers ─────────────────────────────────────────────────────

function relativeTime(dateStr: string | undefined): string {
  if (!dateStr) return 'אף פעם';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 2)   return 'לפני רגע';
  if (min < 60)  return `לפני ${min} דקות`;
  if (hr  < 24)  return `לפני ${hr} שעות`;
  if (day < 7)   return `לפני ${day} ימים`;
  if (day < 30)  return `לפני ${Math.floor(day / 7)} שבועות`;
  if (day < 365) return `לפני ${Math.floor(day / 30)} חודשים`;
  return `לפני ${Math.floor(day / 365)} שנים`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function mapAdminUser(u: AdminUser): User {
  return {
    id:           u.id,
    name:         u.fullName,
    email:        u.email,
    phone:        u.phone ?? '',
    status:       u.status,
    address:      u.country,
    lastActivity: relativeTime(u.lastLoginAt),
    firstJoined:  formatDate(u.createdAt),
    userType:     u.orgMemberships.length > 0 ? 'member' : 'contact',
    systemRole:   u.role,
    orgs:         u.orgMemberships,
  };
}

interface Activity {
  id: string;
  title: string;
  description: string;
  color: string;
}

const Users = () => {
  // ─── API state ─────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiError, setApiError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleChanging, setRoleChanging] = useState(false);

  // ─── Existing UI state ─────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('purchases');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarKey, setSidebarKey] = useState<number>(Date.now());
  const [copiedText, setCopiedText] = useState<string>('');
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [showImportExportMenu, setShowImportExportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [exportOption, setExportOption] = useState<'all' | 'selected'>('all');
  const [sendEmailCopy, setSendEmailCopy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'members'>('contacts');
  const [showMemberTooltip, setShowMemberTooltip] = useState(false);
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldType, setCustomFieldType] = useState<'text' | 'number' | 'link' | 'date' | 'dropdown'>('text');
  const [customFields, setCustomFields] = useState<Array<{id: string; name: string; type: string; visible: boolean}>>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isCustomizeLoading, setIsCustomizeLoading] = useState(false);
  const [filters, setFilters] = useState({
    searchText: '',
    status: 'all' as 'all' | 'active' | 'inactive' | 'pending',
    dateFrom: '',
    dateTo: ''
  });
  const [customFieldFilters, setCustomFieldFilters] = useState<Record<string, string>>({});
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState(false);
  const [showMoreActionsTooltip, setShowMoreActionsTooltip] = useState(false);
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [headerWidth, setHeaderWidth] = useState(0);
  const [headerLeft, setHeaderLeft] = useState(0);
  const [_horizontalScrolled, setHorizontalScrolled] = useState(false);
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerOffsetRef = useRef<number>(0);
  const [showManualRegistrationModal, setShowManualRegistrationModal] = useState(false);
  const [manualContactData, setManualContactData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [rowActionMenuId, setRowActionMenuId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    status: true,
    address: true,
    lastActivity: true,
    firstJoined: true,
  });
  const [frozenColumns, setFrozenColumns] = useState<string[]>(['checkbox']); // checkbox is always frozen

  // Sticky header scroll listener
  useEffect(() => {
    const updateHeaderPosition = () => {
      if (tableRef.current && tableHeaderRef.current && tableContainerRef.current) {
        const tableRect = tableRef.current.getBoundingClientRect();
        void tableContainerRef.current.scrollLeft; // tracked via event listener below

        setHeaderWidth(tableRect.width);
        setHeaderLeft(tableRect.left);

        // Store original offset only once
        if (headerOffsetRef.current === 0) {
          headerOffsetRef.current = tableHeaderRef.current.getBoundingClientRect().top + window.scrollY;
        }
      }
    };

    const handleScroll = () => {
      if (tableRef.current && tableHeaderRef.current) {
        const dashboardHeaderHeight = 64;
        const scrollPosition = window.scrollY + dashboardHeaderHeight;

        const shouldBeFixed = scrollPosition >= headerOffsetRef.current;

        if (shouldBeFixed !== isHeaderFixed) {
          setIsHeaderFixed(shouldBeFixed);
        }

        // Update position on scroll
        if (shouldBeFixed) {
          updateHeaderPosition();
        }
      }
    };

    const handleHorizontalScroll = () => {
      if (isHeaderFixed) {
        updateHeaderPosition();
      }

      // Track horizontal scroll for frozen columns
      if (tableContainerRef.current) {
        const scrollLeft = tableContainerRef.current.scrollLeft;
        setHorizontalScrolled(scrollLeft > 0);
      }
    };

    // Set initial position
    updateHeaderPosition();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateHeaderPosition);

    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleHorizontalScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeaderPosition);
      if (container) {
        container.removeEventListener('scroll', handleHorizontalScroll);
      }
    };
  }, [isHeaderFixed, showCustomizePanel, showFilterPanel, selectedUser]);

  // Update header position when panels open/close
  useEffect(() => {
    if (isHeaderFixed && tableRef.current) {
      setTimeout(() => {
        const tableRect = tableRef.current!.getBoundingClientRect();
        setHeaderWidth(tableRect.width);
        setHeaderLeft(tableRect.left);
      }, 350); // Wait for transition to complete
    }
  }, [showCustomizePanel, showFilterPanel, selectedUser, isHeaderFixed]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // ─── Load users from API ────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setIsTableLoading(true);
    setApiError('');
    try {
      const res = await usersApi.list({
        search: filters.searchText || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        page:   currentPage,
        limit:  50,
      });
      setUsers(res.users.map(mapAdminUser));
      setUsersTotal(res.total);
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setIsTableLoading(false);
    }
  }, [filters.searchText, filters.status, currentPage]);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const t = setTimeout(() => { loadUsers(); }, filters.searchText ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadUsers]);


  const activities: Activity[] = [
    {
      id: '1',
      title: 'רכישה בוצעה',
      description: 'לפני 2 דקות - מוצר #402',
      color: 'bg-emerald-400'
    },
    {
      id: '2',
      title: 'התחברות למערכת',
      description: 'היום, 09:41',
      color: 'bg-blue-400'
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      inactive: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    };

    const labels = {
      active: 'פעיל',
      inactive: 'לא פעיל',
      pending: 'בהמתנה'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  const toggleColumnVisibility = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const toggleColumnFreeze = (column: string) => {
    setFrozenColumns(prev => {
      const newFrozen = prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column];
      console.log('Frozen columns:', newFrozen);
      return newFrozen;
    });
  };

  const getColumnLeftPosition = (columnKey: string): number => {
    const columnOrder = ['checkbox', 'name', 'email', 'status', 'address', 'lastActivity', 'firstJoined'];
    const frozenBeforeThis = columnOrder.slice(0, columnOrder.indexOf(columnKey))
      .filter(col => {
        // Only count frozen columns that are also visible
        if (col === 'checkbox') return true; // checkbox is always visible
        return frozenColumns.includes(col) && visibleColumns[col as keyof typeof visibleColumns];
      });

    let left = 0;
    frozenBeforeThis.forEach(col => {
      if (col === 'checkbox') left += 64; // checkbox column width
      else if (col === 'name') left += 200;
      else if (col === 'email') left += 240;
      else if (col === 'status') left += 140;
      else if (col === 'address') left += 220;
      else if (col === 'lastActivity') left += 180;
      else if (col === 'firstJoined') left += 160;
    });
    return left;
  };

  const isLastFrozenColumn = (columnKey: string): boolean => {
    const columnOrder = ['checkbox', 'name', 'email', 'status', 'address', 'lastActivity', 'firstJoined'];
    const visibleFrozenColumns = columnOrder.filter(col => {
      if (col === 'checkbox') return true;
      return frozenColumns.includes(col) && visibleColumns[col as keyof typeof visibleColumns];
    });
    return visibleFrozenColumns[visibleFrozenColumns.length - 1] === columnKey;
  };

  // Apply frozen column positioning when scrolling horizontally
  useEffect(() => {
    const applyFrozenColumnPositions = () => {
      if (!tableRef.current || !tableContainerRef.current) return;

      const scrollLeft = tableContainerRef.current.scrollLeft;
      const shouldFreeze = scrollLeft > 0;

      // Get all cells in frozen columns
      const allRows = tableRef.current.querySelectorAll('tr');

      allRows.forEach((row) => {
        // Checkbox column (always frozen)
        const checkboxCell = row.querySelector('th:first-child, td:first-child') as HTMLElement;
        if (checkboxCell) {
          if (shouldFreeze) {
            checkboxCell.style.position = 'relative';
            checkboxCell.style.left = `${scrollLeft}px`;
            checkboxCell.style.zIndex = '15';
          } else {
            checkboxCell.style.position = '';
            checkboxCell.style.left = '';
            checkboxCell.style.zIndex = '';
          }
        }
      });
    };

    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', applyFrozenColumnPositions);
      applyFrozenColumnPositions(); // Initial call
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', applyFrozenColumnPositions);
      }
    };
  }, []);

  const clearFilters = () => {
    setFilters({
      searchText: '',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setCustomFieldFilters({});
  };

  // Search + status → server-side (handled by API). Tab → client-side.
  const filteredUsers = users.filter(user => {
    if (activeTab === 'members' && user.userType !== 'member') return false;
    return true;
  });

  const activeFilterCount =
    (filters.searchText ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    Object.values(customFieldFilters).filter(v => v).length;

  const handleRowClick = async (user: User) => {
    // Toggle: if clicking the same user, close the sidebar
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
    } else {
      // Set loading first, then update key after a micro-delay
      setIsLoading(true);

      // Small delay to ensure loading state is set before animation
      await new Promise(resolve => setTimeout(resolve, 50));
      setSidebarKey(Date.now());

      // Simulate loading user data
      await new Promise(resolve => setTimeout(resolve, 450));
      setSelectedUser(user);
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Check file type
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
    // Simulate upload delay
    setTimeout(() => {
      setShowImportModal(false);
      setShowColumnMapping(true);
    }, 1500);
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

  const handleExport = async () => {
    setIsExporting(true);

    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));

    const usersToExport = exportOption === 'all' ? filteredUsers : filteredUsers.filter(u => selectedIds.includes(u.id));

    // In a real app, you would:
    // 1. Convert data to Excel format using a library like xlsx
    // 2. Trigger download
    // 3. If sendEmailCopy is true, send to backend to email the file

    console.log('Exporting:', {
      option: exportOption,
      count: usersToExport.length,
      sendEmail: sendEmailCopy,
      users: usersToExport
    });

    // Simulate success
    alert(`ייצוא הושלם בהצלחה! ${usersToExport.length} משתמשים יוצאו${sendEmailCopy ? ' ונשלחו למייל' : ''}.`);

    setIsExporting(false);
    setShowExportModal(false);
    setExportOption('all');
    setSendEmailCopy(false);
  };

  const handleAddCustomField = () => {
    if (!customFieldName.trim()) {
      alert('אנא הזן שם לשדה');
      return;
    }

    const newField = {
      id: Date.now().toString(),
      name: customFieldName,
      type: customFieldType,
      visible: true
    };

    setCustomFields([...customFields, newField]);
    setShowCustomFieldModal(false);
    setCustomFieldName('');
    setCustomFieldType('text');
  };

  const toggleCustomFieldVisibility = (fieldId: string) => {
    setCustomFields(customFields.map(field =>
      field.id === fieldId ? { ...field, visible: !field.visible } : field
    ));
  };

  const handleManualRegistration = () => {
    if (!manualContactData.name || !manualContactData.email) {
      alert('אנא מלא שם ואימייל לפחות');
      return;
    }

    // In a real app, this would add the user to the database as a contact
    console.log('Registering new contact:', { ...manualContactData, userType: 'contact' });
    alert(`איש קשר "${manualContactData.name}" נוסף בהצלחה!`);

    setShowManualRegistrationModal(false);
    setManualContactData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  const handleConvertToMember = (_userId: string, _userName: string) => {
    // Membership is managed via org invite flow — no DB concept of "convert to member"
    setRowActionMenuId(null);
  };

  // ─── Delete user ─────────────────────────────────────────────────

  const handleDeleteUser = async (user: User) => {
    setIsDeleting(true);
    try {
      await usersApi.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setUsersTotal(prev => prev - 1);
      if (selectedUser?.id === user.id) setSelectedUser(null);
    } catch (err) {
      alert(`שגיאה במחיקת המשתמש: ${(err as Error).message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  // ─── Change global (system) role ─────────────────────────────────

  const handleChangeSystemRole = async (user: User, newRole: UserRole) => {
    setRoleChanging(true);
    try {
      const updated = await usersApi.update(user.id, { role: newRole });
      const mapped = mapAdminUser(updated);
      setUsers(prev => prev.map(u => u.id === user.id ? mapped : u));
      setSelectedUser(mapped);
    } catch (err) {
      alert(`שגיאה בשינוי תפקיד: ${(err as Error).message}`);
    } finally {
      setRoleChanging(false);
    }
  };

  return (
    <>
      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-red-500 text-2xl">delete_forever</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">מחיקת משתמש</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              האם למחוק את <span className="font-semibold text-slate-700 dark:text-slate-300">{showDeleteConfirm.name}</span>?<br/>
              פעולה זו אינה הפיכה.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                מחק
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapping Component */}
      {showColumnMapping && (
        <ColumnMapping
          onClose={() => {
            setShowColumnMapping(false);
            setUploadedFile(null);
          }}
          onComplete={() => {
            setShowColumnMapping(false);
            setUploadedFile(null);
            // Show success message or redirect
            alert('ייבוא הושלם בהצלחה!');
          }}
          fileName={uploadedFile?.name}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Excel Logo in Header */}
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 p-2">
                    <img src={excelLogo} alt="Excel" className="w-full h-full object-contain opacity-70 dark:opacity-50 grayscale" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">ייצא לאקסל</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">ייצא משתמשים לקובץ Excel</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-icons text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">

              {/* Export Options */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  מה לייצא?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group p-3 border-2 rounded-lg transition-all hover:border-primary hover:bg-primary/5">
                    <input
                      type="radio"
                      name="exportOption"
                      checked={exportOption === 'all'}
                      onChange={() => setExportOption('all')}
                      className="w-5 h-5 text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-base font-medium text-slate-900 dark:text-white block">ייצא הכל</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {filteredUsers.length} משתמשים יוצאו
                      </span>
                    </div>
                    <span className="material-icons text-slate-400 group-hover:text-primary transition-colors">
                      select_all
                    </span>
                  </label>

                  <label className={`flex items-center gap-3 cursor-pointer group p-3 border-2 rounded-lg transition-all ${
                    selectedIds.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-primary hover:bg-primary/5'
                  }`}>
                    <input
                      type="radio"
                      name="exportOption"
                      checked={exportOption === 'selected'}
                      onChange={() => setExportOption('selected')}
                      disabled={selectedIds.length === 0}
                      className="w-5 h-5 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <span className="text-base font-medium text-slate-900 dark:text-white block">
                        ייצא רק שורות מסומנות
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedIds.length === 0 ? 'לא נבחרו שורות' : `${selectedIds.length} משתמשים מסומנים`}
                      </span>
                    </div>
                    <span className="material-icons text-slate-400 group-hover:text-primary transition-colors">
                      checklist
                    </span>
                  </label>
                </div>
              </div>

              {/* Email Option */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailCopy}
                    onChange={(e) => setSendEmailCopy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-blue-300 dark:border-blue-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-blue-600 dark:text-blue-400 text-base">email</span>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        שלח עותק למייל שלי
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      הקובץ ישלח אליך במייל בנוסף להורדה ישירה
                    </p>
                  </div>
                </label>
              </div>

              {/* Info */}
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <div className="flex gap-2">
                  <span className="material-icons text-slate-500 dark:text-slate-400 text-lg">info</span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      הקובץ יכלול את כל העמודות הנראות: שם, אימייל, סטטוס, כתובת ותאריכים
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || (exportOption === 'selected' && selectedIds.length === 0)}
                className={`px-8 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                  isExporting
                    ? 'bg-slate-400 cursor-wait'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isExporting ? (
                  <>
                    <span className="material-icons text-sm animate-spin">refresh</span>
                    מייצא...
                  </>
                ) : (
                  <>
                    <span className="material-icons text-sm">file_download</span>
                    ייצא לאקסל
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Registration Modal */}
      {showManualRegistrationModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-primary text-xl">person_add</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">הרשמה ידנית</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">הוסף איש קשר חדש למערכת</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowManualRegistrationModal(false);
                    setManualContactData({ name: '', email: '', phone: '', address: '' });
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-icons text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  שם מלא <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualContactData.name}
                  onChange={(e) => setManualContactData({ ...manualContactData, name: e.target.value })}
                  placeholder="לדוגמה: יוסי כהן"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  אימייל <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={manualContactData.email}
                  onChange={(e) => setManualContactData({ ...manualContactData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  טלפון
                </label>
                <input
                  type="tel"
                  value={manualContactData.phone}
                  onChange={(e) => setManualContactData({ ...manualContactData, phone: e.target.value })}
                  placeholder="050-1234567"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  כתובת
                </label>
                <input
                  type="text"
                  value={manualContactData.address}
                  onChange={(e) => setManualContactData({ ...manualContactData, address: e.target.value })}
                  placeholder="תל אביב, הרצל 12"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex gap-2 items-start">
                  <span className="material-icons text-blue-600 dark:text-blue-400 text-base">info</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex-1">
                    המשתמש ייווצר כאיש קשר. תוכל להפוך אותו לחבר רשום מאוחר יותר.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setShowManualRegistrationModal(false);
                  setManualContactData({ name: '', email: '', phone: '', address: '' });
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors text-sm"
              >
                ביטול
              </button>
              <button
                onClick={handleManualRegistration}
                disabled={!manualContactData.name || !manualContactData.email}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <span className="material-icons text-sm">person_add</span>
                הוסף משתמש
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Field Modal */}
      {showCustomFieldModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-blue-600 dark:text-blue-400 text-lg">add_circle</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">הוסף שדה מותאם אישית</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">צור שדה חדש לטבלה</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCustomFieldModal(false);
                    setCustomFieldName('');
                    setCustomFieldType('text');
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-icons text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar">
              {/* Field Name */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  שם השדה <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  placeholder="לדוגמה: חברת עבודה..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  סוג השדה <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {/* Text */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-primary hover:bg-primary/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'text'}
                      onChange={() => setCustomFieldType('text')}
                      className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="material-icons text-slate-500 dark:text-slate-400 text-base">text_fields</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">טקסט</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">שדה טקסט חופשי</span>
                    </div>
                  </label>

                  {/* Number */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-primary hover:bg-primary/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'number'}
                      onChange={() => setCustomFieldType('number')}
                      className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="material-icons text-slate-500 dark:text-slate-400 text-base">tag</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">מספר</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">ערכים מספריים</span>
                    </div>
                  </label>

                  {/* Link */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-primary hover:bg-primary/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'link'}
                      onChange={() => setCustomFieldType('link')}
                      className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="material-icons text-slate-500 dark:text-slate-400 text-base">link</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">קישור</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">כתובת URL</span>
                    </div>
                  </label>

                  {/* Date */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-primary hover:bg-primary/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'date'}
                      onChange={() => setCustomFieldType('date')}
                      className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="material-icons text-slate-500 dark:text-slate-400 text-base">calendar_today</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">תאריך</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">תאריך ספציפי</span>
                    </div>
                  </label>

                  {/* Dropdown */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-primary hover:bg-primary/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'dropdown'}
                      onChange={() => setCustomFieldType('dropdown')}
                      className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="material-icons text-slate-500 dark:text-slate-400 text-base">arrow_drop_down_circle</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">תפריט נפתח</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">בחירה מרשימה</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <div className="flex gap-2 items-start">
                  <span className="material-icons text-blue-600 dark:text-blue-400 text-base">info</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex-1">
                    השדה יתווסף לטבלת המשתמשים
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setShowCustomFieldModal(false);
                  setCustomFieldName('');
                  setCustomFieldType('text');
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors text-sm"
              >
                ביטול
              </button>
              <button
                onClick={handleAddCustomField}
                disabled={!customFieldName.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <span className="material-icons text-sm">add</span>
                הוסף שדה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Left Side - Content */}
            <div className="flex-1 flex flex-col p-8 md:p-12 relative overflow-y-auto custom-scrollbar">
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
                  <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                    <span className="material-icons text-lg">chat_bubble_outline</span>
                    תן משוב
                  </button>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">שלב 1 מתוך 4</span>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <span className="material-icons text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="max-w-xl">
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">
                  ייבוא נתונים מאקסל › ל-Nexus
                </h1>
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8">
                  העבר נתונים מגיליון אלקטרוני של Excel לתוך לוחות העבודה הקיימים שלך ב-Nexus בצורה חלקה.
                </p>

                {/* Upload Area */}
                <label
                  htmlFor="file-upload"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`upload-dashed rounded-xl group cursor-pointer transition-all duration-300 block ${
                    isDragging ? 'scale-105' : ''
                  }`}
                >
                  <input
                    id="file-upload"
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
                        <span className="text-blue-600 hover:underline cursor-pointer">עיין בקבצים שלך</span> או גרור ושחרר כאן
                      </p>
                      <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                        וודא שזה קובץ CSV, XLS, או XLSX.
                      </p>
                    </div>
                  ) : (
                    <div className="py-16 md:py-20 flex items-center justify-center gap-3">
                      <span className="material-icons text-green-600 text-3xl animate-in zoom-in">check_circle</span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500">מעלה קובץ...</p>
                      </div>
                    </div>
                  )}
                </label>

                {/* Help Section */}
                <div className="mt-8 md:mt-12">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">צריך עזרה להתחיל?</h3>
                  <div className="flex flex-col gap-3">
                    <a className="flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium" href="#">
                      קרא ולמד <span className="text-slate-500 dark:text-slate-400 font-normal">על ייבוא לפלטפורמה</span>
                    </a>
                    <a className="flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium" href="#">
                      הורד <span className="text-slate-500 dark:text-slate-400 font-normal">קובץ Excel לדוגמה</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Footer Button */}
              <div className="mt-auto pt-8 flex justify-start">
                <button
                  disabled={!uploadedFile}
                  className={`px-10 py-3 font-semibold rounded-lg transition-colors ${
                    uploadedFile
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  הבא
                </button>
              </div>
            </div>

            {/* Right Side - Animation */}
            <div className="hidden lg:flex w-[42%] bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col items-center justify-center p-12 overflow-hidden relative">
              {/* Orbit Circles and Dots */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px]">
                <div className="orbit-circle absolute inset-0 border-teal-100 dark:border-teal-900/30 scale-75 pulse-ring"></div>
                <div className="orbit-circle absolute inset-0 border-teal-200 dark:border-teal-800/30 scale-100"></div>
                <div className="orbit-circle absolute inset-0 border-teal-100 dark:border-teal-900/30 scale-125 pulse-ring" style={{ animationDelay: '1s' }}></div>
                <div className="orbit-dot bg-teal-400 top-0 left-1/2 -translate-x-1/2"></div>
                <div className="orbit-dot bg-green-400 bottom-1/4 left-0" style={{ animationDelay: '10s' }}></div>
                <div className="orbit-dot bg-emerald-400 top-1/3 right-0" style={{ animationDelay: '5s' }}></div>
                <div className="orbit-dot bg-teal-300 bottom-0 right-1/3" style={{ animationDelay: '15s' }}></div>
              </div>

              {/* Floating Logos */}
              <div className="floating flex items-center justify-center gap-8 relative z-10">
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
                  מיפוי אוטומטי של עמודות וסוגים כדי לשמור על הנתונים שלך מאורגנים.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">ניהול משתמשים</h1>
        <p className="text-slate-500 dark:text-slate-400 font-normal">נהל ועקוב אחר הלקוחות וחברי האתר שלך במקום אחד.</p>
      </div>

      {/* Tabs for User Types */}
      <div className="mb-6">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'contacts'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-icons text-base">contacts</span>
              <span>אנשי קשר</span>
              <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                {users.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'members'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-icons text-base">badge</span>
              <span>חברים רשומים</span>
              <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                {users.filter(u => u.userType === 'member').length}
              </span>
              {/* Info Icon with Tooltip */}
              <div
                className="relative"
                onMouseEnter={() => setShowMemberTooltip(true)}
                onMouseLeave={() => setShowMemberTooltip(false)}
              >
                <span className="material-icons text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 cursor-help transition-colors">
                  info
                </span>
                {showMemberTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg px-4 py-3 shadow-xl border border-slate-700 dark:border-slate-600 whitespace-nowrap">
                      <div className="font-semibold mb-1">חבר רשום</div>
                      <div className="text-slate-300 dark:text-slate-400">
                        משתמש שנרשם באתר ויש לו גישה מלאה למערכת
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Panel */}
        {showFilterPanel && (
          <aside className="w-full lg:w-[380px] animate-in slide-in-from-right">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
              {isFilterLoading ? (
                /* Skeleton Loader */
                <div className="animate-pulse">
                  {/* Header Skeleton */}
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>

                  {/* Content Skeleton */}
                  <div className="p-6 space-y-6">
                    {/* Search box skeleton */}
                    <div>
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                      <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    </div>

                    {/* Status section skeleton */}
                    <div>
                      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-2">
                            <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Date range skeleton */}
                    <div>
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                      <div className="space-y-3">
                        <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                        <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Skeleton */}
                  <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold">סינון משתמשים</h2>
                      <button
                        onClick={() => setShowFilterPanel(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">סנן משתמשים לפי קריטריונים שונים</p>
                  </div>

                  {/* Filter Content */}
                  <div className="p-6 space-y-6">
                {/* Active Filters Count */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium text-primary">{activeFilterCount} סינונים פעילים</span>
                    <button
                      onClick={clearFilters}
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
                      value={filters.searchText}
                      onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                      placeholder="שם, אימייל או כתובת..."
                      className="w-full ps-10 pe-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                    סטטוס
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <input
                        type="radio"
                        name="status"
                        checked={filters.status === 'all'}
                        onChange={() => setFilters({ ...filters, status: 'all' })}
                        className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">הכל</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <input
                        type="radio"
                        name="status"
                        checked={filters.status === 'active'}
                        onChange={() => setFilters({ ...filters, status: 'active' })}
                        className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        פעיל
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <input
                        type="radio"
                        name="status"
                        checked={filters.status === 'inactive'}
                        onChange={() => setFilters({ ...filters, status: 'inactive' })}
                        className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        לא פעיל
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <input
                        type="radio"
                        name="status"
                        checked={filters.status === 'pending'}
                        onChange={() => setFilters({ ...filters, status: 'pending' })}
                        className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        בהמתנה
                      </span>
                    </label>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                    תאריך הצטרפות
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">מתאריך</label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">עד תאריך</label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Fields Filters */}
                {customFields.filter(f => f.visible).length > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                      שדות מותאמים אישית
                    </label>
                    <div className="space-y-3">
                      {customFields.filter(f => f.visible).map(field => (
                        <div key={field.id}>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <span className="material-icons text-xs">
                              {field.type === 'text' && 'text_fields'}
                              {field.type === 'number' && 'tag'}
                              {field.type === 'link' && 'link'}
                              {field.type === 'date' && 'calendar_today'}
                              {field.type === 'dropdown' && 'arrow_drop_down_circle'}
                            </span>
                            {field.name}
                          </label>
                          {field.type === 'text' || field.type === 'link' ? (
                            <input
                              type="text"
                              value={customFieldFilters[field.id] || ''}
                              onChange={(e) => setCustomFieldFilters({ ...customFieldFilters, [field.id]: e.target.value })}
                              placeholder={`חפש ${field.name}...`}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              value={customFieldFilters[field.id] || ''}
                              onChange={(e) => setCustomFieldFilters({ ...customFieldFilters, [field.id]: e.target.value })}
                              placeholder={`סנן לפי ${field.name}...`}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                          ) : field.type === 'date' ? (
                            <input
                              type="date"
                              value={customFieldFilters[field.id] || ''}
                              onChange={(e) => setCustomFieldFilters({ ...customFieldFilters, [field.id]: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                          ) : field.type === 'dropdown' ? (
                            <select
                              value={customFieldFilters[field.id] || ''}
                              onChange={(e) => setCustomFieldFilters({ ...customFieldFilters, [field.id]: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                              <option value="">הכל</option>
                              <option value="אופציה 1">אופציה 1</option>
                              <option value="אופציה 2">אופציה 2</option>
                              <option value="אופציה 3">אופציה 3</option>
                            </select>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        תוצאות
                      </div>
                      <div className="text-sm text-slate-900 dark:text-white font-bold">
                        {filteredUsers.length} מתוך {users.length}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}

        {/* Customize Panel */}
        {showCustomizePanel && (
          <aside className="w-full lg:w-[380px] animate-in slide-in-from-right">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
              {isCustomizeLoading ? (
                /* Skeleton Loader */
                <div className="animate-pulse">
                  {/* Header Skeleton */}
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>

                  {/* Content Skeleton */}
                  <div className="p-6">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Fields Section Skeleton */}
                  <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                    <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold">התאמה אישית של טבלה</h2>
                      <button
                        onClick={() => setShowCustomizePanel(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">בחר אילו עמודות להציג בטבלה</p>
                  </div>

                  {/* Column Checkboxes */}
                  <div className="p-6">
                <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">עמודות זמינות</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns.name}
                        onChange={() => toggleColumnVisibility('name')}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">שם מלא</span>
                    </label>
                    <button
                      onClick={() => toggleColumnFreeze('name')}
                      className={`p-1.5 rounded transition-colors ${
                        frozenColumns.includes('name')
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={frozenColumns.includes('name') ? 'בטל הקפאה' : 'הקפא עמודה'}
                    >
                      <span className="material-icons text-sm">{frozenColumns.includes('name') ? 'push_pin' : 'push_pin'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns.email}
                        onChange={() => toggleColumnVisibility('email')}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">אימייל</span>
                    </label>
                    <button
                      onClick={() => toggleColumnFreeze('email')}
                      className={`p-1.5 rounded transition-colors ${
                        frozenColumns.includes('email')
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={frozenColumns.includes('email') ? 'בטל הקפאה' : 'הקפא עמודה'}
                    >
                      <span className="material-icons text-sm">push_pin</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns.status}
                        onChange={() => toggleColumnVisibility('status')}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">סטטוס</span>
                    </label>
                    <button
                      onClick={() => toggleColumnFreeze('status')}
                      className={`p-1.5 rounded transition-colors ${
                        frozenColumns.includes('status')
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={frozenColumns.includes('status') ? 'בטל הקפאה' : 'הקפא עמודה'}
                    >
                      <span className="material-icons text-sm">push_pin</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns.address}
                        onChange={() => toggleColumnVisibility('address')}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">כתובת</span>
                    </label>
                    <button
                      onClick={() => toggleColumnFreeze('address')}
                      className={`p-1.5 rounded transition-colors ${
                        frozenColumns.includes('address')
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={frozenColumns.includes('address') ? 'בטל הקפאה' : 'הקפא עמודה'}
                    >
                      <span className="material-icons text-sm">push_pin</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns.lastActivity}
                        onChange={() => toggleColumnVisibility('lastActivity')}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">פעילות אחרונה</span>
                    </label>
                    <button
                      onClick={() => toggleColumnFreeze('lastActivity')}
                      className={`p-1.5 rounded transition-colors ${
                        frozenColumns.includes('lastActivity')
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={frozenColumns.includes('lastActivity') ? 'בטל הקפאה' : 'הקפא עמודה'}
                    >
                      <span className="material-icons text-sm">push_pin</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns.firstJoined}
                        onChange={() => toggleColumnVisibility('firstJoined')}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">כניסה ראשונה</span>
                    </label>
                    <button
                      onClick={() => toggleColumnFreeze('firstJoined')}
                      className={`p-1.5 rounded transition-colors ${
                        frozenColumns.includes('firstJoined')
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={frozenColumns.includes('firstJoined') ? 'בטל הקפאה' : 'הקפא עמודה'}
                    >
                      <span className="material-icons text-sm">push_pin</span>
                    </button>
                  </div>
                </div>
              </div>

                  {/* Custom Fields */}
                  <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">שדות מותאמים אישית</h3>

                    {/* Display Custom Fields */}
                    {customFields.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {customFields.map(field => (
                          <label key={field.id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={field.visible}
                              onChange={() => toggleCustomFieldVisibility(field.id)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                            />
                            <div className="flex-1 flex items-center gap-2">
                              <span className="material-icons text-sm text-slate-500">
                                {field.type === 'text' && 'text_fields'}
                                {field.type === 'number' && 'tag'}
                                {field.type === 'link' && 'link'}
                                {field.type === 'date' && 'calendar_today'}
                                {field.type === 'dropdown' && 'arrow_drop_down_circle'}
                              </span>
                              <span className="text-sm group-hover:text-primary transition-colors">{field.name}</span>
                              <span className="text-xs text-slate-400">
                                ({field.type === 'text' && 'טקסט'}
                                {field.type === 'number' && 'מספר'}
                                {field.type === 'link' && 'קישור'}
                                {field.type === 'date' && 'תאריך'}
                                {field.type === 'dropdown' && 'תפריט'})
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCustomFields(customFields.filter(f => f.id !== field.id));
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors"
                              title="מחק שדה"
                            >
                              <span className="material-icons text-sm">delete</span>
                            </button>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Add Button */}
                    <button
                      onClick={() => setShowCustomFieldModal(true)}
                      className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-icons text-lg">add</span>
                      הוסף שדה מותאם אישית
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}

        {/* Main Content - Users Table */}
        <div className={`transition-[width,flex] duration-300 ${selectedUser || showCustomizePanel || showFilterPanel ? 'flex-1 min-w-0' : 'w-full'}`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            {/* Table Header Actions */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const isOpening = !showFilterPanel;
                    setShowFilterPanel(isOpening);
                    setShowCustomizePanel(false);
                    if (isOpening) {
                      setIsFilterLoading(true);
                      setTimeout(() => setIsFilterLoading(false), 600);
                    }
                  }}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeFilterCount > 0
                      ? 'bg-primary text-white border-primary'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="material-icons text-sm">filter_list</span>
                  סינון
                  {activeFilterCount > 0 && (
                    <span className="bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Import/Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowImportExportMenu(!showImportExportMenu)}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="material-icons text-sm">swap_vert</span>
                    ייבוא/ייצוא
                  </button>

                  {showImportExportMenu && (
                    <>
                      {/* Backdrop to close dropdown when clicking outside */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowImportExportMenu(false)}
                      ></div>

                      {/* Dropdown Menu */}
                      <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
                        <button
                          onClick={() => {
                            setShowImportExportMenu(false);
                            setShowImportModal(true);
                          }}
                          className="w-full px-4 py-3 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                        >
                          <span className="material-icons text-sm text-green-600">file_upload</span>
                          <span>ייבוא משתמשים</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowImportExportMenu(false);
                            setShowExportModal(true);
                          }}
                          className="w-full px-4 py-3 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                        >
                          <span className="material-icons text-sm text-green-600">file_download</span>
                          <span>ייצא לאקסל</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowCustomizePanel(true);
                    setShowFilterPanel(false);
                    setIsCustomizeLoading(true);
                    setTimeout(() => setIsCustomizeLoading(false), 600);
                  }}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-icons text-sm">tune</span>
                  התאם
                </button>

                {/* More Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreActionsMenu(!showMoreActionsMenu)}
                    onMouseEnter={() => setShowMoreActionsTooltip(true)}
                    onMouseLeave={() => setShowMoreActionsTooltip(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <span className="material-icons text-slate-600 dark:text-slate-400">more_vert</span>
                  </button>

                  {/* Tooltip */}
                  {showMoreActionsTooltip && !showMoreActionsMenu && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-in fade-in zoom-in duration-200">
                      <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap">
                        אפשרויות נוספות
                        {/* Arrow */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px">
                          <div className="border-4 border-transparent border-b-slate-900 dark:border-b-slate-800"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showMoreActionsMenu && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMoreActionsMenu(false)}
                      ></div>

                      {/* Dropdown Menu */}
                      <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
                        <button
                          onClick={() => {
                            setShowMoreActionsMenu(false);
                            setShowManualRegistrationModal(true);
                          }}
                          className="w-full px-4 py-3 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                        >
                          <span className="material-icons text-sm text-primary">person_add</span>
                          <div>
                            <div className="font-medium">הרשמה ידנית</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">הוסף איש קשר חדש</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreActionsMenu(false);
                            alert('פעולה זו תהיה זמינה בקרוב');
                          }}
                          className="w-full px-4 py-3 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                        >
                          <span className="material-icons text-sm text-slate-500">email</span>
                          <div>
                            <div className="font-medium">שלח הזמנה</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">הזמן משתמשים חדשים</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">מציג {filteredUsers.length} מתוך {users.length} משתמשים</span>
                <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button className="p-2 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                    <span className="material-icons text-sm">chevron_right</span>
                  </button>
                  <button className="p-2 bg-white dark:bg-slate-800">
                    <span className="material-icons text-sm">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            {/* API Error Banner */}
            {apiError && (
              <div className="mx-6 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="material-icons text-base">error_outline</span>
                {apiError}
                <button onClick={loadUsers} className="mr-auto text-xs underline">נסה שוב</button>
              </div>
            )}

            {/* Users Table */}
            <div ref={tableContainerRef} className="overflow-x-auto relative">
              <table ref={tableRef} className="w-full text-right" style={{ minWidth: '1200px', borderSpacing: 0, position: 'relative' }}>
                <thead
                  ref={tableHeaderRef}
                  style={{
                    position: isHeaderFixed ? 'fixed' : 'static',
                    top: isHeaderFixed ? '64px' : 'auto',
                    left: isHeaderFixed ? `${headerLeft}px` : 'auto',
                    zIndex: isHeaderFixed ? 30 : 1,
                    backgroundColor: 'rgb(248 250 252)',
                    width: isHeaderFixed ? `${headerWidth}px` : 'auto',
                    display: isHeaderFixed ? 'table' : 'table-header-group',
                    tableLayout: isHeaderFixed ? 'fixed' : 'auto'
                  }}
                  className="dark:bg-slate-800"
                >
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th
                      className={`px-6 py-4 w-12 text-center ${isLastFrozenColumn('checkbox') ? 'frozen-column-shadow' : ''}`}
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 20,
                        backgroundColor: 'rgb(248 250 252)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                        onChange={toggleAllUsers}
                        className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary dark:bg-slate-700"
                      />
                    </th>
                    {visibleColumns.name && (
                      <th
                        className={`px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 ${frozenColumns.includes('name') && isLastFrozenColumn('name') ? 'frozen-column-shadow' : ''}`}
                        style={frozenColumns.includes('name') ? {
                          position: 'sticky',
                          left: `${getColumnLeftPosition('name')}px`,
                          zIndex: 20
                        } : {}}
                      >
                        שם מלא
                      </th>
                    )}
                    {visibleColumns.email && (
                      <th
                        className={`px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 ${frozenColumns.includes('email') && isLastFrozenColumn('email') ? 'frozen-column-shadow' : ''}`}
                        style={frozenColumns.includes('email') ? {
                          position: 'sticky',
                          left: `${getColumnLeftPosition('email')}px`,
                          zIndex: 20
                        } : {}}
                      >
                        אימייל
                      </th>
                    )}
                    {visibleColumns.status && (
                      <th
                        className={`px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 ${frozenColumns.includes('status') && isLastFrozenColumn('status') ? 'frozen-column-shadow' : ''}`}
                        style={frozenColumns.includes('status') ? {
                          position: 'sticky',
                          left: `${getColumnLeftPosition('status')}px`,
                          zIndex: 20
                        } : {}}
                      >
                        סטטוס
                      </th>
                    )}
                    {visibleColumns.address && (
                      <th
                        className={`px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 ${frozenColumns.includes('address') && isLastFrozenColumn('address') ? 'frozen-column-shadow' : ''}`}
                        style={frozenColumns.includes('address') ? {
                          position: 'sticky',
                          left: `${getColumnLeftPosition('address')}px`,
                          zIndex: 20
                        } : {}}
                      >
                        כתובת
                      </th>
                    )}
                    {visibleColumns.lastActivity && (
                      <th
                        className={`px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 ${frozenColumns.includes('lastActivity') && isLastFrozenColumn('lastActivity') ? 'frozen-column-shadow' : ''}`}
                        style={frozenColumns.includes('lastActivity') ? {
                          position: 'sticky',
                          left: `${getColumnLeftPosition('lastActivity')}px`,
                          zIndex: 20
                        } : {}}
                      >
                        פעילות אחרונה
                      </th>
                    )}
                    {visibleColumns.firstJoined && (
                      <th
                        className={`px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 ${frozenColumns.includes('firstJoined') && isLastFrozenColumn('firstJoined') ? 'frozen-column-shadow' : ''}`}
                        style={frozenColumns.includes('firstJoined') ? {
                          position: 'sticky',
                          left: `${getColumnLeftPosition('firstJoined')}px`,
                          zIndex: 20
                        } : {}}
                      >
                        כניסה ראשונה
                      </th>
                    )}
                    {customFields.filter(f => f.visible).map(field => (
                      <th key={field.id} className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="material-icons text-xs text-slate-400">
                            {field.type === 'text' && 'text_fields'}
                            {field.type === 'number' && 'tag'}
                            {field.type === 'link' && 'link'}
                            {field.type === 'date' && 'calendar_today'}
                            {field.type === 'dropdown' && 'arrow_drop_down_circle'}
                          </span>
                          {field.name}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isTableLoading ? (
                    // Skeleton rows
                    Array.from({ length: 10 }).map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td
                          className={`px-6 py-4 text-center bg-white dark:bg-slate-900 ${isLastFrozenColumn('checkbox') ? 'frozen-column-shadow' : ''}`}
                          style={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 10
                          }}
                        >
                          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto"></div>
                        </td>
                        {visibleColumns.name && (
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                          </td>
                        )}
                        {visibleColumns.email && (
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="px-6 py-4">
                            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
                          </td>
                        )}
                        {visibleColumns.address && (
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36"></div>
                          </td>
                        )}
                        {visibleColumns.lastActivity && (
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                          </td>
                        )}
                        {visibleColumns.firstJoined && (
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                          </td>
                        )}
                        {customFields.filter(f => f.visible).map(field => (
                          <td key={field.id} className="px-6 py-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="material-icons text-4xl text-slate-300">search_off</span>
                          <p className="text-slate-500 dark:text-slate-400">לא נמצאו משתמשים התואמים לסינון</p>
                          <button
                            onClick={clearFilters}
                            className="text-sm text-primary hover:underline"
                          >
                            נקה סינון
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => handleRowClick(user)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group ${
                          selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-primary' :
                          selectedIds.includes(user.id) ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''
                        }`}
                      >
                      <td
                        className={`px-6 py-4 text-center bg-white dark:bg-slate-900 ${isLastFrozenColumn('checkbox') ? 'frozen-column-shadow' : ''}`}
                        style={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 10
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleUserSelection(user.id);
                          }}
                          className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary dark:bg-slate-700"
                        />
                      </td>
                      {visibleColumns.name && (
                        <td
                          className={`px-6 py-4 font-medium ${frozenColumns.includes('name') ? 'bg-white dark:bg-slate-900' : ''} ${frozenColumns.includes('name') && isLastFrozenColumn('name') ? 'frozen-column-shadow' : ''}`}
                          style={frozenColumns.includes('name') ? {
                            position: 'sticky',
                            left: `${getColumnLeftPosition('name')}px`,
                            zIndex: 10
                          } : {}}
                        >
                          {user.name}
                        </td>
                      )}
                      {visibleColumns.email && (
                        <td
                          className={`px-6 py-4 text-slate-500 dark:text-slate-400 ${frozenColumns.includes('email') ? 'bg-white dark:bg-slate-900' : ''} ${frozenColumns.includes('email') && isLastFrozenColumn('email') ? 'frozen-column-shadow' : ''}`}
                          style={frozenColumns.includes('email') ? {
                            position: 'sticky',
                            left: `${getColumnLeftPosition('email')}px`,
                            zIndex: 10
                          } : {}}
                        >
                          {user.email}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td
                          className={`px-6 py-4 ${frozenColumns.includes('status') ? 'bg-white dark:bg-slate-900' : ''} ${frozenColumns.includes('status') && isLastFrozenColumn('status') ? 'frozen-column-shadow' : ''}`}
                          style={frozenColumns.includes('status') ? {
                            position: 'sticky',
                            left: `${getColumnLeftPosition('status')}px`,
                            zIndex: 10
                          } : {}}
                        >
                          {getStatusBadge(user.status)}
                        </td>
                      )}
                      {visibleColumns.address && (
                        <td
                          className={`px-6 py-4 text-slate-500 dark:text-slate-400 ${frozenColumns.includes('address') ? 'bg-white dark:bg-slate-900' : ''} ${frozenColumns.includes('address') && isLastFrozenColumn('address') ? 'frozen-column-shadow' : ''}`}
                          style={frozenColumns.includes('address') ? {
                            position: 'sticky',
                            left: `${getColumnLeftPosition('address')}px`,
                            zIndex: 10
                          } : {}}
                        >
                          {user.address}
                        </td>
                      )}
                      {visibleColumns.lastActivity && (
                        <td
                          className={`px-6 py-4 text-slate-500 dark:text-slate-400 ${frozenColumns.includes('lastActivity') ? 'bg-white dark:bg-slate-900' : ''} ${frozenColumns.includes('lastActivity') && isLastFrozenColumn('lastActivity') ? 'frozen-column-shadow' : ''}`}
                          style={frozenColumns.includes('lastActivity') ? {
                            position: 'sticky',
                            left: `${getColumnLeftPosition('lastActivity')}px`,
                            zIndex: 10
                          } : {}}
                        >
                          {user.lastActivity}
                        </td>
                      )}
                      {visibleColumns.firstJoined && (
                        <td
                          className={`px-6 py-4 text-slate-500 dark:text-slate-400 ${frozenColumns.includes('firstJoined') ? 'bg-white dark:bg-slate-900' : ''} ${frozenColumns.includes('firstJoined') && isLastFrozenColumn('firstJoined') ? 'frozen-column-shadow' : ''}`}
                          style={frozenColumns.includes('firstJoined') ? {
                            position: 'sticky',
                            left: `${getColumnLeftPosition('firstJoined')}px`,
                            zIndex: 10
                          } : {}}
                        >
                          {user.firstJoined}
                        </td>
                      )}
                      {customFields.filter(f => f.visible).map(field => (
                        <td key={field.id} className="px-6 py-4 text-slate-400 dark:text-slate-500 italic text-sm">
                          —
                        </td>
                      ))}
                      <td className="px-6 py-4 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRowActionMenuId(rowActionMenuId === user.id ? null : user.id);
                          }}
                          className="text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                        >
                          <span className="material-icons">more_horiz</span>
                        </button>

                        {/* Row Actions Menu */}
                        {rowActionMenuId === user.id && (
                          <>
                            {/* Backdrop */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setRowActionMenuId(null)}
                            ></div>

                            {/* Dropdown Menu */}
                            <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
                              {user.userType === 'contact' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConvertToMember(user.id, user.name);
                                  }}
                                  className="w-full px-4 py-2.5 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                                >
                                  <span className="material-icons text-sm text-emerald-600">upgrade</span>
                                  <div>
                                    <div className="font-medium">הפוך לחבר רשום</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">תן גישה מלאה</div>
                                  </div>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRowActionMenuId(null);
                                  alert('פעולה זו תהיה זמינה בקרוב');
                                }}
                                className="w-full px-4 py-2.5 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                              >
                                <span className="material-icons text-sm text-slate-500">edit</span>
                                <div>
                                  <div className="font-medium">ערוך פרטים</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">שנה מידע</div>
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRowActionMenuId(null);
                                  if (confirm(`האם אתה בטוח שברצונך למחוק את ${user.name}?`)) {
                                    alert('המשתמש נמחק בהצלחה');
                                  }
                                }}
                                className="w-full px-4 py-2.5 text-right text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                              >
                                <span className="material-icons text-sm text-red-600">delete</span>
                                <div>
                                  <div className="font-medium text-red-600">מחק משתמש</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">הסרה לצמיתות</div>
                                </div>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usersTotal > 50 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">{usersTotal} משתמשים סה"כ</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    הקודם
                  </button>
                  <span className="text-xs text-slate-500">עמוד {currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * 50 >= usersTotal}
                    className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    הבא
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - User Details */}
        {(selectedUser || isLoading) && (
          <aside
            key={sidebarKey}
            className="w-full lg:w-[380px] space-y-6 animate-in slide-in-from-left sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar"
          >
              {isLoading ? (
                <>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  {/* Skeleton Loader */}
                  <div className="animate-pulse">
                    {/* Avatar Skeleton */}
                    <div className="flex flex-col items-center mb-8">
                      <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 mb-4"></div>
                      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
                      <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                      <div className="flex gap-2 w-full">
                        <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                      </div>
                    </div>

                    {/* Accordion Items Skeleton */}
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="border-b border-slate-100 dark:border-slate-800 pb-4">
                          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity Skeleton */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <div className="animate-pulse">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="space-y-4">
                      {[1, 2].map((item) => (
                        <div key={item} className="flex gap-4">
                          <div className="w-2 h-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </>
              ) : (
              <>
              {/* User Profile Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 relative">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 left-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
                >
                  <span className="material-icons text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
                </button>

                <div className="flex flex-col items-center text-center mb-8 mt-8">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 relative ring-4 ring-slate-50 dark:ring-slate-800/50">
                    <span className="material-icons text-4xl text-slate-300">person</span>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-slate-700 shadow-lg rounded-full border border-slate-100 dark:border-slate-600">
                      <span className="material-icons text-sm">edit</span>
                    </button>
                  </div>
                  <h2 className="text-xl font-semibold">{selectedUser!.name}</h2>

                  {/* Email with copy button */}
                  <div className="group relative inline-block mb-2 pl-5">
                    <button
                      onClick={() => handleCopy(selectedUser!.email)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      title="Copy email"
                    >
                      {copiedText === selectedUser!.email ? (
                        <span className="material-icons text-xs text-green-500">check</span>
                      ) : (
                        <span className="material-icons text-xs text-slate-400">content_copy</span>
                      )}
                    </button>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedUser!.email}</p>
                  </div>

                  {/* Phone with copy button */}
                  <div className="group relative inline-block mb-4 pl-5">
                    <button
                      onClick={() => handleCopy(selectedUser!.phone)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      title="Copy phone"
                    >
                      {copiedText === selectedUser!.phone ? (
                        <span className="material-icons text-xs text-green-500">check</span>
                      ) : (
                        <span className="material-icons text-xs text-slate-400">content_copy</span>
                      )}
                    </button>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedUser!.phone}</p>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                      שלח הודעה
                    </button>
                    <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500">
                      <span className="material-icons">mail_outline</span>
                    </button>
                    <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500">
                      <span className="material-icons">phone</span>
                    </button>
                  </div>
                </div>

                {/* ── System Role ──────────────────────────────── */}
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">תפקיד מערכת</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${SYSTEM_ROLE_COLORS[selectedUser!.systemRole]}`}>
                      {SYSTEM_ROLE_LABELS[selectedUser!.systemRole]}
                    </span>
                    <select
                      value={selectedUser!.systemRole}
                      disabled={roleChanging}
                      onChange={(e) => handleChangeSystemRole(selectedUser!, e.target.value as UserRole)}
                      className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50"
                    >
                      <option value="USER">משתמש</option>
                      <option value="AGENT">סוכן</option>
                      <option value="ADMIN">מנהל מערכת</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">תפקיד זה אינו קשור לתפקיד בארגון</p>
                </div>

                {/* ── Org Memberships ───────────────────────────── */}
                {selectedUser!.orgs.length > 0 && (
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">חברויות ארגוניות</p>
                    <div className="space-y-2">
                      {selectedUser!.orgs.map((m, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: m.org.primaryColor ?? '#6366f1' }}
                            >
                              {m.org.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{m.org.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-slate-500 dark:text-slate-400">
                            {ORG_ROLE_LABELS[m.role] ?? m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Delete User ───────────────────────────────── */}
                <div className="mb-3">
                  <button
                    onClick={() => setShowDeleteConfirm(selectedUser!)}
                    className="w-full py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                  >
                    מחיקת משתמש
                  </button>
                </div>

                {/* Accordion Sections */}
                <div className="space-y-1">
                  {/* Purchase Status */}
                  <div className="border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleSection('purchases')}
                      className="w-full py-4 flex items-center justify-between font-medium text-slate-700 dark:text-slate-300"
                    >
                      <span>סטטוס רכישות</span>
                      <span className="material-icons text-slate-400">
                        {expandedSection === 'purchases' ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {expandedSection === 'purchases' && (
                      <div className="pb-4 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between mb-2">
                            <span className="text-xs text-slate-500">סך רכישות</span>
                            <span className="text-xs font-bold">₪4,250</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-2/3"></div>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2">6 עסקאות הושלמו השנה</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Details */}
                  <div className="border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleSection('contact')}
                      className="w-full py-4 flex items-center justify-between font-medium text-slate-700 dark:text-slate-300"
                    >
                      <span>פרטי קשר</span>
                      <span className="material-icons text-slate-400">
                        {expandedSection === 'contact' ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>

                  {/* Notes */}
                  <div className="border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleSection('notes')}
                      className="w-full py-4 flex items-center justify-between font-medium text-slate-700 dark:text-slate-300"
                    >
                      <span>הערות</span>
                      <span className="material-icons text-slate-400">
                        {expandedSection === 'notes' ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>

                  {/* Tasks */}
                  <div className="border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleSection('tasks')}
                      className="w-full py-4 flex items-center justify-between font-medium text-slate-700 dark:text-slate-300"
                    >
                      <span>משימות</span>
                      <span className="material-icons text-slate-400">
                        {expandedSection === 'tasks' ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>

                  {/* Target Groups */}
                  <div>
                    <button
                      onClick={() => toggleSection('groups')}
                      className="w-full py-4 flex items-center justify-between font-medium text-slate-700 dark:text-slate-300"
                    >
                      <span>קבוצות יעד</span>
                      <span className="material-icons text-slate-400">
                        {expandedSection === 'groups' ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-sm mb-4">פעילות אחרונה</h3>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className={`w-2 ${activity.color} rounded-full`}></div>
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-slate-400">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </>
              )}
          </aside>
        )}
      </div>
    </>
  );
};

export default Users;
