import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { PerformanceReview } from "@/types/api";

export type PerformanceQuery = {
  employee?: string;
  period?: string;
  start?: string;
  end?: string;
};

export const getPerformanceReviews = async (params: PerformanceQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/performance/", { params: mapped });
  return unwrapList<PerformanceReview>(res.data);
};

export const getPerformanceReport = async (params: PerformanceQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/performance/report/", { params: mapped });
  return unwrapList<PerformanceReview>(res.data);
};

export const createPerformanceReview = async (data: Partial<PerformanceReview>) => {
  const res = await apiClient.post("/performance/", data);
  return res.data as PerformanceReview;
};

export const updatePerformanceReview = async (id: string, data: Partial<PerformanceReview>) => {
  const res = await apiClient.patch(`/performance/${id}/`, data);
  return res.data as PerformanceReview;
};

export const deletePerformanceReview = async (id: string) => {
  const res = await apiClient.delete(`/performance/${id}/`);
  return res.data;
};
