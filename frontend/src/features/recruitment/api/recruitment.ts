import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { RecruitmentCandidate } from "@/types/api";

export type RecruitmentQuery = {
  status?: string;
  position?: string;
  start?: string;
  end?: string;
};

export const getCandidates = async (params: RecruitmentQuery = {}) => {
  const res = await apiClient.get("/recruitment/", { params });
  return unwrapList<RecruitmentCandidate>(res.data);
};

export const getRecruitmentReport = async (params: RecruitmentQuery = {}) => {
  const res = await apiClient.get("/recruitment/report/", { params });
  return unwrapList<RecruitmentCandidate>(res.data);
};

export const createCandidate = async (data: Partial<RecruitmentCandidate>) => {
  const res = await apiClient.post("/recruitment/", data);
  return res.data as RecruitmentCandidate;
};

export const updateCandidate = async (id: string, data: Partial<RecruitmentCandidate>) => {
  const res = await apiClient.patch(`/recruitment/${id}/`, data);
  return res.data as RecruitmentCandidate;
};

export const deleteCandidate = async (id: string) => {
  const res = await apiClient.delete(`/recruitment/${id}/`);
  return res.data;
};
