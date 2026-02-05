import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAuditLogsQuery } from "@/features/audit-logs/hooks/useAuditLogs";

export default function AuditLogs() {
  const { t } = useTranslation();
  const [action, setAction] = useState("all");
  const logsQuery = useAuditLogsQuery({
    action: action === "all" ? undefined : action,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("audit_logs_title")}</h1>
        <p className="text-muted-foreground">{t("audit_logs_subtitle")}</p>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-4">
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("action")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status_all")}</SelectItem>
              <SelectItem value="create">{t("create")}</SelectItem>
              <SelectItem value="update">{t("update")}</SelectItem>
              <SelectItem value="delete">{t("delete")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle>{t("audit_logs_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <LoadingState label={t("loading")} />
          ) : logsQuery.isError ? (
            <EmptyState icon={AlertTriangle} title={t("error_loading")} />
          ) : logsQuery.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("action")}</TableHead>
                  <TableHead>{t("model")}</TableHead>
                  <TableHead>{t("object_id")}</TableHead>
                  <TableHead>{t("user")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsQuery.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{t(log.action)}</TableCell>
                    <TableCell>{log.model_name}</TableCell>
                    <TableCell>{log.object_id}</TableCell>
                    <TableCell>{log.userName || "-"}</TableCell>
                    <TableCell>{log.created_at || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">{t("no_data")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
