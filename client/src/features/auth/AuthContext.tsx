
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import apiClient from "@/services/api-client";

import {
  getAccessToken,
  saveAccessToken,
  removeAccessToken,
} from "./auth-storage";

export interface AuthUser {
  userId: number;
  organizationId: number;
  roleId: number;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loadingUser: boolean;
  login: (token: string) => void;
  logout: () => void;
}

interface CurrentUserResponse {
  success: boolean;
  data: AuthUser;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(
    getAccessToken()
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(Boolean(getAccessToken()));

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      if (!token) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      setLoadingUser(true);

      try {
        const response =
          await apiClient.get<CurrentUserResponse>("/auth/me");

        if (!cancelled) {
          setUser(response.data.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to load current user:", error);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = (newToken: string) => {
    saveAccessToken(newToken);
    setUser(null);
    setToken(newToken);
  };

  const logout = () => {
    removeAccessToken();
    setToken(null);
    setUser(null);
    setLoadingUser(false);
  };

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated: Boolean(token),
    loadingUser,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
