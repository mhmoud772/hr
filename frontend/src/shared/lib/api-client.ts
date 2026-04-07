import axios, { AxiosError } from "axios";
import { normalizeStringsDeep } from "./text-normalize";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const AUTH_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_TOKEN_STORAGE_KEY = "authTokenStorage";

export type OfflineSyncError = AxiosError & {
  isOfflineSync?: boolean;
  message: string;
};

export function isOfflineSyncError(error: unknown): error is OfflineSyncError {
  return (
    typeof error === "object" &&
    error !== null &&
    "isOfflineSync" in error &&
    (error as { isOfflineSync?: unknown }).isOfflineSync === true
  );
}

export function getAuthToken() {
  const preferred = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "local";
  if (preferred === "session") {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthTokenStorage() {
  const preferred = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return preferred === "session" ? "session" : "local";
}

export function setAuthToken(token: string | null, storage: "local" | "session" = "local") {
  if (token) {
    if (storage === "session") {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "session");
    } else {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "local");
    }
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

export function getRefreshToken() {
  const preferred = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "local";
  if (preferred === "session") {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null, storage: "local" | "session" = "local") {
  if (token) {
    if (storage === "session") {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "session");
    } else {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "local");
    }
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "results" in (data as Record<string, unknown>)) {
    const results = (data as Record<string, unknown>).results;
    return Array.isArray(results) ? (results as T[]) : [];
  }
  return [];
}

export const apiClient = axios.create({
  baseURL: API_URL,
});
export const publicApiClient = axios.create({
  baseURL: API_URL,
});

let refreshInFlight: Promise<string | null> | null = null;

function clearAuthState() {
  sessionStorage.setItem("authExpired", "1");
  setAuthToken(null);
  setRefreshToken(null);
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent("auth:expired"));
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (refreshInFlight) return refreshInFlight;

  const storage = getAuthTokenStorage();
  refreshInFlight = (async () => {
    try {
      const res = await publicApiClient.post("/auth/refresh", {
        refresh: refreshToken,
        refreshToken,
      });
      if (res?.data) {
        normalizeStringsDeep(res.data);
      }
      const data = res.data as {
        accessToken?: string;
        access?: string;
        token?: string;
        refreshToken?: string;
        refresh?: string;
      };
      const nextAccessToken = data.accessToken || data.access || data.token || null;
      if (!nextAccessToken) return null;

      const nextRefreshToken = data.refreshToken || data.refresh || refreshToken;
      setAuthToken(nextAccessToken, storage);
      setRefreshToken(nextRefreshToken, storage);
      return nextAccessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response?.data) {
      normalizeStringsDeep(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as Record<string, unknown> & {
      _retry?: boolean;
      headers?: Record<string, string>;
      url?: string;
      method?: string;
    };
    const status = error.response?.status;
    const url = originalRequest.url || "";
    const isAuthRequest =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    // Check if offline network error for mutation requests (POST, PUT, PATCH, DELETE)
    const isMutation = ["post", "put", "patch", "delete"].includes(originalRequest.method?.toLowerCase() || "");
    if (!navigator.onLine && isMutation && !error.response) {
      // Workbox will handle the background sync. We tag this error.
      const offlineError = {
        ...error,
        isOfflineSync: true,
        message: "You are offline. Your request has been securely saved and will automatically sync when connection is restored.",
      };
      return Promise.reject(offlineError);
    }

    if (status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      const renewedAccessToken = await refreshAccessToken();
      if (renewedAccessToken) {
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${renewedAccessToken}`,
        };
        return apiClient.request(originalRequest as import("axios").AxiosRequestConfig);
      }
    }

    if (status === 401) {
      clearAuthState();
    }
    return Promise.reject(error);
  },
);

publicApiClient.interceptors.response.use((response) => {
  if (response?.data) {
    normalizeStringsDeep(response.data);
  }
  return response;
});
