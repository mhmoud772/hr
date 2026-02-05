import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/features/audit-logs/api/auditLogs";
import type { AuditLogQuery } from "@/features/audit-logs/api/auditLogs";

export const useAuditLogsQuery = (params: AuditLogQuery = {}) =>
  useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogs(params),
  });
