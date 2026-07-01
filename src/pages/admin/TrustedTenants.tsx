/**
 * Platform-admin page: mark tenants as trusted (auto-approve their global offers).
 * Enabling a tenant retroactively approves its pending offers (backend).
 *
 * The tenant list can be large, so it is SERVER-paginated (fixed page size,
 * prev/next). The search box is DEBOUNCED (350ms) so typing does not fire a
 * request per keystroke; the backend route is additionally rate-limited
 * (apiLimiter). Searching resets to page 1.
 */
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../i18n/LanguageContext';
import { adminTenantsApi, type AdminTenantRow } from '../../lib/api';
import TenantLogo from '../../components/common/TenantLogo';

/** Tenants loaded per page. */
const PAGE_SIZE = 20;
/** Search debounce delay - long enough to coalesce fast typing into one request. */
const SEARCH_DEBOUNCE_MS = 350;

export default function TrustedTenants() {
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<AdminTenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Debounce the search box: apply the typed value only after a pause, and
  // reset to the first page so results start from the top of the new match set.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminTenantsApi.list({ search: debouncedSearch || undefined, page, limit: PAGE_SIZE });
      setRows(res.tenants);
      setTotal(res.total);
      // If a page emptied out (e.g. after a toggle removed the last match), step back.
      if (res.tenants.length === 0 && page > 1) setPage((p) => p - 1);
    } catch {
      toast.error(language === 'he' ? 'שגיאה בטעינת הארגונים' : 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, language]);
  useEffect(() => { void load(); }, [load]);

  const toggle = async (row: AdminTenantRow) => {
    const next = !row.autoApproveOffers;
    setBusyId(row.tenantId);
    try {
      const res = await adminTenantsApi.setAutoApprove(row.tenantId, next);
      setRows((r) => r.map((x) => (
        x.tenantId === row.tenantId
          ? { ...x, autoApproveOffers: next, pendingOfferCount: next ? 0 : x.pendingOfferCount }
          : x
      )));
      if (next && res.approvedOfferIds.length > 0) {
        toast.success((language === 'he' ? 'אושרו ' : 'Approved ') + res.approvedOfferIds.length);
      }
    } catch {
      toast.error(language === 'he' ? 'הפעולה נכשלה' : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t('nav_trustedTenants')}</h1>
      <p className="mb-6 text-sm text-slate-500">{t('trusted_desc')}</p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('trusted_search')}
        className="mb-5 w-64 rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          {t('trusted_empty')}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {rows.map((row) => (
              <li key={row.tenantId} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <TenantLogo name={row.organizationName} logoUrl={row.logoUrl} size={36} rounded="rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{row.organizationName}</p>
                    <p className="text-xs text-slate-400">
                      {row.status}
                      {row.pendingOfferCount > 0 ? ` · ${row.pendingOfferCount} ${t('trusted_pending')}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void toggle(row)}
                  disabled={busyId === row.tenantId}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    row.autoApproveOffers
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {row.autoApproveOffers ? t('trusted_on') : t('trusted_off')}
                </button>
              </li>
            ))}
          </ul>

          {/* Pagination - shown only when there is more than one page. */}
          {pages > 1 && (
            <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {t('u_previous')}
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t('approvals_pageOf').replace('{page}', String(page)).replace('{pages}', String(pages))}
                {total > 0 && <span className="ms-2" dir="ltr">({total})</span>}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {t('u_next')}
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
