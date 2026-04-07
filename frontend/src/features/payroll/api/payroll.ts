import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizePayrollRecord } from "@/shared/lib/normalizers/features";
import type { ApiPaginatedPayrollRecordList, ApiPayrollRecord, ApiPayrollRecordRequest, ApiPatchedPayrollRecordRequest } from "@/types/contracts";
import type { PayrollRecord } from "../types";

export type PayrollQuery = {
  employee?: string;
  status?: string;
};

export const getPayroll = async (params: PayrollQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/payroll/", { params: mapped });
  return normalizePaginatedList(
    res.data as ApiPaginatedPayrollRecordList | ApiPayrollRecord[],
    normalizePayrollRecord,
  ).results;
};

export const getPayrollReport = async (params: PayrollQuery & { start?: string; end?: string } = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/payroll/report/", { params: mapped });
  return normalizePaginatedList(
    res.data as ApiPaginatedPayrollRecordList | ApiPayrollRecord[],
    normalizePayrollRecord,
  ).results;
};

export const createPayroll = async (data: ApiPayrollRecordRequest) => {
  const res = await apiClient.post("/payroll/", data);
  return normalizePayrollRecord(res.data as ApiPayrollRecord);
};

export const updatePayroll = async (id: string, data: ApiPatchedPayrollRecordRequest) => {
  const res = await apiClient.patch(`/payroll/${id}/`, data);
  return normalizePayrollRecord(res.data as ApiPayrollRecord);
};

export const deletePayroll = async (id: string) => {
  const res = await apiClient.delete(`/payroll/${id}/`);
  return res.data;
};
