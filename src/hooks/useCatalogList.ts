/**
 * useCatalogList - owns filter + page state for any paginated catalog view.
 *
 * Pattern:
 *   1. Caller supplies a fetcher of shape (CatalogQuery) => Promise<CatalogPage>.
 *      That is `getPlatformOffers` for admins and `getMemberCatalog(tenantId, ...)`
 *      bound to a tenant for members.
 *   2. The hook owns `filters` (CatalogFilters) and `page` (number).
 *   3. Search input is debounced 250ms so a fast typist does not trigger one
 *      request per keystroke. Other filter chips fire immediately.
 *   4. A monotonically increasing requestId guards against race conditions when
 *      a slow request would otherwise overwrite a newer one's result.
 *   5. Changing any filter resets `page` to 1.
 *
 * Returns:
 *   - filters / setFilters / resetFilters
 *   - page / setPage
 *   - items / total / pages
 *   - isLoading / error
 *   - refresh()  - re-fetch the current page without changing state
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItem, CatalogPage, CatalogQuery } from '../lib/api';
import {
  EMPTY_CATALOG_FILTERS,
  type CatalogFilters,
} from '../components/catalog/catalogFilters';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Debounce window for the search input, in milliseconds. */
const SEARCH_DEBOUNCE_MS = 250;

/** Default page size when the caller does not override. Matches the backend cap floor. */
const DEFAULT_PAGE_SIZE = 25;

// ─── Public contract ──────────────────────────────────────────────────────────

interface UseCatalogListOpts {
  /** Bound fetcher - takes a CatalogQuery, returns a CatalogPage. */
  fetcher: (query: CatalogQuery) => Promise<CatalogPage>;
  /** Optional initial filter overrides. Useful for deep links or member view defaults. */
  initialFilters?: Partial<CatalogFilters>;
  /** Override the default 25-per-page size. Should not exceed the backend cap (100). */
  pageSize?: number;
}

interface UseCatalogListResult {
  filters: CatalogFilters;
  setFilters: (next: CatalogFilters) => void;
  resetFilters: () => void;
  page: number;
  setPage: (next: number) => void;
  items: CatalogItem[];
  total: number;
  pages: number;
  isLoading: boolean;
  /** Last error message from the fetcher, or null. Cleared on the next successful fetch. */
  error: string | null;
  /** Re-fetch the current page without changing state. Useful after a mutation. */
  refresh: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * State + effect controller for any paginated catalog list.
 * See file header for the full contract.
 */
export function useCatalogList(opts: UseCatalogListOpts): UseCatalogListResult {
  const { fetcher, initialFilters, pageSize = DEFAULT_PAGE_SIZE } = opts;

  const [filters, setFiltersState] = useState<CatalogFilters>({
    ...EMPTY_CATALOG_FILTERS,
    ...initialFilters,
  });
  const [page, setPageState] = useState<number>(1);

  // Debounced search value - separate from filters.search so typing does not
  // fire a request on every keystroke. Other filter fields fire immediately.
  const [debouncedSearch, setDebouncedSearch] = useState<string>(filters.search);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [filters.search]);

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pages, setPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Race-condition guard: only the latest request is allowed to commit results.
  // Each fetch claims a fresh id; a stale response that completes later sees
  // its id is not the current one and silently drops.
  const requestIdRef = useRef<number>(0);

  // setFilters wrapper resets the page so the user always lands on page 1
  // when the filter set changes (the prior page may no longer exist).
  const setFilters = useCallback((next: CatalogFilters) => {
    setFiltersState(next);
    setPageState(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ ...EMPTY_CATALOG_FILTERS, ...initialFilters });
    setPageState(1);
  }, [initialFilters]);

  const setPage = useCallback((next: number) => setPageState(next), []);

  // Stable query object derived from filters + page + debounced search.
  // Memoized so refresh()'s useCallback only re-creates when an actual input
  // changes, not on every render.
  const query = useMemo<CatalogQuery>(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    category: filters.category || undefined,
    approvalStatus: filters.approvalStatus || undefined,
    adoptionStatus: filters.adoptionStatus || undefined,
  }), [
    page,
    pageSize,
    debouncedSearch,
    filters.category,
    filters.approvalStatus,
    filters.adoptionStatus,
  ]);

  // Wrap fetcher in a ref so refresh() never holds a stale closure.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  /**
   * Issue a single fetch using the current query. Claims a requestId; if a
   * newer request finishes first, the older result is discarded.
   */
  const runFetch = useCallback(async (q: CatalogQuery): Promise<void> => {
    const myId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(q);
      // Drop stale responses so an older slow request can not overwrite a
      // newer one. A response only commits when its id is still the latest.
      if (requestIdRef.current !== myId) return;
      setItems(result.items);
      setTotal(result.pagination.total);
      setPages(Math.max(1, result.pagination.pages));
    } catch (err) {
      if (requestIdRef.current !== myId) return;
      setError(err instanceof Error ? err.message : 'Failed to load catalog');
    } finally {
      if (requestIdRef.current === myId) setIsLoading(false);
    }
  }, []);

  // Re-run on any change to a filter that goes to the server, or to the page.
  // Search uses the debounced value so typing only triggers after the user pauses.
  useEffect(() => {
    void runFetch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    filters.category,
    filters.approvalStatus,
    filters.adoptionStatus,
    page,
    pageSize,
  ]);

  // Guard: if the total drops below the current page (e.g. a filter narrowed
  // the result set), snap back to page 1 so the user does not stare at an
  // empty page that "should" have data.
  useEffect(() => {
    if (page > pages) setPageState(1);
  }, [pages, page]);

  /** Re-fetch the current query without changing state. Used after mutations. */
  const refresh = useCallback(() => runFetch(query), [runFetch, query]);

  return {
    filters,
    setFilters,
    resetFilters,
    page,
    setPage,
    items,
    total,
    pages,
    isLoading,
    error,
    refresh,
  };
}
