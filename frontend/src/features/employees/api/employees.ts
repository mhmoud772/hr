import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeEmployee } from "@/shared/lib/normalizers/employees";
import type { ApiEmployee, ApiPaginatedEmployeeList, ApiEmployeeRequest, ApiPatchedEmployeeRequest } from "@/types/contracts";
import type { Employee } from "@/types/api";

export type EmployeesQuery = {
  page?: number;
  search?: string;
  ordering?: string;
  status?: string;
  department?: string;
  job_title?: string;
};

export type EmployeesResponse = {
  results: Employee[];
  count: number;
};

const mapEmployeeParams = (params: EmployeesQuery = {}, options: { includePage?: boolean } = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (options.includePage === false) {
    delete mapped.page;
  }
  if (params.department) {
    mapped["department__name"] = params.department;
    delete mapped.department;
  }
  if (params.job_title) {
    mapped["job_title__name"] = params.job_title;
    delete mapped.job_title;
  }
  return mapped;
};

export const getEmployees = async (params: EmployeesQuery = {}) => {
  const mapped = mapEmployeeParams(params, { includePage: true });
  const res = await apiClient.get("/employees/", { params: mapped });
  return normalizePaginatedList(
    res.data as ApiPaginatedEmployeeList | ApiEmployee[],
    normalizeEmployee,
  ) as EmployeesResponse;
};

export const createEmployee = async (data: ApiEmployeeRequest) => {
  const res = await apiClient.post("/employees/", data);
  return normalizeEmployee(res.data as ApiEmployee);
};

export const updateEmployee = async (id: string, data: ApiPatchedEmployeeRequest) => {
  const res = await apiClient.patch(`/employees/${id}/`, data);
  return normalizeEmployee(res.data as ApiEmployee);
};

export const deleteEmployee = async (id: string) => {
  const res = await apiClient.delete(`/employees/${id}/`);
  return res.data;
};

export const createEmployeeWithFile = async (data: FormData) => {
  const res = await apiClient.post("/employees/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeEmployee(res.data as ApiEmployee);
};

export const updateEmployeeWithFile = async (id: string, data: FormData) => {
  const res = await apiClient.patch(`/employees/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeEmployee(res.data as ApiEmployee);
};
export const getEmployeeSummary = async (id: string) => {
  const res = await apiClient.get(`/employees/${id}/summary/`);
  return res.data as {
    attendance: { present: number; absent: number; late: number };
    leaves: { pending: number; approved: number; rejected: number };
  };
};

export const getEmployeeMe = async () => {
  const res = await apiClient.get("/employees/me/");
  return normalizeEmployee(res.data as ApiEmployee);
};

export const exportEmployeesCSV = async (params: EmployeesQuery = {}) => {
  const mapped = mapEmployeeParams(params, { includePage: false });
  const res = await apiClient.get("/employees/export/", {
    params: mapped,
    responseType: "blob",
  });
  return res.data as Blob;
};

export const importEmployeesCSV = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/employees/import/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const checkEmployeeUnique = async (field: string, value: string, excludeId?: string) => {
  try {
    const res = await apiClient.get("/employees/", { params: { [field]: value } });
    const employees = Array.isArray(res.data?.results)
      ? (res.data.results as Array<Record<string, unknown>>)
      : Array.isArray(res.data)
        ? (res.data as Array<Record<string, unknown>>)
        : [];
    const match = employees.find((employee) => String(employee[field]) === String(value));
    if (match && match.id !== excludeId) return true;
    return false;
  } catch {
    return false;
  }
};
