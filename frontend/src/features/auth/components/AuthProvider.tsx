import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@/types/api";
import { getCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister, fetchCurrentUser, isAuthTokenValid } from "@/features/auth/api/auth";
import { getAuthToken, getAuthTokenStorage, setAuthToken } from "@/shared/lib/api-client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<User>;
  register: (name: string, username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const init = async () => {
      try {
        const stored = getCurrentUser();
        const current = await Promise.resolve(stored);
        if (!getAuthToken() || !isAuthTokenValid()) {
          setAuthToken(null);
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
          setUser(null);
        } else {
          setUser(current);
        }
        if (getAuthToken() && isAuthTokenValid()) {
          try {
            const fresh = await fetchCurrentUser();
            if (fresh) {
              const storage = getAuthTokenStorage() === "session" ? sessionStorage : localStorage;
              storage.setItem("user", JSON.stringify(fresh));
              setUser(fresh);
            }
          } catch {
            setAuthToken(null);
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, []);

  const login = async (username: string, password: string, remember: boolean = true) => {
    const result = await apiLogin(username, password);
    if (result.token) {
      setAuthToken(result.token, remember ? "local" : "session");
    }
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  };

  const register = async (name: string, username: string, password: string) => {
    const result = await apiRegister(name, username, password);
    if (result.token) {
      setAuthToken(result.token, "local");
    }
    localStorage.setItem("user", JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    await apiLogout();
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      if (!isAuthTokenValid()) {
        setAuthToken(null);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        setUser(null);
        return null;
      }
      const fresh = await fetchCurrentUser();
      if (fresh) {
        const storage = getAuthTokenStorage() === "session" ? sessionStorage : localStorage;
        storage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);
        return fresh;
      }
      return null;
    } catch {
      setAuthToken(null);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      setUser(null);
      return null;
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

