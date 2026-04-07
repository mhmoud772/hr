import { useMemo, useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { AlertTriangle, ClipboardList } from "lucide-react";
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
import { PageHero } from "@/shared/components/PageHero";
import { TableToolbar } from "@/shared/components/TableToolbar";
import { parseSortValue, sortRows } from "@/shared/lib/tableUtils";

export default function AuditLogs() {
  const { t, i18n } = useTranslation();
  const [action, setAction] = useState("all");
  const [search, setSearch] = useState("");
  const [sortValue, setSortValue] = useState("date:desc");
  const logsQuery = useAuditLogsQuery({
    action: action === "all" ? undefined : action,
  });

  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !search ||
        [log.model_name, log.object_id, log.userName, log.action]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [logs, search]);

  const { key: sortKey, direction } = parseSortValue(sortValue);
  const sortedLogs = useMemo(
    () =>
      sortRows(
        filteredLogs,
        sortKey,
        direction,
        {
          action: (log) => log.action,
          model: (log) => log.model_name,
          user: (log) => log.userName,
          date: (log) => log.created_at,
        },
      ),
    [filteredLogs, sortKey, direction],
  );
  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString(i18n.language?.startsWith("ar") ? "ar-SA" : "en-US");
    } catch {
      return value;
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: sortedLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("audit_logs_title")}
        subtitle={t("audit_logs_subtitle")}
        icon={ClipboardList}
      />

      <Card className="bg-card/90 border border-border/60 shadow-sm">
        <CardContent className="p-4">
          <TableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: t("search_logs"),
            }}
            filters={
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t("action")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  <SelectItem value="create">{t("create")}</SelectItem>
                  <SelectItem value="update">{t("update")}</SelectItem>
                  <SelectItem value="delete">{t("delete")}</SelectItem>
                </SelectContent>
              </Select>
            }
            sort={{
              value: sortValue,
              onChange: setSortValue,
              options: [
                { value: "date:desc", label: t("sort_recent") },
                { value: "action:asc", label: t("sort_action") },
                { value: "model:asc", label: t("sort_model") },
                { value: "user:asc", label: t("sort_user") },
              ],
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-card/90 border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t("audit_logs_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <LoadingState label={t("loading")} />
          ) : logsQuery.isError ? (
            <EmptyState icon={AlertTriangle} title={t("error_loading")} />
          ) : sortedLogs.length ? (
            <>
              <div className="md:hidden space-y-3">
                {sortedLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-border/60 bg-background p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{t(log.action)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(log.created_at)}</div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>{t("model")}: <span className="text-foreground">{log.model_name}</span></div>
                      <div>{t("object_id")}: <span className="text-foreground">{log.object_id}</span></div>
                      <div>{t("user")}: <span className="text-foreground">{log.userName || "-"}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
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
                    {sortedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{t(log.action)}</TableCell>
                        <TableCell>{log.model_name}</TableCell>
                        <TableCell>{log.object_id}</TableCell>
                        <TableCell>{log.userName || "-"}</TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <EmptyState title={t("no_data")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
