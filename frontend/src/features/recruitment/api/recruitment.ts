import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeRecruitmentCandidate } from "@/shared/lib/normalizers/features";
import type { ApiPaginatedRecruitmentCandidateList, ApiRecruitmentCandidate, ApiRecruitmentCandidateRequest, ApiPatchedRecruitmentCandidateRequest } from "@/types/contracts";
import type { RecruitmentCandidate } from "../types";

export type RecruitmentQuery = {
  status?: string;
  position?: string;
  start?: string;
  end?: string;
};

export const getCandidates = async (params: RecruitmentQuery = {}) => {
  const res = await apiClient.get("/recruitment/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedRecruitmentCandidateList | ApiRecruitmentCandidate[],
    normalizeRecruitmentCandidate,
  ).results;
};

export const getRecruitmentReport = async (params: RecruitmentQuery = {}) => {
  const res = await apiClient.get("/recruitment/report/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedRecruitmentCandidateList | ApiRecruitmentCandidate[],
    normalizeRecruitmentCandidate,
  ).results;
};

export const createCandidate = async (data: ApiRecruitmentCandidateRequest) => {
  const res = await apiClient.post("/recruitment/", data);
  return normalizeRecruitmentCandidate(res.data as ApiRecruitmentCandidate);
};

export const updateCandidate = async (id: string, data: ApiPatchedRecruitmentCandidateRequest) => {
  const res = await apiClient.patch(`/recruitment/${id}/`, data);
  return normalizeRecruitmentCandidate(res.data as ApiRecruitmentCandidate);
};

export const deleteCandidate = async (id: string) => {
  const res = await apiClient.delete(`/recruitment/${id}/`);
  return res.data;
};
