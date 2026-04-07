import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizePerformanceReview } from "@/shared/lib/normalizers/features";
import type { ApiPaginatedPerformanceReviewList, ApiPerformanceReview } from "@/types/contracts";
import type { PerformanceReview } from "../types";

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
  return normalizePaginatedList(
    res.data as ApiPaginatedPerformanceReviewList | ApiPerformanceReview[],
    normalizePerformanceReview,
  ).results;
};

export const getPerformanceReport = async (params: PerformanceQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/performance/report/", { params: mapped });
  return normalizePaginatedList(
    res.data as ApiPaginatedPerformanceReviewList | ApiPerformanceReview[],
    normalizePerformanceReview,
  ).results;
};

export const createPerformanceReview = async (data: Partial<PerformanceReview>) => {
  const res = await apiClient.post("/performance/", data);
  return normalizePerformanceReview(res.data as ApiPerformanceReview);
};

export const updatePerformanceReview = async (id: string, data: Partial<PerformanceReview>) => {
  const res = await apiClient.patch(`/performance/${id}/`, data);
  return normalizePerformanceReview(res.data as ApiPerformanceReview);
};

export const deletePerformanceReview = async (id: string) => {
  const res = await apiClient.delete(`/performance/${id}/`);
  return res.data;
};
