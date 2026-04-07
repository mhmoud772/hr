// API methods for settings CRUD
import { apiClient } from "@/shared/lib/api-client";
import type { ApiSettings, ApiSettingsRequest } from "@/types/contracts";

export const getSettings = async (): Promise<ApiSettings> => {
  const res = await apiClient.get("/settings/1/");
  return res.data as ApiSettings;
};

export const updateSettings = async (
  data: ApiSettingsRequest,
): Promise<ApiSettings> => {
  const res = await apiClient.put("/settings/1/", data);
  return res.data as ApiSettings;
};
