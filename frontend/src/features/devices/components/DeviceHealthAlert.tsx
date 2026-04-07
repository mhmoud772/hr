import React from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ChevronDown, ChevronUp, BarChart3, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { DeviceHealthReportResponse } from "@/features/devices/api/devices";

type DeviceHealthRow = DeviceHealthReportResponse["devices"][number];

interface DeviceHealthAlertProps {
  healthIssues: DeviceHealthRow[];
  allHealthRows: DeviceHealthRow[];
  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
  isLoading: boolean;
}

export function DeviceHealthAlert({
  healthIssues,
  allHealthRows,
  showDetails,
  setShowDetails,
  isLoading,
}: DeviceHealthAlertProps) {
  const { t } = useTranslation();

  if (isLoading || healthIssues.length === 0) return null;

  return (
    <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 shadow-sm transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <div className="space-y-1">
            <AlertTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              {t("device_health_issues")}
              <Badge variant="destructive" className="animate-pulse">
                {healthIssues.length}
              </Badge>
            </AlertTitle>
            <AlertDescription className="text-sm text-foreground/80">
              <ul className="list-disc list-inside space-y-1 mt-2">
                {healthIssues.map((issue) => (
                  <li key={issue.deviceId}>
                    <span className="font-semibold">{issue.deviceName}: </span>
                    {issue.inactive ? t("device_inactive") : t("device_failure_rate", { rate: issue.failureRatePercent })}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost" 
          size="sm" 
          className="text-destructive hover:bg-destructive/10"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <div className="flex items-center gap-2">
              {t("hide_details")}
              <ChevronUp className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {t("view_details")}
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>

      {showDetails && (
        <div className="mt-6 pt-4 border-t border-destructive/10 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-4 text-destructive">
            <BarChart3 className="h-4 w-4" />
            <h4 className="font-bold text-sm uppercase tracking-wider">{t("detailed_health_report")}</h4>
          </div>
          <div className="rounded-lg border border-destructive/10 overflow-hidden bg-background">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-2">{t("device")}</TableHead>
                  <TableHead className="py-2 text-center">{t("failure_rate")}</TableHead>
                  <TableHead className="py-2 text-center">{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allHealthRows.map((row) => (
                  <TableRow key={row.deviceId} className="hover:bg-muted/30">
                    <TableCell className="py-2">{row.deviceName}</TableCell>
                    <TableCell className="py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${row.failureRatePercent > 20 ? 'bg-destructive' : 'bg-warning'}`} 
                            style={{ width: `${row.failureRatePercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">{row.failureRatePercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      {row.inactive ? (
                        <Badge variant="destructive" className="text-[10px] uppercase">{t("inactive")}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] uppercase bg-emerald-500/10 text-emerald-600">{t("verified")}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Alert>
  );
}
