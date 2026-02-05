import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { Department } from "@/types/api";

export type DepartmentsQuery = {
  search?: string;
  ordering?: string;
  parent?: string;
  manager?: string;
};

export const getDepartments = async (params: DepartmentsQuery = {}) => {
  const res = await apiClient.get("/departments/", { params });
  return unwrapList<Department>(res.data);
};

export const createDepartment = async (data: Partial<Department>) => {
  const res = await apiClient.post("/departments/", data);
  return res.data as Department;
};

export const updateDepartment = async (id: string, data: Partial<Department>) => {
  const res = await apiClient.patch(`/departments/${id}/`, data);
  return res.data as Department;
};

export const deleteDepartment = async (id: string) => {
  const res = await apiClient.delete(`/departments/${id}/`);
  return res.data;
};
