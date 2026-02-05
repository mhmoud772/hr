import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { User } from "@/types/api";

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

export const getUsers = async (params: UsersQuery = {}) => {
  const res = await apiClient.get("/users/", { params });
  const data = res.data as { results?: User[]; count?: number } | User[];
  return {
    results: unwrapList<User>(data),
    count: (data as { count?: number }).count ?? unwrapList<User>(data).length,
  } as UsersResponse;
};

export const createUser = async (data: Partial<User> & { password?: string }) => {
  const res = await apiClient.post("/users/", data);
  return res.data as User;
};

export const updateUser = async (id: string, data: Partial<User> & { password?: string }) => {
  const res = await apiClient.put(`/users/${id}/`, data);
  return res.data as User;
};

export const deleteUser = async (id: string) => {
  const res = await apiClient.delete(`/users/${id}/`);
  return res.data;
};
