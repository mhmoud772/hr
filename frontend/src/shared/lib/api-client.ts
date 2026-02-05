import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const AUTH_TOKEN_KEY = "authToken";
const AUTH_TOKEN_STORAGE_KEY = "authTokenStorage";

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

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      sessionStorage.setItem("authExpired", "1");
      setAuthToken(null);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return Promise.reject(error);
  },
);
