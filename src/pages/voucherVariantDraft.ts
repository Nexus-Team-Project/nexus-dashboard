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

/** Per-variant validity TYPE override: '' = inherit the offer default. */
export type ValidityTypeChoice = '' | 'limit' | 'from_until';

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
  /** The Nexus price - also the member-facing selling price. Must be < faceValue. */
  nexusCost: string;
  /**
   * Per-variant validity TYPE override ('' = inherit the offer's defaultValidityType).
   * The validity VALUE is NOT on the variant - it is entered per inventory unit
   * (voucher-validity-dating). This only selects which kind of date each unit holds.
   */
  validityTypeOverride: ValidityTypeChoice;
  /** Mandatory combine-with-promotions choice. */
  stackable: StackChoice;
  sku: string;
  tags: string[];
  /**
   * When true, this variant overrides the shared redemption text with its own.
   * When false (default) the variant inherits the parent's shared terms/method.
   */
  customRedemption: boolean;
  /** Per-variant redemption terms (תנאי מימוש) - used only when customRedemption. */
  terms: string;
  /** Per-variant redemption method (אופן מימוש) - used only when customRedemption. */
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
    validityTypeOverride: '',
    stackable: '',
    sku: '',
    tags: [],
    customRedemption: false,
    terms: '',
    implementationInstructions: '',
    inventory: null,
    inventoryChoiceMade: false,
  };
}

/**
 * Maps a stored CatalogVariant (edit load) into an editable draft.
 *
 * The catalog read surfaces the shared (parent) redemption text on every variant,
 * so a variant only counts as a CUSTOM override when its text differs from the
 * shared text. Pass the parent's terms/method so an inherited variant is not
 * misread as custom (which would otherwise round-trip the shared text into it).
 */
export function variantToDraft(v: CatalogVariant, parentTerms?: string, parentMethod?: string): DraftVariant {
  const ownTerms = (v.terms ?? '').trim();
  const ownMethod = (v.implementationInstructions ?? '').trim();
  const sharedTerms = (parentTerms ?? '').trim();
  const sharedMethod = (parentMethod ?? '').trim();
  const custom =
    (ownTerms !== '' && ownTerms !== sharedTerms) ||
    (ownMethod !== '' && ownMethod !== sharedMethod);
  return {
    localId: nextLocalId(),
    variantId: v.variantId,
    faceValue: v.face_value != null ? String(v.face_value) : '',
    nexusCost: v.nexus_cost != null ? String(v.nexus_cost) : '',
    // Per-variant validity TYPE override ('' = inherit offer default). The value
    // is per unit now, loaded/edited through the inventory flow.
    validityTypeOverride: v.validityTypeOverride ?? '',
    stackable: v.voucherStackable === true ? 'yes' : v.voucherStackable === false ? 'no' : '',
    sku: v.sku ?? '',
    tags: v.tags ?? [],
    // Custom only when the variant's text differs from the shared text; an
    // inherited variant keeps an empty draft so the builder's checkbox is off
    // and draftToPayload omits terms (storage stays normalized).
    customRedemption: custom,
    terms: custom ? (v.terms ?? '') : '',
    implementationInstructions: custom ? (v.implementationInstructions ?? '') : '',
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
    return language === 'he' ? 'מחיר NEXUS חייב להיות חיובי ופחות מהשווי' : 'Nexus price must be positive and less than the value';
  }
  // Validity VALUE is no longer entered on the variant (it is per inventory unit);
  // only the optional TYPE override lives here and is a fixed enum, so there is
  // nothing to validate. See voucher-validity-dating.
  if (d.stackable === '') return t('co_voucherStackableRequired');
  if (d.sku.trim() !== '' && !/^[A-Z0-9_-]{4,20}$/.test(d.sku.trim())) return t('co_errSku');
  return null;
}

/**
 * Deterministic signature over a variant's configurable values - the shared
 * definition of "identical" used to block duplicate variants (mirrors the
 * backend `variantSignature`). member_price defaults to nexus_cost when blank.
 */
export function draftSignature(d: DraftVariant): string {
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  return JSON.stringify([
    num(d.faceValue),
    num(d.nexusCost),
    // member price equals the Nexus price (no separate field), so it adds nothing
    // to the signature beyond nexusCost above.
    // Validity is NOT part of the signature: the value lives on inventory units,
    // and the type override does not make a distinct priced product. So two
    // variants differing only by date are the same variant (voucher-validity-dating).
    d.stackable === 'yes',
    d.sku.trim().toUpperCase() || null,
    // Redemption text only distinguishes variants when this one overrides the shared text.
    d.customRedemption ? (d.terms.trim() || null) : null,
    d.customRedemption ? (d.implementationInstructions.trim() || null) : null,
  ]);
}

/** True when the draft duplicates another saved variant (excluding itself by localId). */
export function isDuplicateVariant(draft: DraftVariant, existing: DraftVariant[]): boolean {
  const sig = draftSignature(draft);
  return existing.some((v) => v.localId !== draft.localId && draftSignature(v) === sig);
}

/** Maps a draft variant to the API variant-input shape (numbers, server contract). */
export function draftToPayload(d: DraftVariant): Record<string, unknown> {
  return {
    ...(d.variantId ? { variantId: d.variantId } : {}),
    face_value: Number(d.faceValue),
    nexus_cost: Number(d.nexusCost),
    // No member_price field: the backend defaults member_price to nexus_cost, so
    // the Nexus price is the member-facing selling price.
    // Validity VALUE is per inventory unit; only the optional TYPE override is sent
    // here (null = inherit the offer defaultValidityType). See voucher-validity-dating.
    validityTypeOverride: d.validityTypeOverride === '' ? null : d.validityTypeOverride,
    voucherStackable: d.stackable === 'yes',
    sku: d.sku.trim() !== '' ? d.sku.trim() : null,
    tags: d.tags,
    // Send per-variant redemption text only when this variant overrides the
    // shared text; otherwise it inherits the parent's terms/method.
    ...(d.customRedemption
      ? { terms: d.terms.trim(), implementationInstructions: d.implementationInstructions.trim() }
      : {}),
  };
}

/**
 * Live price check for the builder: returns a localized error when the Nexus
 * price is not strictly below the value, or null. Only fires once both fields
 * hold a number so the user is not nagged while still typing the first field.
 */
export function nexusPriceError(faceValue: string, nexusCost: string, language: string): string | null {
  if (faceValue.trim() === '' || nexusCost.trim() === '') return null;
  const fv = Number(faceValue);
  const nc = Number(nexusCost);
  if (isNaN(fv) || isNaN(nc)) return null;
  if (nc >= fv) {
    return language === 'he'
      ? 'מחיר NEXUS חייב להיות נמוך מהשווי'
      : 'The Nexus price must be lower than the value';
  }
  return null;
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
