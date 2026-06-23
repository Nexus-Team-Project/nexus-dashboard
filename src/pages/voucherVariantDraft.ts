/**
 * Draft-variant model + pure helpers for the voucher authoring flow (Create/Edit
 * Offer). A voucher offer is a parent that holds one or more variants; this file
 * holds the client-side draft shape, validation, duplicate detection, and the
 * mapping to the API variant-input payload. Kept pure (no React) so CreateOffer /
 * EditOffer stay under the 350-line limit.
 */
import type { OfferInventoryInput, CatalogVariant } from '../lib/api';
import type { TranslationKey } from '../i18n/translations';

/** Combine-with-promotions tri-state, mirrors VoucherStackToggle. */
export type StackChoice = '' | 'yes' | 'no';

/**
 * One variant being authored. All numeric fields are kept as strings (form
 * inputs); inventory is staged in memory and applied per variant at publish.
 */
export interface DraftVariant {
  /** Client-only id for list keys + edit targeting (never sent to the server). */
  localId: string;
  /** Server variant id when editing an existing variant; absent for a new one. */
  variantId?: string;
  faceValue: string;
  nexusCost: string;
  /** Optional; empty defaults to nexusCost server-side. */
  memberPrice: string;
  /** Empty = never expires. */
  validityValue: string;
  validityUnit: string;
  /** Mandatory combine-with-promotions choice. */
  stackable: StackChoice;
  sku: string;
  tags: string[];
  /** Redemption terms (תנאי מימוש) - used only when redemptionScope is per_variant. */
  terms: string;
  /** Redemption method (אופן מימוש) - used only when redemptionScope is per_variant. */
  implementationInstructions: string;
  /** Staged inventory choice (null = explicitly none/skip). */
  inventory: OfferInventoryInput | null;
  /** Whether the admin has chosen inventory or explicitly skipped for this variant. */
  inventoryChoiceMade: boolean;
}

let localIdCounter = 0;
/** Generates a unique client-only id for a draft variant. */
export function nextLocalId(): string {
  localIdCounter += 1;
  return `dv_${localIdCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

/** A blank draft variant (years default matches the offer-level voucher default). */
export function emptyDraftVariant(): DraftVariant {
  return {
    localId: nextLocalId(),
    faceValue: '',
    nexusCost: '',
    memberPrice: '',
    validityValue: '',
    validityUnit: 'years',
    stackable: '',
    sku: '',
    tags: [],
    terms: '',
    implementationInstructions: '',
    inventory: null,
    inventoryChoiceMade: false,
  };
}

/** Maps a stored CatalogVariant (edit load) into an editable draft. */
export function variantToDraft(v: CatalogVariant): DraftVariant {
  return {
    localId: nextLocalId(),
    variantId: v.variantId,
    faceValue: v.face_value != null ? String(v.face_value) : '',
    nexusCost: v.nexus_cost != null ? String(v.nexus_cost) : '',
    memberPrice: v.member_price != null ? String(v.member_price) : '',
    validityValue: v.voucherValidityValue != null ? String(v.voucherValidityValue) : '',
    validityUnit: v.voucherValidityUnit ?? 'years',
    stackable: v.voucherStackable === true ? 'yes' : v.voucherStackable === false ? 'no' : '',
    sku: v.sku ?? '',
    tags: v.tags ?? [],
    terms: v.terms ?? '',
    implementationInstructions: v.implementationInstructions ?? '',
    // Inventory is loaded separately per variant (links pre-fill); start "made"
    // so an unchanged edit is publishable, matching the create-page gate.
    inventory: null,
    inventoryChoiceMade: true,
  };
}

/**
 * Validates one draft variant. Returns the first localized error message, or
 * null when valid. `perVariant` controls whether redemption fields are required.
 */
export function validateVariantDraft(
  d: DraftVariant,
  t: (key: TranslationKey) => string,
  language: string,
): string | null {
  const fv = Number(d.faceValue);
  const nc = Number(d.nexusCost);
  if (!d.faceValue || isNaN(fv) || fv <= 0) {
    return language === 'he' ? 'יש להזין שווי שובר תקין וחיובי' : 'Face value must be a positive number';
  }
  if (!d.nexusCost || isNaN(nc) || nc <= 0 || nc >= fv) {
    return language === 'he' ? 'מחיר NEXUS חייב להיות חיובי ופחות מהשווי' : 'Nexus price must be positive and less than face value';
  }
  if (d.memberPrice.trim() !== '') {
    const mp = Number(d.memberPrice);
    if (isNaN(mp) || mp < nc || mp > fv) {
      return language === 'he' ? 'מחיר לחבר חייב להיות בין מחיר NEXUS לשווי' : 'Member price must be between the Nexus price and the face value';
    }
  }
  if (d.validityValue.trim() !== '') {
    const vv = Number(d.validityValue);
    if (!Number.isInteger(vv) || vv <= 0) {
      return language === 'he' ? 'מגבלת התוקף חייבת להיות מספר שלם חיובי' : 'Validity limit must be a positive whole number';
    }
  }
  if (d.stackable === '') return t('co_voucherStackableRequired');
  if (d.sku.trim() !== '' && !/^[A-Z0-9_-]{4,20}$/.test(d.sku.trim())) return t('co_errSku');
  return null;
}

/**
 * Deterministic signature over a variant's configurable values - the shared
 * definition of "identical" used to block duplicate variants (mirrors the
 * backend `variantSignature`). member_price defaults to nexus_cost when blank.
 */
export function draftSignature(d: DraftVariant, perVariant: boolean): string {
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  const member = d.memberPrice.trim() === '' ? num(d.nexusCost) : num(d.memberPrice);
  return JSON.stringify([
    num(d.faceValue),
    num(d.nexusCost),
    member,
    num(d.validityValue),
    d.validityValue.trim() === '' ? null : d.validityUnit,
    d.stackable === 'yes',
    d.sku.trim().toUpperCase() || null,
    perVariant ? (d.terms.trim() || null) : null,
    perVariant ? (d.implementationInstructions.trim() || null) : null,
  ]);
}

/** True when the draft duplicates another saved variant (excluding itself by localId). */
export function isDuplicateVariant(
  draft: DraftVariant,
  existing: DraftVariant[],
  perVariant: boolean,
): boolean {
  const sig = draftSignature(draft, perVariant);
  return existing.some((v) => v.localId !== draft.localId && draftSignature(v, perVariant) === sig);
}

/** Maps a draft variant to the API variant-input shape (numbers, server contract). */
export function draftToPayload(d: DraftVariant, perVariant: boolean): Record<string, unknown> {
  const hasValidity = d.validityValue.trim() !== '';
  return {
    ...(d.variantId ? { variantId: d.variantId } : {}),
    face_value: Number(d.faceValue),
    nexus_cost: Number(d.nexusCost),
    ...(d.memberPrice.trim() !== '' ? { member_price: Number(d.memberPrice) } : {}),
    voucherValidityValue: hasValidity ? Number(d.validityValue) : null,
    voucherValidityUnit: hasValidity ? d.validityUnit : null,
    voucherStackable: d.stackable === 'yes',
    sku: d.sku.trim() !== '' ? d.sku.trim() : null,
    tags: d.tags,
    ...(perVariant
      ? { terms: d.terms.trim(), implementationInstructions: d.implementationInstructions.trim() }
      : {}),
  };
}

/** Human summary of a variant's staged inventory choice (for the list + builder). */
export function variantInventorySummary(
  t: (key: TranslationKey) => string,
  d: DraftVariant,
): string {
  if (!d.inventoryChoiceMade) return t('co_invSummaryNotSet');
  if (d.inventory === null) return t('co_invSummarySkipped');
  if (d.inventory.kind === 'barcode') return `${d.inventory.values?.length ?? 0} ${t('co_invSummaryBarcodes')}`;
  return `${d.inventory.links?.length ?? 0} ${t('co_invSummaryLinks')}`;
}
