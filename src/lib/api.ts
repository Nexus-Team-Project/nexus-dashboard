// ─── Nexus Backend API client ─────────────────────────────────────
// Connects to the shared nexus-website backend.
// Set VITE_API_URL in .env (e.g. http://localhost:3001)

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

// In-memory token store (replace with proper auth context when integrating login)
let _token: string | null = null;

export function setToken(token: string | null) {
  _token = token;
}

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
}

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
