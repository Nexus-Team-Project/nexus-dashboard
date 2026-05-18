/**
 * FieldInfoKey — union of all offer-form field keys that support the
 * FieldTooltip + FieldInfoModal info system.
 *
 * Adding a new field: add its key here, then add four translation entries
 * (fi_<key>_label, fi_<key>_short, fi_<key>_detail, fi_<key>_example)
 * to both language objects in translations.ts.
 */
export type FieldInfoKey =
  | 'title'
  | 'description'
  | 'category'
  | 'executionType'
  | 'marketPrice'
  | 'stockLimit'
  | 'visibility'
  | 'implementationLink'
  | 'implementationInstructions'
  | 'validFrom'
  | 'validUntil'
  | 'terms'
  | 'tags'
  | 'faceValue'
  | 'nexusCost'
  | 'memberPrice'
  // BenefitsPartnerships page - tab tooltips
  | 'tabCards'
  | 'tabTable'
  // BenefitsPartnerships page - table column tooltips (columns that have no
  // matching CreateOffer field reuse the keys above; only the columns that
  // are admin-table specific need new keys).
  | 'bpcStatus'
  | 'bpcLogo'
  | 'bpcBackgroundImage'
  | 'bpcBusinessName'
  | 'bpcBenefitType'
  | 'bpcUsageTerms'
  | 'bpcActions';
