import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/features/audit-logs/api/auditLogs";
import type { AuditLogQuery } from "@/features/audit-logs/api/auditLogs";

type UseAuditLogsOptions = {
  enabled?: boolean;
};

export const useAuditLogsQuery = (
  params: AuditLogQuery = {},
  options: UseAuditLogsOptions = {},
) =>
  useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogs(params),
    enabled: options.enabled ?? true,
  });
