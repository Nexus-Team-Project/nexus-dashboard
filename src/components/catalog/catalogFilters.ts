/**
 * Filter shape + helpers for the BenefitsPartnerships catalog page.
 *
 * Lives in its own file so CatalogFilterPanel.tsx can be a pure component
 * module (required by Vite Fast Refresh - mixed component + value exports
 * disable hot-reload for the file).
 */

/**
 * Filter state shared between the catalog page, the top bar, and the
 * slide-in filter panel. Empty strings mean "no constraint" so the active
 * filter count is a simple count of non-empty fields.
 */
export interface CatalogFilters {
  search: string;
  category: string; // '' = All
  approvalStatus: '' | 'active' | 'pending_approval' | 'denied' | 'expired';
  adoptionStatus: '' | 'adopted' | 'not_adopted';
}

/** Initial / cleared state for the catalog filter form. */
export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  search: '',
  category: '',
  approvalStatus: '',
  adoptionStatus: '',
};

/**
 * Returns the number of constraints currently active in a CatalogFilters object.
 * Used to render the badge on the top bar's filter icon.
 *
 * Input:  filters - current CatalogFilters state.
 * Output: integer count of non-empty fields. search uses a trim so a string of
 *         whitespace does not count as an active constraint.
 */
export function countActiveCatalogFilters(filters: CatalogFilters): number {
  let n = 0;
  if (filters.search.trim() !== '') n += 1;
  if (filters.category !== '') n += 1;
  if (filters.approvalStatus !== '') n += 1;
  if (filters.adoptionStatus !== '') n += 1;
  return n;
}
