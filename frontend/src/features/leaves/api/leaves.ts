// API methods for leaves CRUD
import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import {
  normalizeLeave,
  normalizeLeaveBalance,
} from "@/shared/lib/normalizers/attendance";
import type {
  ApiLeave,
  ApiLeaveBalance,
  ApiPaginatedLeaveList,
  ApiLeaveRequest,
  ApiPatchedLeaveRequest,
} from "@/types/contracts";
import type { Leave, LeaveBalance } from "../types";

// Ensure API calls use VITE_API_URL from env.
// Example: const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export type LeavesQuery = {
  page?: number;
  search?: string;
  ordering?: string;
  status?: string;
  leave_type?: string;
  employee?: string;
  department?: string;
  start?: string;
  end?: string;
};

export type LeavesResponse = {
  results: Leave[];
  count: number;
};

export const getLeaves = async (params: LeavesQuery = {}) => {
  const res = await apiClient.get("/leaves/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedLeaveList | ApiLeave[],
    normalizeLeave,
  ) as LeavesResponse;
};

export const createLeave = async (data: ApiLeaveRequest) => {
  const res = await apiClient.post("/leaves/", data);
  return normalizeLeave(res.data as ApiLeave);
};

export const updateLeave = async (id: string, data: ApiPatchedLeaveRequest) => {
  const res = await apiClient.patch(`/leaves/${id}/`, data);
  return normalizeLeave(res.data as ApiLeave);
};

export const deleteLeave = async (id: string) => {
  const res = await apiClient.delete(`/leaves/${id}/`);
  return res.data;
};

export const approveLeave = async (id: string, comment?: string) => {
  const res = await apiClient.post(`/leaves/${id}/approve/`, { comment });
  return normalizeLeave(res.data as ApiLeave);
};

export const rejectLeave = async (id: string, comment?: string) => {
  const res = await apiClient.post(`/leaves/${id}/reject/`, { comment });
  return normalizeLeave(res.data as ApiLeave);
};

export const uploadLeaveAttachment = async (id: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post(`/leaves/${id}/attachments/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getLeaveBalances = async (employee?: string) => {
  const res = await apiClient.get("/leave-balances/", { params: employee ? { employee } : {} });
  return (Array.isArray(res.data) ? res.data : []).map((item) =>
    normalizeLeaveBalance(item as ApiLeaveBalance),
  );
};

export const getLeavesReport = async (
  params: { start?: string; end?: string; status?: string; leave_type?: string; department?: string; job_title?: string; employee?: string } = {},
) => {
  const res = await apiClient.get("/leaves/report/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedLeaveList | ApiLeave[],
    normalizeLeave,
  ).results;
};

// Example: server-side validation before sending to the API
// export const validateLeaveOnServer = async (leaveData: any) => {
//   const res = await apiClient.post(`/leaves/validate`, leaveData);
//   return res.data;
// };

