// ── Step IDs ─────────────────────────────────────────────────────────────────
export type SubStepId =
  | 'business_type'
  | 'tax_details'
  | 'business_details'
  | 'business_representative'
  | 'business_owners'
  | 'products_services'
  | 'public_details'
  | 'bank_account'
  | 'account_security'
  | 'document_upload'
  | 'review_submit';

export interface SubStep {
  id: SubStepId;
  /** Translation key for this step's label (use t(labelKey) at the call site). */
  labelKey: 'bs_businessType' | 'bs_taxDetails' | 'bs_businessDetails' | 'bs_businessRepresentative'
          | 'bs_businessOwners' | 'bs_productsServices' | 'bs_publicDetails' | 'bs_bankAccount'
          | 'bs_twoStepAuth' | 'bs_documentUpload' | 'bs_reviewSubmitStep';
  parentGroup: string;
}

export interface MainStep {
  id: string;
  /** Translation key for this main step's label. */
  labelKey: 'bs_verifyBusiness' | 'bs_addBank' | 'bs_secureAccount' | 'bs_addExtras' | 'bs_reviewSubmit';
  icon: string; // material-symbols name
  subSteps: SubStepId[];
}

// ── Step structure (Stripe-style grouping) ───────────────────────────────────
export const MAIN_STEPS: MainStep[] = [
  {
    id: 'verify_business',
    labelKey: 'bs_verifyBusiness',
    icon: 'verified',
    subSteps: [
      'business_type',
      'tax_details',
      'business_details',
      'business_representative',
      'business_owners',
      'products_services',
      'public_details',
    ],
  },
  {
    id: 'add_bank',
    labelKey: 'bs_addBank',
    icon: 'account_balance',
    subSteps: ['bank_account'],
  },
  {
    id: 'secure_account',
    labelKey: 'bs_secureAccount',
    icon: 'shield',
    subSteps: ['account_security'],
  },
  {
    id: 'add_extras',
    labelKey: 'bs_addExtras',
    icon: 'upload_file',
    subSteps: ['document_upload'],
  },
  {
    id: 'review',
    labelKey: 'bs_reviewSubmit',
    icon: 'checklist',
    subSteps: ['review_submit'],
  },
];

export const SUB_STEPS: SubStep[] = [
  { id: 'business_type',            labelKey: 'bs_businessType',            parentGroup: 'verify_business' },
  { id: 'tax_details',              labelKey: 'bs_taxDetails',              parentGroup: 'verify_business' },
  { id: 'business_details',         labelKey: 'bs_businessDetails',         parentGroup: 'verify_business' },
  { id: 'business_representative',  labelKey: 'bs_businessRepresentative',  parentGroup: 'verify_business' },
  { id: 'business_owners',          labelKey: 'bs_businessOwners',          parentGroup: 'verify_business' },
  { id: 'products_services',        labelKey: 'bs_productsServices',        parentGroup: 'verify_business' },
  { id: 'public_details',           labelKey: 'bs_publicDetails',           parentGroup: 'verify_business' },
  { id: 'bank_account',             labelKey: 'bs_bankAccount',             parentGroup: 'add_bank' },
  { id: 'account_security',         labelKey: 'bs_twoStepAuth',             parentGroup: 'secure_account' },
  { id: 'document_upload',          labelKey: 'bs_documentUpload',          parentGroup: 'add_extras' },
  { id: 'review_submit',            labelKey: 'bs_reviewSubmitStep',        parentGroup: 'review' },
];

// Ordered list of all sub-step IDs (flat navigation order)
export const STEP_ORDER: SubStepId[] = SUB_STEPS.map(s => s.id);

export function getSubStep(id: SubStepId): SubStep {
  return SUB_STEPS.find(s => s.id === id)!;
}

export function getMainStepForSub(subId: SubStepId): MainStep {
  return MAIN_STEPS.find(m => m.subSteps.includes(subId))!;
}

export function getNextStep(current: SubStepId): SubStepId | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

export function getPrevStep(current: SubStepId): SubStepId | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx > 0 ? STEP_ORDER[idx - 1] : null;
}

// ── Form data types ──────────────────────────────────────────────────────────
export interface BusinessSetupData {
  // Part 1 — Business Type
  business_location: string;
  business_type: string;
  business_structure: string;
  has_ein: string;

  // Part 2 — Tax Details
  ein: string;
  legal_name_en: string;
  legal_name_he: string;

  // Part 3 — Business Details
  dba_name_en: string;
  dba_name_he: string;
  business_address_country: string;
  business_address_street: string;
  business_address_house: string;
  business_address_apt: string;
  business_address_city: string;
  business_address_state: string;
  business_address_postal: string;
  business_phone: string;
  business_website: string;
  has_website: string;
  business_activity_desc: string;

  // Part 4 — Products, Services & KYC
  product_category: string;
  products_offered: string;
  transaction_types: string;
  product_source: string;
  sales_method: string;
  customer_type: string[];
  tourist_card_volume: string;

  // Part 5 — Business Representative
  rep_first_name: string;
  rep_last_name: string;
  rep_email: string;
  rep_job_title: string;
  rep_dob: string;
  rep_national_id: string;
  rep_id_issue_date: string;
  rep_gender: string;
  rep_address_country: string;
  rep_address_street: string;
  rep_address_house: string;
  rep_address_apt: string;
  rep_address_city: string;
  rep_address_state: string;
  rep_address_postal: string;
  rep_phone: string;
  rep_owns_25_plus: boolean;

  // Part 6 — Business Owners
  owners: { first_name: string; last_name: string; email: string }[];

  // Part 7 — Bank Account
  bank_selection: string;
  bank_branch: string;
  routing_number: string;
  account_number: string;
  confirm_account_number: string;

  // Part 8 — Public Details
  public_business_name: string;
  statement_descriptor: string;
  shortened_descriptor: string;
  support_phone: string;
  show_phone_receipts: boolean;
  support_address_country: string;
  support_address_street: string;
  support_address_apt: string;
  support_address_city: string;
  support_address_state: string;
  support_address_postal: string;

  // Part 9 — Document Upload
  doc_government_id: File | null;
  doc_signatories: File | null;
  doc_bank_confirmation: File | null;
  doc_business_registration: File | null;
  doc_copyright: File | null;

  // Part 10 — Account Security
  security_method: string;
}

export function createEmptyFormData(): BusinessSetupData {
  return {
    business_location: 'United States',
    business_type: '',
    business_structure: '',
    has_ein: '',
    ein: '',
    legal_name_en: '',
    legal_name_he: '',
    dba_name_en: '',
    dba_name_he: '',
    business_address_country: 'United States',
    business_address_street: '',
    business_address_house: '',
    business_address_apt: '',
    business_address_city: '',
    business_address_state: '',
    business_address_postal: '',
    business_phone: '',
    business_website: '',
    has_website: '',
    business_activity_desc: '',
    product_category: '',
    products_offered: '',
    transaction_types: '',
    product_source: '',
    sales_method: '',
    customer_type: [],
    tourist_card_volume: '',
    rep_first_name: '',
    rep_last_name: '',
    rep_email: '',
    rep_job_title: '',
    rep_dob: '',
    rep_national_id: '',
    rep_id_issue_date: '',
    rep_gender: '',
    rep_address_country: 'United States',
    rep_address_street: '',
    rep_address_house: '',
    rep_address_apt: '',
    rep_address_city: '',
    rep_address_state: '',
    rep_address_postal: '',
    rep_phone: '',
    rep_owns_25_plus: false,
    owners: [],
    bank_selection: '',
    bank_branch: '',
    routing_number: '',
    account_number: '',
    confirm_account_number: '',
    public_business_name: '',
    statement_descriptor: '',
    shortened_descriptor: '',
    support_phone: '',
    show_phone_receipts: false,
    support_address_country: 'United States',
    support_address_street: '',
    support_address_apt: '',
    support_address_city: '',
    support_address_state: '',
    support_address_postal: '',
    doc_government_id: null,
    doc_signatories: null,
    doc_bank_confirmation: null,
    doc_business_registration: null,
    doc_copyright: null,
    security_method: '',
  };
}
