/**
 * Connects dashboard features to the shared Nexus backend with an in-memory
 * access token and credentialed requests for the httpOnly refresh cookie.
 * Includes in-flight deduplication for refresh calls and automatic 401 retry,
 * mirroring the website API client to prevent concurrent-refresh races.
 */
import type { ImageCrop, ImageCropEntry } from './cloudinaryImage';
import { extractApiError, ApiError } from './apiError';

const AUTH_BASE = (import.meta.env.VITE_AUTH_URL as string | undefined) ?? (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

let _token: string | null = null;

/**
 * Updates the in-memory access token used by dashboard API requests.
 * Input: access token string, or null to clear auth.
 * Output: future requests include or omit the Bearer token.
 */
export function setToken(token: string | null) {
  _token = token;
}

// ─── Refresh deduplication ────────────────────────────────────────
// Module-level promise ensures multiple concurrent 401s only trigger one
// /api/auth/refresh call, preventing the replacement-chain races that caused
// the backend to bulk-revoke all user tokens and force a logout.

interface RefreshResult { accessToken: string }
let _refreshPromise: Promise<RefreshResult | null> | null = null;

/**
 * Calls /api/auth/refresh once and deduplicates concurrent callers.
 * Input: none — uses the httpOnly refresh cookie automatically via credentials.
 * Output: the new access token on success, or null when the session is expired.
 */
export async function refreshAccessToken(): Promise<RefreshResult | null> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = _doRefresh();
  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

async function _doRefresh(): Promise<RefreshResult | null> {
  try {
    const res = await fetch(`${AUTH_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json() as { accessToken: string };
    _token = data.accessToken;
    return { accessToken: data.accessToken };
  } catch {
    return null;
  }
}

// ─── Core request helper ──────────────────────────────────────────

/**
 * Sends a typed request to the backend API.
 * Automatically sets Content-Type to application/json unless the body is
 * FormData, in which case the browser sets the multipart boundary itself.
 * On 401, refreshes the access token once and retries automatically.
 * Input: HTTP method, API path, optional body (JSON-serializable or FormData),
 *        and internal retry flag.
 * Output: parsed JSON response or throws with the backend error message.
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  const isFormData = body instanceof FormData;
  // Only set Content-Type for JSON payloads - FormData needs the browser to
  // inject the multipart boundary into Content-Type automatically.
  const headers: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  // Auto-refresh on 401 then retry once — silent recovery without logging out.
  if (res.status === 401 && !retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(method, path, body, true);
    throw Object.assign(new Error('Session expired'), { status: 401 });
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  // The backend `error` can be a string OR a Zod validation object (flatten/format,
  // incl. nested fieldErrors.variants). extractApiError pulls out the real message(s)
  // so we never throw an Error whose message renders as "[object Object]". The
  // backend also sends a localized `errorHe`; we carry it on ApiError so the UI
  // can show the Hebrew message in Hebrew mode (see localizedApiError).
  if (!res.ok) {
    const messageHe = typeof data?.errorHe === 'string' ? data.errorHe : undefined;
    throw new ApiError(extractApiError(data?.error, `HTTP ${res.status}`), messageHe);
  }
  return data as T;
}

// ─── Types (mirrors backend Prisma output) ────────────────────────

export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Org {
  id: string;
  slug: string;
  name: string;
  nameHe?: string;
  logoUrl?: string;
  primaryColor?: string;
  plan?: string;
  isPremium: boolean;
  isPublished: boolean;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number };
}

export interface OrgMember {
  id: string;
  userId: string;
  orgId: string;
  role: OrgRole;
  displayName?: string;
  avatarUrl?: string;
  title?: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    createdAt?: string;
    lastLoginAt?: string;
  };
}

// ─── Organization CRUD ────────────────────────────────────────────

export const orgsApi = {
  list: () => request<Org[]>('GET', '/api/orgs'),

  create: (data: {
    name: string;
    nameHe?: string;
    logoUrl?: string;
    primaryColor?: string;
    plan?: string;
    websiteUrl?: string;
    isPremium?: boolean;
    isPublished?: boolean;
    slug?: string;
  }) => request<Org>('POST', '/api/orgs', data),

  get: (slug: string) => request<Org>('GET', `/api/orgs/${slug}`),

  update: (slug: string, data: Partial<Omit<Org, 'id' | 'slug' | 'createdAt' | 'updatedAt' | '_count'>>) =>
    request<Org>('PATCH', `/api/orgs/${slug}`, data),

  delete: (slug: string) => request<void>('DELETE', `/api/orgs/${slug}`),

  // Members
  listMembers: (slug: string) => request<OrgMember[]>('GET', `/api/orgs/${slug}/members`),

  addMember: (slug: string, email: string, role: OrgRole = 'MEMBER') =>
    request<OrgMember>('POST', `/api/orgs/${slug}/members`, { email, role }),

  updateMember: (slug: string, userId: string, data: { role?: OrgRole; displayName?: string; title?: string }) =>
    request<OrgMember>('PATCH', `/api/orgs/${slug}/members/${userId}`, data),

  removeMember: (slug: string, userId: string) =>
    request<void>('DELETE', `/api/orgs/${slug}/members/${userId}`),

  // Current user's org memberships
  myOrgs: () => request<{ role: OrgRole; org: Org }[]>('GET', '/api/user/orgs'),

  // Invites
  listInvites: (slug: string) => request<OrgInvite[]>('GET', `/api/orgs/${slug}/invites`),

  createInvite: (slug: string, data: { role?: OrgRole; label?: string; maxUses?: number; expiresInDays?: number }) =>
    request<OrgInvite>('POST', `/api/orgs/${slug}/invites`, data),

  deleteInvite: (slug: string, id: string) =>
    request<void>('DELETE', `/api/orgs/${slug}/invites/${id}`),
};

// ─── Admin Users API ──────────────────────────────────────────────

export type UserRole   = 'USER' | 'ADMIN' | 'AGENT';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type AuthProvider = 'EMAIL' | 'GOOGLE';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface TaxId {
  type: string;
  value: string;
}

export type TaxStatus = 'taxable' | 'exempt' | 'reverse_charge';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  country: string;
  provider: AuthProvider;
  createdAt: string;
  lastLoginAt?: string;
  status: UserStatus; // derived by backend
  orgMemberships: {
    role: OrgRole;
    org: { id: string; slug: string; name: string; logoUrl?: string; primaryColor?: string };
  }[];
  // Account info
  displayName?: string;
  language?: string;
  businessName?: string;
  description?: string;
  // Billing
  billingEmail?: string;
  billingAddress?: Address;
  currency?: string;
  timezone?: string;
  // Tax
  taxStatus?: TaxStatus;
  taxIds?: TaxId[];
  // Shipping
  shippingAddress?: Address;
  shippingPhone?: string;
}

export type OnboardingStep = 'workspace_setup' | 'workspace_setup_deferred' | 'business_setup' | null;
export type DashboardMode = 'tenant' | 'regular_user' | 'workspace_setup_deferred' | 'needs_workspace_setup' | 'platform_admin';
export type SkipReason = 'regular_user' | 'complete_later';

export type TenantPlan = 'basic' | 'advanced' | 'premium';

export interface TenantSeats {
  used: number;
  limit: number;
  remaining: number;
  isAtLimit: boolean;
}

export interface DashboardMe {
  user: {
    id: string;
    email: string;
    name: string;
  };
  context: {
    isTenant: boolean;
    isMember: boolean;
    mode: DashboardMode;
    tenantId: string | null;
    tenantName: string | null;
    /** Cloudinary URL of the tenant logo (pristine), or null -> show the name initials. */
    tenantLogoUrl?: string | null;
    /** Crop of the logo (normalized fractions), or null -> show the full logo. */
    tenantLogoCrop?: ImageCrop | null;
    /** Org brand color ("#rrggbb"), or null -> wallet derives one from the id. */
    tenantBrandColor?: string | null;
    memberId: string | null;
    role: string | null;
    plan?: TenantPlan;
    seats?: TenantSeats;
  };
  authorization: {
    tenantRole: string | null;
    platformRole: 'nexusAdmin' | null;
    /** True when the user is a NEXUS platform admin (NEXUS_ADMIN_EMAILS env). */
    isPlatformAdmin?: boolean;
    canSeeDevMode: boolean;
    canUseDevPlayground: boolean;
    canViewMembers: boolean;
    canManageMembers: boolean;
    /** True when the user can create or manage supply catalog offers. */
    canManageSupply?: boolean;
    /** Catalog activation mode derived from TenantServiceActivation + Tenant.status. */
    catalogMode?: 'inactive' | 'sandbox' | 'live';
    /** True when the benefits_catalog service is active for this tenant. */
    catalogServiceActive?: boolean;
    /** True when this user holds the 'member' role AND the catalog is not inactive. */
    canPurchaseCatalog?: boolean;
    /** Services this member was granted at invite time (e.g. ['benefits_catalog']). */
    memberServices?: string[];
    /** True when business setup is complete and Go Live is allowed. */
    businessSetupComplete?: boolean;
  };
  onboarding: {
    required: boolean;
    step: OnboardingStep;
  };
  /**
   * True when the user is a NEXUS platform admin. The backend returns this at the top level
   * as well as under `authorization`, so call sites may read either `me.isPlatformAdmin` or
   * `me.authorization.isPlatformAdmin`. Optional to stay backward-compatible with older payloads.
   */
  isPlatformAdmin?: boolean;
}

export interface WorkspaceSetupInput {
  organizationName: string;
  website: string;
  businessDescription: string;
  selectedUseCases: string[];
  contactPhone: string;
  contactRole: string;
}

export interface WorkspaceSetupResponse {
  success: true;
  userType: 'tenant';
  tenantId: string;
  nextStep: 'business_setup';
  redirectTo: string;
}

export interface SkipWorkspaceResponse {
  success: true;
  userType: 'tenant' | 'member' | 'deferred';
  mode: DashboardMode;
  memberId: string | null;
  redirectTo: string;
}

export interface BusinessSetupResponse {
  tenantId: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  data: Record<string, unknown>;
  updatedAt: string | null;
}

export interface WizardDraftPayload {
  step?: number;
  orgName?: string;
  website?: string;
  businessDesc?: string;
  primarySelected?: string[];
  primarySuggested?: string[];
  phone?: string;
  role?: string;
}

export const onboardingApi = {
  me: () => request<DashboardMe>('GET', '/api/me'),
  status: () => request<Pick<DashboardMe, 'context' | 'onboarding'>>('GET', '/api/onboarding/status'),
  createWorkspace: (data: WorkspaceSetupInput) =>
    request<WorkspaceSetupResponse>('POST', '/api/onboarding/workspace', data),
  skipWorkspace: (skipReason: SkipReason) =>
    request<SkipWorkspaceResponse>('POST', '/api/onboarding/skip', { skipReason }),
  loadWizardDraft: () =>
    request<{ draft: WizardDraftPayload | null }>('GET', '/api/onboarding/wizard-draft'),
  saveWizardDraft: (draft: WizardDraftPayload) =>
    request<{ ok: boolean }>('PATCH', '/api/onboarding/wizard-draft', draft),
  clearWizardDraft: () =>
    request<{ ok: boolean }>('DELETE', '/api/onboarding/wizard-draft'),
};

export const businessSetupApi = {
  get: () => request<BusinessSetupResponse>('GET', '/api/business-setup'),
  saveDraft: (data: Record<string, unknown>) =>
    request<BusinessSetupResponse>('PATCH', '/api/business-setup', { data }),
  submit: (data: Record<string, unknown>) =>
    request<BusinessSetupResponse>('POST', '/api/business-setup', { data }),
};

export type TenantRole =
  // Active tenant roles
  | 'owner'
  | 'admin'
  | 'back_office_manager'
  | 'hr_manager'
  | 'finance'
  | 'billing_manager'
  | 'payments_manager'
  | 'support_agent'
  | 'developer'
  | 'supply_manager'
  | 'member'
  // Deprecated - existing DB rows only, hidden from invite UI
  | 'operator'
  | 'analyst'
  // Platform roles
  | 'platform_admin'
  | 'platform_operator'
  | 'platform_back_office'
  | 'platform_marketing'
  | 'platform_commerce'
  | 'platform_support'
  | 'platform_finance';

export interface TenantRolePermissions {
  role: TenantRole;
  permissions: string[];
}

export interface TenantMemberListItem {
  tenantMemberId: string;
  nexusIdentityId: string;
  email: string;
  displayName: string | null;
  status: string;
  invitationStatus: string | null;
  invitationExpiresAt: string | null;
  roles: TenantRole[];
  groupIds: string[];
  joinedAt: string;
}

/** Pagination metadata returned by paged list endpoints. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** Query params accepted by GET /api/v1/tenant/members. */
export interface ListMembersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: TenantRole;
}

/** One pending invitation row shown in the admin pending-invitations panel. */
export interface PendingInvitationItem {
  invitationId: string;
  email: string;
  roles: TenantRole[];
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface TenantMemberInviteInput {
  email: string;
  displayName?: string;
  roles: TenantRole[];
  groupIds?: string[];
  employeeId?: string;
  customFields?: Record<string, unknown>;
  /**
   * Services granted to this member at invite time.
   * Omit or pass undefined to use the backend default (benefits_catalog).
   */
  services?: string[];
  /**
   * Optional Israeli mobile carried from the invite to the new member.
   * Backend accepts "+972…", dashes, spaces and normalizes to "05XXXXXXXX".
   */
  phone?: string;
  language?: 'he' | 'en';
  sendEmail?: boolean;
}

export interface TenantMemberInviteResponse {
  tenantId: string;
  tenantMemberId: string;
  nexusIdentityId: string;
  email: string;
  roles: TenantRole[];
  status: 'active';
  groupIds: string[];
  invitationId: string;
  inviteUrl: string;
  expiresAt: string;
  emailSent: boolean;
}

export interface BulkTenantMemberInviteResult {
  email: string;
  ok: boolean;
  result?: TenantMemberInviteResponse;
  error?: string;
}

/**
 * Per-row create-time outcome from POST /members/invitations/bulk-async.
 * 'ok' rows are queued for the worker; 'already_invited' and
 * 'duplicate_in_batch' rows are surfaced so the dashboard can show why a
 * given email did not get queued.
 */
export interface BulkInviteAsyncRowResult {
  email: string;
  ok: boolean;
  invitationId?: string;
  error?: string;
}

export interface BulkInviteAsyncResponse {
  jobId: string;
  totalQueued: number;
  totalSkipped: number;
  totalFailed: number;
  results: BulkInviteAsyncRowResult[];
}

export interface InviteJobStatusResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed';
  totalCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  language: 'he' | 'en';
  failedItems: { email: string; lastError?: string }[];
}

export interface TenantMemberInvitationPreview {
  invitationId?: string;
  tenantId?: string;
  tenantName: string;
  invitedEmail: string;
  roles: TenantRole[];
  status: string;
  expiresAt: string;
}

/**
 * Serialises ListMembersParams into a URL query string.
 * Skips undefined values so the backend receives only active filters.
 */
function buildMembersQuery(params?: ListMembersParams): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const tenantMembersApi = {
  list: (params?: ListMembersParams) =>
    request<{ tenantId: string; members: TenantMemberListItem[]; pagination: PaginationMeta }>(
      'GET',
      `/api/v1/tenant/members${buildMembersQuery(params)}`,
    ),
  pendingInvitations: () =>
    request<{ pendingInvitations: PendingInvitationItem[]; total: number; hasMore: boolean }>(
      'GET',
      '/api/v1/tenant/members/pending-invitations',
    ),
  roles: () => request<{ roles: TenantRolePermissions[] }>('GET', '/api/v1/tenant/roles'),
  invite: (data: TenantMemberInviteInput) =>
    request<TenantMemberInviteResponse>('POST', '/api/v1/tenant/members/invitations', data),
  bulkInvite: (invitations: TenantMemberInviteInput[], language: 'he' | 'en') =>
    request<{ results: BulkTenantMemberInviteResult[] }>('POST', '/api/v1/tenant/members/invitations/bulk', {
      invitations,
      language,
    }),
  /**
   * Production-scale bulk invite. Returns immediately with a jobId that the
   * dashboard polls for delivery progress. Caller is responsible for chunking
   * if the row count exceeds the server cap (1000).
   */
  bulkInviteAsync: (invitations: TenantMemberInviteInput[], language: 'he' | 'en') =>
    request<BulkInviteAsyncResponse>('POST', '/api/v1/tenant/members/invitations/bulk-async', {
      invitations,
      language,
    }),
  getInviteJobStatus: (jobId: string) =>
    request<InviteJobStatusResponse>(
      'GET',
      `/api/v1/tenant/members/invitations/jobs/${encodeURIComponent(jobId)}`,
    ),
  retryInviteJobFailed: (jobId: string) =>
    request<{ requeued: number }>(
      'POST',
      `/api/v1/tenant/members/invitations/jobs/${encodeURIComponent(jobId)}/retry-failed`,
    ),
  updateRoles: (tenantMemberId: string, roles: TenantRole[]) =>
    request<{ roles: TenantRole[] }>(
      'PATCH',
      `/api/v1/tenant/members/${encodeURIComponent(tenantMemberId)}/roles`,
      { roles },
    ),
  updateEmail: (tenantMemberId: string, email: string) =>
    request<{ tenantMemberId: string; invitationId: string }>(
      'PATCH',
      `/api/v1/tenant/members/${encodeURIComponent(tenantMemberId)}/email`,
      { email },
    ),
  remove: (tenantMemberId: string) =>
    request<void>('DELETE', `/api/v1/tenant/members/${encodeURIComponent(tenantMemberId)}`),
};

// ─── Tenant Contacts ─────────────────────────────────────────────

/** Value type a custom contact column can hold. */
export type ContactFieldType = 'free_text' | 'number' | 'date' | 'single_label' | 'multi_label' | 'location';

/** A tenant-defined custom column on the contacts table. */
export interface ContactField {
  fieldId: string;
  name: string;
  type: ContactFieldType;
  /** Allowed values for single_label / multi_label columns. */
  options?: string[];
  order: number;
  /** 'manual' (default) or 'wallet_profile' for read-only mirror columns. */
  origin?: 'manual' | 'wallet_profile';
  /** Stable mirror-field key when origin === 'wallet_profile'. */
  sourceFieldKey?: string;
}

/** One option label pair for a wallet mirror field. */
export interface WalletMirrorOption {
  value: string;
  labelEn: string;
  labelHe: string;
}

/** A wallet onboarding field that mirrors into contacts (from the backend registry). */
export interface WalletProfileFieldDef {
  sourceFieldKey: string;
  profileKey: string;
  columnType: 'multi_label' | 'single_label' | 'date' | 'free_text';
  labelEn: string;
  labelHe: string;
  options?: WalletMirrorOption[];
}

/** A joiner's mirrorable onboarding answers, captured at request time. */
export interface JoinAnswersSnapshot {
  purpose?: string[];
  lifeStage?: string;
  gender?: string;
  birthday?: string;
  motivation?: string;
}

/** One custom-column filter sent to the contacts list endpoint. */
export interface ContactCustomFilter {
  fieldId: string;
  op: 'contains' | 'range' | 'in';
  value: unknown;
}

export interface TenantContact {
  tenantContactId: string;
  email: string;
  displayName: string;
  status: 'active' | 'inactive' | 'pending' | 'expired';
  address: string | null;
  /** Canonical Israeli mobile number ("05XXXXXXXX") or null when not provided. */
  phone: string | null;
  /** True only when the member verified the number themselves (SMS / wallet OTP).
   *  Tenant-entered or test-attached numbers are false. */
  phoneVerified: boolean;
  /** Custom-column values keyed by fieldId; empty/undefined when none set. */
  customFields?: Record<string, unknown>;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ListContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  /** Active custom-column filters (serialized as a JSON query param). */
  customFilters?: ContactCustomFilter[];
}

function buildContactsQuery(params?: ListContactsParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    if (k === 'customFilters') {
      if (Array.isArray(v) && v.length) sp.set('customFilters', JSON.stringify(v));
      continue;
    }
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/** Payload shape for creating/updating a contact (custom values optional). */
type ContactWritePayload = {
  email?: string;
  displayName?: string;
  address?: string;
  phone?: string;
  customFields?: Record<string, unknown>;
};

export const tenantContactsApi = {
  list: (params?: ListContactsParams) =>
    request<{ tenantId: string; contacts: TenantContact[]; pagination: PaginationMeta }>(
      'GET',
      `/api/v1/tenant/contacts${buildContactsQuery(params)}`,
    ),
  create: (data: ContactWritePayload & { email: string }) =>
    request<TenantContact>('POST', '/api/v1/tenant/contacts', data),
  update: (contactId: string, data: ContactWritePayload) =>
    request<TenantContact>('PATCH', `/api/v1/tenant/contacts/${encodeURIComponent(contactId)}`, data),
  importContacts: (rows: Array<ContactWritePayload & { email: string }>) =>
    request<ContactImportResult>('POST', '/api/v1/tenant/contacts/import', { rows }),
  updateEmail: (tenantContactId: string, email: string) =>
    request<{ ok: boolean }>(
      'PATCH',
      `/api/v1/tenant/contacts/${encodeURIComponent(tenantContactId)}/email`,
      { email },
    ),
  remove: (tenantContactId: string) =>
    request<void>('DELETE', `/api/v1/tenant/contacts/${encodeURIComponent(tenantContactId)}`),
};

/** Tenant-defined custom columns on the contacts table (tenant-admin only). */
export const tenantContactFieldsApi = {
  list: () => request<{ fields: ContactField[] }>('GET', '/api/v1/tenant/contact-fields'),
  create: (data: { name: string; type: ContactFieldType; options?: string[] }) =>
    request<ContactField>('POST', '/api/v1/tenant/contact-fields', data),
  rename: (fieldId: string, name: string) =>
    request<ContactField>('PATCH', `/api/v1/tenant/contact-fields/${encodeURIComponent(fieldId)}`, { name }),
  remove: (fieldId: string) =>
    request<{ ok: true }>('DELETE', `/api/v1/tenant/contact-fields/${encodeURIComponent(fieldId)}`),
  reorder: (order: Array<{ fieldId: string; order: number }>) =>
    request<{ fields: ContactField[] }>('PATCH', '/api/v1/tenant/contact-fields/reorder', { order }),
};

/** Read the wallet mirror-field registry (labels + options, both languages). */
export const walletProfileFieldsApi = {
  list: () => request<{ fields: WalletProfileFieldDef[] }>('GET', '/api/v1/wallet/profile-fields'),
};

export const tenantMemberInvitationsApi = {
  mine: () =>
    request<{ invitations: TenantMemberInvitationPreview[] }>('GET', '/api/v1/member-invitations/mine'),
  get: (token: string) =>
    request<TenantMemberInvitationPreview>('GET', `/api/v1/member-invitations/${encodeURIComponent(token)}`),
  accept: (token: string) =>
    request<{ tenantId: string; roles: TenantRole[]; alreadyAccepted: boolean }>(
      'POST',
      `/api/v1/member-invitations/${encodeURIComponent(token)}/accept`,
    ),
  acceptMine: (invitationId: string) =>
    request<{ tenantId: string; roles: TenantRole[]; alreadyAccepted: boolean }>(
      'POST',
      `/api/v1/member-invitations/mine/${encodeURIComponent(invitationId)}/accept`,
    ),
};

/**
 * Tenant-admin join-request management. Backed by
 * /api/v1/tenant/join-requests in nexus-website/backend (Plan #4).
 * Each entry represents a wallet user asking to be added to this
 * tenant; admin approves -> becomes member, or denies (optional reason).
 */
export interface TenantJoinRequestItem {
  id: string;
  nexusIdentityId: string;
  email: string;
  displayName: string | null;
  status: 'pending' | 'approved' | 'denied' | 'auto_accepted';
  createdAt: string;
  /** Present when the joiner answered onboarding questions; null otherwise. */
  answersSnapshot?: JoinAnswersSnapshot | null;
}

/** Organization logo upload/remove (Cloudinary, tenant-admin only). */
export const tenantLogoApi = {
  /** Upload the pristine logo + an optional crop (applied at display time). */
  upload: (file: File, crop?: ImageCrop | null) => {
    const fd = new FormData();
    fd.append('logo', file, file.name || 'logo');
    if (crop) fd.append('crop', JSON.stringify(crop));
    return request<{ logoUrl: string; logoCrop: ImageCrop | null }>('POST', '/api/v1/tenant/logo', fd);
  },
  /** Set or clear the logo crop without re-uploading (adjust, or revert to full photo). */
  setCrop: (crop: ImageCrop | null) =>
    request<{ logoCrop: ImageCrop | null }>('PATCH', '/api/v1/tenant/logo/crop', { crop }),
  /** Remove the logo (revert to the tenant-name initials). */
  remove: () => request<{ ok: true }>('DELETE', '/api/v1/tenant/logo'),
};

/** Organization brand color (tenant-admin only). Drives the wallet first-login
 *  accent. Pass a "#rrggbb" hex to set, or null to clear (wallet falls back to
 *  a color derived from the tenant id). */
export const tenantBrandColorApi = {
  set: (brandColor: string | null) =>
    request<{ brandColor: string | null }>('PATCH', '/api/v1/tenant/brand-color', { brandColor }),
};

export const tenantJoinRequestsApi = {
  /** List pending join requests for the calling tenant admin. */
  list: () =>
    request<{ requests: TenantJoinRequestItem[] }>('GET', '/api/v1/tenant/join-requests'),
  /** Approve a single pending request - creates member role + tenantMember row. */
  approve: (id: string) =>
    request<{ status: 'approved'; tenantId: string; nexusIdentityId: string }>(
      'PATCH',
      `/api/v1/tenant/join-requests/${encodeURIComponent(id)}`,
      { decision: 'approve' },
    ),
  /** Deny a single pending request. Reason is shown to the user via email. */
  deny: (id: string, reason?: string) =>
    request<{ status: 'denied'; tenantId: string; nexusIdentityId: string }>(
      'PATCH',
      `/api/v1/tenant/join-requests/${encodeURIComponent(id)}`,
      { decision: 'deny', ...(reason ? { reason } : {}) },
    ),
  /**
   * Read the tenant's auto-accept setting. When true, new wallet join
   * requests are accepted instantly instead of landing in the pending list.
   * Requires tenant-admin auth (enforced server-side).
   */
  getSettings: () =>
    request<{ autoAcceptEnabled: boolean }>(
      'GET',
      '/api/v1/tenant/join-requests/settings',
    ),
  /**
   * Update the tenant's auto-accept setting.
   * Input: autoAcceptEnabled - the desired on/off state.
   * Output: the persisted setting echoed back by the backend.
   */
  updateSettings: (autoAcceptEnabled: boolean) =>
    request<{ autoAcceptEnabled: boolean }>(
      'PATCH',
      '/api/v1/tenant/join-requests/settings',
      { autoAcceptEnabled },
    ),
};

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
}

export const usersApi = {
  list: (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.role)   qs.set('role',   params.role);
    if (params?.status) qs.set('status', params.status);
    if (params?.page)   qs.set('page',   String(params.page));
    if (params?.limit)  qs.set('limit',  String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<AdminUsersResponse>('GET', `/api/admin/users${query}`);
  },

  get: (id: string) =>
    request<AdminUser>('GET', `/api/admin/users/${id}`),

  update: (id: string, data: Partial<Pick<AdminUser, 'fullName' | 'phone' | 'jobTitle' | 'emailVerified'> & { role: UserRole }>) =>
    request<AdminUser>('PATCH', `/api/admin/users/${id}`, data),

  delete: (id: string) =>
    request<void>('DELETE', `/api/admin/users/${id}`),
};

// ─── Transactions API ─────────────────────────────────────────────

export type TransactionStatus = 'pending' | 'successful' | 'declined' | 'refunded' | 'chargeback' | 'authorized' | 'voided';
export type TransactionType = 'payment' | 'payout' | 'topup' | 'refund' | 'third_party';
export type PaymentMethod = 'bit' | 'apple_pay' | 'google_pay' | 'paypal' | 'alipay_qr' | 'credit_card' | 'il_direct_debit' | 'bank_transfer' | 'funds_transfer' | 'cash' | 'check' | 'pos' | 'echeck' | 'multi';
export type TransactionChannel = 'club' | 'direct';

export interface Transaction {
  id: string;
  date: string;
  customerName: string;
  product: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  transactionDate: string;
  amount: number;
  currency: string;
  transactionId: string;
  type: TransactionType;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
}

export const transactionsApi = {
  list: (params?: {
    search?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentMethod?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    if (params?.type) qs.set('type', params.type);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    if (params?.paymentMethod) qs.set('paymentMethod', params.paymentMethod);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<TransactionsResponse>('GET', `/api/transactions${query}`);
  },
  get: (id: string) => request<Transaction>('GET', `/api/transactions/${id}`),
};

// ─── Public Invite API ────────────────────────────────────────────

export interface OrgInvite {
  id: string;
  token: string;
  role: OrgRole;
  label?: string;
  orgId: string;
  maxUses?: number;
  useCount: number;
  expiresAt?: string;
  createdAt: string;
  org?: Pick<Org, 'id' | 'slug' | 'name' | 'nameHe' | 'logoUrl' | 'primaryColor'> & { _count?: { members: number } };
}

export const invitesApi = {
  get: (token: string) => request<OrgInvite>('GET', `/api/invites/${token}`),
  accept: (token: string) =>
    request<{ membership: OrgMember; org: OrgInvite['org']; alreadyMember: boolean }>(
      'POST',
      `/api/invites/${token}/accept`,
    ),
};

// ─── Supply & Catalog ─────────────────────────────────────────────────────────

/**
 * A single catalog offer as seen by a tenant admin (platform view) or member.
 * isAdopted reflects whether this tenant has included the offer in their catalog.
 */
export interface CatalogItem {
  offerId: string;
  title: string;
  description: string;
  /** Legacy single cover URL. Equals `imageUrls[0]` when a gallery exists. */
  imageUrl?: string;
  /** Ordered gallery of public image URLs (max 6). Index 0 is the cover. */
  imageUrls?: string[];
  /**
   * Per-image crop metadata keyed by original URL. The URLs above are the
   * pristine originals; render with `buildOfferImageUrl` to apply the crop.
   */
  imageCrops?: ImageCropEntry[];
  category: string;
  /** 'ecosystem' (visible to every tenant) or 'tenant_only' (visible only to the creating tenant). */
  visibility: 'ecosystem' | 'tenant_only' | string;
  market_price?: number;
  isAdopted: boolean;
  adoptedAt?: string;
  createdByTenantId: string;
  /** Creating tenant's org name (NEXUS for platform-created offers). */
  createdByTenantName?: string;
  /** Creating tenant's logo URL, when set. */
  createdByTenantLogoUrl?: string;
  /** Creating tenant's brand color (#rrggbb), for an initials avatar fallback. */
  createdByTenantBrandColor?: string;
  /** Crop of the creating tenant's logo (normalized fractions), applied at display time. */
  createdByTenantLogoCrop?: ImageCrop | null;
  /** Delivery mechanism for this offer (voucher, coupon, gift_card, product, service). */
  executionType: string;
  /** Maximum number of units that can be redeemed. Null means unlimited. */
  stockLimit: number | null;
  /** Units remaining after redemptions. Null when stock tracking is disabled. */
  stockAvailable: number | null;
  /** True when stockLimit is set and stockAvailable has reached 0. */
  isSoldOut: boolean;
  /** Redemption URL set by the offer creator. */
  implementationLink?: string | null;
  /** Step-by-step redemption instructions. */
  implementationInstructions?: string;
  /** Date the offer becomes visible to members (ISO string). null = immediately. */
  validFrom?: string | null;
  /** Offer expiry date as ISO string (serialised from backend Date). Always null for vouchers. */
  validUntil?: string | null;
  /** Voucher validity TYPE default ('limit' | 'from_until'). Voucher-only; null
   *  otherwise. The validity VALUE is per inventory unit (voucher-validity-dating). */
  defaultValidityType?: 'limit' | 'from_until' | null;
  /** Whether the voucher may be combined with other promotions. Voucher-only; null otherwise. */
  voucherStackable?: boolean | null;
  /** Voucher card background color ("#rrggbb"). Voucher-only; null otherwise. */
  voucherBackgroundColor?: string | null;
  /** Voucher SKU / internal company code. Voucher-only; null otherwise. */
  sku?: string | null;
  /** Terms and conditions text. */
  terms?: string;
  /** Display tags set by the offer creator. */
  tags: string[];
  /** Voucher face value - nominal value printed on the voucher (voucher executionType only). */
  face_value?: number;
  /** What members pay for this voucher; between nexus_cost and face_value (voucher only). */
  member_price?: number;
  /**
   * Wholesale price NEXUS pays the supplier per voucher.
   * Only returned to the creating tenant and platform admins.
   */
  nexus_cost?: number;
  /** Offer's current approval status: 'active' | 'pending_approval' | 'denied'. */
  approval_status?: string;
  /** Denial reason - only returned to the creating tenant when status is 'denied'. */
  denial_reason?: string;
  /** Per-tenant override of voucher member price (admin view only). */
  tenantMemberPrice?: number;
  /** Per-tenant denormalized display price (admin view only). */
  tenantDisplayPrice?: number;
  /** Whether redemption terms/method are shared across variants or per variant. */
  redemptionScope?: 'shared' | 'per_variant';
  /**
   * Voucher variants (priced configurations). Present only for voucher offers
   * that carry variants. `nexus_cost` is included only for privileged callers.
   */
  variants?: CatalogVariant[];
}

/**
 * A voucher variant as exposed by the catalog read. Mirrors the stored variant;
 * `nexus_cost` is present only for the creating tenant / platform admin.
 */
export interface CatalogVariant {
  variantId: string;
  face_value?: number;
  nexus_cost?: number;
  member_price?: number;
  /** Raw offer base sale price (member_price) before this tenant's markup. */
  baseMemberPrice?: number;
  /** This tenant's stored markup % (0 when none). */
  tenantMarkupPct?: number;
  voucherStackable?: boolean | null;
  sku?: string | null;
  tags?: string[];
  terms?: string;
  implementationInstructions?: string;
}

/**
 * Per-tenant offer configuration row. Tracks adoption state plus any
 * per-tenant price overrides for the given offer.
 */
export interface TenantOfferConfig {
  tenantId: string;
  offerId: string;
  adoptionStatus: 'active' | 'excluded';
  memberPrice?: number;
  displayPrice?: number;
}

/**
 * A NEXUS platform offer as stored in the supply catalog.
 * Returned on creation.
 */
export interface NexusOffer {
  offerId: string;
  title: string;
  description: string;
  /** Legacy single cover URL. Equals `imageUrls[0]` when a gallery exists. */
  imageUrl?: string;
  /** Ordered gallery of public image URLs (max 6). Index 0 is the cover. */
  imageUrls?: string[];
  /** Per-image crop metadata keyed by original URL (full image when absent). */
  imageCrops?: ImageCropEntry[];
  category: string;
  market_price?: number;
  /** Offer lifecycle status. */
  status: 'draft' | 'active' | 'inactive' | 'pending_approval' | 'denied';
  visibility: string;
  createdByTenantId: string;
  createdAt: string;
  updatedAt: string;
  /** Delivery mechanism for this offer (voucher, coupon, gift_card, product, service). */
  executionType: string;
  /** Maximum number of units that can be redeemed. Null means unlimited. */
  stockLimit: number | null;
  /** Number of units already consumed by redemptions. */
  stockUsed: number;
  implementationLink?: string | null;
  implementationInstructions?: string;
  /** Date the offer becomes visible to members (ISO string). null = immediately. */
  validFrom?: string | null;
  /** Offer expiry date. Always null for vouchers (they use unit-level dating instead). */
  validUntil?: string | null;
  /** Voucher validity TYPE default ('limit' | 'from_until'). Voucher-only; null
   *  otherwise. The validity VALUE is per inventory unit (voucher-validity-dating). */
  defaultValidityType?: 'limit' | 'from_until' | null;
  /** Whether the voucher may be combined with other promotions. Voucher-only; null otherwise. */
  voucherStackable?: boolean | null;
  /** Voucher card background color ("#rrggbb"). Voucher-only; null otherwise. */
  voucherBackgroundColor?: string | null;
  /** Voucher SKU / internal company code. Voucher-only; null otherwise. */
  sku?: string | null;
  terms?: string;
  tags?: string[];
  /** Voucher face value - nominal value printed on the voucher (voucher executionType only). */
  face_value?: number;
  /**
   * Wholesale price NEXUS pays the supplier per voucher.
   * Only returned to the creating tenant and platform admins.
   */
  nexus_cost?: number;
  /** What members pay for this voucher; between nexus_cost and face_value (voucher only). */
  member_price?: number;
  /** Denial reason - only set when status is 'denied'. */
  denial_reason?: string;
  /** Whether redemption terms/method are shared across variants or per variant. */
  redemptionScope?: 'shared' | 'per_variant';
  /** Voucher variants with their server-generated variantIds (returned on create/update). */
  variants?: CatalogVariant[];
}

/**
 * Maps each offer execution type value to a bilingual label and icon.
 * Consumers should read `label` (EN) or `labelHe` (HE) based on current language.
 * Used across CreateOffer, EditOfferDrawer, BenefitsPartnerships, ProductCatalog, and OfferModal.
 */
export const EXECUTION_TYPE_LABELS: Record<string, { label: string; labelHe: string; icon: string }> = {
  voucher:   { label: 'Voucher',   labelHe: 'שובר',       icon: '🎟' },
  coupon:    { label: 'Coupon',    labelHe: 'קוד קופון',   icon: '%'  },
  gift_card: { label: 'Gift Card', labelHe: 'כרטיס מתנה', icon: '🎁' },
  product:   { label: 'Product',   labelHe: 'מוצר',       icon: '📦' },
  service:   { label: 'Service',   labelHe: 'שירות',      icon: '⚡' },
};

/**
 * Static list of offer category options shared across supply/catalog UI.
 * Values match the backend enum; labels are display strings.
 */
export const OFFER_CATEGORIES = [
  { value: 'food_beverage',   label: 'Food & Beverage',   labelHe: 'אוכל ומשקאות' },
  { value: 'fashion',         label: 'Fashion',            labelHe: 'אופנה' },
  { value: 'health_wellness', label: 'Health & Wellness',  labelHe: 'בריאות ורווחה' },
  { value: 'entertainment',   label: 'Entertainment',      labelHe: 'בידור' },
  { value: 'travel',          label: 'Travel',             labelHe: 'טיסות ונופש' },
  { value: 'technology',      label: 'Technology',         labelHe: 'טכנולוגיה' },
  { value: 'education',       label: 'Education',          labelHe: 'חינוך' },
  { value: 'financial',       label: 'Financial',          labelHe: 'פיננסי' },
  { value: 'home_living',     label: 'Home & Living',      labelHe: 'בית ומגורים' },
  { value: 'other',           label: 'Other',              labelHe: 'אחר' },
] as const;

/**
 * Server-side catalog query parameters. Mirrors the backend Zod schema in
 * offers.routes.ts. Empty / undefined fields mean "no constraint".
 */
export interface CatalogQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  approvalStatus?: 'active' | 'pending_approval' | 'denied' | 'expired';
  adoptionStatus?: 'adopted' | 'not_adopted';
  /** When true, return only offers this tenant created (not adopted ones). */
  ownedOnly?: boolean;
  /** Filter by one or more offer execution types (e.g. 'voucher', 'booking'). */
  offerTypes?: string[];
  /** Minimum selling price filter (inclusive). */
  priceMin?: number;
  /** Maximum selling price filter (inclusive). */
  priceMax?: number;
  /** ISO-8601 date string; return only offers whose validFrom is after this date. */
  validFromAfter?: string;
  /** ISO-8601 date string; return only offers whose validUntil is before this date. */
  validUntilBefore?: string;
  /** Free-text tags to filter on (server matches any tag in the array). */
  tags?: string[];
  /** When true, exclude out-of-stock offers. */
  inStockOnly?: boolean;
  /** Result ordering. Defaults to 'newest' when omitted. */
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'expiry_soon' | 'expiry_far';
}

/** Paginated response envelope returned by both catalog endpoints. */
export interface CatalogPage {
  items: CatalogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Builds a URL query string from a CatalogQuery, dropping empty / undefined
 * fields so the server sees only the filters the caller actually set.
 * Numbers are stringified; enums and the search string are URI-encoded.
 */
function catalogQueryToParams(q: CatalogQuery): string {
  const u = new URLSearchParams();
  // Pagination - always sent so the server never has to guess defaults.
  if (q.page) u.set('page', String(q.page));
  if (q.limit) u.set('limit', String(q.limit));
  // Text / category filters.
  if (q.search && q.search.trim()) u.set('search', q.search.trim());
  if (q.category) u.set('category', q.category);
  // Status filters used by the admin (platform) catalog view.
  if (q.approvalStatus) u.set('approvalStatus', q.approvalStatus);
  if (q.adoptionStatus) u.set('adoptionStatus', q.adoptionStatus);
  if (q.ownedOnly) u.set('ownedOnly', 'true');
  // Extended server-side filters (Task 11 - mirrors backend CatalogQuery Zod schema).
  if (q.offerTypes && q.offerTypes.length > 0) {
    u.set('offerTypes', q.offerTypes.join(','));
  }
  if (q.priceMin != null) u.set('priceMin', String(q.priceMin));
  if (q.priceMax != null) u.set('priceMax', String(q.priceMax));
  if (q.validFromAfter) u.set('validFromAfter', q.validFromAfter);
  if (q.validUntilBefore) u.set('validUntilBefore', q.validUntilBefore);
  if (q.tags && q.tags.length > 0) u.set('tags', q.tags.join(','));
  if (q.inStockOnly) u.set('inStockOnly', 'true');
  // 'newest' is the server default - omit it to keep URLs clean.
  if (q.sort && q.sort !== 'newest') u.set('sort', q.sort);
  return u.toString();
}

/**
 * Fetches one page of platform offers with per-tenant adoption status (admin view).
 * Matches GET /api/v1/offers/platform.
 * Input: CatalogQuery - page + filters.
 * Output: CatalogPage with items + pagination metadata.
 */
export async function getPlatformOffers(query: CatalogQuery): Promise<CatalogPage> {
  const data = await request<CatalogPage>(
    'GET',
    `/api/v1/offers/platform?${catalogQueryToParams(query)}`,
  );
  return data;
}

/**
 * Fetches a single offer's full detail record.
 * Matches GET /api/v1/offers/:offerId/details.
 * Input: offerId - the platform offer identifier.
 * Output: CatalogItem detail, or null when the offer is not found.
 */
export async function getOfferDetails(offerId: string): Promise<CatalogItem | null> {
  const data = await request<{ offer: CatalogItem }>(
    'GET',
    `/api/v1/offers/${encodeURIComponent(offerId)}/details`,
  );
  return data.offer;
}

/**
 * Adopts a platform offer into this tenant's catalog.
 * Matches POST /api/v1/offers/:offerId/adopt.
 * Input: offerId - the platform offer to adopt.
 * Output: void on success; throws on error.
 */
export async function adoptOffer(offerId: string): Promise<void> {
  await request<void>('POST', `/api/v1/offers/${encodeURIComponent(offerId)}/adopt`);
}

/**
 * Removes (excludes) an adopted offer from this tenant's catalog.
 * Matches DELETE /api/v1/offers/:offerId/adopt.
 * Input: offerId - the platform offer to remove from the catalog.
 * Output: void on success; throws on error.
 */
export async function excludeOffer(offerId: string): Promise<void> {
  await request<void>('DELETE', `/api/v1/offers/${encodeURIComponent(offerId)}/adopt`);
}

/**
 * Set the caller-tenant's voucher markup percentage for one offer/variant.
 * Backend resolves the tenant from the session - the caller never
 * supplies tenantId. The % is applied to the offer's base sale price and
 * the effective price is recomputed + cached server-side.
 *
 * Matches PATCH /api/v1/offers/:offerId/tenant-price.
 * Input:  offerId, markupPct (>= 0), optional variantId.
 * Output: updated TenantOfferConfig row.
 * Errors: 400 (bounds / non-voucher), 403 (not adopted), 404 (offer gone).
 */
export async function updateTenantVoucherPrice(
  offerId: string,
  markupPct: number,
  variantId?: string,
): Promise<{ config: TenantOfferConfig }> {
  return request<{ config: TenantOfferConfig }>(
    'PATCH',
    `/api/v1/offers/${encodeURIComponent(offerId)}/tenant-price`,
    { markupPct, ...(variantId !== undefined && { variantId }) },
  );
}

/**
 * Permanently deletes a platform offer (supply manager / platform admin only).
 * Matches DELETE /api/v1/offers/:offerId.
 * Input: offerId - the offer to delete.
 * Output: void on success; throws on error.
 */
export async function deleteOffer(offerId: string): Promise<void> {
  await request<void>('DELETE', `/api/v1/offers/${encodeURIComponent(offerId)}`);
}

/**
 * Creates a new platform offer, uploading the image as multipart/form-data.
 * Matches POST /api/v1/offers.
 * Input: FormData with fields: title, description, category, and optionally
 *        market_price and an image file.
 * Output: the created NexusOffer record returned by the backend.
 */
export async function createOfferApi(formData: FormData): Promise<NexusOffer> {
  // FormData body triggers the request() helper to omit Content-Type so the
  // browser can set the correct multipart/form-data boundary automatically.
  const data = await request<{ offer: NexusOffer }>('POST', '/api/v1/offers', formData);
  return data.offer;
}

/**
 * PATCHes an existing offer. Sends multipart/form-data when imageFile is provided
 * (required by the backend multer handler). Sends JSON otherwise.
 * Only the offer creator or platform admin can call this - the backend
 * enforces ownership before applying the update.
 *
 * Input: offerId - the offer to update; data - all editable offer fields plus
 *        optional imageFile for image replacement.
 * Output: Updated NexusOffer.
 */
export async function updateOfferApi(
  offerId: string,
  formData: FormData,
): Promise<NexusOffer> {
  // Caller is responsible for assembling the FormData with `images[]` files
  // and a JSON `keptImageUrls` array. We forward it unchanged; the request()
  // helper omits Content-Type so the browser sets the multipart boundary.
  const res = await request<{ offer: NexusOffer }>('PATCH', `/api/v1/offers/${offerId}`, formData);
  return res.offer;
}

/** A link inventory item: an http(s) URL with an optional paired code. */
export interface OfferLinkItem {
  url: string;
  /** Optional coupon/redemption code paired with the link (safe charset, server-validated). */
  code?: string;
}

/** Payload for adding voucher inventory: barcode strings OR a list of links+codes. */
export interface OfferInventoryInput {
  kind: 'barcode' | 'link';
  /** Required when kind === 'barcode': the provider-supplied barcode strings. */
  values?: string[];
  /** Required when kind === 'link': the links, each with an optional code. */
  links?: OfferLinkItem[];
  /**
   * Per-batch validity stamped onto every unit (voucher-validity-dating). Supply
   * the set matching the variant's effective type: `limit` -> validityValue +
   * validityUnit; `from_until` -> validFrom + validUntil (ISO date strings).
   */
  validityValue?: number | null;
  validityUnit?: 'days' | 'months' | 'years' | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

/** Result of an inventory call: units created + the offer's new stock total. */
export interface OfferInventoryResult {
  created: number;
  stockLimit: number;
}

/**
 * Appends redeemable inventory (mock barcodes or real links) to a voucher offer.
 * Matches POST /api/v1/offers/:offerId/inventory (admin-gated, voucher-only).
 *
 * Input: offerId, and an OfferInventoryInput (barcode quantity or link list).
 * Output: { created, stockLimit }. Throws on validation / authorization failure.
 */
export async function addOfferInventory(
  offerId: string,
  input: OfferInventoryInput,
): Promise<OfferInventoryResult> {
  return request<OfferInventoryResult>('POST', `/api/v1/offers/${offerId}/inventory`, input);
}

/**
 * Appends redeemable inventory to ONE variant of a voucher offer.
 * Matches POST /api/v1/offers/:offerId/variants/:variantId/inventory.
 * Inventory is owned per variant, so this is the path used by the variant-aware
 * authoring + edit flows. Throws on validation / authorization failure (incl.
 * 409 on a global barcode collision or a one-kind-per-variant mismatch).
 */
export async function addVariantInventory(
  offerId: string,
  variantId: string,
  input: OfferInventoryInput,
): Promise<OfferInventoryResult & { variantCount?: number }> {
  return request<OfferInventoryResult & { variantCount?: number }>(
    'POST',
    `/api/v1/offers/${offerId}/variants/${variantId}/inventory`,
    input,
  );
}

/** One inventory unit as shown in the management surface (dates are ISO strings). */
export interface InventoryUnitView {
  codeId: string;
  kind: 'barcode' | 'link';
  value: string;
  code?: string;
  status: 'available' | 'assigned' | 'redeemed';
  validityValue?: number | null;
  validityUnit?: 'days' | 'months' | 'years' | null;
  validFrom?: string | null;
  validUntil?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** A page of a variant's inventory units plus the total matching the filter. */
export interface InventoryUnitPage {
  units: InventoryUnitView[];
  total: number;
  page: number;
  pageSize: number;
}

/** Date filter for the management list. Expiring choices are fixed windows. */
export interface UnitDateFilter {
  from?: string;
  until?: string;
  expiringWithin?: '1m' | '3m' | '1y';
  noWindow?: boolean;
  /** Created-at range (ISO date strings). */
  createdFrom?: string;
  createdTo?: string;
  /** Updated-at range (ISO date strings). */
  updatedFrom?: string;
  updatedTo?: string;
  /** Case-insensitive substring match on the code value / link code. */
  search?: string;
}

/**
 * Lists a variant's inventory units (paged + date-filtered) for the management
 * surface. Matches GET /api/v1/offers/:offerId/variants/:variantId/inventory/units.
 */
export async function listVariantUnits(
  offerId: string,
  variantId: string,
  filter: UnitDateFilter = {},
  page = 1,
  pageSize = 50,
): Promise<InventoryUnitPage> {
  const u = new URLSearchParams();
  if (filter.from) u.set('from', filter.from);
  if (filter.until) u.set('until', filter.until);
  if (filter.expiringWithin) u.set('expiringWithin', filter.expiringWithin);
  if (filter.noWindow) u.set('noWindow', 'true');
  if (filter.createdFrom) u.set('createdFrom', filter.createdFrom);
  if (filter.createdTo) u.set('createdTo', filter.createdTo);
  if (filter.updatedFrom) u.set('updatedFrom', filter.updatedFrom);
  if (filter.updatedTo) u.set('updatedTo', filter.updatedTo);
  if (filter.search && filter.search.trim()) u.set('search', filter.search.trim());
  u.set('page', String(page));
  u.set('pageSize', String(pageSize));
  return request<InventoryUnitPage>(
    'GET',
    `/api/v1/offers/${offerId}/variants/${variantId}/inventory/units?${u.toString()}`,
  );
}

/** The validity to set on one unit (the set matching its variant's effective type). */
export interface UnitValidityPatch {
  validityValue?: number | null;
  validityUnit?: 'days' | 'months' | 'years' | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

/**
 * Edits ONE unit's validity. Matches
 * PATCH /api/v1/offers/:offerId/variants/:variantId/inventory/:codeId.
 */
export async function updateUnitValidity(
  offerId: string,
  variantId: string,
  codeId: string,
  validity: UnitValidityPatch,
): Promise<{ unit: InventoryUnitView }> {
  return request<{ unit: InventoryUnitView }>(
    'PATCH',
    `/api/v1/offers/${offerId}/variants/${variantId}/inventory/${codeId}`,
    validity,
  );
}

/** One unit's before -> after validity in a bulk-update response. */
export interface UnitValidityChange {
  codeId: string;
  value: string;
  before: UnitValidityPatch;
  after: UnitValidityPatch;
}

/** Bulk-update response: count + per-unit from->to + who/when (audit). */
export interface BulkUpdateResult {
  updated: number;
  changes: UnitValidityChange[];
  updatedBy: { identityId: string; tenantId: string };
  updatedAt: string;
}

/**
 * Re-stamps the validity of MANY units in one request. Matches
 * PATCH /api/v1/offers/:offerId/variants/:variantId/inventory (bulk). The response
 * reports how many changed, the per-unit before->after, and who/when (audit).
 */
export async function bulkUpdateUnitValidity(
  offerId: string,
  variantId: string,
  codeIds: string[],
  validity: UnitValidityPatch,
): Promise<BulkUpdateResult> {
  return request<BulkUpdateResult>(
    'PATCH',
    `/api/v1/offers/${offerId}/variants/${variantId}/inventory`,
    { codeIds, ...validity },
  );
}

/**
 * Deletes ONE inventory unit. Matches
 * DELETE /api/v1/offers/:offerId/variants/:variantId/inventory/:codeId.
 */
export async function deleteVariantUnit(
  offerId: string,
  variantId: string,
  codeId: string,
): Promise<{ deleted: boolean; stockLimit: number }> {
  return request<{ deleted: boolean; stockLimit: number }>(
    'DELETE',
    `/api/v1/offers/${offerId}/variants/${variantId}/inventory/${codeId}`,
  );
}

/** Summary of an offer's existing inventory: code values + per-kind counts. */
export interface OfferInventorySummary {
  /** Existing barcode values (used to pre-fill the edit popup). */
  barcodes: string[];
  links: string[];
  counts: { barcode: number; link: number };
}

/**
 * Reads an offer's inventory summary (existing link values + counts) so the
 * Edit popup can pre-fill them. Matches GET /api/v1/offers/:offerId/inventory.
 */
export async function getOfferInventory(offerId: string): Promise<OfferInventorySummary> {
  return request<OfferInventorySummary>('GET', `/api/v1/offers/${offerId}/inventory`);
}

/**
 * Reads ONE variant's inventory summary (existing link values + counts) so the
 * Edit popup can pre-fill them. Matches
 * GET /api/v1/offers/:offerId/variants/:variantId/inventory.
 */
export async function getVariantInventory(
  offerId: string,
  variantId: string,
): Promise<OfferInventorySummary> {
  return request<OfferInventorySummary>(
    'GET',
    `/api/v1/offers/${offerId}/variants/${variantId}/inventory`,
  );
}

/**
 * Requests the backend to transition the tenant's catalog from sandbox to live.
 * Matches POST /api/v1/tenant/go-live.
 * Input: none - tenant is derived from the authenticated session on the backend.
 * Output: void on success; throws on failure.
 */
export async function goLiveCatalog(): Promise<void> {
  await request<void>('POST', '/api/v1/tenant/go-live');
}

/**
 * Activates the Benefits Catalog service for the current tenant.
 * Uses plug_and_play mode by default (auto-adopt offers, no manual review).
 * Matches POST /api/v1/tenant/services/benefits-catalog/activate.
 * Input: none - tenant is derived from the authenticated session on the backend.
 * Output: void on success; throws on failure.
 */
export async function activateBenefitsCatalog(): Promise<void> {
  await request<void>('POST', '/api/v1/tenant/services/benefits-catalog/activate', {
    startingMode: 'plug_and_play',
  });
}

/**
 * Approves a pending ecosystem voucher offer. Platform admins only.
 * Transitions the offer from 'pending_approval' to 'active' status.
 * Input: offerId - the offer to approve.
 * Output: void on success; throws on failure.
 */
export async function approveOfferApi(offerId: string): Promise<void> {
  await request<void>('POST', `/api/v1/offers/${encodeURIComponent(offerId)}/approve`);
}

/**
 * Denies a pending ecosystem voucher offer with a mandatory reason.
 * Platform admins only. The backend emails the reason to the creating tenant.
 * Input: offerId - the offer to deny; reason - explanation sent to supplier.
 * Output: void on success; throws on failure.
 */
export async function denyOfferApi(offerId: string, reason: string): Promise<void> {
  await request<void>('POST', `/api/v1/offers/${encodeURIComponent(offerId)}/deny`, { reason });
}

/** A tenant row in the platform-admin trusted-tenants list. */
export interface AdminTenantRow {
  tenantId: string;
  organizationName: string;
  logoUrl?: string;
  brandColor?: string;
  status: string;
  autoApproveOffers: boolean;
  pendingOfferCount: number;
}

/** Platform-admin: trusted-tenants management (list all tenants + auto-approve toggle). */
export const adminTenantsApi = {
  list: (params: { search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    return request<{ tenants: AdminTenantRow[]; total: number }>('GET', `/api/v1/admin/tenants?${q.toString()}`);
  },
  setAutoApprove: (tenantId: string, enabled: boolean) =>
    request<{ approvedOfferIds: string[] }>('PATCH', `/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/auto-approve`, { enabled }),
};

/**
 * Deactivates the Benefits Catalog service for the current tenant.
 * Sets TenantServiceActivation.status to 'suspended' and bulk-marks
 * all active tenant-created offers as inactive.
 * Matches POST /api/v1/tenant/services/benefits-catalog/deactivate.
 * Input: none - tenant is derived from the authenticated session on the backend.
 * Output: deactivation summary on success; throws on failure.
 */
export async function deactivateBenefitsCatalog(): Promise<{
  tenantId: string;
  serviceKey: string;
  status: string;
  offersDeactivated: number;
}> {
  return request<{ tenantId: string; serviceKey: string; status: string; offersDeactivated: number }>(
    'POST',
    '/api/v1/tenant/services/benefits-catalog/deactivate',
  );
}
