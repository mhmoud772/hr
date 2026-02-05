// API methods for authentication and roles
import { apiClient, publicApiClient, getAuthToken, setAuthToken } from "@/shared/lib/api-client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types/api";

export const login = async (username: string, password: string) => {
  const payload: LoginRequest = { username, password };
  const res = await publicApiClient.post("/auth/login", payload);
  const data = res.data as AuthResponse | User;
  const token = "token" in data ? data.token : undefined;
  const accessToken = "accessToken" in data ? data.accessToken : undefined;
  const user = "user" in data && data.user ? data.user : (data as User);
  return { user, token: token || accessToken || null };
};

export const requestPasswordReset = async (email: string) => {
  const res = await publicApiClient.post("/auth/reset-password", { email });
  return res.data;
};

export const confirmPasswordReset = async (uid: string, token: string, newPassword: string) => {
  const res = await publicApiClient.post("/auth/reset-password/confirm", { uid, token, newPassword });
  return res.data;
};

export const logout = async () => {
  try {
    await apiClient.post("/auth/logout");
  } catch {
    // ignore logout errors
  }
  setAuthToken(null);
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
  return true;
};

export const register = async (
  name: string,
  username: string,
  password: string,
) => {
  const payload: RegisterRequest = { name, username, password };
  const res = await publicApiClient.post("/auth/register", payload);
  const data = res.data as AuthResponse | User;
  const token = "token" in data ? data.token : undefined;
  const accessToken = "accessToken" in data ? data.accessToken : undefined;
  const user = "user" in data && data.user ? data.user : (data as User);
  return { user, token: token || accessToken || null };
};

export const getCurrentUser = async () => {
  const token = getAuthToken();
  if (!token || !isAuthTokenValid()) {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    return null;
  }
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch {
      // fall through to default
    }
  }
  const sessionUserStr = sessionStorage.getItem("user");
  if (sessionUserStr) {
    try {
      return JSON.parse(sessionUserStr) as User;
    } catch {
      // fall through to default
    }
  }
  return null;
};

export const isAuthTokenValid = () => {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    if (!payload?.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
};

export const fetchCurrentUser = async () => {
  try {
    const res = await apiClient.get("/auth/me");
    return res.data as User;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 401) {
      return null;
    }
    throw error;
  }
};

