import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import {
  normalizeEmployeeShift,
  normalizeShift,
} from "@/shared/lib/normalizers/attendance";
import type {
  ApiEmployeeShift,
  ApiPaginatedEmployeeShiftList,
  ApiPaginatedShiftList,
  ApiShift,
} from "@/types/contracts";
import type { Shift, EmployeeShift } from "@/types/api";

const mapEmployeeShiftPayload = (data: Partial<EmployeeShift>) => ({
  employee: data.employeeId,
  shift: data.shift,
  start_date: data.start_date,
  end_date: data.end_date,
});

export const getShifts = async () => {
  const res = await apiClient.get("/shifts/");
  return normalizePaginatedList(
    res.data as ApiPaginatedShiftList | ApiShift[],
    normalizeShift,
  ).results;
};

export const createShift = async (data: Partial<Shift>) => {
  const res = await apiClient.post("/shifts/", data);
  return normalizeShift(res.data as ApiShift);
};

export const updateShift = async (id: string, data: Partial<Shift>) => {
  const res = await apiClient.patch(`/shifts/${id}/`, data);
  return normalizeShift(res.data as ApiShift);
};

export const deleteShift = async (id: string) => {
  const res = await apiClient.delete(`/shifts/${id}/`);
  return res.data;
};

export const getEmployeeShifts = async (params: { employee__employee_code?: string; shift?: string } = {}) => {
  const res = await apiClient.get("/employee-shifts/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedEmployeeShiftList | ApiEmployeeShift[],
    normalizeEmployeeShift,
  ).results;
};

export const createEmployeeShift = async (data: Partial<EmployeeShift>) => {
  const res = await apiClient.post("/employee-shifts/", mapEmployeeShiftPayload(data));
  return normalizeEmployeeShift(res.data as ApiEmployeeShift);
};

export const updateEmployeeShift = async (id: string, data: Partial<EmployeeShift>) => {
  const res = await apiClient.patch(`/employee-shifts/${id}/`, mapEmployeeShiftPayload(data));
  return normalizeEmployeeShift(res.data as ApiEmployeeShift);
};

export const deleteEmployeeShift = async (id: string) => {
  const res = await apiClient.delete(`/employee-shifts/${id}/`);
  return res.data;
};
