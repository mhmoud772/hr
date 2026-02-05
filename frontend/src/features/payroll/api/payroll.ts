import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { PayrollRecord } from "@/types/api";

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
  return unwrapList<PayrollRecord>(res.data);
};

export const getPayrollReport = async (params: PayrollQuery & { start?: string; end?: string } = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/payroll/report/", { params: mapped });
  return unwrapList<PayrollRecord>(res.data);
};

export const createPayroll = async (data: Partial<PayrollRecord>) => {
  const res = await apiClient.post("/payroll/", data);
  return res.data as PayrollRecord;
};

export const updatePayroll = async (id: string, data: Partial<PayrollRecord>) => {
  const res = await apiClient.patch(`/payroll/${id}/`, data);
  return res.data as PayrollRecord;
};

export const deletePayroll = async (id: string) => {
  const res = await apiClient.delete(`/payroll/${id}/`);
  return res.data;
};
