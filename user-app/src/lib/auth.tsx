import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getAuthToken,
  getStoredUser,
  setAuthToken,
  setStoredUser,
  clearAuth,
  fetchCurrentUser,
  type AuthUser,
} from "./api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({
  requiredRole,
  children,
}: {
  requiredRole: "ADMIN" | "AGENT" | "CUSTOMER";
  children: ReactNode;
}) {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const stored = getStoredUser();
    return stored && stored.role === requiredRole ? stored : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => !!getAuthToken());

  useEffect(() => {
    let isMounted = true;
    const initialToken = getAuthToken();

    if (!initialToken) {
      clearAuth();
      if (isMounted) {
        setUserState(null);
        setTokenState(null);
        setIsLoading(false);
      }
      return;
    }

    // Validate token with backend /api/auth/me
    fetchCurrentUser()
      .then((validatedUser) => {
        if (!isMounted) return;
        if (validatedUser && validatedUser.role === requiredRole) {
          setUserState(validatedUser);
          setTokenState(initialToken);
        } else {
          // Token invalid, expired, or role mismatch
          clearAuth();
          setUserState(null);
          setTokenState(null);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        clearAuth();
        setUserState(null);
        setTokenState(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requiredRole]);

  const login = (newToken: string, newUser: AuthUser) => {
    if (newUser.role !== requiredRole) {
      clearAuth();
      setUserState(null);
      setTokenState(null);
      throw new Error(`Access denied: Requires ${requiredRole} role.`);
    }
    setAuthToken(newToken);
    setStoredUser(newUser);
    setTokenState(newToken);
    setUserState(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    clearAuth();
    setTokenState(null);
    setUserState(null);
    setIsLoading(false);
  };

  const isAuthenticated = !isLoading && !!token && !!user && user.role === requiredRole;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
