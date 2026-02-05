import { apiClient } from "@/shared/lib/api-client";

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const res = await apiClient.post("/auth/change-password", { currentPassword, newPassword });
  return res.data;
};
