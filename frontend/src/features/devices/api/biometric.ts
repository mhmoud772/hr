// Biometric device integration placeholder.
// Ensure all API calls use VITE_API_URL from env.
// Example: const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
import { apiClient } from "@/shared/lib/api-client";

export const fetchBiometricData = async (deviceId: string) => {
  const res = await apiClient.get(`/biometric/${deviceId}`);
  return res.data;
};

export const ingestBiometricLogs = async (deviceId: string, logs: Array<Record<string, unknown>>) => {
  const res = await apiClient.post(`/devices/${deviceId}/ingest/`, { logs });
  return res.data;
};

