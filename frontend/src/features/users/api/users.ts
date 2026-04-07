import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeUser } from "@/shared/lib/normalizers/users";
import type { ApiPaginatedUserList, ApiUser, ApiUserRequest, ApiPatchedUserRequest } from "@/types/contracts";
import type { User } from "../types";


export type UsersQuery = {
  page?: number;
  search?: string;
  ordering?: string;
  role?: string;
  is_active?: string;
};

export type UsersResponse = {
  results: User[];
  count: number;
};

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

export const getUsers = async (params: UsersQuery = {}) => {
  const res = await apiClient.get("/users/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedUserList | ApiUser[],
    normalizeUser,
  ) as UsersResponse;
};

export const createUser = async (data: ApiUserRequest) => {
  const res = await apiClient.post("/users/", data);
  return normalizeUser(res.data as ApiUser);
};

export const updateUser = async (id: string, data: ApiPatchedUserRequest) => {
  const res = await apiClient.patch(`/users/${id}/`, data);
  return normalizeUser(res.data as ApiUser);
};

export const deleteUser = async (id: string) => {
  const res = await apiClient.delete(`/users/${id}/`);
  return res.data;
};

export const inviteUsers = async (data: InviteUsersPayload) => {
  const res = await apiClient.post("/users/invite/", data);
  return res.data as InviteUsersResponse;
};
