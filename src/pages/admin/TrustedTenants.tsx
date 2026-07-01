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
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

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
  // When enabling trust on a tenant that has pending offers, we confirm first
  // (the action approves those offers platform-wide + emails the org). Holds the
  // tenant awaiting confirmation, or null when no confirm is open.
  const [confirmRow, setConfirmRow] = useState<AdminTenantRow | null>(null);

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

  // Runs the actual toggle request. Called directly for the harmless cases and
  // from the confirm dialog when enabling a tenant that has pending offers.
  const applyToggle = async (row: AdminTenantRow) => {
    const next = !row.autoApproveOffers;
    setBusyId(row.tenantId);
    try {
      const res = await adminTenantsApi.setAutoApprove(row.tenantId, next, language);
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
      setConfirmRow(null);
    }
  };

  // Decides whether to confirm first: enabling a tenant with pending offers
  // approves + notifies, so it asks first; every other case toggles immediately.
  const requestToggle = (row: AdminTenantRow) => {
    const enabling = !row.autoApproveOffers;
    if (enabling && row.pendingOfferCount > 0) { setConfirmRow(row); return; }
    void applyToggle(row);
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
            {rows.map((row) => {
              const on = row.autoApproveOffers;
              const busy = busyId === row.tenantId;
              return (
                <li key={row.tenantId}>
                  {/* The whole row is the control: a full-width switch so it is
                      obvious the box is pressable and toggles allowed / not
                      allowed. role="switch" + aria-checked expose the state. */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    title={t('trusted_toggleHint')}
                    onClick={() => requestToggle(row)}
                    disabled={busy}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-start transition-colors hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800/50"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <TenantLogo name={row.organizationName} logoUrl={row.logoUrl} size={36} rounded="rounded-lg" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{row.organizationName}</span>
                        {row.pendingOfferCount > 0 && (
                          <span className="block text-xs text-slate-400">{row.pendingOfferCount} {t('trusted_pending')}</span>
                        )}
                      </span>
                    </span>

                    {/* State label + switch track. The track is dir="ltr" so the
                        thumb slides the same visual way in RTL and LTR. */}
                    <span className="flex shrink-0 items-center gap-2.5">
                      <span className={`text-xs font-semibold ${on ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {on ? t('trusted_on') : t('trusted_off')}
                      </span>
                      <span
                        dir="ltr"
                        aria-hidden="true"
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
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

      {/* Confirm before enabling trust on a tenant with pending offers - the
          action approves them platform-wide and emails the org. */}
      {confirmRow && (
        <ConfirmDeleteModal
          tone="primary"
          title={t('trusted_confirmTitle')}
          message={t('trusted_confirmMsg')
            .replace('{org}', confirmRow.organizationName)
            .replace('{count}', String(confirmRow.pendingOfferCount))}
          confirmLabel={t('trusted_confirmYes')}
          cancelLabel={t('u_cancel')}
          isDeleting={busyId === confirmRow.tenantId}
          onConfirm={() => void applyToggle(confirmRow)}
          onCancel={() => setConfirmRow(null)}
        />
      )}
    </main>
  );
}
