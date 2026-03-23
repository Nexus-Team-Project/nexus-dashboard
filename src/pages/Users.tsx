import { useState, useEffect, useRef, useCallback } from 'react';
import ColumnMapping from '../components/ColumnMapping';
import excelLogo from '../assets/logos/excel_logo.png';
import nexusLogo from '../assets/logos/nexus_logo.png';
import { usersApi, type AdminUser, type UserRole, type Address, type TaxId, type TaxStatus } from '../lib/api';

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
  // Account info
  displayName?: string;
  language?: string;
  businessName?: string;
  description?: string;
  // Billing
  billingEmail?: string;
  billingAddress?: Address;
  currency?: string;
  timezone?: string;
  // Tax
  taxStatus?: TaxStatus;
  taxIds?: TaxId[];
  // Shipping
  shippingAddress?: Address;
  shippingPhone?: string;
}

// ─── Constants ───────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'IL', name: 'ישראל' }, { code: 'US', name: 'ארצות הברית' }, { code: 'GB', name: 'בריטניה' },
  { code: 'DE', name: 'גרמניה' }, { code: 'FR', name: 'צרפת' }, { code: 'IT', name: 'איטליה' },
  { code: 'ES', name: 'ספרד' }, { code: 'NL', name: 'הולנד' }, { code: 'BE', name: 'בלגיה' },
  { code: 'AT', name: 'אוסטריה' }, { code: 'CH', name: 'שוויץ' }, { code: 'SE', name: 'שוודיה' },
  { code: 'NO', name: 'נורווגיה' }, { code: 'DK', name: 'דנמרק' }, { code: 'FI', name: 'פינלנד' },
  { code: 'PT', name: 'פורטוגל' }, { code: 'GR', name: 'יוון' }, { code: 'PL', name: 'פולין' },
  { code: 'CZ', name: 'צ\'כיה' }, { code: 'RO', name: 'רומניה' }, { code: 'HU', name: 'הונגריה' },
  { code: 'BG', name: 'בולגריה' }, { code: 'HR', name: 'קרואטיה' }, { code: 'IE', name: 'אירלנד' },
  { code: 'CA', name: 'קנדה' }, { code: 'AU', name: 'אוסטרליה' }, { code: 'NZ', name: 'ניו זילנד' },
  { code: 'JP', name: 'יפן' }, { code: 'CN', name: 'סין' }, { code: 'KR', name: 'דרום קוריאה' },
  { code: 'IN', name: 'הודו' }, { code: 'BR', name: 'ברזיל' }, { code: 'MX', name: 'מקסיקו' },
  { code: 'AR', name: 'ארגנטינה' }, { code: 'CL', name: 'צ\'ילה' }, { code: 'CO', name: 'קולומביה' },
  { code: 'ZA', name: 'דרום אפריקה' }, { code: 'AE', name: 'איחוד האמירויות' }, { code: 'SA', name: 'ערב הסעודית' },
  { code: 'EG', name: 'מצרים' }, { code: 'TR', name: 'טורקיה' }, { code: 'RU', name: 'רוסיה' },
  { code: 'UA', name: 'אוקראינה' }, { code: 'TH', name: 'תאילנד' }, { code: 'SG', name: 'סינגפור' },
  { code: 'MY', name: 'מלזיה' }, { code: 'PH', name: 'פיליפינים' }, { code: 'ID', name: 'אינדונזיה' },
  { code: 'VN', name: 'וייטנאם' }, { code: 'TW', name: 'טייוואן' }, { code: 'HK', name: 'הונג קונג' },
];

const CURRENCIES = [
  { code: 'ILS', symbol: '₪', name: 'שקל חדש' }, { code: 'USD', symbol: '$', name: 'דולר אמריקאי' },
  { code: 'EUR', symbol: '€', name: 'יורו' }, { code: 'GBP', symbol: '£', name: 'ליש"ט' },
  { code: 'CHF', symbol: 'CHF', name: 'פרנק שוויצרי' }, { code: 'CAD', symbol: 'C$', name: 'דולר קנדי' },
  { code: 'AUD', symbol: 'A$', name: 'דולר אוסטרלי' }, { code: 'JPY', symbol: '¥', name: 'ין יפני' },
  { code: 'CNY', symbol: '¥', name: 'יואן סיני' }, { code: 'INR', symbol: '₹', name: 'רופי הודי' },
  { code: 'BRL', symbol: 'R$', name: 'ריאל ברזילאי' }, { code: 'KRW', symbol: '₩', name: 'וון דרום קוריאני' },
  { code: 'TRY', symbol: '₺', name: 'לירה טורקית' }, { code: 'AED', symbol: 'د.إ', name: 'דירהם' },
  { code: 'SAR', symbol: '﷼', name: 'ריאל סעודי' }, { code: 'PLN', symbol: 'zł', name: 'זלוטי פולני' },
  { code: 'SEK', symbol: 'kr', name: 'כתר שוודי' }, { code: 'NOK', symbol: 'kr', name: 'כתר נורווגי' },
  { code: 'DKK', symbol: 'kr', name: 'כתר דני' }, { code: 'MXN', symbol: '$', name: 'פזו מקסיקני' },
  { code: 'SGD', symbol: 'S$', name: 'דולר סינגפורי' }, { code: 'HKD', symbol: 'HK$', name: 'דולר הונג קונגי' },
  { code: 'ZAR', symbol: 'R', name: 'רנד דרום אפריקאי' }, { code: 'RUB', symbol: '₽', name: 'רובל רוסי' },
];

const TIMEZONES = [
  { value: 'Pacific/Midway', label: '(GMT-11:00) מידוויי' },
  { value: 'Pacific/Honolulu', label: '(GMT-10:00) הוואי' },
  { value: 'America/Anchorage', label: '(GMT-9:00) אלסקה' },
  { value: 'America/Los_Angeles', label: '(GMT-8:00) לוס אנג\'לס' },
  { value: 'America/Denver', label: '(GMT-7:00) דנוור' },
  { value: 'America/Chicago', label: '(GMT-6:00) שיקגו' },
  { value: 'America/New_York', label: '(GMT-5:00) ניו יורק' },
  { value: 'America/Sao_Paulo', label: '(GMT-3:00) סאו פאולו' },
  { value: 'America/Argentina/Buenos_Aires', label: '(GMT-3:00) בואנוס איירס' },
  { value: 'Atlantic/Cape_Verde', label: '(GMT-1:00) כף ורדה' },
  { value: 'Europe/London', label: '(GMT+0:00) לונדון' },
  { value: 'Europe/Paris', label: '(GMT+1:00) פריז' },
  { value: 'Europe/Berlin', label: '(GMT+1:00) ברלין' },
  { value: 'Europe/Amsterdam', label: '(GMT+1:00) אמסטרדם' },
  { value: 'Europe/Rome', label: '(GMT+1:00) רומא' },
  { value: 'Europe/Madrid', label: '(GMT+1:00) מדריד' },
  { value: 'Europe/Athens', label: '(GMT+2:00) אתונה' },
  { value: 'Europe/Helsinki', label: '(GMT+2:00) הלסינקי' },
  { value: 'Europe/Bucharest', label: '(GMT+2:00) בוקרשט' },
  { value: 'Asia/Jerusalem', label: '(GMT+2:00) ירושלים' },
  { value: 'Africa/Cairo', label: '(GMT+2:00) קהיר' },
  { value: 'Europe/Moscow', label: '(GMT+3:00) מוסקבה' },
  { value: 'Asia/Riyadh', label: '(GMT+3:00) ריאד' },
  { value: 'Asia/Dubai', label: '(GMT+4:00) דובאי' },
  { value: 'Asia/Karachi', label: '(GMT+5:00) קראצ\'י' },
  { value: 'Asia/Kolkata', label: '(GMT+5:30) מומבאי' },
  { value: 'Asia/Bangkok', label: '(GMT+7:00) בנגקוק' },
  { value: 'Asia/Singapore', label: '(GMT+8:00) סינגפור' },
  { value: 'Asia/Hong_Kong', label: '(GMT+8:00) הונג קונג' },
  { value: 'Asia/Shanghai', label: '(GMT+8:00) שנגחאי' },
  { value: 'Asia/Tokyo', label: '(GMT+9:00) טוקיו' },
  { value: 'Asia/Seoul', label: '(GMT+9:00) סיאול' },
  { value: 'Australia/Sydney', label: '(GMT+10:00) סידני' },
  { value: 'Pacific/Auckland', label: '(GMT+12:00) אוקלנד' },
];

const TAX_ID_TYPES = [
  { code: 'il_vat', name: 'ע.מ ישראלי (IL VAT)' },
  { code: 'eu_vat', name: 'EU VAT' },
  { code: 'gb_vat', name: 'GB VAT' },
  { code: 'us_ein', name: 'US EIN' },
  { code: 'au_abn', name: 'AU ABN' },
  { code: 'br_cnpj', name: 'BR CNPJ' },
  { code: 'ca_bn', name: 'CA BN' },
  { code: 'ch_vat', name: 'CH VAT' },
  { code: 'in_gst', name: 'IN GST' },
  { code: 'jp_cn', name: 'JP Corporate Number' },
  { code: 'kr_brn', name: 'KR BRN' },
  { code: 'mx_rfc', name: 'MX RFC' },
  { code: 'nz_gst', name: 'NZ GST' },
  { code: 'sg_uen', name: 'SG UEN' },
  { code: 'za_vat', name: 'ZA VAT' },
  { code: 'other', name: 'אחר' },
];

const LANGUAGES = [
  { code: 'he', name: 'עברית' }, { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' }, { code: 'ru', name: 'Русский' },
  { code: 'fr', name: 'Français' }, { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' }, { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' }, { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' }, { code: 'tr', name: 'Türkçe' },
  { code: 'ja', name: '日本語' }, { code: 'zh', name: '中文' },
  { code: 'ko', name: '한국어' }, { code: 'hi', name: 'हिन्दी' },
  { code: 'th', name: 'ไทย' }, { code: 'vi', name: 'Tiếng Việt' },
];

const EMPTY_CONTACT_DATA = {
  name: '', email: '', phone: '', address: '',
  displayName: '', language: '', businessName: '', individualName: '', description: '',
  billingEmail: '', billingStreet: '', billingCity: '', billingState: '', billingZip: '', billingCountry: '', billingPhone: '',
  currency: '', timezone: '',
  taxStatus: '' as '' | TaxStatus,
  taxIds: [] as { type: string; value: string }[],
  shippingStreet: '', shippingCity: '', shippingState: '', shippingZip: '', shippingCountry: '', shippingPhone: '',
};

const SYSTEM_ROLE_LABELS: Record<UserRole, string> = {
  USER:  'משתמש',
  ADMIN: 'מנהל מערכת',
  AGENT: 'סוכן',
};

const SYSTEM_ROLE_COLORS: Record<UserRole, string> = {
  USER:  'bg-slate-100 text-slate-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  AGENT: 'bg-violet-100 text-violet-700',
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
    displayName:    u.displayName,
    language:       u.language,
    businessName:   u.businessName,
    description:    u.description,
    billingEmail:   u.billingEmail,
    billingAddress: u.billingAddress,
    currency:       u.currency,
    timezone:       u.timezone,
    taxStatus:      u.taxStatus,
    taxIds:         u.taxIds,
    shippingAddress: u.shippingAddress,
    shippingPhone:  u.shippingPhone,
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
  const [isTableSearchExpanded, setIsTableSearchExpanded] = useState(false);
  const tableSearchInputRef = useRef<HTMLInputElement>(null);
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [headerWidth, setHeaderWidth] = useState(0);
  const [headerLeft, setHeaderLeft] = useState(0);
  const [_horizontalScrolled, setHorizontalScrolled] = useState(false);
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerOffsetRef = useRef<number>(0);
  const [showManualRegistrationModal, setShowManualRegistrationModal] = useState(false);
  const [manualContactData, setManualContactData] = useState({ ...EMPTY_CONTACT_DATA });
  const [expandedFormSections, setExpandedFormSections] = useState<Record<string, boolean>>({});
  const [rowActionMenuId, setRowActionMenuId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    status: true,
    address: true,
    lastActivity: true,
    firstJoined: true,
    displayName: false,
    language: false,
    businessName: false,
    description: false,
    billingEmail: false,
    billingAddress: false,
    billingPhone: false,
    currency: false,
    timezone: false,
    taxStatus: false,
    shippingAddress: false,
    shippingPhone: false,
  });
  const [frozenColumns, setFrozenColumns] = useState<string[]>(['checkbox']); // checkbox is always frozen

  // ─── Column infrastructure ──────────────────────────────────────
  const COLUMN_WIDTHS: Record<string, number> = {
    checkbox: 64, name: 200, email: 240, status: 140, address: 220,
    lastActivity: 180, firstJoined: 160, displayName: 180, language: 120,
    businessName: 200, description: 220, billingEmail: 240, billingAddress: 220,
    billingPhone: 160, currency: 120, timezone: 180, taxStatus: 140,
    shippingAddress: 220, shippingPhone: 160,
  };

  const [columnOrder, setColumnOrder] = useState([
    'checkbox', 'name', 'email', 'status', 'address', 'lastActivity', 'firstJoined',
    'displayName', 'language', 'businessName', 'description', 'billingEmail',
    'billingAddress', 'billingPhone', 'currency', 'timezone', 'taxStatus',
    'shippingAddress', 'shippingPhone',
  ]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [headerHeight, setHeaderHeight] = useState(0);

  // Sticky header scroll listener
  useEffect(() => {
    let rafId: number;

    const updateHeaderPosition = () => {
      if (tableRef.current && tableHeaderRef.current && tableContainerRef.current) {
        const tableRect = tableRef.current.getBoundingClientRect();
        void tableContainerRef.current.scrollLeft; // tracked via event listener below

        setHeaderWidth(tableRect.width);
        setHeaderLeft(tableRect.left);

        // Measure header height for spacer row
        const hh = tableHeaderRef.current.getBoundingClientRect().height;
        if (hh !== headerHeight) setHeaderHeight(hh);

        // Store original offset only once
        if (headerOffsetRef.current === 0) {
          headerOffsetRef.current = tableHeaderRef.current.getBoundingClientRect().top + window.scrollY;
        }
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
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
      });
    };

    const handleHorizontalScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (isHeaderFixed) {
          updateHeaderPosition();
        }

        // Track horizontal scroll for frozen columns
        if (tableContainerRef.current) {
          const scrollLeft = tableContainerRef.current.scrollLeft;
          setHorizontalScrolled(scrollLeft > 0);
        }
      });
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
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeaderPosition);
      if (container) {
        container.removeEventListener('scroll', handleHorizontalScroll);
      }
    };
  }, [isHeaderFixed, showCustomizePanel, showFilterPanel, selectedUser, headerHeight]);

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
      color: 'bg-violet-400'
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
    if (selectedIds.length === sortedUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedUsers.map(u => u.id));
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

  // ─── Column helpers (data-driven, matching Transactions pattern) ──
  const getColWidth = (col: string) => columnWidths[col] || COLUMN_WIDTHS[col] || 160;

  const getColumnLeftPosition = (columnKey: string): number => {
    const frozenBefore = columnOrder.slice(0, columnOrder.indexOf(columnKey))
      .filter(col => frozenColumns.includes(col) && (col === 'checkbox' || visibleColumns[col as keyof typeof visibleColumns]));
    return frozenBefore.reduce((sum, col) => sum + getColWidth(col), 0);
  };

  const isLastFrozenColumn = (columnKey: string): boolean => {
    const frozenVisible = columnOrder.filter(col =>
      frozenColumns.includes(col) && (col === 'checkbox' || visibleColumns[col as keyof typeof visibleColumns])
    );
    return frozenVisible[frozenVisible.length - 1] === columnKey;
  };

  // ─── Column resize ──────────────────────────────────────────────
  const handleResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(colKey);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = getColWidth(colKey);

    const onMouseMove = (ev: MouseEvent) => {
      // RTL: moving mouse LEFT = increasing width, RIGHT = decreasing
      const diff = resizeStartX.current - ev.clientX;
      const newWidth = Math.max(80, resizeStartWidth.current + diff);
      setColumnWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };

    const onMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // ─── Column drag-to-reorder ─────────────────────────────────────
  const handleColumnDragStart = (e: React.DragEvent, colKey: string) => {
    setDraggedColumn(colKey);
    setColumnMenuOpen(null);
    e.dataTransfer.effectAllowed = 'move';

    const thEl = e.currentTarget as HTMLElement;
    const table = thEl.closest('table');
    if (!table) return;

    const headerRow = table.querySelector('thead tr');
    if (!headerRow) return;
    const allThs = Array.from(headerRow.querySelectorAll('th'));
    const colIndex = allThs.indexOf(thEl);
    if (colIndex === -1) return;

    const colWidth = thEl.getBoundingClientRect().width;
    const allBodyRows = Array.from(table.querySelectorAll('tbody tr'));

    const pad = 50;
    const ghost = document.createElement('div');
    ghost.style.cssText = `position:absolute;top:-2000px;left:-2000px;pointer-events:none;padding:${pad}px;`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `transform:rotate(-6deg);opacity:0.72;border-radius:10px;overflow:hidden;box-shadow:0 16px 32px rgba(99,91,255,0.28),0 4px 12px rgba(0,0,0,0.12);border:2px solid #635bff;`;

    const cloneTable = document.createElement('table');
    cloneTable.style.cssText = `width:${colWidth}px;border-collapse:collapse;direction:rtl;table-layout:fixed;`;

    const cloneThead = document.createElement('thead');
    const cloneHeadRow = document.createElement('tr');
    const cloneTh = thEl.cloneNode(true) as HTMLElement;
    const thComputed = window.getComputedStyle(thEl);
    cloneTh.style.cssText = `padding:${thComputed.padding};background:${thComputed.backgroundColor};color:${thComputed.color};font-size:${thComputed.fontSize};font-weight:${thComputed.fontWeight};text-transform:${thComputed.textTransform};letter-spacing:${thComputed.letterSpacing};text-align:${thComputed.textAlign};width:${colWidth}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:none;`;
    const menuBtn = cloneTh.querySelector('button');
    if (menuBtn) menuBtn.remove();
    const absDropdown = cloneTh.querySelector('[class*="absolute"]');
    if (absDropdown) absDropdown.remove();
    cloneHeadRow.appendChild(cloneTh);
    cloneThead.appendChild(cloneHeadRow);
    cloneTable.appendChild(cloneThead);

    const cloneTbody = document.createElement('tbody');
    const maxRows = Math.min(allBodyRows.length, 8);
    for (let i = 0; i < maxRows; i++) {
      const origRow = allBodyRows[i];
      const origTds = origRow.querySelectorAll('td');
      if (colIndex >= origTds.length) continue;
      const origTd = origTds[colIndex] as HTMLElement;
      const cloneRow = document.createElement('tr');
      const cloneTd = origTd.cloneNode(true) as HTMLElement;
      const tdComputed = window.getComputedStyle(origTd);
      cloneTd.style.cssText = `padding:${tdComputed.padding};background:${tdComputed.backgroundColor};color:${tdComputed.color};font-size:${tdComputed.fontSize};font-weight:${tdComputed.fontWeight};text-align:${tdComputed.textAlign};width:${colWidth}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:none;border-bottom:1px solid #e2e8f0;`;
      cloneRow.appendChild(cloneTd);
      cloneTbody.appendChild(cloneRow);
    }

    if (allBodyRows.length > maxRows) {
      const moreRow = document.createElement('tr');
      const moreTd = document.createElement('td');
      moreTd.textContent = `+${allBodyRows.length - maxRows} עוד`;
      moreTd.style.cssText = `padding:6px 12px;font-size:11px;color:#94a3b8;text-align:center;background:#f8fafc;border:none;`;
      moreRow.appendChild(moreTd);
      cloneTbody.appendChild(moreRow);
    }

    cloneTable.appendChild(cloneTbody);
    wrapper.appendChild(cloneTable);
    ghost.appendChild(wrapper);
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, colWidth / 2 + pad, 20 + pad);
    setTimeout(() => ghost.remove(), 0);
  };

  const handleColumnDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (colKey !== 'checkbox' && colKey !== draggedColumn) {
      setDragOverColumn(colKey);
    }
  };

  const handleColumnDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetKey || targetKey === 'checkbox') return;
    setColumnOrder(prev => {
      const newOrder = [...prev];
      const dragIdx = newOrder.indexOf(draggedColumn);
      const targetIdx = newOrder.indexOf(targetKey);
      const [removed] = newOrder.splice(dragIdx, 1);
      newOrder.splice(targetIdx, 0, removed);
      return newOrder;
    });
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // ─── Table border highlight ─────────────────────────────────────
  const handleTableMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

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

  // ─── COLUMN_CONFIG — data-driven column rendering ─────────────
  const COLUMN_CONFIG: Record<string, { label: string; cellClass: string; render: (user: User) => React.ReactNode }> = {
    name: {
      label: 'שם מלא',
      cellClass: 'text-sm font-medium text-slate-900 dark:text-white',
      render: (user) => user.name,
    },
    email: {
      label: 'אימייל',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.email,
    },
    status: {
      label: 'סטטוס',
      cellClass: '',
      render: (user) => getStatusBadge(user.status),
    },
    address: {
      label: 'כתובת',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.address,
    },
    lastActivity: {
      label: 'פעילות אחרונה',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.lastActivity,
    },
    firstJoined: {
      label: 'כניסה ראשונה',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.firstJoined,
    },
    displayName: {
      label: 'שם תצוגה',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.displayName || '—',
    },
    language: {
      label: 'שפה',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.language ? LANGUAGES.find(l => l.code === user.language)?.name || user.language : '—',
    },
    businessName: {
      label: 'שם עסק',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.businessName || '—',
    },
    description: {
      label: 'תיאור',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.description || '—',
    },
    billingEmail: {
      label: 'אימייל חיוב',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.billingEmail || '—',
    },
    billingAddress: {
      label: 'כתובת חיוב',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.billingAddress
        ? [user.billingAddress.street, user.billingAddress.city, user.billingAddress.country].filter(Boolean).join(', ')
        : '—',
    },
    billingPhone: {
      label: 'טלפון חיוב',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: () => '—',
    },
    currency: {
      label: 'מטבע',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.currency || '—',
    },
    timezone: {
      label: 'אזור זמן',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.timezone
        ? TIMEZONES.find(tz => tz.value === user.timezone)?.label || user.timezone
        : '—',
    },
    taxStatus: {
      label: 'סטטוס מס',
      cellClass: '',
      render: (user) => user.taxStatus ? (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          user.taxStatus === 'taxable' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          user.taxStatus === 'exempt' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
        }`}>
          {user.taxStatus === 'taxable' ? 'חייב' : user.taxStatus === 'exempt' ? 'פטור' : 'חיוב הפוך'}
        </span>
      ) : <span className="text-slate-400 italic">—</span>,
    },
    shippingAddress: {
      label: 'כתובת משלוח',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.shippingAddress
        ? [user.shippingAddress.street, user.shippingAddress.city, user.shippingAddress.country].filter(Boolean).join(', ')
        : '—',
    },
    shippingPhone: {
      label: 'טלפון משלוח',
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.shippingPhone || '—',
    },
  };

  // Add custom field entries dynamically
  customFields.forEach(field => {
    const cfKey = `cf_${field.id}`;
    if (!COLUMN_CONFIG[cfKey]) {
      COLUMN_CONFIG[cfKey] = {
        label: field.name,
        cellClass: 'text-sm text-slate-400 dark:text-slate-500 italic',
        render: () => '—',
      };
    }
  });

  const COLUMN_LABELS: [string, string][] = Object.entries(COLUMN_CONFIG).map(
    ([key, cfg]) => [key, cfg.label]
  );

  const visibleOrderedColumns = columnOrder.filter(col => {
    if (col === 'checkbox') return false;
    if (!COLUMN_CONFIG[col]) return false;
    if (col.startsWith('cf_')) {
      const fieldId = col.replace('cf_', '');
      return customFields.find(f => f.id === fieldId)?.visible ?? false;
    }
    return visibleColumns[col as keyof typeof visibleColumns] ?? false;
  });

  const totalTableWidth = getColWidth('checkbox') + visibleOrderedColumns.reduce((sum, col) => sum + getColWidth(col), 0) + 48;

  // ─── Sorting ────────────────────────────────────────────────────
  const sortedUsers = sortColumn
    ? [...filteredUsers].sort((a, b) => {
        const aVal = a[sortColumn as keyof User];
        const bVal = b[sortColumn as keyof User];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal ?? '');
        const bStr = String(bVal ?? '');
        return sortDirection === 'asc' ? aStr.localeCompare(bStr, 'he') : bStr.localeCompare(aStr, 'he');
      })
    : filteredUsers;

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
    setColumnOrder(prev => [...prev, `cf_${newField.id}`]);
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
    setManualContactData({ ...EMPTY_CONTACT_DATA });
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-rounded text-red-500 text-2xl">delete_forever</span>
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
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
                  <span className="material-symbols-rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
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
                  <label className="flex items-center gap-3 cursor-pointer group p-3 border-2 rounded-lg transition-all hover:border-[#635bff] hover:bg-[#635bff]/5">
                    <input
                      type="radio"
                      name="exportOption"
                      checked={exportOption === 'all'}
                      onChange={() => setExportOption('all')}
                      className="w-5 h-5 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-base font-medium text-slate-900 dark:text-white block">ייצא הכל</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {filteredUsers.length} משתמשים יוצאו
                      </span>
                    </div>
                    <span className="material-symbols-rounded text-slate-400 group-hover:text-[#635bff] transition-colors">
                      select_all
                    </span>
                  </label>

                  <label className={`flex items-center gap-3 cursor-pointer group p-3 border-2 rounded-lg transition-all ${
                    selectedIds.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-[#635bff] hover:bg-[#635bff]/5'
                  }`}>
                    <input
                      type="radio"
                      name="exportOption"
                      checked={exportOption === 'selected'}
                      onChange={() => setExportOption('selected')}
                      disabled={selectedIds.length === 0}
                      className="w-5 h-5 text-[#635bff] focus:ring-[#635bff] cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <span className="text-base font-medium text-slate-900 dark:text-white block">
                        ייצא רק שורות מסומנות
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedIds.length === 0 ? 'לא נבחרו שורות' : `${selectedIds.length} משתמשים מסומנים`}
                      </span>
                    </div>
                    <span className="material-symbols-rounded text-slate-400 group-hover:text-[#635bff] transition-colors">
                      checklist
                    </span>
                  </label>
                </div>
              </div>

              {/* Email Option */}
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailCopy}
                    onChange={(e) => setSendEmailCopy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-violet-300 dark:border-violet-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-violet-600 dark:text-violet-400 text-base">email</span>
                      <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
                        שלח עותק למייל שלי
                      </span>
                    </div>
                    <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
                      הקובץ ישלח אליך במייל בנוסף להורדה ישירה
                    </p>
                  </div>
                </label>
              </div>

              {/* Info */}
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <div className="flex gap-2">
                  <span className="material-symbols-rounded text-slate-500 dark:text-slate-400 text-lg">info</span>
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
                    <span className="material-symbols-rounded text-sm animate-spin">refresh</span>
                    מייצא...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded text-sm">file_download</span>
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#635bff]/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-rounded text-[#635bff] text-xl">person_add</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">הרשמה ידנית</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">הוסף איש קשר חדש למערכת</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowManualRegistrationModal(false);
                    setManualContactData({ ...EMPTY_CONTACT_DATA });
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-symbols-rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* ── Basic Info (always visible) ── */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  שם מלא <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualContactData.name}
                  onChange={(e) => setManualContactData({ ...manualContactData, name: e.target.value })}
                  placeholder="לדוגמה: יוסי כהן"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  אימייל <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={manualContactData.email}
                  onChange={(e) => setManualContactData({ ...manualContactData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">טלפון</label>
                <input
                  type="tel"
                  value={manualContactData.phone}
                  onChange={(e) => setManualContactData({ ...manualContactData, phone: e.target.value })}
                  placeholder="050-1234567"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">כתובת</label>
                <input
                  type="text"
                  value={manualContactData.address}
                  onChange={(e) => setManualContactData({ ...manualContactData, address: e.target.value })}
                  placeholder="תל אביב, הרצל 12"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                />
              </div>

              {/* ── Section: Account Information ── */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFormSections(s => ({ ...s, account: !s.account }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-rounded text-base text-[#635bff]">person</span>
                    פרטי חשבון
                  </span>
                  <span className={`material-symbols-rounded text-slate-400 text-base transition-transform ${expandedFormSections.account ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {expandedFormSections.account && (
                  <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">שם תצוגה</label>
                      <input type="text" value={manualContactData.displayName} onChange={(e) => setManualContactData({ ...manualContactData, displayName: e.target.value })} placeholder="שם שמופיע בחשבוניות" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">שפה</label>
                      <select value={manualContactData.language} onChange={(e) => setManualContactData({ ...manualContactData, language: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                        <option value="">בחר שפה...</option>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">שם עסק</label>
                      <input type="text" value={manualContactData.businessName} onChange={(e) => setManualContactData({ ...manualContactData, businessName: e.target.value })} placeholder="שם החברה או העסק" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">שם פרטי (אדם פרטי)</label>
                      <input type="text" value={manualContactData.individualName} onChange={(e) => setManualContactData({ ...manualContactData, individualName: e.target.value })} placeholder="שם פרטי של איש הקשר" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">תיאור</label>
                      <textarea value={manualContactData.description} onChange={(e) => setManualContactData({ ...manualContactData, description: e.target.value })} placeholder="הערות פנימיות על הלקוח" rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all resize-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section: Billing Information ── */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFormSections(s => ({ ...s, billing: !s.billing }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-rounded text-base text-[#635bff]">receipt_long</span>
                    פרטי חיוב
                  </span>
                  <span className={`material-symbols-rounded text-slate-400 text-base transition-transform ${expandedFormSections.billing ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {expandedFormSections.billing && (
                  <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">אימייל לחיוב</label>
                      <input type="email" value={manualContactData.billingEmail} onChange={(e) => setManualContactData({ ...manualContactData, billingEmail: e.target.value })} placeholder="billing@company.com" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">רחוב</label>
                        <input type="text" value={manualContactData.billingStreet} onChange={(e) => setManualContactData({ ...manualContactData, billingStreet: e.target.value })} placeholder="הרצל 12" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">עיר</label>
                        <input type="text" value={manualContactData.billingCity} onChange={(e) => setManualContactData({ ...manualContactData, billingCity: e.target.value })} placeholder="תל אביב" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">מדינה/מחוז</label>
                        <input type="text" value={manualContactData.billingState} onChange={(e) => setManualContactData({ ...manualContactData, billingState: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">מיקוד</label>
                        <input type="text" value={manualContactData.billingZip} onChange={(e) => setManualContactData({ ...manualContactData, billingZip: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">ארץ</label>
                        <select value={manualContactData.billingCountry} onChange={(e) => setManualContactData({ ...manualContactData, billingCountry: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                          <option value="">בחר ארץ...</option>
                          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">טלפון לחיוב</label>
                      <input type="tel" value={manualContactData.billingPhone} onChange={(e) => setManualContactData({ ...manualContactData, billingPhone: e.target.value })} placeholder="+972-50-1234567" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">מטבע</label>
                        <select value={manualContactData.currency} onChange={(e) => setManualContactData({ ...manualContactData, currency: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                          <option value="">בחר מטבע...</option>
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">אזור זמן</label>
                        <select value={manualContactData.timezone} onChange={(e) => setManualContactData({ ...manualContactData, timezone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                          <option value="">בחר אזור זמן...</option>
                          {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section: Tax Information ── */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFormSections(s => ({ ...s, tax: !s.tax }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-rounded text-base text-[#635bff]">calculate</span>
                    מידע מס
                  </span>
                  <span className={`material-symbols-rounded text-slate-400 text-base transition-transform ${expandedFormSections.tax ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {expandedFormSections.tax && (
                  <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">סטטוס מס</label>
                      <div className="flex gap-2">
                        {([['taxable', 'חייב במס'], ['exempt', 'פטור'], ['reverse_charge', 'חיוב הפוך']] as const).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setManualContactData({ ...manualContactData, taxStatus: manualContactData.taxStatus === val ? '' : val })}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${manualContactData.taxStatus === val ? 'bg-[#635bff]/10 border-[#635bff] text-[#635bff]' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">מזהי מס</label>
                      {manualContactData.taxIds.map((tid, idx) => (
                        <div key={idx} className="grid grid-cols-6 gap-2 mb-2">
                          <div className="col-span-2">
                            <select value={tid.type} onChange={(e) => { const ids = [...manualContactData.taxIds]; ids[idx] = { ...ids[idx], type: e.target.value }; setManualContactData({ ...manualContactData, taxIds: ids }); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                              <option value="">סוג...</option>
                              {TAX_ID_TYPES.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <input type="text" value={tid.value} onChange={(e) => { const ids = [...manualContactData.taxIds]; ids[idx] = { ...ids[idx], value: e.target.value }; setManualContactData({ ...manualContactData, taxIds: ids }); }} placeholder="123456789" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                          </div>
                          <button type="button" onClick={() => { const ids = manualContactData.taxIds.filter((_, i) => i !== idx); setManualContactData({ ...manualContactData, taxIds: ids }); }} className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                            <span className="material-symbols-rounded text-base">delete</span>
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setManualContactData({ ...manualContactData, taxIds: [...manualContactData.taxIds, { type: '', value: '' }] })} className="flex items-center gap-1 text-xs text-[#635bff] hover:text-[#635bff]/80 font-medium mt-1">
                        <span className="material-symbols-rounded text-sm">add</span>
                        הוסף מזהה מס
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section: Shipping Information ── */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFormSections(s => ({ ...s, shipping: !s.shipping }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-rounded text-base text-[#635bff]">local_shipping</span>
                    פרטי משלוח
                  </span>
                  <span className={`material-symbols-rounded text-slate-400 text-base transition-transform ${expandedFormSections.shipping ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {expandedFormSections.shipping && (
                  <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">רחוב</label>
                        <input type="text" value={manualContactData.shippingStreet} onChange={(e) => setManualContactData({ ...manualContactData, shippingStreet: e.target.value })} placeholder="הרצל 12" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">עיר</label>
                        <input type="text" value={manualContactData.shippingCity} onChange={(e) => setManualContactData({ ...manualContactData, shippingCity: e.target.value })} placeholder="תל אביב" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">מדינה/מחוז</label>
                        <input type="text" value={manualContactData.shippingState} onChange={(e) => setManualContactData({ ...manualContactData, shippingState: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">מיקוד</label>
                        <input type="text" value={manualContactData.shippingZip} onChange={(e) => setManualContactData({ ...manualContactData, shippingZip: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">ארץ</label>
                        <select value={manualContactData.shippingCountry} onChange={(e) => setManualContactData({ ...manualContactData, shippingCountry: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                          <option value="">בחר ארץ...</option>
                          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">טלפון למשלוח</label>
                      <input type="tel" value={manualContactData.shippingPhone} onChange={(e) => setManualContactData({ ...manualContactData, shippingPhone: e.target.value })} placeholder="050-1234567" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                  </div>
                )}
              </div>

              {/* Info Note */}
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                <div className="flex gap-2 items-start">
                  <span className="material-symbols-rounded text-violet-600 dark:text-violet-400 text-base">info</span>
                  <p className="text-xs text-violet-700 dark:text-violet-300 flex-1">
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
                  setManualContactData({ ...EMPTY_CONTACT_DATA });
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors text-sm"
              >
                ביטול
              </button>
              <button
                onClick={handleManualRegistration}
                disabled={!manualContactData.name || !manualContactData.email}
                className="px-6 py-2 bg-[#635bff] hover:bg-[#635bff]/90 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <span className="material-symbols-rounded text-sm">person_add</span>
                הוסף משתמש
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Field Modal */}
      {showCustomFieldModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-md my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-rounded text-violet-600 dark:text-violet-400 text-lg">add_circle</span>
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
                  <span className="material-symbols-rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                />
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  סוג השדה <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {/* Text */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-[#635bff] hover:bg-[#635bff]/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'text'}
                      onChange={() => setCustomFieldType('text')}
                      className="w-4 h-4 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                    />
                    <span className="material-symbols-rounded text-slate-500 dark:text-slate-400 text-base">text_fields</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">טקסט</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">שדה טקסט חופשי</span>
                    </div>
                  </label>

                  {/* Number */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-[#635bff] hover:bg-[#635bff]/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'number'}
                      onChange={() => setCustomFieldType('number')}
                      className="w-4 h-4 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                    />
                    <span className="material-symbols-rounded text-slate-500 dark:text-slate-400 text-base">tag</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">מספר</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">ערכים מספריים</span>
                    </div>
                  </label>

                  {/* Link */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-[#635bff] hover:bg-[#635bff]/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'link'}
                      onChange={() => setCustomFieldType('link')}
                      className="w-4 h-4 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                    />
                    <span className="material-symbols-rounded text-slate-500 dark:text-slate-400 text-base">link</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">קישור</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">כתובת URL</span>
                    </div>
                  </label>

                  {/* Date */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-[#635bff] hover:bg-[#635bff]/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'date'}
                      onChange={() => setCustomFieldType('date')}
                      className="w-4 h-4 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                    />
                    <span className="material-symbols-rounded text-slate-500 dark:text-slate-400 text-base">calendar_today</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">תאריך</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">תאריך ספציפי</span>
                    </div>
                  </label>

                  {/* Dropdown */}
                  <label className="flex items-center gap-2 cursor-pointer group p-2 border-2 rounded-lg transition-all hover:border-[#635bff] hover:bg-[#635bff]/5">
                    <input
                      type="radio"
                      name="fieldType"
                      checked={customFieldType === 'dropdown'}
                      onChange={() => setCustomFieldType('dropdown')}
                      className="w-4 h-4 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                    />
                    <span className="material-symbols-rounded text-slate-500 dark:text-slate-400 text-base">arrow_drop_down_circle</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">תפריט נפתח</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">בחירה מרשימה</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Info */}
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-2">
                <div className="flex gap-2 items-start">
                  <span className="material-symbols-rounded text-violet-600 dark:text-violet-400 text-base">info</span>
                  <p className="text-xs text-violet-700 dark:text-violet-300 flex-1">
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
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <span className="material-symbols-rounded text-sm">add</span>
                הוסף שדה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Left Side - Content */}
            <div className="flex-1 flex flex-col p-8 md:p-12 relative overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
                    <span className="material-symbols-rounded text-sm">table_view</span>
                    <span className="material-symbols-rounded text-xs">chevron_left</span>
                    <span className="material-symbols-rounded text-sm text-emerald-600">drive_folder_upload</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                    <span className="material-symbols-rounded text-lg">chat_bubble_outline</span>
                    תן משוב
                  </button>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">שלב 1 מתוך 4</span>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <span className="material-symbols-rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
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
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-6 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-rounded text-3xl">upload_file</span>
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
                      <span className="material-symbols-rounded text-green-600 text-3xl animate-in zoom-in">check_circle</span>
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
                    <a className="flex items-center gap-2 text-violet-600 hover:underline text-sm font-medium" href="#">
                      קרא ולמד <span className="text-slate-500 dark:text-slate-400 font-normal">על ייבוא לפלטפורמה</span>
                    </a>
                    <a className="flex items-center gap-2 text-violet-600 hover:underline text-sm font-medium" href="#">
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
                  <span className="material-symbols-rounded text-teal-500 dark:text-teal-400 mt-2 text-2xl">arrow_back</span>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">ניהול משתמשים</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">נהל ועקוב אחר הלקוחות וחברי האתר שלך במקום אחד.</p>
          </div>
        </div>
      </div>

      {/* Tabs for User Types */}
      <div className="mb-6">
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === 'contacts'
                ? 'border-[#635bff] text-[#635bff]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            אנשי קשר
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-[#635bff] text-[#635bff]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            חברים רשומים
            {/* Info Icon with Tooltip */}
            <div
              className="relative"
              onMouseEnter={() => setShowMemberTooltip(true)}
              onMouseLeave={() => setShowMemberTooltip(false)}
            >
              <span className="material-symbols-rounded !text-[14px] text-slate-400 hover:text-slate-600 cursor-help transition-colors">
                info
              </span>
              {showMemberTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in zoom-in duration-200">
                  <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg px-4 py-3 shadow-xl border border-slate-700 dark:border-slate-600 whitespace-nowrap">
                    <div className="font-semibold mb-1">חבר רשום</div>
                    <div className="text-slate-300 dark:text-slate-400">
                      משתמש שנרשם באתר ויש לו גישה מלאה למערכת
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Panel */}
        {showFilterPanel && (
          <aside className="w-full lg:w-[380px] animate-in slide-in-from-right">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
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
                        <span className="material-symbols-rounded">close</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">סנן משתמשים לפי קריטריונים שונים</p>
                  </div>

                  {/* Filter Content */}
                  <div className="p-6 space-y-6">
                {/* Active Filters Count */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-[#635bff]/10 rounded-lg">
                    <span className="text-sm font-medium text-[#635bff]">{activeFilterCount} סינונים פעילים</span>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[#635bff] hover:underline font-medium"
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
                    <span className="material-symbols-rounded absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      value={filters.searchText}
                      onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                      placeholder="שם, אימייל או כתובת..."
                      className="w-full ps-10 pe-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
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
                        className="w-4 h-4 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-[#635bff] transition-colors">הכל</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <input
                        type="radio"
                        name="status"
                        checked={filters.status === 'active'}
                        onChange={() => setFilters({ ...filters, status: 'active' })}
                        className="w-4 h-4 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-[#635bff] transition-colors flex items-center gap-2">
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
                        className="w-4 h-4 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-[#635bff] transition-colors flex items-center gap-2">
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
                        className="w-4 h-4 text-[#635bff] focus:ring-[#635bff] cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-[#635bff] transition-colors flex items-center gap-2">
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
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">עד תאריך</label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
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
                            <span className="material-symbols-rounded text-xs">
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
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                            />
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              value={customFieldFilters[field.id] || ''}
                              onChange={(e) => setCustomFieldFilters({ ...customFieldFilters, [field.id]: e.target.value })}
                              placeholder={`סנן לפי ${field.name}...`}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                            />
                          ) : field.type === 'date' ? (
                            <input
                              type="date"
                              value={customFieldFilters[field.id] || ''}
                              onChange={(e) => setCustomFieldFilters({ ...customFieldFilters, [field.id]: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                            />
                          ) : field.type === 'dropdown' ? (
                            <select
                              value={customFieldFilters[field.id] || ''}
                              onChange={(e) => setCustomFieldFilters({ ...customFieldFilters, [field.id]: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
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
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
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
                        <span className="material-symbols-rounded">close</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">בחר אילו עמודות להציג בטבלה</p>
                  </div>

                  {/* Column Checkboxes */}
                  <div className="p-6">
                    <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">עמודות זמינות</h3>
                    <div className="space-y-3">
                      {COLUMN_LABELS.filter(([key]) => key !== 'checkbox' && !key.startsWith('cf_')).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                          <label className="flex items-center gap-3 cursor-pointer group flex-1">
                            <input
                              type="checkbox"
                              checked={visibleColumns[key as keyof typeof visibleColumns] ?? false}
                              onChange={() => toggleColumnVisibility(key as keyof typeof visibleColumns)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#635bff] focus:ring-[#635bff]"
                            />
                            <span className="text-sm group-hover:text-[#635bff] transition-colors">{label}</span>
                          </label>
                          <button
                            onClick={() => toggleColumnFreeze(key)}
                            className={`p-1 rounded transition-colors ${
                              frozenColumns.includes(key)
                                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title={frozenColumns.includes(key) ? 'בטל הקפאה' : 'הקפא עמודה'}
                          >
                            <span className="material-symbols-rounded !text-[14px]">push_pin</span>
                          </button>
                        </div>
                      ))}
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
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#635bff] focus:ring-[#635bff]"
                            />
                            <div className="flex-1 flex items-center gap-2">
                              <span className="material-symbols-rounded text-sm text-slate-500">
                                {field.type === 'text' && 'text_fields'}
                                {field.type === 'number' && 'tag'}
                                {field.type === 'link' && 'link'}
                                {field.type === 'date' && 'calendar_today'}
                                {field.type === 'dropdown' && 'arrow_drop_down_circle'}
                              </span>
                              <span className="text-sm group-hover:text-[#635bff] transition-colors">{field.name}</span>
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
                                setColumnOrder(prev => prev.filter(c => c !== `cf_${field.id}`));
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors"
                              title="מחק שדה"
                            >
                              <span className="material-symbols-rounded text-sm">delete</span>
                            </button>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Add Button */}
                    <button
                      onClick={() => setShowCustomFieldModal(true)}
                      className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:border-[#635bff] hover:text-[#635bff] transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-rounded text-lg">add</span>
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
          <div
            className="relative bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 border-highlight-card"
            onMouseMove={handleTableMouseMove}
          >
            {/* Table Header Actions */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Table Search */}
                <div className="relative">
                  {!isTableSearchExpanded ? (
                    <button
                      className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md transition-colors"
                      onClick={() => {
                        setIsTableSearchExpanded(true);
                        setTimeout(() => tableSearchInputRef.current?.focus(), 50);
                      }}
                      title="חיפוש"
                    >
                      <span className="material-symbols-rounded !text-[16px]">search</span>
                    </button>
                  ) : (
                    <div className="relative">
                      <input
                        ref={tableSearchInputRef}
                        type="text"
                        value={filters.searchText}
                        onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                        className="w-52 ps-8 pe-8 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                        placeholder="חיפוש משתמשים..."
                        autoFocus
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="material-symbols-rounded text-slate-400 !text-[16px]">search</span>
                      </div>
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (filters.searchText) {
                              setFilters({ ...filters, searchText: '' });
                              tableSearchInputRef.current?.focus();
                            } else {
                              setIsTableSearchExpanded(false);
                            }
                          }}
                          className="text-slate-400 hover:text-slate-600 flex items-center justify-center"
                          tabIndex={-1}
                        >
                          <span className="material-symbols-rounded !text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
                  className={`relative w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                    activeFilterCount > 0
                      ? 'bg-[#635bff] text-white'
                      : 'text-[#635bff] hover:bg-[#635bff]/10'
                  }`}
                  title="סינון"
                >
                  <span className="material-symbols-rounded !text-[16px]">filter_list</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -end-1.5 bg-white text-[#635bff] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#635bff]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Import/Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowImportExportMenu(!showImportExportMenu)}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 transition-colors"
                    title="ייבוא/ייצוא"
                  >
                    <span className="material-symbols-rounded !text-[16px]">swap_vert</span>
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
                          <span className="material-symbols-rounded text-sm text-[#635bff]">file_upload</span>
                          <span>ייבוא משתמשים</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowImportExportMenu(false);
                            setShowExportModal(true);
                          }}
                          className="w-full px-4 py-3 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                        >
                          <span className="material-symbols-rounded text-sm text-[#635bff]">file_download</span>
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
                  className="w-8 h-8 rounded-md flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 transition-colors"
                  title="התאמה אישית"
                >
                  <span className="material-symbols-rounded !text-[16px]">tune</span>
                </button>

                {/* More Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreActionsMenu(!showMoreActionsMenu)}
                    onMouseEnter={() => setShowMoreActionsTooltip(true)}
                    onMouseLeave={() => setShowMoreActionsTooltip(false)}
                    className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md transition-colors"
                  >
                    <span className="material-symbols-rounded !text-[16px]">more_vert</span>
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
                          <span className="material-symbols-rounded text-sm text-[#635bff]">person_add</span>
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
                          <span className="material-symbols-rounded text-sm text-[#635bff]">email</span>
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
                <span className="text-xs text-slate-400">מציג {sortedUsers.length} מתוך {users.length} משתמשים</span>
                <div className="flex gap-1">
                  <button className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md transition-colors">
                    <span className="material-symbols-rounded !text-[16px]">chevron_right</span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md transition-colors">
                    <span className="material-symbols-rounded !text-[16px]">chevron_left</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div ref={tableContainerRef} className="overflow-x-auto relative custom-scrollbar">
              <table ref={tableRef} className="text-right" style={{ width: `${totalTableWidth}px`, minWidth: '100%', borderSpacing: 0, position: 'relative', tableLayout: 'fixed' }}>
                <thead
                  ref={tableHeaderRef}
                  style={{
                    position: isHeaderFixed ? 'fixed' : 'static',
                    top: isHeaderFixed ? '64px' : 'auto',
                    left: isHeaderFixed ? `${headerLeft}px` : 'auto',
                    zIndex: isHeaderFixed ? 30 : 1,
                    backgroundColor: 'rgb(239 246 255)',
                    width: isHeaderFixed ? `${headerWidth}px` : 'auto',
                    display: isHeaderFixed ? 'table' : 'table-header-group',
                    tableLayout: isHeaderFixed ? 'fixed' : 'auto',
                    willChange: 'transform',
                    boxShadow: isHeaderFixed ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'box-shadow 0.2s ease',
                  }}
                  className="dark:bg-slate-800"
                >
                  <tr className="bg-violet-50 dark:bg-slate-800 text-primary/70 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-y-2 border-violet-200/60">
                    {/* Checkbox — always first, always frozen */}
                    <th
                      className={`px-3 py-2.5 ${isLastFrozenColumn('checkbox') ? 'frozen-column-shadow' : ''}`}
                      style={{
                        width: `${getColWidth('checkbox')}px`,
                        position: 'sticky',
                        right: 0,
                        zIndex: 20,
                        backgroundColor: 'rgb(239 246 255)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={sortedUsers.length > 0 && selectedIds.length === sortedUsers.length}
                        onChange={toggleAllUsers}
                        className="rounded border-slate-300 dark:border-slate-600 text-[#635bff] focus:ring-[#635bff] dark:bg-slate-700"
                      />
                    </th>

                    {/* Data columns — iterated */}
                    {visibleOrderedColumns.map(col => (
                      <th
                        key={col}
                        draggable={!resizingColumn}
                        onDragStart={(e) => { if (resizingColumn) { e.preventDefault(); return; } handleColumnDragStart(e, col); }}
                        onDragOver={(e) => handleColumnDragOver(e, col)}
                        onDrop={(e) => handleColumnDrop(e, col)}
                        onDragEnd={handleColumnDragEnd}
                        onContextMenu={(e) => { e.preventDefault(); setColumnMenuOpen(columnMenuOpen === col ? null : col); }}
                        className={`px-6 py-2.5 bg-violet-50 dark:bg-slate-800/50 cursor-grab active:cursor-grabbing select-none group/col relative overflow-visible ${
                          frozenColumns.includes(col) && isLastFrozenColumn(col) ? 'frozen-column-shadow' : ''
                        } ${draggedColumn === col ? '!bg-[#635bff]/20 border-x-2 border-[#635bff]/30' : ''} ${
                          dragOverColumn === col && draggedColumn !== col ? 'border-e-[3px] border-[#635bff]' : ''
                        }`}
                        style={{
                          width: `${getColWidth(col)}px`,
                          ...(frozenColumns.includes(col) ? { position: 'sticky' as const, right: `${getColumnLeftPosition(col)}px`, zIndex: 20, backgroundColor: draggedColumn === col ? 'rgba(99,91,255,0.15)' : 'rgb(239 246 255)' } : {}),
                        }}
                      >
                        <div className="flex items-center gap-1 overflow-hidden">
                          <span className="flex-1 truncate">{COLUMN_CONFIG[col]?.label ?? col}</span>
                          {sortColumn === col && (
                            <span className="material-symbols-rounded !text-[14px] text-[#635bff]">
                              {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setColumnMenuOpen(columnMenuOpen === col ? null : col); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            draggable={false}
                            className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover/col:opacity-100 hover:bg-slate-200/60 transition-opacity"
                          >
                            <span className="material-symbols-rounded !text-[14px]">expand_more</span>
                          </button>
                        </div>

                        {/* Column context menu */}
                        {columnMenuOpen === col && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setColumnMenuOpen(null)} />
                            <div className="absolute top-full start-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden text-sm font-normal normal-case tracking-normal" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { setSortColumn(col); setSortDirection('asc'); setColumnMenuOpen(null); }}
                                className={`w-full px-4 py-2.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 ${sortColumn === col && sortDirection === 'asc' ? 'text-[#635bff] bg-[#635bff]/5' : 'text-slate-700 dark:text-slate-300'}`}>
                                <span className="material-symbols-rounded !text-[16px]">arrow_upward</span>
                                מיין לפי עולה
                              </button>
                              <button onClick={() => { setSortColumn(col); setSortDirection('desc'); setColumnMenuOpen(null); }}
                                className={`w-full px-4 py-2.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 ${sortColumn === col && sortDirection === 'desc' ? 'text-[#635bff] bg-[#635bff]/5' : 'text-slate-700 dark:text-slate-300'}`}>
                                <span className="material-symbols-rounded !text-[16px]">arrow_downward</span>
                                מיין לפי יורד
                              </button>
                              {sortColumn === col && (
                                <button onClick={() => { setSortColumn(null); setColumnMenuOpen(null); }}
                                  className="w-full px-4 py-2.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 text-slate-400">
                                  <span className="material-symbols-rounded !text-[16px]">close</span>
                                  הסר מיון
                                </button>
                              )}
                              <div className="border-t border-slate-100 dark:border-slate-700" />
                              <button onClick={() => { setShowFilterPanel(true); setShowCustomizePanel(false); setColumnMenuOpen(null); }}
                                className="w-full px-4 py-2.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                                <span className="material-symbols-rounded !text-[16px]">filter_list</span>
                                סנן
                              </button>
                              <div className="border-t border-slate-100 dark:border-slate-700" />
                              <button onClick={() => { toggleColumnFreeze(col); setColumnMenuOpen(null); }}
                                className={`w-full px-4 py-2.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 ${frozenColumns.includes(col) ? 'text-[#635bff]' : 'text-slate-700 dark:text-slate-300'}`}>
                                <span className="material-symbols-rounded !text-[16px]">push_pin</span>
                                {frozenColumns.includes(col) ? 'בטל הקפאה' : 'הקפא עמודה'}
                              </button>
                              <button onClick={() => { toggleColumnVisibility(col as keyof typeof visibleColumns); setColumnMenuOpen(null); }}
                                className="w-full px-4 py-2.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                                <span className="material-symbols-rounded !text-[16px]">visibility_off</span>
                                הסתר עמודה
                              </button>
                            </div>
                          </>
                        )}

                        {/* Resize handle */}
                        <div
                          className={`absolute top-0 end-0 h-full w-[5px] cursor-col-resize z-10 transition-colors ${
                            resizingColumn === col ? 'bg-[#635bff]' : 'hover:bg-[#635bff]/20'
                          }`}
                          onMouseDown={(e) => handleResizeStart(e, col)}
                          draggable={false}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => { e.stopPropagation(); setColumnWidths(prev => { const next = { ...prev }; delete next[col]; return next; }); }}
                        />
                      </th>
                    ))}

                    {/* Actions spacer column */}
                    <th className="px-3 py-2.5 w-12 bg-violet-50 dark:bg-slate-800/50"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {apiError && (
                    <tr>
                      <td colSpan={100} className="px-6 py-3">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                          <span className="material-symbols-rounded text-base">error_outline</span>
                          {apiError}
                          <button onClick={loadUsers} className="mr-auto text-xs underline">נסה שוב</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {isHeaderFixed && <tr><td colSpan={100} style={{ height: `${headerHeight}px`, padding: 0, border: 'none' }}></td></tr>}
                  {isTableLoading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <tr key={index} className="animate-pulse border-b border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2.5"><div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto"></div></td>
                        {visibleOrderedColumns.map(col => (
                          <td key={col} className="px-6 py-2.5">
                            <div className={`h-4 bg-slate-200 dark:bg-slate-700 ${
                              col === 'status' || col === 'taxStatus' ? 'w-16 h-6 rounded-full' : 'w-24 rounded'
                            }`}></div>
                          </td>
                        ))}
                        <td className="px-3 py-2.5"><div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                      </tr>
                    ))
                  ) : sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={100} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="material-symbols-rounded text-4xl text-slate-300">search_off</span>
                          <p className="text-slate-500 dark:text-slate-400">לא נמצאו משתמשים התואמים לסינון</p>
                          <button onClick={clearFilters} className="text-sm text-[#635bff] hover:underline">נקה סינון</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => handleRowClick(user)}
                        className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group ${
                          selectedUser?.id === user.id ? 'bg-[#635bff]/5 dark:bg-[#635bff]/10 border-r-4 border-[#635bff]' :
                          selectedIds.includes(user.id) ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className={`px-3 py-2.5 text-center ${isLastFrozenColumn('checkbox') ? 'frozen-column-shadow' : ''}`}
                          style={frozenColumns.includes('checkbox') ? {
                            position: 'sticky', right: 0, zIndex: 10,
                            backgroundColor: selectedIds.includes(user.id) ? 'rgb(245 243 255)' : 'white',
                          } : {}}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(user.id)}
                            onChange={(e) => { e.stopPropagation(); toggleUserSelection(user.id); }}
                            className="rounded border-slate-300 dark:border-slate-600 text-[#635bff] focus:ring-[#635bff] dark:bg-slate-700"
                          />
                        </td>

                        {/* Data columns — iterated */}
                        {visibleOrderedColumns.map(col => (
                          <td
                            key={col}
                            className={`px-6 py-2.5 overflow-hidden text-ellipsis whitespace-nowrap ${COLUMN_CONFIG[col]?.cellClass ?? ''} ${
                              frozenColumns.includes(col) && isLastFrozenColumn(col) ? 'frozen-column-shadow' : ''
                            } ${draggedColumn === col ? '!bg-[#635bff]/10 border-x-2 border-[#635bff]/20' : ''} ${
                              dragOverColumn === col && draggedColumn !== col ? 'border-e-[3px] border-[#635bff]' : ''
                            }`}
                            style={frozenColumns.includes(col) ? {
                              position: 'sticky', right: `${getColumnLeftPosition(col)}px`, zIndex: 10,
                              backgroundColor: draggedColumn === col ? 'rgba(99,91,255,0.08)' : selectedIds.includes(user.id) ? 'rgb(245 243 255)' : 'white',
                            } : {}}
                          >
                            {COLUMN_CONFIG[col]?.render(user)}
                          </td>
                        ))}

                        {/* Row actions */}
                        <td className="px-6 py-2.5 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRowActionMenuId(rowActionMenuId === user.id ? null : user.id);
                          }}
                          className="text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                        >
                          <span className="material-symbols-rounded">more_horiz</span>
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
                                  <span className="material-symbols-rounded text-sm text-[#635bff]">upgrade</span>
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
                                <span className="material-symbols-rounded text-sm text-slate-500">edit</span>
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
                                <span className="material-symbols-rounded text-sm text-red-600">delete</span>
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
                    className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md disabled:opacity-40 transition-colors"
                    title="הקודם"
                  >
                    <span className="material-symbols-rounded !text-[16px]">chevron_right</span>
                  </button>
                  <span className="text-xs text-slate-500">עמוד {currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * 50 >= usersTotal}
                    className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md disabled:opacity-40 transition-colors"
                    title="הבא"
                  >
                    <span className="material-symbols-rounded !text-[16px]">chevron_left</span>
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
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 p-6">
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
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 p-6">
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
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 p-6 relative">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 left-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
                >
                  <span className="material-symbols-rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">close</span>
                </button>

                <div className="flex flex-col items-center text-center mb-8 mt-8">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 relative ring-4 ring-slate-50 dark:ring-slate-800/50">
                    <span className="material-symbols-rounded text-4xl text-slate-300">person</span>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-slate-700 shadow-lg rounded-full border border-slate-100 dark:border-slate-600">
                      <span className="material-symbols-rounded text-sm">edit</span>
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
                        <span className="material-symbols-rounded text-xs text-green-500">check</span>
                      ) : (
                        <span className="material-symbols-rounded text-xs text-slate-400">content_copy</span>
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
                        <span className="material-symbols-rounded text-xs text-green-500">check</span>
                      ) : (
                        <span className="material-symbols-rounded text-xs text-slate-400">content_copy</span>
                      )}
                    </button>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedUser!.phone}</p>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button className="flex-1 px-4 py-2 bg-[#635bff] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                      שלח הודעה
                    </button>
                    <button className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <span className="material-symbols-rounded !text-[20px]">mail</span>
                    </button>
                    <button className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <span className="material-symbols-rounded !text-[20px]">phone</span>
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
                      <span className="material-symbols-rounded text-slate-400">
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
                      <span className="material-symbols-rounded text-slate-400">
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
                      <span className="material-symbols-rounded text-slate-400">
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
                      <span className="material-symbols-rounded text-slate-400">
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
                      <span className="material-symbols-rounded text-slate-400">
                        {expandedSection === 'groups' ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 p-6">
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
