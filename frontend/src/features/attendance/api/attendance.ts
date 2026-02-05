// API methods for attendance CRUD
import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { Attendance } from "@/types/api";

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
  const data = res.data as { results?: Attendance[]; count?: number } | Attendance[];
  return {
    results: unwrapList<Attendance>(data),
    count: (data as { count?: number }).count ?? unwrapList<Attendance>(data).length,
  } as AttendanceResponse;
};

export const createAttendance = async (data: Partial<Attendance>) => {
  const res = await apiClient.post("/attendance/", data);
  return res.data as Attendance;
};

export const updateAttendance = async (id: string, data: Partial<Attendance>) => {
  const res = await apiClient.patch(`/attendance/${id}/`, data);
  return res.data as Attendance;
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
  const res = await apiClient.get("/attendance/import_history/");
  return res.data as Array<{ id: string; source: string; status: string; message?: string; created_at?: string }>;
};

export const getAttendanceReport = async (
  params: { start?: string; end?: string; status?: string; department?: string; job_title?: string; employee?: string } = {},
) => {
  const res = await apiClient.get("/attendance/report/", { params });
  return unwrapList<Attendance>(res.data);
};

