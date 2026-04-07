import type { ID, ISODate } from "@/types/api";

export interface AuthUser {
  id: ID;
  name: string;
  username?: string;
  role: string;
  email?: string;
  is_active?: boolean;
  last_login?: ISODate;
  must_change_password?: boolean;
  mfa_enabled?: boolean;
  permissions?: string[];
  role_permissions?: string[];
  effective_permissions?: string[];
  avatar?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: AuthUser;
}

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
export type User = AuthUser;
