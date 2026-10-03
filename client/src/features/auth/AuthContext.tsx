import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  getAccessToken,
  saveAccessToken,
  removeAccessToken,
} from "./auth-storage";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(
    getAccessToken()
  );

  const login = (newToken: string) => {
    saveAccessToken(newToken);
    setToken(newToken);
  };

  const logout = () => {
    removeAccessToken();
    setToken(null);
  };

  const value: AuthContextValue = {
    token,
    isAuthenticated: Boolean(token),
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
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}