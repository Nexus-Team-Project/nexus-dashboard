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
  implementationInstructions: string;
  voucherValidityValue: string;
  voucherValidityUnit: string;
  voucherStackable: '' | 'yes' | 'no';
  bgMode: BgMode;
  voucherBackgroundColor: string;
  sku: string;
  validFrom: string;
  validUntil: string;
  terms: string;
  tags: string[];
}

export function buildCreateOfferFormData(v: CreateOfferValues): FormData {
  const fd = new FormData();
  fd.append('title', v.title.trim());
  fd.append('description', v.description.trim());
  fd.append('category', v.category);
  if (v.marketPrice && Number(v.marketPrice) > 0) fd.append('market_price', v.marketPrice);
  fd.append('visibility', v.isPlatformAdmin ? 'ecosystem' : v.visibility);
  fd.append('executionType', v.executionType);
  if (v.executionType !== 'voucher' && v.stockLimit && Number(v.stockLimit) > 0) fd.append('stockLimit', v.stockLimit);
  if (v.executionType === 'voucher') {
    fd.append('face_value', v.faceValue);
    fd.append('nexus_cost', v.nexusCost);
  }
  v.gallery.forEach((item) => { if (item.kind === 'new') fd.append('images', item.file); });
  if (v.implementationLink.trim()) fd.append('implementationLink', v.implementationLink.trim());
  if (v.implementationInstructions.trim()) fd.append('implementationInstructions', v.implementationInstructions.trim());
  if (v.executionType === 'voucher') {
    if (v.voucherValidityValue.trim() !== '') {
      fd.append('voucherValidityValue', v.voucherValidityValue.trim());
      fd.append('voucherValidityUnit', v.voucherValidityUnit);
    }
    fd.append('voucherStackable', v.voucherStackable === 'yes' ? 'true' : 'false');
    if (v.bgMode === 'color' && v.voucherBackgroundColor) fd.append('voucherBackgroundColor', v.voucherBackgroundColor);
    if (v.sku.trim() !== '') fd.append('sku', v.sku.trim());
  } else {
    if (v.validFrom) fd.append('validFrom', v.validFrom);
    if (v.validUntil) fd.append('validUntil', v.validUntil);
  }
  if (v.terms.trim()) fd.append('terms', v.terms.trim());
  if (v.tags.length > 0) fd.append('tags', JSON.stringify(v.tags));
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
    const fv = Number(v.faceValue);
    const nc = Number(v.nexusCost);
    if (!v.faceValue || isNaN(fv) || fv <= 0) {
      return language === 'he' ? 'יש להזין שווי שובר תקין וחיובי' : 'Face value must be a positive number';
    }
    if (!v.nexusCost || isNaN(nc) || nc <= 0 || nc >= fv) {
      return language === 'he' ? 'מחיר NEXUS חייב להיות חיובי ופחות מהשווי' : 'Nexus price must be positive and less than face value';
    }
    if (v.voucherValidityValue.trim() !== '') {
      const vv = Number(v.voucherValidityValue);
      if (!Number.isInteger(vv) || vv <= 0) {
        return language === 'he' ? 'מגבלת התוקף חייבת להיות מספר שלם חיובי' : 'Validity limit must be a positive whole number';
      }
    }
    if (v.voucherStackable === '') return t('co_voucherStackableRequired');
    if (v.sku.trim() !== '' && !/^[A-Z0-9_-]{4,20}$/.test(v.sku.trim())) return t('co_errSku');
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
