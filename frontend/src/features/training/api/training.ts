import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { TrainingRecord } from "@/types/api";

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
  return unwrapList<TrainingRecord>(res.data);
};

export const getTrainingReport = async (params: TrainingQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/training/report/", { params: mapped });
  return unwrapList<TrainingRecord>(res.data);
};

export const createTrainingRecord = async (data: Partial<TrainingRecord>) => {
  const res = await apiClient.post("/training/", data);
  return res.data as TrainingRecord;
};

export const updateTrainingRecord = async (id: string, data: Partial<TrainingRecord>) => {
  const res = await apiClient.patch(`/training/${id}/`, data);
  return res.data as TrainingRecord;
};

export const deleteTrainingRecord = async (id: string) => {
  const res = await apiClient.delete(`/training/${id}/`);
  return res.data;
};
