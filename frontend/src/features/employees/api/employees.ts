// API methods for employees CRUD
// Replace the URLs with your backend endpoints

import { apiClient, unwrapList } from "@/shared/lib/api-client";
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

export const getEmployees = async (params: EmployeesQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.department) {
    mapped["department__name"] = params.department;
    delete mapped.department;
  }
  if (params.job_title) {
    mapped["job_title__name"] = params.job_title;
    delete mapped.job_title;
  }
  const res = await apiClient.get("/employees/", { params: mapped });
  const data = res.data as { results?: Employee[]; count?: number } | Employee[];
  return {
    results: unwrapList<Employee>(data),
    count: (data as { count?: number }).count ?? unwrapList<Employee>(data).length,
  } as EmployeesResponse;
};

export const createEmployee = async (data: Employee) => {
  const res = await apiClient.post("/employees/", data);
  return res.data as Employee;
};

export const updateEmployee = async (id: string, data: Employee) => {
  const res = await apiClient.patch(`/employees/${id}/`, data);
  return res.data as Employee;
};

export const deleteEmployee = async (id: string) => {
  const res = await apiClient.delete(`/employees/${id}/`);
  return res.data;
};

export const createEmployeeWithFile = async (data: FormData) => {
  const res = await apiClient.post("/employees/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as Employee;
};

export const updateEmployeeWithFile = async (id: string, data: FormData) => {
  const res = await apiClient.patch(`/employees/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as Employee;
};

export const exportEmployeesCSV = async () => {
  const res = await apiClient.get("/employees/export_csv/", { responseType: "blob" });
  return res.data as Blob;
};

export const importEmployeesCSV = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post("/employees/import_csv/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as { created: number; updated: number };
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
  return res.data as Employee;
};

