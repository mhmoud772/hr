// API methods for biometric devices integration
import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { Device, DeviceSyncLog } from "@/types/api";

// Ensure API calls use VITE_API_URL from env.
// Example: const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export type DevicesResponse = { results: Device[]; count: number };

export const getDevices = async (params: Record<string, unknown> = {}) => {
  const res = await apiClient.get("/devices/", { params });
  const data = res.data as { results?: Device[]; count?: number } | Device[];
  return {
    results: unwrapList<Device>(data),
    count: (data as { count?: number }).count ?? unwrapList<Device>(data).length,
  } as DevicesResponse;
};

export const syncDevice = async (deviceId: string) => {
  const res = await apiClient.post(`/devices/${deviceId}/sync/`);
  return res.data;
};

export const getDeviceSyncLogs = async (deviceId: string) => {
  const res = await apiClient.get(`/devices/${deviceId}/sync_logs/`);
  return res.data as DeviceSyncLog[];
};

export const createDevice = async (data: Device) => {
  const res = await apiClient.post("/devices/", data);
  return res.data as Device;
};

export const updateDevice = async (id: string, data: Device) => {
  const res = await apiClient.put(`/devices/${id}/`, data);
  return res.data as Device;
};

export const deleteDevice = async (id: string) => {
  const res = await apiClient.delete(`/devices/${id}/`);
  return res.data;
};

