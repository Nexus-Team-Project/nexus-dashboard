/**
 * Members page — two tabs: Contacts (tenant address book) and Registered Members
 * (people who accepted a tenant invitation). Design mirrors main-branch Users.tsx.
 * Contacts use the new /api/v1/tenant/contacts API.
 * Registered Members use the existing /api/v1/tenant/members API.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  tenantContactsApi,
  tenantMembersApi,
  type TenantContact,
  type TenantMemberListItem,
  type TenantRole,
  type PaginationMeta,
  type ListContactsParams,
  type ListMembersParams,
} from '../lib/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { parseCsv } from '../lib/csvParser';
import ColumnMapping, { type ResolvedContactRow } from '../components/ColumnMapping';
import ContactsTable from '../components/members/ContactsTable';
import RegisteredTable from '../components/members/RegisteredTable';
import FilterPanel from '../components/members/FilterPanel';
import AddContactModal from '../components/members/AddContactModal';
import EditEmailModal from '../components/members/EditEmailModal';
import EditRolesModal from '../components/members/EditRolesModal';
import ConfirmRemoveModal from '../components/members/ConfirmRemoveModal';

type ActiveTab = 'contacts' | 'members';

const COPY = {
  he: {
    title: 'חברים',
    subtitle: (name: string) => `נהל אנשי קשר ואת חברי ${name} הרשומים.`,
    workspaceFallback: 'סביבת העבודה',
    tabContacts: 'אנשי קשר',
    tabMembers: 'חברים רשומים',
    membersTooltip: 'אנשים שקיבלו הזמנה והצטרפו לסביבת העבודה.',
    search: 'חפש...',
    filter: 'מסננים',
    importCsv: 'ייבא CSV',
    exportCsv: 'ייצא CSV',
    inviteMembers: 'הזמן חברים',
    showing: 'מציג',
    of: 'מתוך',
    contacts: 'אנשי קשר',
    members: 'חברים',
    prevPage: 'הקודם',
    nextPage: 'הבא',
    pageOf: (p: number, t: number) => `עמוד ${p} מתוך ${t}`,
    importSuccess: (n: number) => `יובאו ${n} אנשי קשר`,
    importFailed: 'הייבוא נכשל',
  },
  en: {
    title: 'Members',
    subtitle: (name: string) => `Manage contacts and registered members of ${name}.`,
    workspaceFallback: 'your workspace',
    tabContacts: 'Contacts',
    tabMembers: 'Registered Members',
    membersTooltip: 'People who have accepted a tenant invitation and joined the workspace.',
    search: 'Search...',
    filter: 'Filters',
    importCsv: 'Import CSV',
    exportCsv: 'Export CSV',
    inviteMembers: 'Invite members',
    showing: 'Showing',
    of: 'of',
    contacts: 'contacts',
    members: 'members',
    prevPage: 'Prev',
    nextPage: 'Next',
    pageOf: (p: number, t: number) => `Page ${p} of ${t}`,
    importSuccess: (n: number) => `${n} contacts imported`,
    importFailed: 'Import failed',
  },
} as const;

const PAGE_SIZE = 25;

/**
 * Downloads the given rows as a CSV file to the user's device.
 * Input: array of objects and a filename (without extension).
 * Output: browser file download triggered.
 */
function exportToCsv(rows: Record<string, string | null | undefined>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = r[h] ?? '';
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(','),
    ),
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Toolbar icon button with a hover tooltip label, matching main-branch design.
 * Input: icon name, tooltip text, click handler, active state, and badge count.
 * Output: icon button with an absolute dark tooltip shown on hover.
 */
function TooltipButton({
  icon,
  label,
  onClick,
  active = false,
  badge,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors ${
          active ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'
        }`}
      >
        <span className="material-icons text-[16px]">{icon}</span>
      </button>
      {badge !== undefined && badge > 0 && !active && (
        <span className="pointer-events-none absolute -end-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-primary bg-white text-[10px] font-bold text-primary">
          {badge}
        </span>
      )}
      {visible && (
        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2">
          <div className="whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white shadow-md dark:bg-slate-700">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Full Members page with Contacts and Registered Members tabs.
 * Input: none — reads tenant auth context from AuthContext.
 * Output: tabbed member management page backed by Nexus domain APIs.
 */
export default function Members() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { me, user, reloadMe } = useAuth();
  const copy = COPY[language];

  const canViewMembers = me?.authorization.canViewMembers === true || me?.authorization.canManageMembers === true;
  const canManage = me?.authorization.canManageMembers === true;
  const isAtSeatLimit = me?.context.seats?.isAtLimit === true;

  // Redirect unauthorized users — must be a useEffect so it runs after all hooks.
  useEffect(() => {
    if (me !== undefined && !canViewMembers) navigate('/', { replace: true });
  }, [canViewMembers, me, navigate]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('contacts');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showMemberTooltip, setShowMemberTooltip] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editEmailContact, setEditEmailContact] = useState<TenantContact | null>(null);
  const [editEmailMember, setEditEmailMember] = useState<TenantMemberListItem | null>(null);
  const [editRolesMember, setEditRolesMember] = useState<TenantMemberListItem | null>(null);
  const [removeContact, setRemoveContact] = useState<TenantContact | null>(null);
  const [removeMember, setRemoveMember] = useState<TenantMemberListItem | null>(null);

  // Contacts state
  const [contacts, setContacts] = useState<TenantContact[]>([]);
  const [contactsPagination, setContactsPagination] = useState<PaginationMeta | null>(null);
  const [contactsParams, setContactsParams] = useState<ListContactsParams>({ page: 1, limit: PAGE_SIZE });
  const [contactsLoading, setContactsLoading] = useState(true);

  // Registered members state
  const [members, setMembers] = useState<TenantMemberListItem[]>([]);
  const [membersPagination, setMembersPagination] = useState<PaginationMeta | null>(null);
  const [membersParams, setMembersParams] = useState<ListMembersParams>({ page: 1, limit: PAGE_SIZE });
  const [membersLoading, setMembersLoading] = useState(false);

  const [invitingInactive, setInvitingInactive] = useState(false);

  // CSV import state
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contactsFetchRef = useRef(0);
  const membersFetchRef = useRef(0);

  /** Fetches the paged contacts list. */
  const fetchContacts = useCallback(async (params: ListContactsParams) => {
    contactsFetchRef.current += 1;
    const gen = contactsFetchRef.current;
    setContactsLoading(true);
    try {
      const result = await tenantContactsApi.list(params);
      if (gen !== contactsFetchRef.current) return;
      setContacts(result.contacts);
      setContactsPagination(result.pagination);
    } catch {
      if (gen === contactsFetchRef.current) setContacts([]);
    } finally {
      if (gen === contactsFetchRef.current) setContactsLoading(false);
    }
  }, []);

  /** Fetches the paged registered members list. */
  const fetchMembers = useCallback(async (params: ListMembersParams) => {
    membersFetchRef.current += 1;
    const gen = membersFetchRef.current;
    setMembersLoading(true);
    try {
      const result = await tenantMembersApi.list(params);
      if (gen !== membersFetchRef.current) return;
      setMembers(result.members);
      setMembersPagination(result.pagination);
    } catch {
      if (gen === membersFetchRef.current) setMembers([]);
    } finally {
      if (gen === membersFetchRef.current) setMembersLoading(false);
    }
  }, []);

  useEffect(() => { void fetchContacts(contactsParams); }, [contactsParams, fetchContacts]);
  useEffect(() => { if (activeTab === 'members') void fetchMembers(membersParams); }, [activeTab, membersParams, fetchMembers]);

  /** Updates a contacts filter param and resets to page 1. */
  const updateContactsFilter = (key: keyof ListContactsParams, value: string) => {
    setContactsParams((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: key !== 'page' ? 1 : (value ? Number(value) : 1),
    }));
  };

  /** Updates a members filter param and resets to page 1. */
  const updateMembersFilter = (key: keyof ListMembersParams, value: string) => {
    setMembersParams((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: key !== 'page' ? 1 : (value ? Number(value) : 1),
    }));
  };

  const clearFilters = () => {
    setContactsParams({ page: 1, limit: PAGE_SIZE });
    setMembersParams({ page: 1, limit: PAGE_SIZE });
  };

  const activeFilterCount = [
    contactsParams.search, contactsParams.status,
    membersParams.search, membersParams.status, membersParams.role,
  ].filter(Boolean).length;

  /**
   * Paginates through all inactive contacts, stores their emails in sessionStorage,
   * then navigates to the invite page so InviteCollaborators pre-populates the rows.
   */
  const handleInviteInactive = async () => {
    setInvitingInactive(true);
    try {
      const emails: string[] = [];
      let page = 1;
      while (true) {
        const result = await tenantContactsApi.list({ status: 'inactive', limit: 100, page });
        result.contacts.forEach((c) => { if (c.email) emails.push(c.email); });
        if (page >= (result.pagination?.pages ?? 1)) break;
        page++;
      }
      if (emails.length > 0) {
        sessionStorage.setItem('pendingInviteEmails', JSON.stringify(emails));
      }
      navigate('/settings/roles-permissions/invite');
    } finally {
      setInvitingInactive(false);
    }
  };

  /** Handles CSV file selection and opens the column-mapping modal. */
  const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.headers.length === 0) { toast.error('Empty or invalid CSV file'); return; }
    setCsvFileName(file.name);
    setCsvData({ headers: parsed.headers, rows: parsed.rows });
  };

  /** Called by ColumnMapping on confirm — posts resolved rows to the contacts API. */
  const handleImport = async (rows: ResolvedContactRow[]) => {
    try {
      const result = await tenantContactsApi.importContacts(rows);
      toast.success(copy.importSuccess(result.imported));
      setCsvData(null);
      void fetchContacts({ ...contactsParams, page: 1 });
    } catch (err) {
      toast.error(copy.importFailed, { description: err instanceof Error ? err.message : undefined });
    }
  };

  /** Exports current tab's visible data to CSV. */
  const handleExport = () => {
    if (activeTab === 'contacts') {
      exportToCsv(
        contacts.map((c) => ({ Name: c.displayName, Email: c.email, Status: c.status, Address: c.address ?? '', 'Last Activity': c.lastActivityAt ?? '', 'First Entry': c.createdAt })),
        'contacts',
      );
    } else {
      exportToCsv(
        members.map((m) => ({ Name: m.displayName ?? '', Email: m.email, Roles: m.roles.join(', '), Status: m.status, Invitation: m.invitationStatus ?? '', Joined: m.joinedAt })),
        'registered-members',
      );
    }
    setShowImportMenu(false);
  };

  // Return null while the auth context loads or redirect is pending.
  if (!canViewMembers) return null;

  const pagination = activeTab === 'contacts' ? contactsPagination : membersPagination;
  const currentPage = activeTab === 'contacts' ? (contactsParams.page ?? 1) : (membersParams.page ?? 1);
  const totalPages = pagination?.pages ?? 1;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl">
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{copy.title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {copy.subtitle(me?.context.tenantName ?? copy.workspaceFallback)}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`-mb-px border-b-2 px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'contacts'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-md dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {copy.tabContacts}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'members'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-md dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {copy.tabMembers}
            {/* Info tooltip */}
            <div
              className="relative"
              onMouseEnter={() => setShowMemberTooltip(true)}
              onMouseLeave={() => setShowMemberTooltip(false)}
            >
              <span className="material-icons cursor-help text-[14px] text-slate-400 hover:text-slate-600 transition-colors">info</span>
              {showMemberTooltip && (
                <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 animate-in fade-in zoom-in duration-200">
                  <div className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-white shadow-xl dark:border-slate-600 dark:bg-slate-800">
                    <div className="font-semibold mb-1">{copy.tabMembers}</div>
                    <div className="text-slate-300 dark:text-slate-400">{copy.membersTooltip}</div>
                    <div className="absolute left-1/2 top-full -mt-px -translate-x-1/2">
                      <div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Table + optional filter panel layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {showFilterPanel && (
          <FilterPanel
            activeTab={activeTab}
            language={language}
            contactsParams={contactsParams}
            membersParams={membersParams}
            activeFilterCount={activeFilterCount}
            onContactsFilter={updateContactsFilter}
            onMembersFilter={updateMembersFilter}
            onClearFilters={clearFilters}
            onClose={() => setShowFilterPanel(false)}
          />
        )}

        {/* Main card */}
        <div className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {/* Filter toggle */}
              <TooltipButton
                icon="filter_list"
                label={copy.filter}
                onClick={() => setShowFilterPanel((v) => !v)}
                active={showFilterPanel || activeFilterCount > 0}
                badge={activeFilterCount}
              />

              {/* Add contact button — contacts tab only */}
              {activeTab === 'contacts' && canManage && (
                <TooltipButton
                  icon="person_add_alt"
                  label={language === 'he' ? 'הוסף איש קשר' : 'Add contact'}
                  onClick={() => setShowAddContact(true)}
                />
              )}

              {/* Import / Export dropdown */}
              <div className="relative">
                <TooltipButton
                  icon="swap_vert"
                  label={`${copy.importCsv} / ${copy.exportCsv}`}
                  onClick={() => setShowImportMenu((v) => !v)}
                  active={showImportMenu}
                />
                {showImportMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowImportMenu(false)} aria-hidden="true" />
                    <div className="absolute start-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                      {activeTab === 'contacts' && canManage && (
                        <button
                          type="button"
                          onClick={() => { setShowImportMenu(false); fileInputRef.current?.click(); }}
                          className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <span className="material-icons text-sm text-primary">file_upload</span>
                          <div>
                            <div className="font-medium">{copy.importCsv}</div>
                          </div>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleExport}
                        className="flex w-full cursor-pointer items-center gap-3 border-t border-slate-100 px-4 py-3 text-start text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
                      >
                        <span className="material-icons text-sm text-primary">file_download</span>
                        <div>
                          <div className="font-medium">{copy.exportCsv}</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: results count + invite button */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {copy.showing} {pagination?.total ?? 0} {activeTab === 'contacts' ? copy.contacts : copy.members}
              </span>
              {canManage && activeTab === 'contacts' && (
                <button
                  type="button"
                  onClick={() => void handleInviteInactive()}
                  disabled={invitingInactive}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-icons text-sm">{invitingInactive ? 'hourglass_empty' : 'person_add'}</span>
                  {copy.inviteMembers}
                </button>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3 dark:border-slate-800">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() =>
                  activeTab === 'contacts'
                    ? updateContactsFilter('page', String(currentPage - 1))
                    : updateMembersFilter('page', String(currentPage - 1))
                }
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span className="material-icons text-lg">{isRTL ? 'chevron_right' : 'chevron_left'}</span>
                {copy.prevPage}
              </button>
              <span className="text-sm text-slate-500">{copy.pageOf(currentPage, totalPages)}</span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  activeTab === 'contacts'
                    ? updateContactsFilter('page', String(currentPage + 1))
                    : updateMembersFilter('page', String(currentPage + 1))
                }
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {copy.nextPage}
                <span className="material-icons text-lg">{isRTL ? 'chevron_left' : 'chevron_right'}</span>
              </button>
            </div>
          )}

          {/* Tab content */}
          {activeTab === 'contacts' ? (
            <ContactsTable
              contacts={contacts}
              loading={contactsLoading}
              language={language}
              canManage={canManage}
              tenantName={me?.context.tenantName ?? undefined}
              onEditEmail={canManage ? (c) => setEditEmailContact(c) : undefined}
              onRemove={canManage ? (c) => setRemoveContact(c) : undefined}
            />
          ) : (
            <RegisteredTable
              members={members}
              loading={membersLoading}
              language={language}
              canManage={canManage}
              currentUserEmail={user?.email ?? ''}
              onEditEmail={canManage ? (m) => setEditEmailMember(m) : undefined}
              onEditRoles={canManage ? (m) => setEditRolesMember(m) : undefined}
              onRemove={canManage ? (m) => setRemoveMember(m) : undefined}
            />
          )}
        </div>
      </div>

      {/* Add contact modal */}
      {showAddContact && (
        <AddContactModal
          language={language}
          onClose={() => setShowAddContact(false)}
          onCreated={() => void fetchContacts(contactsParams)}
        />
      )}

      {/* Edit email — contact */}
      {editEmailContact && (
        <EditEmailModal
          language={language}
          currentEmail={editEmailContact.email}
          wasInvited={editEmailContact.status === 'pending' || editEmailContact.status === 'expired'}
          onClose={() => setEditEmailContact(null)}
          onSubmit={async (email) => {
            await tenantContactsApi.updateEmail(editEmailContact.tenantContactId, email);
            setEditEmailContact(null);
            toast.success(language === 'he' ? 'האימייל עודכן' : 'Email updated');
            void fetchContacts(contactsParams);
            void fetchMembers(membersParams);
          }}
        />
      )}

      {/* Edit email — member */}
      {editEmailMember && (
        <EditEmailModal
          language={language}
          currentEmail={editEmailMember.email}
          wasInvited={true}
          onClose={() => setEditEmailMember(null)}
          onSubmit={async (email) => {
            await tenantMembersApi.updateEmail(editEmailMember.tenantMemberId, email);
            setEditEmailMember(null);
            toast.success(language === 'he' ? 'האימייל עודכן וההזמנה נשלחה מחדש' : 'Email updated and new invite sent');
            void fetchMembers(membersParams);
            void fetchContacts(contactsParams);
          }}
        />
      )}

      {/* Edit roles — member */}
      {editRolesMember && (
        <EditRolesModal
          language={language}
          currentRoles={editRolesMember.roles as TenantRole[]}
          isAtSeatLimit={isAtSeatLimit}
          onClose={() => setEditRolesMember(null)}
          onSubmit={async (roles) => {
            await tenantMembersApi.updateRoles(editRolesMember.tenantMemberId, roles);
            setEditRolesMember(null);
            toast.success(language === 'he' ? 'התפקידים עודכנו' : 'Roles updated');
            void fetchMembers(membersParams);
          }}
        />
      )}

      {/* Confirm remove — contact */}
      {removeContact && (
        <ConfirmRemoveModal
          language={language}
          tenantName={me?.context.tenantName ?? ''}
          displayName={removeContact.displayName}
          email={removeContact.email}
          willSendEmail={removeContact.status === 'pending' || removeContact.status === 'expired'}
          onClose={() => setRemoveContact(null)}
          onConfirm={async () => {
            await tenantContactsApi.remove(removeContact.tenantContactId);
            setRemoveContact(null);
            toast.success(language === 'he' ? 'איש הקשר הוסר' : 'Contact removed');
            void fetchContacts(contactsParams);
          }}
        />
      )}

      {/* Confirm remove — member */}
      {removeMember && (
        <ConfirmRemoveModal
          language={language}
          tenantName={me?.context.tenantName ?? ''}
          displayName={removeMember.displayName ?? ''}
          email={removeMember.email}
          willSendEmail={true}
          onClose={() => setRemoveMember(null)}
          onConfirm={async () => {
            await tenantMembersApi.remove(removeMember.tenantMemberId);
            setRemoveMember(null);
            toast.success(language === 'he' ? 'החבר הוסר' : 'Member removed');
            void fetchMembers(membersParams);
            void fetchContacts(contactsParams);
            void reloadMe();
          }}
        />
      )}

      {/* Hidden CSV file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => void handleCsvFile(e)}
        className="sr-only"
        aria-hidden="true"
      />

      {/* CSV column-mapping modal */}
      {csvData && (
        <ColumnMapping
          fileName={csvFileName}
          csvHeaders={csvData.headers}
          csvRows={csvData.rows}
          onImport={handleImport}
          onClose={() => setCsvData(null)}
        />
      )}
    </div>
  );
}
