/**
 * Connects dashboard features to the shared Nexus backend with an in-memory
 * access token and credentialed requests for the httpOnly refresh cookie.
 */

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

/**
 * Sends a typed JSON request to the backend API.
 * Input: HTTP method, API path, and optional JSON body.
 * Output: parsed JSON response or an Error when the backend rejects it.
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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

export type OnboardingStep = 'workspace_setup' | 'business_setup' | 'complete';

export interface DashboardMe {
  user: {
    id: string;
    email: string;
    name: string;
  };
  context: {
    isTenant: boolean;
    isMember: boolean;
    tenantId: string | null;
    memberId: string | null;
    role: string | null;
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
  userType: 'tenant' | 'member';
  memberId: string | null;
  redirectTo: string;
}

export interface BusinessSetupResponse {
  tenantId: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  data: Record<string, unknown>;
  updatedAt: string | null;
}

export const onboardingApi = {
  me: () => request<DashboardMe>('GET', '/api/me'),
  status: () => request<Pick<DashboardMe, 'context' | 'onboarding'>>('GET', '/api/onboarding/status'),
  createWorkspace: (data: WorkspaceSetupInput) =>
    request<WorkspaceSetupResponse>('POST', '/api/onboarding/workspace', data),
  skipWorkspace: () => request<SkipWorkspaceResponse>('POST', '/api/onboarding/skip'),
};

export const businessSetupApi = {
  get: () => request<BusinessSetupResponse>('GET', '/api/business-setup'),
  saveDraft: (data: Record<string, unknown>) =>
    request<BusinessSetupResponse>('PATCH', '/api/business-setup', { data }),
  submit: (data: Record<string, unknown>) =>
    request<BusinessSetupResponse>('POST', '/api/business-setup', { data }),
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
