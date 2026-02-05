import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { EmployeeDocument } from "@/types/api";

export type EmployeeDocumentsQuery = {
  employee?: string;
};

export const getEmployeeDocuments = async (params: EmployeeDocumentsQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/employee-documents/", { params: mapped });
  return unwrapList<EmployeeDocument>(res.data);
};

export const createEmployeeDocument = async (data: FormData) => {
  const res = await apiClient.post("/employee-documents/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as EmployeeDocument;
};

export const deleteEmployeeDocument = async (id: string) => {
  const res = await apiClient.delete(`/employee-documents/${id}/`);
  return res.data;
};
