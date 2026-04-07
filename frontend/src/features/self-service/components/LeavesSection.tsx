import React from "react";
import type { Leave } from "@/types/api";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
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
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { useSelfServiceLeaves } from "../hooks/useSelfServiceLeaves";

const LEAVE_TYPES = [
  { key: "annual" },
  { key: "sick" },
  { key: "emergency" },
  { key: "unpaid" },
] as const;

interface LeavesSectionProps {
  employeeId?: string;
  onOpenDetails: (leave: Leave) => void;
  onOpenRequestDialog: () => void;
}

export function LeavesTable({ employeeId, onOpenDetails, onOpenRequestDialog }: LeavesSectionProps) {
  const { t } = useTranslation();
  const { leavesQuery } = useSelfServiceLeaves(employeeId ? parseInt(employeeId, 10) : undefined);

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("my_leaves")}</CardTitle>
        <Button onClick={onOpenRequestDialog}>{t("request_leave")}</Button>
      </CardHeader>
      <CardContent>
        {leavesQuery.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : leavesQuery.isError ? (
          <EmptyState icon={AlertTriangle} title={t("error_loading")} />
        ) : leavesQuery.data?.results?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("leave_type_label")}</TableHead>
                <TableHead>{t("from_date")}</TableHead>
                <TableHead>{t("to_date")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leavesQuery.data.results.slice(0, 10).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{t(`leave_type_${item.leaveType}`)}</TableCell>
                  <TableCell>{item.startDate}</TableCell>
                  <TableCell>{item.endDate}</TableCell>
                  <TableCell>{t(item.status)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onOpenDetails(item)}>
                      {t("view_details")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">{t("no_data")}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function LeaveBalances({ employeeId }: { employeeId?: string }) {
  const { t } = useTranslation();
  const { balancesQuery, balanceByType } = useSelfServiceLeaves(employeeId ? parseInt(employeeId, 10) : undefined);

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle>{t("self_service_balances")}</CardTitle>
      </CardHeader>
      <CardContent>
        {balancesQuery.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : balancesQuery.isError ? (
          <EmptyState icon={AlertTriangle} title={t("error_loading")} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {LEAVE_TYPES.map(({ key }) => {
              const balance = balanceByType.get(key) || { total: 0, used: 0, remaining: 0 };
              return (
                <Card key={key} className="bg-muted/40 border-none shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t(`leave_type_${key}`)}</span>
                      <Badge variant="outline">
                        {balance.remaining} {t("days")}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("total_balance")}</span>
                        <span>{balance.total} {t("days")}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("used_balance")}</span>
                        <span>{balance.used} {t("days")}</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${balance.total ? (balance.used / balance.total) * 100 : 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ApprovalsTable({ employeeId, onOpenDetails }: { employeeId?: string; onOpenDetails: (leave: Leave) => void }) {
  const { t } = useTranslation();
  const { leavesQuery } = useSelfServiceLeaves(employeeId ? parseInt(employeeId, 10) : undefined);

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle>{t("self_service_approvals")}</CardTitle>
      </CardHeader>
      <CardContent>
        {leavesQuery.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : leavesQuery.isError ? (
          <EmptyState icon={AlertTriangle} title={t("error_loading")} />
        ) : leavesQuery.data?.results?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("leave_type_label")}</TableHead>
                <TableHead>{t("from_date")}</TableHead>
                <TableHead>{t("to_date")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("approval_log")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leavesQuery.data.results.slice(0, 10).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{t(`leave_type_${item.leaveType}`)}</TableCell>
                  <TableCell>{item.startDate}</TableCell>
                  <TableCell>{item.endDate}</TableCell>
                  <TableCell>{t(item.status)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onOpenDetails(item)}>
                      {t("view_details")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">{t("no_data")}</p>
        )}
      </CardContent>
    </Card>
  );
}
