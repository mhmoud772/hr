import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { JobTitle } from "@/types/api";

export type JobTitlesQuery = {
  page?: number;
  search?: string;
  ordering?: string;
  level?: string;
  department__name?: string;
};

export type JobTitlesResponse = {
  results: JobTitle[];
  count: number;
};

export const getJobTitles = async (params: JobTitlesQuery = {}) => {
  const res = await apiClient.get("/job-titles/", { params });
  const data = res.data as { results?: JobTitle[]; count?: number } | JobTitle[];
  return {
    results: unwrapList<JobTitle>(data),
    count: (data as { count?: number }).count ?? unwrapList<JobTitle>(data).length,
  } as JobTitlesResponse;
};

export const createJobTitle = async (data: Partial<JobTitle>) => {
  const res = await apiClient.post("/job-titles/", data);
  return res.data as JobTitle;
};

export const updateJobTitle = async (id: string, data: Partial<JobTitle>) => {
  const res = await apiClient.put(`/job-titles/${id}/`, data);
  return res.data as JobTitle;
};

export const deleteJobTitle = async (id: string) => {
  const res = await apiClient.delete(`/job-titles/${id}/`);
  return res.data;
};
