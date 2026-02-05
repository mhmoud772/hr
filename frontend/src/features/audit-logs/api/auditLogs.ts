import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { AuditLog } from "@/types/api";

export type AuditLogQuery = {
  model_name?: string;
  action?: string;
  user?: string;
};

export const getAuditLogs = async (params: AuditLogQuery = {}) => {
  const res = await apiClient.get("/audit-logs/", { params });
  return unwrapList<AuditLog>(res.data);
};
