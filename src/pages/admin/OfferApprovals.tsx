/**
 * Platform-admin page: review pending global (ecosystem) offers - approve or deny.
 *
 * There can be a large backlog here, so the list is SERVER-paginated (fixed page
 * size, prev/next controls) rather than loading everything at once. Each offer is
 * shown as a rich card - thumbnail, uploader, offer type, and (for vouchers) the
 * variant count + selling-price range (lowest-highest) - plus a "view details"
 * badge that opens the same detail modal used on Benefits Partnerships
 * (OfferModal) so the admin sees the full offer before deciding.
 *
 * Reuses the existing platform list + approve/deny APIs + the shared DenyOfferModal.
 */
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  getPlatformOffers,
  approveOfferApi,
  EXECUTION_TYPE_LABELS,
  OFFER_CATEGORIES,
  type CatalogItem,
} from '../../lib/api';
import { buildOfferImageUrl, getImageCrop } from '../../lib/cloudinaryImage';
import { variantMemberPriceRange } from '../../lib/voucherPricing';
import OfferModal from '../../components/catalog/OfferModal';
import OfferUploaderBadge from '../../components/catalog/OfferUploaderBadge';
import DenyOfferModal from '../../components/DenyOfferModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { notifyPendingApprovalsChanged } from '../../lib/pendingApprovals';

/** Offers loaded per page. Small enough to render richly, large enough to batch. */
const PAGE_SIZE = 12;

/**
 * Builds the selling-price display string for a card.
 * Vouchers show the variant member-price range (lowest-highest) or a single
 * price; other types show market_price (falling back to member_price).
 * Returns null when no price is resolvable so the caller can hide the chip.
 */
function cardPrice(offer: CatalogItem): string | null {
  if (offer.executionType === 'voucher') {
    const range = variantMemberPriceRange(offer);
    if (range) {
      return range.count > 1 && range.min !== range.max
        ? `₪${range.min.toLocaleString()} - ₪${range.max.toLocaleString()}`
        : `₪${range.min.toLocaleString()}`;
    }
    return typeof offer.member_price === 'number' ? `₪${offer.member_price.toLocaleString()}` : null;
  }
  const p = offer.market_price ?? offer.member_price;
  return typeof p === 'number' ? `₪${p.toLocaleString()}` : null;
}

/**
 * Small square offer thumbnail mirroring the catalog card image logic:
 * color-mode voucher -> solid color; otherwise the first (cropped) gallery
 * image; otherwise a gift placeholder.
 */
function OfferThumb({ offer }: { offer: CatalogItem }) {
  const box = 'h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700';
  if (offer.executionType === 'voucher' && offer.voucherBackgroundColor) {
    return <div aria-hidden className={box} style={{ background: offer.voucherBackgroundColor }} />;
  }
  const origins = offer.imageUrls && offer.imageUrls.length > 0
    ? offer.imageUrls
    : offer.imageUrl ? [offer.imageUrl] : [];
  if (origins.length === 0) {
    return <div className={`${box} flex items-center justify-center bg-slate-100 text-2xl dark:bg-slate-800`}>🎁</div>;
  }
  const url = buildOfferImageUrl(origins[0], getImageCrop(offer.imageCrops, origins[0]), 'card');
  return <img src={url} alt="" className={`${box} object-cover`} />;
}

/**
 * One pending-offer card: thumbnail + title/uploader, a chip row (type, category,
 * variant count, price range), the "view details" badge, and approve/deny actions.
 */
function ApprovalCard({
  offer, onView, onApprove, onDeny,
}: {
  offer: CatalogItem;
  onView: () => void;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const { t, language } = useLanguage();
  const typeMeta = offer.executionType ? EXECUTION_TYPE_LABELS[offer.executionType] : undefined;
  const typeLabel = typeMeta ? (language === 'he' ? typeMeta.labelHe : typeMeta.label) : null;
  const catMeta = OFFER_CATEGORIES.find((c) => c.value === offer.category);
  const catLabel = catMeta ? (language === 'he' ? catMeta.labelHe : catMeta.label) : null;
  const variantCount = offer.executionType === 'voucher' ? (offer.variants?.length ?? 0) : 0;
  const price = cardPrice(offer);
  const chip = 'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <OfferThumb offer={offer} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900 dark:text-white">{offer.title}</p>
          {/* Uploading tenant's logo (cropped if a crop exists) + name. Falls back
              to initials on the brand color when the tenant has no logo. */}
          <OfferUploaderBadge
            name={offer.createdByTenantName ?? offer.createdByTenantId}
            logoUrl={offer.createdByTenantLogoUrl}
            logoCrop={offer.createdByTenantLogoCrop}
            brandColor={offer.createdByTenantBrandColor}
            className="mt-1"
          />

          {/* Detail chips - each hidden when the offer lacks that field. */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {typeLabel && <span className={chip}>{typeMeta?.icon} {typeLabel}</span>}
            {catLabel && <span className={chip}>{catLabel}</span>}
            {variantCount > 0 && (
              <span className={chip}>{variantCount} {t('approvals_variantsCount')}</span>
            )}
            {price && <span className={`${chip} font-semibold`} dir="ltr">{price}</span>}
          </div>

          {/* "Click to view details" badge - opens the full detail modal. */}
          <button
            type="button"
            onClick={onView}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M10 4c-3.9 0-7.2 2.4-8.5 6 1.3 3.6 4.6 6 8.5 6s7.2-2.4 8.5-6C17.2 6.4 13.9 4 10 4Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            </svg>
            {t('approvals_viewDetails')}
          </button>
        </div>
      </div>

      {/* Actions - full width on mobile, aligned end on larger screens. */}
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex-row sm:justify-end">
        <button
          onClick={onApprove}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {t('co_allowOffer')}
        </button>
        <button
          onClick={onDeny}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          {t('co_denyOffer')}
        </button>
      </div>
    </li>
  );
}

/**
 * Approvals page. Loads one server page of pending ecosystem offers, renders them
 * as rich cards, and lets the admin approve/deny each or open its detail modal.
 */
export default function OfferApprovals() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [denyTarget, setDenyTarget] = useState<CatalogItem | null>(null);
  const [viewOffer, setViewOffer] = useState<CatalogItem | null>(null);
  // Offer awaiting approve-confirmation, and whether the approve call is in flight.
  const [approveTarget, setApproveTarget] = useState<CatalogItem | null>(null);
  const [approving, setApproving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlatformOffers({ approvalStatus: 'pending_approval', page, limit: PAGE_SIZE });
      setItems(res.items);
      setPages(Math.max(1, res.pagination.pages));
      setTotal(res.pagination.total);
      // If a page emptied out (last item approved/denied), step back one page.
      if (res.items.length === 0 && page > 1) setPage((p) => p - 1);
    } catch {
      toast.error(language === 'he' ? 'שגיאה בטעינת ההצעות' : 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [language, page]);
  useEffect(() => { void load(); }, [load]);

  // Runs the actual approve after the admin confirms in the modal.
  const approve = async (id: string) => {
    setApproving(true);
    try {
      await approveOfferApi(id);
      toast.success(language === 'he' ? 'ההצעה אושרה' : 'Offer approved');
      notifyPendingApprovalsChanged(); // refresh the sidebar badge
      await load();
    } catch {
      toast.error(language === 'he' ? 'שגיאה באישור' : 'Failed to approve');
    } finally {
      setApproving(false);
      setApproveTarget(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t('nav_offerApprovals')}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{t('approvals_subtitle')}</p>
      </header>

      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          {t('approvals_empty')}
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((o) => (
              <ApprovalCard
                key={o.offerId}
                offer={o}
                onView={() => setViewOffer(o)}
                onApprove={() => setApproveTarget(o)}
                onDeny={() => setDenyTarget(o)}
              />
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

      {/* Full offer detail - same modal as Benefits Partnerships. Admin view:
          no purchase section (canPurchase=false), inactive catalog mode. */}
      {viewOffer && (
        <OfferModal
          offer={viewOffer}
          catalogMode="inactive"
          canPurchase={false}
          onClose={() => setViewOffer(null)}
        />
      )}

      {/* Confirm before the approve API call fires. */}
      {approveTarget && (
        <ConfirmDeleteModal
          tone="primary"
          title={language === 'he' ? 'לאשר את ההצעה?' : 'Approve this offer?'}
          message={language === 'he'
            ? `"${approveTarget.title}" תפורסם לכל הפלטפורמה.`
            : `"${approveTarget.title}" will be published across the whole platform.`}
          confirmLabel={t('co_allowOffer')}
          cancelLabel={t('u_cancel')}
          isDeleting={approving}
          onConfirm={() => void approve(approveTarget.offerId)}
          onCancel={() => setApproveTarget(null)}
        />
      )}

      {denyTarget && (
        <DenyOfferModal
          offer={denyTarget}
          onClose={() => setDenyTarget(null)}
          onDenied={async () => {
            toast.success(language === 'he' ? 'ההצעה נדחתה' : 'Offer rejected');
            notifyPendingApprovalsChanged(); // refresh the sidebar badge
            await load();
            setDenyTarget(null);
          }}
        />
      )}
    </main>
  );
}
