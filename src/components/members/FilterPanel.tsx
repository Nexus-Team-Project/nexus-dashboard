/**
 * Slide-in filter panel for the Members page.
 * Renders different filter fields depending on the active tab (contacts vs members).
 * Matches the main-branch Users.tsx filter panel layout exactly.
 */
import type { ListContactsParams, ListMembersParams, ContactField, ContactCustomFilter } from '../../lib/api';
import { TENANT_ROLE_ORDER } from '../../lib/tenantRoles';
import { getTenantRoleLabel } from '../../lib/tenantRoles';

interface FilterPanelProps {
  activeTab: 'contacts' | 'members';
  language: 'he' | 'en';
  contactsParams: ListContactsParams;
  membersParams: ListMembersParams;
  /** Tenant custom columns, rendered as type-aware filter controls. */
  contactFields: ContactField[];
  activeFilterCount: number;
  onContactsFilter: (key: keyof ListContactsParams, value: string) => void;
  /** Add/replace/remove a single custom-column filter. */
  onContactsCustomFilter: (fieldId: string, op: ContactCustomFilter['op'], value: unknown) => void;
  onMembersFilter: (key: keyof ListMembersParams, value: string) => void;
  onClearFilters: () => void;
  onClose: () => void;
}

const COPY = {
  he: {
    filters: 'מסננים',
    filtersDesc: 'צמצם את רשימת התוצאות',
    close: 'סגור',
    activeFilters: 'מסננים פעילים',
    clearAll: 'נקה הכל',
    search: 'חיפוש חופשי',
    searchPh: 'חפש לפי שם או אימייל',
    status: 'סטטוס',
    role: 'תפקיד',
    allStatuses: 'כל הסטטוסים',
    allRoles: 'כל התפקידים',
    customTitle: 'עמודות מותאמות',
    containsPh: 'מכיל...',
    min: 'מינ׳',
    max: 'מקס׳',
    from: 'מתאריך',
    to: 'עד תאריך',
  },
  en: {
    filters: 'Filters',
    filtersDesc: 'Narrow down the result list',
    close: 'Close',
    activeFilters: 'active filters',
    clearAll: 'Clear all',
    search: 'Free search',
    searchPh: 'Search by name or email',
    status: 'Status',
    role: 'Role',
    allStatuses: 'All statuses',
    allRoles: 'All roles',
    customTitle: 'Custom columns',
    containsPh: 'Contains...',
    min: 'Min',
    max: 'Max',
    from: 'From',
    to: 'To',
  },
} as const;

/**
 * Renders the filter side panel.
 * Input: current filter state, callbacks to update filters and close.
 * Output: sticky filter card with search, status, and role fields.
 */
export default function FilterPanel({
  activeTab,
  language,
  contactsParams,
  membersParams,
  contactFields,
  activeFilterCount,
  onContactsFilter,
  onContactsCustomFilter,
  onMembersFilter,
  onClearFilters,
  onClose,
}: FilterPanelProps) {
  const copy = COPY[language];

  const fieldInput =
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800';

  // Current value of a custom-column filter (undefined when not set).
  const customValueFor = (fieldId: string): unknown =>
    (contactsParams.customFilters ?? []).find((f) => f.fieldId === fieldId)?.value;

  /** Type-aware filter control for one custom column. */
  const renderCustomControl = (field: ContactField): React.ReactNode => {
    if (field.type === 'number') {
      const v = (customValueFor(field.fieldId) as { min?: string; max?: string }) ?? {};
      return (
        <div className="flex gap-2">
          <input type="number" value={v.min ?? ''} placeholder={copy.min} onWheel={(e) => e.currentTarget.blur()}
            onChange={(e) => onContactsCustomFilter(field.fieldId, 'range', { ...v, min: e.target.value })} className={fieldInput} />
          <input type="number" value={v.max ?? ''} placeholder={copy.max} onWheel={(e) => e.currentTarget.blur()}
            onChange={(e) => onContactsCustomFilter(field.fieldId, 'range', { ...v, max: e.target.value })} className={fieldInput} />
        </div>
      );
    }
    if (field.type === 'date') {
      const v = (customValueFor(field.fieldId) as { from?: string; to?: string }) ?? {};
      return (
        <div className="flex gap-2">
          <input type="date" value={v.from ?? ''} aria-label={copy.from}
            onChange={(e) => onContactsCustomFilter(field.fieldId, 'range', { ...v, from: e.target.value })} className={fieldInput} />
          <input type="date" value={v.to ?? ''} aria-label={copy.to}
            onChange={(e) => onContactsCustomFilter(field.fieldId, 'range', { ...v, to: e.target.value })} className={fieldInput} />
        </div>
      );
    }
    if (field.type === 'single_label' || field.type === 'multi_label') {
      const sel = (customValueFor(field.fieldId) as string[]) ?? [];
      const toggle = (o: string) =>
        onContactsCustomFilter(field.fieldId, 'in', sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]);
      return (
        <div className="flex flex-wrap gap-1.5">
          {(field.options ?? []).map((o) => {
            const on = sel.includes(o);
            return (
              <button key={o} type="button" onClick={() => toggle(o)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${on ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
                {o}
              </button>
            );
          })}
        </div>
      );
    }
    // free_text + location
    return (
      <input type="text" value={String(customValueFor(field.fieldId) ?? '')} placeholder={copy.containsPh} dir="auto"
        onChange={(e) => onContactsCustomFilter(field.fieldId, 'contains', e.target.value)} className={fieldInput} />
    );
  };

  return (
    <aside className="w-full lg:w-[320px] shrink-0 animate-in slide-in-from-right duration-200">
      <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{copy.filters}</h2>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={copy.close}
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{copy.filtersDesc}</p>
        </div>

        {/* Content */}
        <div className="space-y-5 p-5">
          {/* Active filters summary */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
              <span className="text-sm font-medium text-primary">{activeFilterCount} {copy.activeFilters}</span>
              <button
                type="button"
                onClick={onClearFilters}
                className="cursor-pointer text-xs font-medium text-primary hover:underline"
              >
                {copy.clearAll}
              </button>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.search}
            </label>
            <div className="relative">
              <span className="material-icons absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={activeTab === 'contacts' ? (contactsParams.search ?? '') : (membersParams.search ?? '')}
                onChange={(e) =>
                  activeTab === 'contacts'
                    ? onContactsFilter('search', e.target.value)
                    : onMembersFilter('search', e.target.value)
                }
                placeholder={copy.searchPh}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 ps-10 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.status}
            </label>
            <select
              value={activeTab === 'contacts' ? (contactsParams.status ?? '') : (membersParams.status ?? '')}
              onChange={(e) =>
                activeTab === 'contacts'
                  ? onContactsFilter('status', e.target.value)
                  : onMembersFilter('status', e.target.value)
              }
              className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 py-3 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">{copy.allStatuses}</option>
              {activeTab === 'contacts' ? (
                <>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </>
              ) : (
                <>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deactivated">Deactivated</option>
                </>
              )}
            </select>
          </div>

          {/* Custom columns — contacts tab only */}
          {activeTab === 'contacts' && contactFields.length > 0 && (
            <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{copy.customTitle}</p>
              {contactFields.map((field) => (
                <div key={field.fieldId}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300" dir="auto">
                    {field.name}
                  </label>
                  {renderCustomControl(field)}
                </div>
              ))}
            </div>
          )}

          {/* Role — members tab only */}
          {activeTab === 'members' && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {copy.role}
              </label>
              <select
                value={membersParams.role ?? ''}
                onChange={(e) => onMembersFilter('role', e.target.value)}
                className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 py-3 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">{copy.allRoles}</option>
                {TENANT_ROLE_ORDER.map((role) => (
                  <option key={role} value={role}>{getTenantRoleLabel(role, language)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
