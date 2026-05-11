/**
 * Connects dashboard features to the shared Nexus backend with an in-memory
 * access token and credentialed requests for the httpOnly refresh cookie.
 * Includes in-flight deduplication for refresh calls and automatic 401 retry,
 * mirroring the website API client to prevent concurrent-refresh races.
 */

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
 * Sends a typed JSON request to the backend API.
 * On 401, refreshes the access token once and retries automatically.
 * Input: HTTP method, API path, optional JSON body, and internal retry flag.
 * Output: parsed JSON response or throws with the backend error message.
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401 then retry once — silent recovery without logging out.
  if (res.status === 401 && !retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(method, path, body, true);
    throw Object.assign(new Error('Session expired'), { status: 401 });
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
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
export type DashboardMode = 'tenant' | 'regular_user' | 'workspace_setup_deferred' | 'needs_workspace_setup';
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
    memberId: string | null;
    role: string | null;
    plan?: TenantPlan;
    seats?: TenantSeats;
  };
  authorization: {
    tenantRole: string | null;
    platformRole: 'nexusAdmin' | null;
    canSeeDevMode: boolean;
    canUseDevPlayground: boolean;
    canViewMembers: boolean;
    canManageMembers: boolean;
  };
  onboarding: {
    required: boolean;
    step: OnboardingStep;
  };
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
  | 'admin'
  | 'finance'
  | 'operator'
  | 'analyst'
  | 'developer'
  | 'supply_manager'
  | 'member';

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

export interface TenantContact {
  tenantContactId: string;
  email: string;
  displayName: string;
  status: 'active' | 'inactive' | 'pending' | 'expired';
  address: string | null;
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
}

function buildContactsQuery(params?: ListContactsParams): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const tenantContactsApi = {
  list: (params?: ListContactsParams) =>
    request<{ tenantId: string; contacts: TenantContact[]; pagination: PaginationMeta }>(
      'GET',
      `/api/v1/tenant/contacts${buildContactsQuery(params)}`,
    ),
  create: (data: { email: string; displayName?: string; address?: string }) =>
    request<TenantContact>('POST', '/api/v1/tenant/contacts', data),
  update: (contactId: string, data: { displayName?: string; address?: string }) =>
    request<TenantContact>('PATCH', `/api/v1/tenant/contacts/${encodeURIComponent(contactId)}`, data),
  importContacts: (rows: Array<{ email: string; displayName?: string; address?: string }>) =>
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
