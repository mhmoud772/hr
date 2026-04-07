// API methods for authentication and roles
import { apiClient, publicApiClient, getAuthToken, getRefreshToken, setAuthToken, setRefreshToken } from "@/shared/lib/api-client";
import { normalizeUser } from "@/shared/lib/normalizers/users";
import type { ApiUser, ApiTokenObtainPairRequest, ApiRegisterRequest } from "@/types/contracts";
import type { AuthResponse, User } from "../types";

export type SetupStatusResponse = {
  requiresSetup: boolean;
  setupCompleted: boolean;
  hasUsers: boolean;
  hasAdmin: boolean;
};

export type InitialSetupPayload = {
  admin: {
    name?: string;
    username: string;
    email: string;
    password: string;
  };
  company?: {
    name?: string;
    nameEn?: string;
    email?: string;
    phone?: string;
    address?: string;
    country?: string;
    currency?: string;
    logoDataUrl?: string;
  };
};

type AuthResultLike = AuthResponse | User | (Record<string, unknown> & { user?: ApiUser | User });

const extractAuthResult = (raw: AuthResultLike) => {
  const data = raw as Record<string, unknown>;
  const nestedUser =
    data.user && typeof data.user === "object"
      ? normalizeUser(data.user as ApiUser | User)
      : normalizeUser(raw as User);

  return {
    user: nestedUser,
    token:
      (typeof data.token === "string" && data.token) ||
      (typeof data.accessToken === "string" && data.accessToken) ||
      (typeof data.access === "string" && data.access) ||
      null,
    refreshToken:
      (typeof data.refreshToken === "string" && data.refreshToken) ||
      (typeof data.refresh === "string" && data.refresh) ||
      null,
  };
};

export const login = async (username: string, password: string) => {
  const payload: ApiTokenObtainPairRequest = { username, password };
  const res = await publicApiClient.post("/auth/login", payload);
  return extractAuthResult(res.data as AuthResultLike);
};

export const loginWithMfa = async (username: string, password: string, mfaCode: string) => {
  const payload: ApiTokenObtainPairRequest & { mfa_code: string } = { username, password, mfa_code: mfaCode };
  const res = await publicApiClient.post("/auth/login", payload);
  return extractAuthResult(res.data as AuthResultLike);
};

export const requestPasswordReset = async (email: string) => {
  const res = await publicApiClient.post("/auth/reset-password", { email });
  return res.data;
};

export const getSetupStatus = async () => {
  const res = await publicApiClient.get("/auth/setup-status");
  return res.data as SetupStatusResponse;
};

export const completeInitialSetup = async (payload: InitialSetupPayload) => {
  const res = await publicApiClient.post("/auth/initial-setup", payload);
  return extractAuthResult(res.data as AuthResultLike);
};

export const confirmPasswordReset = async (email: string, token: string, newPassword: string) => {
  const res = await publicApiClient.post("/auth/reset-password/confirm", { email, token, newPassword });
  return res.data;
};

// MFA management
export const mfaSetup = async () => {
  const res = await apiClient.post("/auth/mfa/setup");
  return res.data as { secret: string; otpauth_url: string };
};

export const mfaEnable = async (code: string) => {
  const res = await apiClient.post("/auth/mfa/enable", { code });
  return res.data;
};

export const mfaDisable = async () => {
  const res = await apiClient.post("/auth/mfa/disable");
  return res.data;
};

// WebAuthn helpers
export const webauthnRegisterBegin = async () => {
  const res = await apiClient.post("/auth/webauthn/register/begin");
  return res.data;
};

type WebAuthnCredentialPayload = Record<string, unknown>;

export const webauthnRegisterFinish = async (credential: WebAuthnCredentialPayload) => {
  const res = await apiClient.post("/auth/webauthn/register/finish", credential);
  return res.data;
};

export const webauthnAuthBegin = async (username: string) => {
  const res = await publicApiClient.post("/auth/webauthn/authenticate/begin", { username });
  return res.data;
};

type WebAuthnAuthPayload = Record<string, unknown>;

export const webauthnAuthFinish = async (payload: WebAuthnAuthPayload) => {
  const res = await publicApiClient.post("/auth/webauthn/authenticate/finish", payload);
  return res.data as AuthResponse | User;
};

export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    const payload = refreshToken ? { refreshToken } : {};
    await apiClient.post("/auth/logout", payload);
  } catch {
    // ignore logout errors
  }
  setAuthToken(null);
  setRefreshToken(null);
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
  return true;
};

export const register = async (
  name: string,
  username: string,
  password: string,
) => {
  const payload: ApiRegisterRequest = { name, username, password };
  const res = await publicApiClient.post("/auth/register", payload);
  return extractAuthResult(res.data as AuthResultLike);
};

export const getCurrentUser = async () => {
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  if (!token && !refreshToken) {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    return null;
  }
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return normalizeUser(JSON.parse(userStr) as User);
    } catch {
      // fall through to default
    }
  }
  const sessionUserStr = sessionStorage.getItem("user");
  if (sessionUserStr) {
    try {
      return normalizeUser(JSON.parse(sessionUserStr) as User);
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
    return normalizeUser(res.data as ApiUser);
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 401) {
      return null;
    }
    throw error;
  }
};

