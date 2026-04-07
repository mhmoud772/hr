import type { ID, ISODate } from "@/types/api";

export interface User {
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

export type InviteUsersPayload = {
  emails: string[] | string;
  role?: string;
  message?: string;
  forceRoleUpdate?: boolean;
};

export type InviteUsersResponse = {
  status: string;
  requested: number;
  invited: number;
  createdUsers: number;
  existingUsers: number;
  invalidEmails: string[];
  results: Array<{
    email: string;
    userId: string;
    username: string;
    created: boolean;
  }>;
};
