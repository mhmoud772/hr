import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeAuditLog } from "@/shared/lib/normalizers/features";
import type { ApiAuditLog, ApiPaginatedAuditLogList } from "@/types/contracts";
import type { AuditLog } from "@/types/api";

export type AuditLogQuery = {
  model_name?: string;
  action?: string;
  user?: string;
};

export const getAuditLogs = async (params: AuditLogQuery = {}) => {
  const res = await apiClient.get("/audit-logs/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedAuditLogList | ApiAuditLog[],
    normalizeAuditLog,
  ).results;
};
