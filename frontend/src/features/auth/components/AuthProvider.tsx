import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@/types/api";
import {
  getCurrentUser,
  login as apiLogin,
  loginWithMfa,
  logout as apiLogout,
  register as apiRegister,
  fetchCurrentUser,
} from "@/features/auth/api/auth";
import { getAuthToken, getAuthTokenStorage, getRefreshToken, setAuthToken, setRefreshToken } from "@/shared/lib/api-client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, remember?: boolean, mfaCode?: string) => Promise<User>;
  register: (name: string, username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutRef = useRef<(() => Promise<void>) | null>(null);

  const idleTimeoutMinutes = Number(import.meta.env.VITE_AUTH_IDLE_TIMEOUT_MINUTES || "0");
  const IDLE_TIMEOUT_MS = Number.isFinite(idleTimeoutMinutes) && idleTimeoutMinutes > 0
    ? idleTimeoutMinutes * 60 * 1000
    : 0;

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const init = async () => {
      try {
        const stored = getCurrentUser();
        const current = await Promise.resolve(stored);
        const hasAnyToken = Boolean(getAuthToken() || getRefreshToken());
        if (!hasAnyToken) {
          setAuthToken(null);
          setRefreshToken(null);
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
          setUser(null);
        } else {
          setUser(current);
          try {
            const fresh = await fetchCurrentUser();
            if (fresh) {
              const storage = getAuthTokenStorage() === "session" ? sessionStorage : localStorage;
              storage.setItem("user", JSON.stringify(fresh));
              setUser(fresh);
            } else {
              setAuthToken(null);
              setRefreshToken(null);
              localStorage.removeItem("user");
              sessionStorage.removeItem("user");
              setUser(null);
            }
          } catch {
            setAuthToken(null);
            setRefreshToken(null);
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

  const login = async (username: string, password: string, remember: boolean = true, mfaCode?: string) => {
    const result = mfaCode ? await loginWithMfa(username, password, mfaCode) : await apiLogin(username, password);
    if (result.token) {
      setAuthToken(result.token, remember ? "local" : "session");
    }
    setRefreshToken(result.refreshToken, remember ? "local" : "session");
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
    setRefreshToken(result.refreshToken, "local");
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
      if (!getAuthToken() && !getRefreshToken()) {
        setAuthToken(null);
        setRefreshToken(null);
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
      setRefreshToken(null);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      setUser(null);
      return null;
    }
  };

  logoutRef.current = logout;

  useEffect(() => {
    if (IDLE_TIMEOUT_MS <= 0) return;
    const activityEvents: (keyof WindowEventMap)[] = ["click", "mousemove", "keydown", "touchstart", "scroll"];

    const resetIdleTimer = () => {
      if (!user) return;
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
      idleTimer.current = setTimeout(() => {
        if (logoutRef.current) {
          logoutRef.current();
        }
      }, IDLE_TIMEOUT_MS);
    };

    if (user) {
      resetIdleTimer();
      activityEvents.forEach((event) => window.addEventListener(event, resetIdleTimer));
    }

    return () => {
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
      activityEvents.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [user, IDLE_TIMEOUT_MS]);

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

