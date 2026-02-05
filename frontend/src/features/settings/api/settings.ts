// API methods for settings CRUD
import { apiClient } from "@/shared/lib/api-client";
import type { SettingsPayload } from "@/types/api";

export const getSettings = async (): Promise<SettingsPayload> => {
  const res = await apiClient.get("/settings/1/");
  return res.data as SettingsPayload;
};

export const updateSettings = async (
  data: SettingsPayload,
): Promise<SettingsPayload> => {
  const res = await apiClient.put("/settings/1/", data);
  return res.data as SettingsPayload;
};
