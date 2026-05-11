/* eslint-disable react-refresh/only-export-components */
/**
 * Provides dashboard authentication by exchanging website-issued SSO codes,
 * restoring refresh-cookie sessions, and exposing the current user to pages.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { onboardingApi, setToken, refreshAccessToken, type AdminUser, type DashboardMe } from '../lib/api';

const AUTH_URL = (import.meta.env.VITE_AUTH_URL ?? import.meta.env.VITE_API_URL ?? '') as string;
const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL ?? 'http://localhost:3000';

interface AuthResponse {
  accessToken: string;
  user?: AdminUser | null;
}

const codeExchangeRequests = new Map<string, Promise<AuthResponse | null>>();

interface AuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  me: DashboardMe | null;
  reloadMe: () => Promise<DashboardMe | null>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Exchanges an SSO code once, even when React StrictMode replays effects in dev.
 * Input: one-time auth code from the callback URL.
 * Output: auth response when exchange succeeds, or null when the code is invalid.
 */
function exchangeDashboardCode(code: string): Promise<AuthResponse | null> {
  const existingRequest = codeExchangeRequests.get(code);
  if (existingRequest) return existingRequest;

  const request = fetch(`${AUTH_URL}/api/auth/code-exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  }).then(async (res) => {
    if (!res.ok) return null;
    return await res.json() as AuthResponse;
  });

  codeExchangeRequests.set(code, request);
  window.setTimeout(() => codeExchangeRequests.delete(code), 60 * 1000);
  return request;
}

/**
 * Returns a safe in-app redirect path from a query string value.
 * Input: raw redirect query value.
 * Output: local path only; unsafe absolute URLs fall back to "/".
 */
function getSafeRedirectPath(redirect: string | null): string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return '/';
  return redirect;
}

/**
 * Sends unauthenticated users back to the website login page.
 * Input: none.
 * Output: browser navigates to the website login route.
 */
function redirectToWebsiteLogin(): void {
  window.location.replace(new URL('/login', WEBSITE_URL).toString());
}

/**
 * Updates the browser path without a full reload and tells React Router.
 * Input: local path to display after successful auth.
 * Output: browser URL and router state are updated in-place.
 */
function replaceDashboardPath(path: string): void {
  window.history.replaceState({}, document.title, path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Wraps dashboard pages with the current authenticated session.
 * Input: React children.
 * Output: AuthContext provider that blocks dashboard rendering while auth loads.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [me, setMe] = useState<DashboardMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Loads backend-owned tenant/member context for the authenticated user.
   * Input: none.
   * Output: `/api/me` response stored in context, or null when unavailable.
   */
  const reloadMe = useCallback(async () => {
    try {
      const data = await onboardingApi.me();
      setMe(data);
      return data;
    } catch {
      setMe(null);
      return null;
    }
  }, []);

  /**
   * Loads the current profile with a fresh access token.
   * Only clears auth state on a 401/403 — network errors keep the existing
   * user intact so a transient backend hiccup does not log the user out.
   * Input: access token returned by auth endpoints.
   * Output: user state is set when the token is valid.
   */
  const fetchUser = useCallback(async (token: string) => {
    try {
      setToken(token);
      const res = await fetch(`${AUTH_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        setUser(null);
        setMe(null);
        setToken(null);
        return;
      }
      if (!res.ok) return; // Transient error — keep existing state.
      const data = await res.json();
      setUser(data);
      await reloadMe();
    } catch {
      // Network error — keep existing state, will retry on next action.
    }
  }, [reloadMe]);

  /**
   * Restores or rotates the dashboard session from the httpOnly refresh cookie.
   * Uses the shared refreshAccessToken helper so concurrent calls are deduplicated
   * and never race each other into a destructive token-reuse cascade.
   * Only clears auth state on a definitive 401 — transient network errors or
   * backend 5xx responses leave the current user intact to retry on the next action.
   * Input: none.
   * Output: user and in-memory access token are refreshed when possible.
   */
  const refreshSession = useCallback(async () => {
    try {
      const result = await refreshAccessToken();
      if (!result) {
        // Definitive auth failure — refresh cookie expired or invalid.
        setUser(null);
        setMe(null);
        setToken(null);
        return;
      }
      setToken(result.accessToken);
      await fetchUser(result.accessToken);
      await reloadMe();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401 || status === 403) {
        // Confirmed auth failure — clear state and let App.tsx redirect to login.
        setUser(null);
        setMe(null);
        setToken(null);
      }
      // Any other error (network, 5xx) — keep existing state; retry on next action.
    }
  }, [fetchUser, reloadMe]);

  /**
   * Revokes the refresh cookie and sends the user back to website login.
   * Input: none.
   * Output: local auth state is cleared and the browser leaves the dashboard.
   */
  const logout = useCallback(async () => {
    try {
      await fetch(`${AUTH_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // Logout should still clear local state if the backend is unavailable.
    }
    setUser(null);
    setMe(null);
    setToken(null);
    redirectToWebsiteLogin();
  }, []);

  useEffect(() => {
    /**
     * Initializes dashboard auth from a callback code or an existing cookie.
     * Input: current browser URL and cookies.
     * Output: authenticated user state, or redirect to website login.
     */
    const initializeAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const redirect = getSafeRedirectPath(params.get('redirect'));

      if (code) {
        try {
          const data = await exchangeDashboardCode(code);
          if (data) {
            setToken(data.accessToken);
            if (data.user) {
              setUser(data.user);
            } else {
              await fetchUser(data.accessToken);
            }
            await reloadMe();
            replaceDashboardPath(redirect);
            return;
          }
        } catch (e) {
          console.error('Code exchange failed', e);
        }
      }

      await refreshSession();
    };

    void initializeAuth().finally(() => {
      setIsLoading(false);
    });
  }, [fetchUser, refreshSession, reloadMe]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        me,
        reloadMe,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Reads the dashboard auth context from child components.
 * Input: none.
 * Output: current auth context or an error when used outside the provider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
