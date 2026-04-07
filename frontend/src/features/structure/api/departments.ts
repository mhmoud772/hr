import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeDepartment } from "@/shared/lib/normalizers/employees";
import type { ApiDepartment, ApiPaginatedDepartmentList, ApiDepartmentRequest, ApiPatchedDepartmentRequest } from "@/types/contracts";
import type { Department } from "@/types/api";

export type DepartmentsQuery = {
  search?: string;
  ordering?: string;
  parent?: string;
  manager?: string;
};

export const getDepartments = async (params: DepartmentsQuery = {}) => {
  const res = await apiClient.get("/departments/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedDepartmentList | ApiDepartment[],
    normalizeDepartment,
  ).results;
};

export const createDepartment = async (data: ApiDepartmentRequest) => {
  const res = await apiClient.post("/departments/", data);
  return normalizeDepartment(res.data as ApiDepartment);
};

export const updateDepartment = async (id: string, data: ApiPatchedDepartmentRequest) => {
  const res = await apiClient.patch(`/departments/${id}/`, data);
  return normalizeDepartment(res.data as ApiDepartment);
};

export const deleteDepartment = async (id: string) => {
  const res = await apiClient.delete(`/departments/${id}/`);
  return res.data;
};
