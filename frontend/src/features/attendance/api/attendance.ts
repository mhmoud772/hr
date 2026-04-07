// API methods for attendance CRUD
import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeAttendance } from "@/shared/lib/normalizers/attendance";
import type { ApiAttendance, ApiPaginatedAttendanceList, ApiAttendanceRequest, ApiPatchedAttendanceRequest } from "@/types/contracts";
import type { Attendance } from "../types";

// Ensure API calls use VITE_API_URL from env.
// Example: const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export type AttendanceQuery = {
  page?: number;
  search?: string;
  ordering?: string;
  status?: string;
  employee?: string;
  department?: string;
  start?: string;
  end?: string;
  date?: string;
};

export type AttendanceResponse = {
  results: Attendance[];
  count: number;
};

export type AttendanceImportLog = {
  id: string;
  source: string;
  status: string;
  message?: string;
  created_at?: string;
};

export const getAttendance = async (params: AttendanceQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["employee__employee_code"] = params.employee;
    delete mapped.employee;
  }
  if (params.department) {
    mapped["employee__department__id"] = params.department;
    delete mapped.department;
  }
  const res = await apiClient.get("/attendance/", { params: mapped });
  return normalizePaginatedList(
    res.data as ApiPaginatedAttendanceList | ApiAttendance[],
    normalizeAttendance,
  ) as AttendanceResponse;
};

export const createAttendance = async (data: ApiAttendanceRequest) => {
  const res = await apiClient.post("/attendance/", data);
  return normalizeAttendance(res.data as ApiAttendance);
};

export const updateAttendance = async (id: string, data: ApiPatchedAttendanceRequest) => {
  const res = await apiClient.patch(`/attendance/${id}/`, data);
  return normalizeAttendance(res.data as ApiAttendance);
};

export const deleteAttendance = async (id: string) => {
  const res = await apiClient.delete(`/attendance/${id}/`);
  return res.data;
};

export const getAttendanceSummary = async (date?: string) => {
  const res = await apiClient.get("/attendance/summary/", { params: date ? { date } : {} });
  return res.data as { total: number; present: number; absent: number; late: number };
};

export const closeAttendanceDay = async (date: string) => {
  const res = await apiClient.post("/attendance/close_day/", { date });
  return res.data as { updated: number };
};

export const importAttendanceLogs = async (source: string = "device") => {
  const res = await apiClient.post("/attendance/import_logs/", { source });
  return res.data;
};

export const getAttendanceImportHistory = async () => {
  const res = await apiClient.get("/import-logs/");
  return normalizePaginatedList(
    res.data as { results?: AttendanceImportLog[]; count?: number } | AttendanceImportLog[],
    (item) => item,
  ).results;
};

export const getAttendanceReport = async (
  params: { start?: string; end?: string; status?: string; department?: string; job_title?: string; employee?: string } = {},
) => {
  const res = await apiClient.get("/attendance/report/", { params });
  const data = res.data as ApiPaginatedAttendanceList | ApiAttendance[];
  return normalizePaginatedList(data, normalizeAttendance).results;
};

