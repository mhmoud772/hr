import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeTrainingRecord } from "@/shared/lib/normalizers/features";
import type { ApiPaginatedTrainingRecordList, ApiTrainingRecord, ApiTrainingRecordRequest, ApiPatchedTrainingRecordRequest } from "@/types/contracts";
import type { TrainingRecord } from "../types";

export type TrainingQuery = {
  employee?: string;
  status?: string;
  start?: string;
  end?: string;
};

export const getTrainingRecords = async (params: TrainingQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/training/", { params: mapped });
  return normalizePaginatedList(
    res.data as ApiPaginatedTrainingRecordList | ApiTrainingRecord[],
    normalizeTrainingRecord,
  ).results;
};

export const getTrainingReport = async (params: TrainingQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/training/report/", { params: mapped });
  return normalizePaginatedList(
    res.data as ApiPaginatedTrainingRecordList | ApiTrainingRecord[],
    normalizeTrainingRecord,
  ).results;
};

export const createTrainingRecord = async (data: ApiTrainingRecordRequest) => {
  const res = await apiClient.post("/training/", data);
  return normalizeTrainingRecord(res.data as ApiTrainingRecord);
};

export const updateTrainingRecord = async (id: string, data: ApiPatchedTrainingRecordRequest) => {
  const res = await apiClient.patch(`/training/${id}/`, data);
  return normalizeTrainingRecord(res.data as ApiTrainingRecord);
};

export const deleteTrainingRecord = async (id: string) => {
  const res = await apiClient.delete(`/training/${id}/`);
  return res.data;
};
