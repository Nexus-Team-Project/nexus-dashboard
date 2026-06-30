/**
 * CreateOffer form helpers (pure) — extracted from CreateOffer to keep that file
 * under the 350-line limit:
 *   - buildCreateOfferFormData: builds the multipart payload from form values.
 *   - validateCreateOffer: returns the first validation error message, or null.
 *   - voucherInventorySummary: human label for a staged (in-memory) inventory choice.
 */
import type { GalleryItem } from '../components/offer/OfferImageGallery';
import type { BgMode } from '../components/offer/VoucherBackgroundField';
import type { OfferInventoryInput } from '../lib/api';
import type { TranslationKey } from '../i18n/translations';
import { type DraftVariant, draftToPayload, validateVariantDraft } from './voucherVariantDraft';

export interface CreateOfferValues {
  title: string;
  description: string;
  category: string;
  marketPrice: string;
  visibility: 'ecosystem' | 'tenant_only';
  isPlatformAdmin: boolean;
  executionType: string;
  stockLimit: string;
  faceValue: string;
  nexusCost: string;
  gallery: GalleryItem[];
  implementationLink: string;
  /** For vouchers, the parent-level redemption method (shared scope only). */
  implementationInstructions: string;
  voucherStackable: '' | 'yes' | 'no';
  bgMode: BgMode;
  voucherBackgroundColor: string;
  sku: string;
  validFrom: string;
  validUntil: string;
  /** For vouchers, the parent-level redemption terms (shared scope only). */
  terms: string;
  tags: string[];
  /** Voucher variants (voucher executionType only). */
  variants: DraftVariant[];
}

export function buildCreateOfferFormData(v: CreateOfferValues): FormData {
  const fd = new FormData();
  fd.append('title', v.title.trim());
  fd.append('description', v.description.trim());
  fd.append('category', v.category);
  if (v.marketPrice && Number(v.marketPrice) > 0) fd.append('market_price', v.marketPrice);
  fd.append('visibility', v.isPlatformAdmin ? 'ecosystem' : v.visibility);
  fd.append('executionType', v.executionType);
  // Originals upload as-is (images[]); crops travel as metadata. New-file crops
  // align to the images[] append order; kept crops are keyed by URL. Create
  // normally has no kept images, but the field is sent for codepath symmetry.
  const newCrops: (typeof v.gallery[number]['crop'])[] = [];
  v.gallery.forEach((item) => {
    if (item.kind === 'new') {
      fd.append('images', item.file);
      newCrops.push(item.crop ?? null);
    }
  });
  if (newCrops.length > 0) fd.append('newImageCrops', JSON.stringify(newCrops));
  const keptItems = v.gallery.filter((g): g is Extract<GalleryItem, { kind: 'existing' }> => g.kind === 'existing');
  if (keptItems.length > 0) {
    fd.append('keptImageUrls', JSON.stringify(keptItems.map((g) => g.url)));
    fd.append('keptImageCrops', JSON.stringify(keptItems.map((g) => ({ url: g.url, crop: g.crop ?? null }))));
  }

  if (v.executionType === 'voucher') {
    // Voucher: price/validity/stackable/SKU/tags are per VARIANT. Send the
    // variants array; the backend mirrors the representative variant onto the
    // offer's flat fields. redemptionScope reflects whether any variant overrides
    // the shared text (vestigial but kept accurate).
    const perVariant = v.variants.some((d) => d.customRedemption);
    fd.append('redemptionScope', perVariant ? 'per_variant' : 'shared');
    fd.append('variants', JSON.stringify(v.variants.map((d) => draftToPayload(d))));
    if (v.bgMode === 'color' && v.voucherBackgroundColor) fd.append('voucherBackgroundColor', v.voucherBackgroundColor);
    // The shared redemption terms + method always live on the parent; a variant
    // that overrides them carries its own copy inside its variant payload.
    if (v.terms.trim()) fd.append('terms', v.terms.trim());
    if (v.implementationInstructions.trim()) fd.append('implementationInstructions', v.implementationInstructions.trim());
  } else {
    if (v.stockLimit && Number(v.stockLimit) > 0) fd.append('stockLimit', v.stockLimit);
    if (v.implementationLink.trim()) fd.append('implementationLink', v.implementationLink.trim());
    if (v.implementationInstructions.trim()) fd.append('implementationInstructions', v.implementationInstructions.trim());
    if (v.validFrom) fd.append('validFrom', v.validFrom);
    if (v.validUntil) fd.append('validUntil', v.validUntil);
    if (v.terms.trim()) fd.append('terms', v.terms.trim());
    if (v.tags.length > 0) fd.append('tags', JSON.stringify(v.tags));
  }
  return fd;
}

/**
 * Subset of the form needed to decide whether Publish is allowed. Both
 * CreateOffer and EditOffer build this so the gate logic stays identical.
 */
export interface PublishGateInput {
  title: string;
  /** Required global field (backend requires a category on create). */
  category: string;
  marketPrice: string;
  executionType: string;
  /** Voucher variants (voucher executionType only). */
  variants: DraftVariant[];
  /** True while a variant draft is open in the VariantsManager (blocks publish). */
  variantEditing: boolean;
}

/**
 * Computes the HARD publish blockers - the conditions that disable the Publish
 * button. Each entry is an already-localized, user-friendly message; the first
 * one is shown as the button tooltip + inline hint. This is the SINGLE source of
 * truth: the same array drives both the button's `disabled` state and the
 * on-click guard, so the two can never disagree about whether publishing is
 * allowed. Pure - the caller owns rendering.
 *
 * Required global fields (title, category) AND every variant's required fields are
 * re-validated here, so variants added programmatically (e.g. the XLSX import,
 * which bypasses the per-variant Save) can never publish while incomplete.
 */
export function computePublishBlockers(
  v: PublishGateInput,
  t: (key: TranslationKey) => string,
  language: string,
): string[] {
  const blockers: string[] = [];
  if (!v.title.trim()) blockers.push(t('co_errTitleRequired'));
  if (!v.category) blockers.push(t('co_errCategoryRequired'));
  if (v.marketPrice && (isNaN(Number(v.marketPrice)) || Number(v.marketPrice) <= 0)) {
    blockers.push(t('co_errMarketPrice'));
  }
  if (v.executionType === 'voucher') {
    if (v.variants.length === 0) blockers.push(t('co_variantsRequired'));
    else if (v.variantEditing) blockers.push(t('of_publishBlockVariantEditing'));
    else {
      // Re-validate every variant's required fields (price, mandatory stackable, SKU
      // format). Catches imported variants that never went through "Save Variant".
      for (const d of v.variants) {
        const err = validateVariantDraft(d, t, language);
        if (err) { blockers.push(err); break; }
      }
    }
    // Validity VALUE is per unit (set in the inventory flow), so nothing to gate here.
  }
  return blockers;
}

/**
 * The single SOFT, on-submit-only validation: the optional launch/expiry date
 * range sanity check (non-voucher offers only). Returns a localized error to show
 * in the error banner, or null. Deliberately kept OFF the disable gate so an
 * in-progress date pair does not perma-disable Publish; it surfaces on click.
 */
export function submitDateRangeError(
  v: { executionType: string; validFrom: string; validUntil: string },
  language: string,
): string | null {
  if (v.executionType !== 'voucher' && v.validFrom && v.validUntil && new Date(v.validFrom) >= new Date(v.validUntil)) {
    return language === 'he' ? 'תאריך ההשקה חייב להיות לפני תאריך התפוגה' : 'Launch date must be before the expiry date';
  }
  return null;
}

/**
 * Human summary of a staged (in-memory) voucher inventory choice. Shared by the
 * inventory section card and the publish-confirm dialog so both read identically.
 */
export function voucherInventorySummary(
  t: (key: TranslationKey) => string,
  choiceMade: boolean,
  inventory: OfferInventoryInput | null,
): string {
  if (!choiceMade) return t('co_invSummaryNotSet');
  if (inventory === null) return t('co_invSummarySkipped');
  if (inventory.kind === 'barcode') return `${inventory.values?.length ?? 0} ${t('co_invSummaryBarcodes')}`;
  return `${inventory.links?.length ?? 0} ${t('co_invSummaryLinks')}`;
}
