/**
 * Filter shape + helpers for the BenefitsPartnerships catalog page.
 *
 * Lives in its own file so CatalogFilterPanel.tsx can be a pure component
 * module (required by Vite Fast Refresh - mixed component + value exports
 * disable hot-reload for the file).
 */

/**
 * Filter state shared between the catalog page, the top bar, and the
 * slide-in filter panel. Empty strings / null / empty arrays mean
 * "no constraint" so the active filter count is a simple count of
 * non-empty fields.
 *
 * Fields that map directly to backend query params:
 *   search, category, approvalStatus, adoptionStatus, offerTypes,
 *   priceMin, priceMax, validFromAfter, validUntilBefore, tags,
 *   inStockOnly, sort.
 */
export interface CatalogFilters {
  search: string;
  category: string; // '' = All
  approvalStatus: '' | 'active' | 'pending_approval' | 'denied' | 'expired';
  adoptionStatus: '' | 'adopted' | 'not_adopted';

  /** Offer execution types to include (e.g. ['voucher', 'direct']). Empty = all. */
  offerTypes: string[];
  /** Minimum selling price in base currency units. null = no lower bound. */
  priceMin: number | null;
  /** Maximum selling price in base currency units. null = no upper bound. */
  priceMax: number | null;
  /** ISO date string YYYY-MM-DD - include only offers valid from this date. '' = unset. */
  validFromAfter: string;
  /** ISO date string YYYY-MM-DD - include only offers valid before this date. '' = unset. */
  validUntilBefore: string;
  /** Tag slugs to filter by (AND logic on backend). Empty = no tag constraint. */
  tags: string[];
  /** When true, only return offers that have inventory remaining. */
  inStockOnly: boolean;
  /** Result ordering sent to the backend. Defaults to newest first. */
  sort: 'newest' | 'price_asc' | 'price_desc' | 'expiry_soon' | 'expiry_far';
}

/** Initial / cleared state for the catalog filter form. */
export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  search: '',
  category: '',
  approvalStatus: '',
  adoptionStatus: '',
  offerTypes: [],
  priceMin: null,
  priceMax: null,
  validFromAfter: '',
  validUntilBefore: '',
  tags: [],
  inStockOnly: false,
  sort: 'newest',
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
  if (filters.offerTypes.length > 0) n += 1;
  if (filters.priceMin !== null) n += 1;
  if (filters.priceMax !== null) n += 1;
  if (filters.validFromAfter !== '') n += 1;
  if (filters.validUntilBefore !== '') n += 1;
  if (filters.tags.length > 0) n += 1;
  if (filters.inStockOnly) n += 1;
  // sort is not counted as an active constraint - it is always set to a value
  return n;
}
