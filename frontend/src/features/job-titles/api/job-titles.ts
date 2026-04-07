import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeJobTitle } from "@/shared/lib/normalizers/employees";
import type { ApiJobTitle, ApiPaginatedJobTitleList } from "@/types/contracts";
import type { JobTitle } from "@/types/api";

export type JobTitlesQuery = {
  page?: number;
  search?: string;
  ordering?: string;
  level?: string;
  department?: string;
};

export type JobTitlesResponse = {
  results: JobTitle[];
  count: number;
};

const mapJobTitlePayload = (data: Partial<JobTitle>) => {
  const mapped: Record<string, unknown> = {};
  if (data.name !== undefined) mapped.name = data.name;
  if (data.nameEn !== undefined) mapped.name_en = data.nameEn;
  if (data.level !== undefined) mapped.level = data.level;
  if (data.minSalary !== undefined) mapped.min_salary = data.minSalary;
  if (data.maxSalary !== undefined) mapped.max_salary = data.maxSalary;
  if (data.description !== undefined) mapped.description = data.description;
  if (data.departmentId !== undefined) {
    mapped.department = data.departmentId || null;
  } else if (data.department !== undefined) {
    mapped.department = data.department || null;
  }
  return mapped;
};

export const getJobTitles = async (params: JobTitlesQuery = {}) => {
  const res = await apiClient.get("/job-titles/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedJobTitleList | ApiJobTitle[],
    normalizeJobTitle,
  ) as JobTitlesResponse;
};

export const createJobTitle = async (data: Partial<JobTitle>) => {
  const res = await apiClient.post("/job-titles/", mapJobTitlePayload(data));
  return normalizeJobTitle(res.data as ApiJobTitle);
};

export const updateJobTitle = async (id: string, data: Partial<JobTitle>) => {
  const res = await apiClient.put(`/job-titles/${id}/`, mapJobTitlePayload(data));
  return normalizeJobTitle(res.data as ApiJobTitle);
};

export const deleteJobTitle = async (id: string) => {
  const res = await apiClient.delete(`/job-titles/${id}/`);
  return res.data;
};
