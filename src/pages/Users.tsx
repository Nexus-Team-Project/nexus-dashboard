import { useState, useEffect, useRef, useCallback } from 'react';
import ColumnMapping from '../components/ColumnMapping';
import excelLogo from '../assets/logos/excel_logo.png';
import nexusLogo from '../assets/logos/nexus_logo.png';
import { usersApi, type AdminUser, type UserRole, type Address, type TaxId, type TaxStatus } from '../lib/api';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

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
  { code: 'IL', name: 'ישראל', nameEn: 'Israel' }, { code: 'US', name: 'ארצות הברית', nameEn: 'United States' }, { code: 'GB', name: 'בריטניה', nameEn: 'United Kingdom' },
  { code: 'DE', name: 'גרמניה', nameEn: 'Germany' }, { code: 'FR', name: 'צרפת', nameEn: 'France' }, { code: 'IT', name: 'איטליה', nameEn: 'Italy' },
  { code: 'ES', name: 'ספרד', nameEn: 'Spain' }, { code: 'NL', name: 'הולנד', nameEn: 'Netherlands' }, { code: 'BE', name: 'בלגיה', nameEn: 'Belgium' },
  { code: 'AT', name: 'אוסטריה', nameEn: 'Austria' }, { code: 'CH', name: 'שוויץ', nameEn: 'Switzerland' }, { code: 'SE', name: 'שוודיה', nameEn: 'Sweden' },
  { code: 'NO', name: 'נורווגיה', nameEn: 'Norway' }, { code: 'DK', name: 'דנמרק', nameEn: 'Denmark' }, { code: 'FI', name: 'פינלנד', nameEn: 'Finland' },
  { code: 'PT', name: 'פורטוגל', nameEn: 'Portugal' }, { code: 'GR', name: 'יוון', nameEn: 'Greece' }, { code: 'PL', name: 'פולין', nameEn: 'Poland' },
  { code: 'CZ', name: 'צ\'כיה', nameEn: 'Czechia' }, { code: 'RO', name: 'רומניה', nameEn: 'Romania' }, { code: 'HU', name: 'הונגריה', nameEn: 'Hungary' },
  { code: 'BG', name: 'בולגריה', nameEn: 'Bulgaria' }, { code: 'HR', name: 'קרואטיה', nameEn: 'Croatia' }, { code: 'IE', name: 'אירלנד', nameEn: 'Ireland' },
  { code: 'CA', name: 'קנדה', nameEn: 'Canada' }, { code: 'AU', name: 'אוסטרליה', nameEn: 'Australia' }, { code: 'NZ', name: 'ניו זילנד', nameEn: 'New Zealand' },
  { code: 'JP', name: 'יפן', nameEn: 'Japan' }, { code: 'CN', name: 'סין', nameEn: 'China' }, { code: 'KR', name: 'דרום קוריאה', nameEn: 'South Korea' },
  { code: 'IN', name: 'הודו', nameEn: 'India' }, { code: 'BR', name: 'ברזיל', nameEn: 'Brazil' }, { code: 'MX', name: 'מקסיקו', nameEn: 'Mexico' },
  { code: 'AR', name: 'ארגנטינה', nameEn: 'Argentina' }, { code: 'CL', name: 'צ\'ילה', nameEn: 'Chile' }, { code: 'CO', name: 'קולומביה', nameEn: 'Colombia' },
  { code: 'ZA', name: 'דרום אפריקה', nameEn: 'South Africa' }, { code: 'AE', name: 'איחוד האמירויות', nameEn: 'United Arab Emirates' }, { code: 'SA', name: 'ערב הסעודית', nameEn: 'Saudi Arabia' },
  { code: 'EG', name: 'מצרים', nameEn: 'Egypt' }, { code: 'TR', name: 'טורקיה', nameEn: 'Turkey' }, { code: 'RU', name: 'רוסיה', nameEn: 'Russia' },
  { code: 'UA', name: 'אוקראינה', nameEn: 'Ukraine' }, { code: 'TH', name: 'תאילנד', nameEn: 'Thailand' }, { code: 'SG', name: 'סינגפור', nameEn: 'Singapore' },
  { code: 'MY', name: 'מלזיה', nameEn: 'Malaysia' }, { code: 'PH', name: 'פיליפינים', nameEn: 'Philippines' }, { code: 'ID', name: 'אינדונזיה', nameEn: 'Indonesia' },
  { code: 'VN', name: 'וייטנאם', nameEn: 'Vietnam' }, { code: 'TW', name: 'טייוואן', nameEn: 'Taiwan' }, { code: 'HK', name: 'הונג קונג', nameEn: 'Hong Kong' },
];

const CURRENCIES = [
  { code: 'ILS', symbol: '₪', name: 'שקל חדש', nameEn: 'New Shekel' }, { code: 'USD', symbol: '$', name: 'דולר אמריקאי', nameEn: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'יורו', nameEn: 'Euro' }, { code: 'GBP', symbol: '£', name: 'ליש"ט', nameEn: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', name: 'פרנק שוויצרי', nameEn: 'Swiss Franc' }, { code: 'CAD', symbol: 'C$', name: 'דולר קנדי', nameEn: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'דולר אוסטרלי', nameEn: 'Australian Dollar' }, { code: 'JPY', symbol: '¥', name: 'ין יפני', nameEn: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'יואן סיני', nameEn: 'Chinese Yuan' }, { code: 'INR', symbol: '₹', name: 'רופי הודי', nameEn: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'ריאל ברזילאי', nameEn: 'Brazilian Real' }, { code: 'KRW', symbol: '₩', name: 'וון דרום קוריאני', nameEn: 'South Korean Won' },
  { code: 'TRY', symbol: '₺', name: 'לירה טורקית', nameEn: 'Turkish Lira' }, { code: 'AED', symbol: 'د.إ', name: 'דירהם', nameEn: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'ריאל סעודי', nameEn: 'Saudi Riyal' }, { code: 'PLN', symbol: 'zł', name: 'זלוטי פולני', nameEn: 'Polish Zloty' },
  { code: 'SEK', symbol: 'kr', name: 'כתר שוודי', nameEn: 'Swedish Krona' }, { code: 'NOK', symbol: 'kr', name: 'כתר נורווגי', nameEn: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'כתר דני', nameEn: 'Danish Krone' }, { code: 'MXN', symbol: '$', name: 'פזו מקסיקני', nameEn: 'Mexican Peso' },
  { code: 'SGD', symbol: 'S$', name: 'דולר סינגפורי', nameEn: 'Singapore Dollar' }, { code: 'HKD', symbol: 'HK$', name: 'דולר הונג קונגי', nameEn: 'Hong Kong Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'רנד דרום אפריקאי', nameEn: 'South African Rand' }, { code: 'RUB', symbol: '₽', name: 'רובל רוסי', nameEn: 'Russian Ruble' },
];

const TIMEZONES = [
  { value: 'Pacific/Midway', label: '(GMT-11:00) מידוויי', labelEn: '(GMT-11:00) Midway' },
  { value: 'Pacific/Honolulu', label: '(GMT-10:00) הוואי', labelEn: '(GMT-10:00) Hawaii' },
  { value: 'America/Anchorage', label: '(GMT-9:00) אלסקה', labelEn: '(GMT-9:00) Alaska' },
  { value: 'America/Los_Angeles', label: '(GMT-8:00) לוס אנג\'לס', labelEn: '(GMT-8:00) Los Angeles' },
  { value: 'America/Denver', label: '(GMT-7:00) דנוור', labelEn: '(GMT-7:00) Denver' },
  { value: 'America/Chicago', label: '(GMT-6:00) שיקגו', labelEn: '(GMT-6:00) Chicago' },
  { value: 'America/New_York', label: '(GMT-5:00) ניו יורק', labelEn: '(GMT-5:00) New York' },
  { value: 'America/Sao_Paulo', label: '(GMT-3:00) סאו פאולו', labelEn: '(GMT-3:00) São Paulo' },
  { value: 'America/Argentina/Buenos_Aires', label: '(GMT-3:00) בואנוס איירס', labelEn: '(GMT-3:00) Buenos Aires' },
  { value: 'Atlantic/Cape_Verde', label: '(GMT-1:00) כף ורדה', labelEn: '(GMT-1:00) Cape Verde' },
  { value: 'Europe/London', label: '(GMT+0:00) לונדון', labelEn: '(GMT+0:00) London' },
  { value: 'Europe/Paris', label: '(GMT+1:00) פריז', labelEn: '(GMT+1:00) Paris' },
  { value: 'Europe/Berlin', label: '(GMT+1:00) ברלין', labelEn: '(GMT+1:00) Berlin' },
  { value: 'Europe/Amsterdam', label: '(GMT+1:00) אמסטרדם', labelEn: '(GMT+1:00) Amsterdam' },
  { value: 'Europe/Rome', label: '(GMT+1:00) רומא', labelEn: '(GMT+1:00) Rome' },
  { value: 'Europe/Madrid', label: '(GMT+1:00) מדריד', labelEn: '(GMT+1:00) Madrid' },
  { value: 'Europe/Athens', label: '(GMT+2:00) אתונה', labelEn: '(GMT+2:00) Athens' },
  { value: 'Europe/Helsinki', label: '(GMT+2:00) הלסינקי', labelEn: '(GMT+2:00) Helsinki' },
  { value: 'Europe/Bucharest', label: '(GMT+2:00) בוקרשט', labelEn: '(GMT+2:00) Bucharest' },
  { value: 'Asia/Jerusalem', label: '(GMT+2:00) ירושלים', labelEn: '(GMT+2:00) Jerusalem' },
  { value: 'Africa/Cairo', label: '(GMT+2:00) קהיר', labelEn: '(GMT+2:00) Cairo' },
  { value: 'Europe/Moscow', label: '(GMT+3:00) מוסקבה', labelEn: '(GMT+3:00) Moscow' },
  { value: 'Asia/Riyadh', label: '(GMT+3:00) ריאד', labelEn: '(GMT+3:00) Riyadh' },
  { value: 'Asia/Dubai', label: '(GMT+4:00) דובאי', labelEn: '(GMT+4:00) Dubai' },
  { value: 'Asia/Karachi', label: '(GMT+5:00) קראצ\'י', labelEn: '(GMT+5:00) Karachi' },
  { value: 'Asia/Kolkata', label: '(GMT+5:30) מומבאי', labelEn: '(GMT+5:30) Mumbai' },
  { value: 'Asia/Bangkok', label: '(GMT+7:00) בנגקוק', labelEn: '(GMT+7:00) Bangkok' },
  { value: 'Asia/Singapore', label: '(GMT+8:00) סינגפור', labelEn: '(GMT+8:00) Singapore' },
  { value: 'Asia/Hong_Kong', label: '(GMT+8:00) הונג קונג', labelEn: '(GMT+8:00) Hong Kong' },
  { value: 'Asia/Shanghai', label: '(GMT+8:00) שנגחאי', labelEn: '(GMT+8:00) Shanghai' },
  { value: 'Asia/Tokyo', label: '(GMT+9:00) טוקיו', labelEn: '(GMT+9:00) Tokyo' },
  { value: 'Asia/Seoul', label: '(GMT+9:00) סיאול', labelEn: '(GMT+9:00) Seoul' },
  { value: 'Australia/Sydney', label: '(GMT+10:00) סידני', labelEn: '(GMT+10:00) Sydney' },
  { value: 'Pacific/Auckland', label: '(GMT+12:00) אוקלנד', labelEn: '(GMT+12:00) Auckland' },
];

const TAX_ID_TYPES = [
  { code: 'il_vat', name: 'ע.מ ישראלי (IL VAT)', nameEn: 'IL VAT' },
  { code: 'eu_vat', name: 'EU VAT', nameEn: 'EU VAT' },
  { code: 'gb_vat', name: 'GB VAT', nameEn: 'GB VAT' },
  { code: 'us_ein', name: 'US EIN', nameEn: 'US EIN' },
  { code: 'au_abn', name: 'AU ABN', nameEn: 'AU ABN' },
  { code: 'br_cnpj', name: 'BR CNPJ', nameEn: 'BR CNPJ' },
  { code: 'ca_bn', name: 'CA BN', nameEn: 'CA BN' },
  { code: 'ch_vat', name: 'CH VAT', nameEn: 'CH VAT' },
  { code: 'in_gst', name: 'IN GST', nameEn: 'IN GST' },
  { code: 'jp_cn', name: 'JP Corporate Number', nameEn: 'JP Corporate Number' },
  { code: 'kr_brn', name: 'KR BRN', nameEn: 'KR BRN' },
  { code: 'mx_rfc', name: 'MX RFC', nameEn: 'MX RFC' },
  { code: 'nz_gst', name: 'NZ GST', nameEn: 'NZ GST' },
  { code: 'sg_uen', name: 'SG UEN', nameEn: 'SG UEN' },
  { code: 'za_vat', name: 'ZA VAT', nameEn: 'ZA VAT' },
  { code: 'other', name: 'אחר', nameEn: 'Other' },
];

const LANGUAGES = [
  { code: 'he', name: 'עברית', nameEn: 'Hebrew' }, { code: 'en', name: 'English', nameEn: 'English' },
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

const SYSTEM_ROLE_LABEL_KEYS: Record<UserRole, TranslationKey> = {
  USER:  'u_role_user',
  ADMIN: 'u_role_admin',
  AGENT: 'u_role_agent',
};

const SYSTEM_ROLE_COLORS: Record<UserRole, string> = {
  USER:  'bg-slate-100 text-slate-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  AGENT: 'bg-violet-100 text-violet-700',
};

const ORG_ROLE_LABEL_KEYS: Record<string, TranslationKey> = {
  OWNER:  'u_orgRole_owner',
  ADMIN:  'u_orgRole_admin',
  MEMBER: 'u_orgRole_member',
};

// ─── Helpers ─────────────────────────────────────────────────────

function relativeTime(dateStr: string | undefined, t: (key: TranslationKey) => string, isRTL: boolean): string {
  if (!dateStr) return t('u_never');
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  // Hebrew uses "לפני N units"; English uses "N units ago".
  const fmt = (n: number, unitKey: TranslationKey) =>
    isRTL ? `לפני ${n} ${t(unitKey)}` : `${n} ${t(unitKey)}`;
  if (min < 2)   return t('u_justNow');
  if (min < 60)  return fmt(min, 'u_minutesAgo');
  if (hr  < 24)  return fmt(hr, 'u_hoursAgo');
  if (day < 7)   return fmt(day, 'u_daysAgo');
  if (day < 30)  return fmt(Math.floor(day / 7), 'u_weeksAgo');
  if (day < 365) return fmt(Math.floor(day / 30), 'u_monthsAgo');
  return fmt(Math.floor(day / 365), 'u_yearsAgo');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function mapAdminUser(u: AdminUser, t: (key: TranslationKey) => string, isRTL: boolean): User {
  return {
    id:           u.id,
    name:         u.fullName,
    email:        u.email,
    phone:        u.phone ?? '',
    status:       u.status,
    address:      u.country,
    lastActivity: relativeTime(u.lastLoginAt, t, isRTL),
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
  const { t, isRTL, language } = useLanguage();
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
      setUsers(res.users.map(u => mapAdminUser(u, t, isRTL)));
      setUsersTotal(res.total);
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setIsTableLoading(false);
    }
  }, [filters.searchText, filters.status, currentPage, t, isRTL]);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const handle = setTimeout(() => { loadUsers(); }, filters.searchText ? 400 : 0);
    return () => clearTimeout(handle);
  }, [loadUsers]);


  const activities: Activity[] = [
    {
      id: '1',
      title: t('u_act_purchase'),
      description: t('u_act_purchaseDesc'),
      color: 'bg-emerald-400'
    },
    {
      id: '2',
      title: t('u_act_login'),
      description: t('u_act_loginDesc'),
      color: 'bg-violet-400'
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      inactive: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    };

    const labels: Record<string, string> = {
      active: t('u_status_active'),
      inactive: t('u_status_inactive'),
      pending: t('u_status_pending')
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

    const thEl = e.currentTarget as HTMLTableCellElement;
    const table = thEl.closest('table');
    if (!table) return;

    const headerRow = table.querySelector('thead tr');
    if (!headerRow) return;
    const allThs = Array.from(headerRow.querySelectorAll<HTMLTableCellElement>('th'));
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
      moreTd.textContent = `+${allBodyRows.length - maxRows} ${t('u_more')}`;
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
      label: t('u_col_name'),
      cellClass: 'text-sm font-medium text-slate-900 dark:text-white',
      render: (user) => user.name,
    },
    email: {
      label: t('u_col_email'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.email,
    },
    status: {
      label: t('u_col_status'),
      cellClass: '',
      render: (user) => getStatusBadge(user.status),
    },
    address: {
      label: t('u_col_address'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.address,
    },
    lastActivity: {
      label: t('u_col_lastActivity'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.lastActivity,
    },
    firstJoined: {
      label: t('u_col_firstJoined'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.firstJoined,
    },
    displayName: {
      label: t('u_col_displayName'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.displayName || '—',
    },
    language: {
      label: t('u_col_language'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => {
        if (!user.language) return '—';
        const lang = LANGUAGES.find(l => l.code === user.language);
        if (!lang) return user.language;
        return language === 'he' ? lang.name : lang.nameEn;
      },
    },
    businessName: {
      label: t('u_col_businessName'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.businessName || '—',
    },
    description: {
      label: t('u_col_description'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.description || '—',
    },
    billingEmail: {
      label: t('u_col_billingEmail'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.billingEmail || '—',
    },
    billingAddress: {
      label: t('u_col_billingAddress'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.billingAddress
        ? [user.billingAddress.street, user.billingAddress.city, user.billingAddress.country].filter(Boolean).join(', ')
        : '—',
    },
    billingPhone: {
      label: t('u_col_billingPhone'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: () => '—',
    },
    currency: {
      label: t('u_col_currency'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.currency || '—',
    },
    timezone: {
      label: t('u_col_timezone'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => {
        if (!user.timezone) return '—';
        const tz = TIMEZONES.find(z => z.value === user.timezone);
        if (!tz) return user.timezone;
        return language === 'he' ? tz.label : tz.labelEn;
      },
    },
    taxStatus: {
      label: t('u_col_taxStatus'),
      cellClass: '',
      render: (user) => user.taxStatus ? (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          user.taxStatus === 'taxable' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          user.taxStatus === 'exempt' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
        }`}>
          {user.taxStatus === 'taxable' ? t('u_tax_taxable') : user.taxStatus === 'exempt' ? t('u_tax_exempt') : t('u_tax_reverseCharge')}
        </span>
      ) : <span className="text-slate-400 italic">—</span>,
    },
    shippingAddress: {
      label: t('u_col_shippingAddress'),
      cellClass: 'text-sm text-slate-500 dark:text-slate-400',
      render: (user) => user.shippingAddress
        ? [user.shippingAddress.street, user.shippingAddress.city, user.shippingAddress.country].filter(Boolean).join(', ')
        : '—',
    },
    shippingPhone: {
      label: t('u_col_shippingPhone'),
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
      alert(t('u_alert_excelOnly'));
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
    alert(`${t('u_alert_exportSuccess')} ${usersToExport.length} ${t('u_alert_usersExported')}${sendEmailCopy ? t('u_alert_andEmailed') : ''}.`);

    setIsExporting(false);
    setShowExportModal(false);
    setExportOption('all');
    setSendEmailCopy(false);
  };

  const handleAddCustomField = () => {
    if (!customFieldName.trim()) {
      alert(t('u_alert_enterFieldName'));
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
      alert(t('u_alert_fillNameEmail'));
      return;
    }

    // In a real app, this would add the user to the database as a contact
    console.log('Registering new contact:', { ...manualContactData, userType: 'contact' });
    alert(`${t('u_alert_contactPrefix')} "${manualContactData.name}" ${t('u_alert_contactAdded')}`);

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
      alert(`${t('u_alert_deleteError')}: ${(err as Error).message}`);
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
      const mapped = mapAdminUser(updated, t, isRTL);
      setUsers(prev => prev.map(u => u.id === user.id ? mapped : u));
      setSelectedUser(mapped);
    } catch (err) {
      alert(`${t('u_alert_roleError')}: ${(err as Error).message}`);
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t('u_delete_title')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {t('u_delete_q1')} <span className="font-semibold text-slate-700 dark:text-slate-300">{showDeleteConfirm.name}</span>{t('u_delete_q2')}<br/>
              {t('u_delete_irreversible')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {t('u_cancel')}
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {t('u_delete')}
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
            alert(t('u_alert_importSuccess'));
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
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('u_export_title')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('u_export_subtitle')}</p>
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
                  {t('u_export_whatToExport')}
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
                      <span className="text-base font-medium text-slate-900 dark:text-white block">{t('u_export_all')}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {filteredUsers.length} {t('u_export_allDesc')}
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
                        {t('u_export_selected')}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedIds.length === 0 ? t('u_export_selectedNone') : `${selectedIds.length} ${t('u_export_selectedDesc')}`}
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
                        {t('u_export_emailMe')}
                      </span>
                    </div>
                    <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
                      {t('u_export_emailMeDesc')}
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
                      {t('u_export_includes')}
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
                {t('u_cancel')}
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
                    {t('u_export_exporting')}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded text-sm">file_download</span>
                    {t('u_export_action')}
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
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('u_man_title')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('u_man_subtitle')}</p>
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
                  {t('u_man_fullName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualContactData.name}
                  onChange={(e) => setManualContactData({ ...manualContactData, name: e.target.value })}
                  placeholder={t('u_man_fullName_ph')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  {t('u_man_email')} <span className="text-red-500">*</span>
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
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">{t('u_man_phone')}</label>
                <input
                  type="tel"
                  value={manualContactData.phone}
                  onChange={(e) => setManualContactData({ ...manualContactData, phone: e.target.value })}
                  placeholder="050-1234567"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">{t('u_man_address')}</label>
                <input
                  type="text"
                  value={manualContactData.address}
                  onChange={(e) => setManualContactData({ ...manualContactData, address: e.target.value })}
                  placeholder={t('u_man_address_ph')}
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
                    {t('u_man_accountDetails')}
                  </span>
                  <span className={`material-symbols-rounded text-slate-400 text-base transition-transform ${expandedFormSections.account ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {expandedFormSections.account && (
                  <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_displayName')}</label>
                      <input type="text" value={manualContactData.displayName} onChange={(e) => setManualContactData({ ...manualContactData, displayName: e.target.value })} placeholder={t('u_man_displayName_ph')} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_language')}</label>
                      <select value={manualContactData.language} onChange={(e) => setManualContactData({ ...manualContactData, language: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                        <option value="">{t('u_man_chooseLang')}</option>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{language === 'he' ? l.name : l.nameEn}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_businessName')}</label>
                      <input type="text" value={manualContactData.businessName} onChange={(e) => setManualContactData({ ...manualContactData, businessName: e.target.value })} placeholder={t('u_man_businessName_ph')} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_individualName')}</label>
                      <input type="text" value={manualContactData.individualName} onChange={(e) => setManualContactData({ ...manualContactData, individualName: e.target.value })} placeholder={t('u_man_individualName_ph')} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_description')}</label>
                      <textarea value={manualContactData.description} onChange={(e) => setManualContactData({ ...manualContactData, description: e.target.value })} placeholder={t('u_man_description_ph')} rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all resize-none" />
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
                    {t('u_man_billing')}
                  </span>
                  <span className={`material-symbols-rounded text-slate-400 text-base transition-transform ${expandedFormSections.billing ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {expandedFormSections.billing && (
                  <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_billingEmail')}</label>
                      <input type="email" value={manualContactData.billingEmail} onChange={(e) => setManualContactData({ ...manualContactData, billingEmail: e.target.value })} placeholder="billing@company.com" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_street')}</label>
                        <input type="text" value={manualContactData.billingStreet} onChange={(e) => setManualContactData({ ...manualContactData, billingStreet: e.target.value })} placeholder={t('u_man_street_ph')} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_city')}</label>
                        <input type="text" value={manualContactData.billingCity} onChange={(e) => setManualContactData({ ...manualContactData, billingCity: e.target.value })} placeholder={t('u_man_city_ph')} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_stateProvince')}</label>
                        <input type="text" value={manualContactData.billingState} onChange={(e) => setManualContactData({ ...manualContactData, billingState: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_zip')}</label>
                        <input type="text" value={manualContactData.billingZip} onChange={(e) => setManualContactData({ ...manualContactData, billingZip: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_country')}</label>
                        <select value={manualContactData.billingCountry} onChange={(e) => setManualContactData({ ...manualContactData, billingCountry: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                          <option value="">{t('u_man_chooseCountry')}</option>
                          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{language === 'he' ? c.name : c.nameEn}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_billingPhone')}</label>
                      <input type="tel" value={manualContactData.billingPhone} onChange={(e) => setManualContactData({ ...manualContactData, billingPhone: e.target.value })} placeholder="+972-50-1234567" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_currency')}</label>
                        <select value={manualContactData.currency} onChange={(e) => setManualContactData({ ...manualContactData, currency: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                          <option value="">{t('u_man_chooseCurrency')}</option>
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {language === 'he' ? c.name : c.nameEn} ({c.code})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_timezone')}</label>
                        <select value={manualContactData.timezone} onChange={(e) => setManualContactData({ ...manualContactData, timezone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                          <option value="">{t('u_man_chooseTimezone')}</option>
                          {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{language === 'he' ? tz.label : tz.labelEn}</option>)}
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
                    {t('u_man_taxInfo')}
                  </span>
                  <span className={`material-symbols-rounded text-slate-400 text-base transition-transform ${expandedFormSections.tax ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {expandedFormSections.tax && (
                  <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_taxStatus')}</label>
                      <div className="flex gap-2">
                        {([['taxable', t('u_tax_taxable')], ['exempt', t('u_tax_exempt')], ['reverse_charge', t('u_tax_reverseCharge')]] as const).map(([val, label]) => (
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
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_taxIds')}</label>
                      {manualContactData.taxIds.map((tid, idx) => (
                        <div key={idx} className="grid grid-cols-6 gap-2 mb-2">
                          <div className="col-span-2">
                            <select value={tid.type} onChange={(e) => { const ids = [...manualContactData.taxIds]; ids[idx] = { ...ids[idx], type: e.target.value }; setManualContactData({ ...manualContactData, taxIds: ids }); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                              <option value="">{t('u_man_typeDots')}</option>
                              {TAX_ID_TYPES.map(ti => <option key={ti.code} value={ti.code}>{language === 'he' ? ti.name : ti.nameEn}</option>)}
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
                        {t('u_man_addTaxId')}
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
                    {t('u_man_shipping')}
                  </span>
                  <span className={`material-symbols-rounded text-slate-400 text-base transition-transform ${expandedFormSections.shipping ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {expandedFormSections.shipping && (
                  <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_street')}</label>
                        <input type="text" value={manualContactData.shippingStreet} onChange={(e) => setManualContactData({ ...manualContactData, shippingStreet: e.target.value })} placeholder={t('u_man_street_ph')} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_city')}</label>
                        <input type="text" value={manualContactData.shippingCity} onChange={(e) => setManualContactData({ ...manualContactData, shippingCity: e.target.value })} placeholder={t('u_man_city_ph')} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_stateProvince')}</label>
                        <input type="text" value={manualContactData.shippingState} onChange={(e) => setManualContactData({ ...manualContactData, shippingState: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_zip')}</label>
                        <input type="text" value={manualContactData.shippingZip} onChange={(e) => setManualContactData({ ...manualContactData, shippingZip: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_country')}</label>
                        <select value={manualContactData.shippingCountry} onChange={(e) => setManualContactData({ ...manualContactData, shippingCountry: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all">
                          <option value="">{t('u_man_chooseCountry')}</option>
                          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{language === 'he' ? c.name : c.nameEn}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">{t('u_man_shippingPhone')}</label>
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
                    {t('u_man_disclaimer')}
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
                {t('u_cancel')}
              </button>
              <button
                onClick={handleManualRegistration}
                disabled={!manualContactData.name || !manualContactData.email}
                className="px-6 py-2 bg-[#635bff] hover:bg-[#635bff]/90 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <span className="material-symbols-rounded text-sm">person_add</span>
                {t('u_man_addUser')}
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
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('u_cf_title')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('u_cf_subtitle')}</p>
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
                  {t('u_cf_fieldName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  placeholder={t('u_cf_fieldName_ph')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                />
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  {t('u_cf_fieldType')} <span className="text-red-500">*</span>
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
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{t('u_cf_text')}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('u_cf_textDesc')}</span>
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
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{t('u_cf_number')}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('u_cf_numberDesc')}</span>
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
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{t('u_cf_link')}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('u_cf_linkDesc')}</span>
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
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{t('u_cf_date')}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('u_cf_dateDesc')}</span>
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
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{t('u_cf_dropdown')}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('u_cf_dropdownDesc')}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Info */}
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-2">
                <div className="flex gap-2 items-start">
                  <span className="material-symbols-rounded text-violet-600 dark:text-violet-400 text-base">info</span>
                  <p className="text-xs text-violet-700 dark:text-violet-300 flex-1">
                    {t('u_cf_disclaimer')}
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
                {t('u_cancel')}
              </button>
              <button
                onClick={handleAddCustomField}
                disabled={!customFieldName.trim()}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <span className="material-symbols-rounded text-sm">add</span>
                {t('u_cf_addField')}
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
                    {t('u_imp_giveFeedback')}
                  </button>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{t('u_imp_step1of4')}</span>
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
                  {t('u_imp_title')}
                </h1>
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8">
                  {t('u_imp_desc')}
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
                        <span className="text-violet-600 hover:underline cursor-pointer">{t('u_imp_browseFiles')}</span>{t('u_imp_orDrag')}
                      </p>
                      <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                        {t('u_imp_fileTypes')}
                      </p>
                    </div>
                  ) : (
                    <div className="py-16 md:py-20 flex items-center justify-center gap-3">
                      <span className="material-symbols-rounded text-green-600 text-3xl animate-in zoom-in">check_circle</span>
                      <div className="text-start">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500">{t('u_imp_uploading')}</p>
                      </div>
                    </div>
                  )}
                </label>

                {/* Help Section */}
                <div className="mt-8 md:mt-12">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('u_imp_needHelp')}</h3>
                  <div className="flex flex-col gap-3">
                    <a className="flex items-center gap-2 text-violet-600 hover:underline text-sm font-medium" href="#">
                      {t('u_imp_readLearn')} <span className="text-slate-500 dark:text-slate-400 font-normal">{t('u_imp_readLearn_sub')}</span>
                    </a>
                    <a className="flex items-center gap-2 text-violet-600 hover:underline text-sm font-medium" href="#">
                      {t('u_imp_download')} <span className="text-slate-500 dark:text-slate-400 font-normal">{t('u_imp_download_sub')}</span>
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
                  {t('u_imp_next')}
                </button>
              </div>
            </div>

            {/* Right Side - Animation */}
            <div className="hidden lg:flex w-[42%] bg-slate-50 dark:bg-slate-800 border-e border-slate-200 dark:border-slate-700 flex-col items-center justify-center p-12 overflow-hidden relative">
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
                  <span className="material-symbols-rounded text-teal-500 dark:text-teal-400 mt-2 text-2xl ltr:rotate-180">arrow_back</span>
                </div>
                {/* Nexus Logo */}
                <div className="w-24 h-24 md:w-28 md:h-28 bg-white dark:bg-slate-700 rounded-3xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-600 p-4">
                  <img src={nexusLogo} alt="Nexus" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Description */}
              <div className="mt-16 text-center max-w-[280px] relative z-10">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('u_imp_autoMap')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('u_pageTitle')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('u_pageSubtitle')}</p>
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
            {t('u_tab_contacts')}
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-[#635bff] text-[#635bff]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {t('u_tab_members')}
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
                    <div className="font-semibold mb-1">{t('u_tooltip_member')}</div>
                    <div className="text-slate-300 dark:text-slate-400">
                      {t('u_tooltip_memberDesc')}
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
                      <h2 className="text-xl font-bold">{t('u_filter_title')}</h2>
                      <button
                        onClick={() => setShowFilterPanel(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <span className="material-symbols-rounded">close</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('u_filter_desc')}</p>
                  </div>

                  {/* Filter Content */}
                  <div className="p-6 space-y-6">
                {/* Active Filters Count */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-[#635bff]/10 rounded-lg">
                    <span className="text-sm font-medium text-[#635bff]">{activeFilterCount} {t('u_activeFilters')}</span>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[#635bff] hover:underline font-medium"
                    >
                      {t('u_clearAll')}
                    </button>
                  </div>
                )}

                {/* Search Input */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                    {t('u_filter_freeSearch')}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-rounded absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      value={filters.searchText}
                      onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                      placeholder={t('u_filter_freeSearch_ph')}
                      className="w-full ps-10 pe-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                    {t('u_col_status')}
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
                      <span className="text-sm group-hover:text-[#635bff] transition-colors">{t('u_all')}</span>
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
                        {t('u_active')}
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
                        {t('u_inactive')}
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
                        {t('u_pending')}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                    {t('u_filter_joinDate')}
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('u_fromDate')}</label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('u_toDate')}</label>
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
                      {t('u_customFields')}
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
                              placeholder={`${t('u_searchPlaceholder')} ${field.name}...`}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                            />
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              value={customFieldFilters[field.id] || ''}
                              onChange={(e) => setCustomFieldFilters({ ...customFieldFilters, [field.id]: e.target.value })}
                              placeholder={`${t('u_filterByPlaceholder')} ${field.name}...`}
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
                              <option value="">{t('u_all')}</option>
                              <option value="option1">{t('u_option1')}</option>
                              <option value="option2">{t('u_option2')}</option>
                              <option value="option3">{t('u_option3')}</option>
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
                        {t('u_results')}
                      </div>
                      <div className="text-sm text-slate-900 dark:text-white font-bold">
                        {filteredUsers.length} {t('u_resultsOf')} {users.length}
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
                      <h2 className="text-xl font-bold">{t('u_customize_title')}</h2>
                      <button
                        onClick={() => setShowCustomizePanel(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <span className="material-symbols-rounded">close</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('u_customize_desc')}</p>
                  </div>

                  {/* Column Checkboxes */}
                  <div className="p-6">
                    <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">{t('u_customize_available')}</h3>
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
                            title={frozenColumns.includes(key) ? t('u_customize_unfreezeColumn') : t('u_customize_freezeColumn')}
                          >
                            <span className="material-symbols-rounded !text-[14px]">push_pin</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Fields */}
                  <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">{t('u_customize_customFields')}</h3>

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
                                ({field.type === 'text' && t('u_customize_type_text')}
                                {field.type === 'number' && t('u_customize_type_number')}
                                {field.type === 'link' && t('u_customize_type_link')}
                                {field.type === 'date' && t('u_customize_type_date')}
                                {field.type === 'dropdown' && t('u_customize_type_dropdown')})
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
                              title={t('u_customize_deleteField')}
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
                      {t('u_customize_addCustomField')}
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
                      title={t('u_search')}
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
                        placeholder={t('u_searchUsers')}
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
                  title={t('u_filter')}
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
                    title={t('u_importExport')}
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
                          <span>{t('u_importUsers')}</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowImportExportMenu(false);
                            setShowExportModal(true);
                          }}
                          className="w-full px-4 py-3 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                        >
                          <span className="material-symbols-rounded text-sm text-[#635bff]">file_download</span>
                          <span>{t('u_exportToExcel')}</span>
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
                  title={t('u_customize')}
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
                        {t('u_moreActions')}
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
                            <div className="font-medium">{t('u_manualReg')}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{t('u_manualReg_desc')}</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreActionsMenu(false);
                            alert(t('u_alert_comingSoon'));
                          }}
                          className="w-full px-4 py-3 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                        >
                          <span className="material-symbols-rounded text-sm text-[#635bff]">email</span>
                          <div>
                            <div className="font-medium">{t('u_sendInvite')}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{t('u_sendInvite_desc')}</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{t('u_showing')} {sortedUsers.length} {t('u_resultsOf')} {users.length} {t('u_users')}</span>
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
                                {t('u_sortAsc')}
                              </button>
                              <button onClick={() => { setSortColumn(col); setSortDirection('desc'); setColumnMenuOpen(null); }}
                                className={`w-full px-4 py-2.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 ${sortColumn === col && sortDirection === 'desc' ? 'text-[#635bff] bg-[#635bff]/5' : 'text-slate-700 dark:text-slate-300'}`}>
                                <span className="material-symbols-rounded !text-[16px]">arrow_downward</span>
                                {t('u_sortDesc')}
                              </button>
                              {sortColumn === col && (
                                <button onClick={() => { setSortColumn(null); setColumnMenuOpen(null); }}
                                  className="w-full px-4 py-2.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 text-slate-400">
                                  <span className="material-symbols-rounded !text-[16px]">close</span>
                                  {t('u_removeSort')}
                                </button>
                              )}
                              <div className="border-t border-slate-100 dark:border-slate-700" />
                              <button onClick={() => { setShowFilterPanel(true); setShowCustomizePanel(false); setColumnMenuOpen(null); }}
                                className="w-full px-4 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                                <span className="material-symbols-rounded !text-[16px]">filter_list</span>
                                {t('u_filterCol')}
                              </button>
                              <div className="border-t border-slate-100 dark:border-slate-700" />
                              <button onClick={() => { toggleColumnFreeze(col); setColumnMenuOpen(null); }}
                                className={`w-full px-4 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 ${frozenColumns.includes(col) ? 'text-[#635bff]' : 'text-slate-700 dark:text-slate-300'}`}>
                                <span className="material-symbols-rounded !text-[16px]">push_pin</span>
                                {frozenColumns.includes(col) ? t('u_unfreezeColumn') : t('u_freezeColumn')}
                              </button>
                              <button onClick={() => { toggleColumnVisibility(col as keyof typeof visibleColumns); setColumnMenuOpen(null); }}
                                className="w-full px-4 py-2.5 text-start hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                                <span className="material-symbols-rounded !text-[16px]">visibility_off</span>
                                {t('u_hideColumn')}
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
                          <button onClick={loadUsers} className="ms-auto text-xs underline">{t('u_retry')}</button>
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
                          <p className="text-slate-500 dark:text-slate-400">{t('u_noUsersMatch')}</p>
                          <button onClick={clearFilters} className="text-sm text-[#635bff] hover:underline">{t('u_clearFilter')}</button>
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
                            <div className="absolute start-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
                              {user.userType === 'contact' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConvertToMember(user.id, user.name);
                                  }}
                                  className="w-full px-4 py-2.5 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                                >
                                  <span className="material-symbols-rounded text-sm text-[#635bff]">upgrade</span>
                                  <div>
                                    <div className="font-medium">{t('u_promoteToMember')}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('u_promoteToMember_desc')}</div>
                                  </div>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRowActionMenuId(null);
                                  alert(t('u_alert_comingSoon'));
                                }}
                                className="w-full px-4 py-2.5 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                              >
                                <span className="material-symbols-rounded text-sm text-slate-500">edit</span>
                                <div>
                                  <div className="font-medium">{t('u_editDetails')}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">{t('u_editDetails_desc')}</div>
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRowActionMenuId(null);
                                  if (confirm(`${t('u_confirmDelete_q')} ${user.name}?`)) {
                                    alert(t('u_alert_userDeleted'));
                                  }
                                }}
                                className="w-full px-4 py-2.5 text-start text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-700"
                              >
                                <span className="material-symbols-rounded text-sm text-red-600">delete</span>
                                <div>
                                  <div className="font-medium text-red-600">{t('u_deleteUser')}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">{t('u_deleteUser_desc')}</div>
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
                <span className="text-xs text-slate-400">{usersTotal} {t('u_totalUsers')}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md disabled:opacity-40 transition-colors"
                    title={t('u_previous')}
                  >
                    <span className="material-symbols-rounded !text-[16px] ltr:rotate-180">chevron_right</span>
                  </button>
                  <span className="text-xs text-slate-500">{t('u_pageLabel')} {currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * 50 >= usersTotal}
                    className="w-8 h-8 flex items-center justify-center text-[#635bff] hover:bg-[#635bff]/10 rounded-md disabled:opacity-40 transition-colors"
                    title={t('u_next')}
                  >
                    <span className="material-symbols-rounded !text-[16px] ltr:rotate-180">chevron_left</span>
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
                      {t('u_sendMessage')}
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
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">{t('u_systemRole')}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${SYSTEM_ROLE_COLORS[selectedUser!.systemRole]}`}>
                      {t(SYSTEM_ROLE_LABEL_KEYS[selectedUser!.systemRole])}
                    </span>
                    <select
                      value={selectedUser!.systemRole}
                      disabled={roleChanging}
                      onChange={(e) => handleChangeSystemRole(selectedUser!, e.target.value as UserRole)}
                      className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50"
                    >
                      <option value="USER">{t('u_role_user')}</option>
                      <option value="AGENT">{t('u_role_agent')}</option>
                      <option value="ADMIN">{t('u_role_admin')}</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">{t('u_systemRole_note')}</p>
                </div>

                {/* ── Org Memberships ───────────────────────────── */}
                {selectedUser!.orgs.length > 0 && (
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">{t('u_orgMemberships')}</p>
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
                            {ORG_ROLE_LABEL_KEYS[m.role] ? t(ORG_ROLE_LABEL_KEYS[m.role]) : m.role}
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
                    {t('u_delete_title')}
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
                      <span>{t('u_purchaseStatus')}</span>
                      <span className="material-symbols-rounded text-slate-400">
                        {expandedSection === 'purchases' ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {expandedSection === 'purchases' && (
                      <div className="pb-4 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between mb-2">
                            <span className="text-xs text-slate-500">{t('u_totalPurchases')}</span>
                            <span className="text-xs font-bold">₪4,250</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-2/3"></div>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2">6 {t('u_completedYear')}</p>
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
                      <span>{t('u_contactInfo')}</span>
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
                      <span>{t('u_notes')}</span>
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
                      <span>{t('u_tasks')}</span>
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
                      <span>{t('u_targetGroups')}</span>
                      <span className="material-symbols-rounded text-slate-400">
                        {expandedSection === 'groups' ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-[#e3e8ee] dark:border-slate-700 p-6">
                <h3 className="font-semibold text-sm mb-4">{t('u_recentActivity')}</h3>
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
