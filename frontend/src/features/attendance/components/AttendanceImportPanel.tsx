import React from "react";
import { useTranslation } from "react-i18next";
import { ListChecks, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import type { AttendanceImportLog } from "@/features/attendance/api/attendance";

interface AttendanceImportPanelProps {
  onSync: () => void;
  isLoading: boolean;
  history: AttendanceImportLog[];
  canManage: boolean;
}

export function AttendanceImportPanel({
  onSync,
  isLoading,
  history,
  canManage,
}: AttendanceImportPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          {t("import_logs")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-background/50"
            onClick={onSync}
            disabled={!canManage || isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            {t("sync_devices")}
          </Button>
        </div>
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-6 text-sm text-muted-foreground">
            {t("no_data")}
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-foreground">{log.message || log.status}</span>
                <span className="text-xs text-muted-foreground">
                  {log.created_at || ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
