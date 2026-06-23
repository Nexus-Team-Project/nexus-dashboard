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
import { type DraftVariant, draftToPayload } from './voucherVariantDraft';

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
  voucherValidityValue: string;
  voucherValidityUnit: string;
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
  v.gallery.forEach((item) => { if (item.kind === 'new') fd.append('images', item.file); });

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
 * Validates the create-offer form. Returns the first error message (already
 * localized) to display, or null when valid. Pure — the caller owns setError.
 */
export function validateCreateOffer(
  v: CreateOfferValues,
  t: (key: TranslationKey) => string,
  language: string,
): string | null {
  if (!v.title.trim()) return t('co_errTitleRequired');
  if (v.marketPrice && (isNaN(Number(v.marketPrice)) || Number(v.marketPrice) <= 0)) return t('co_errMarketPrice');
  if (v.validFrom && v.validUntil && new Date(v.validFrom) >= new Date(v.validUntil)) {
    return language === 'he' ? 'תאריך ההשקה חייב להיות לפני תאריך התפוגה' : 'Launch date must be before the expiry date';
  }
  if (v.executionType === 'voucher') {
    // Per-variant pricing/validity/stackable/SKU are validated when each variant
    // is saved (VariantsManager). Here we only require at least one variant.
    if (v.variants.length === 0) return t('co_variantsRequired');
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
