import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, setToken, type DashboardUser } from '../lib/api';

interface AuthContextType {
  user: DashboardUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore session from httpOnly refresh cookie
  useEffect(() => {
    authApi
      .refresh()
      .then(async (data) => {
        setToken(data.accessToken);
        const profile = await authApi.me();
        setUser(profile);
      })
      .catch(() => {
        // No valid session — user stays null
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setToken(data.accessToken);
    const profile = await authApi.me();
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
