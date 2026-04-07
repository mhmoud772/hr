import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
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
import { useSelfServiceData } from "../hooks/useSelfServiceData";
import type { PayrollRecord } from "@/features/payroll/types";

export function PayrollSection({ employeeId }: { employeeId?: string }) {
  const { t } = useTranslation();
  const { payrollQuery } = useSelfServiceData(employeeId);

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle>{t("self_service_payroll")}</CardTitle>
      </CardHeader>
      <CardContent>
        {payrollQuery.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : payrollQuery.isError ? (
          <EmptyState icon={AlertTriangle} title={t("error_loading")} />
        ) : payrollQuery.data?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("period")}</TableHead>
                <TableHead>{t("base_salary")}</TableHead>
                <TableHead>{t("allowances")}</TableHead>
                <TableHead>{t("deductions")}</TableHead>
                <TableHead>{t("net_salary")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollQuery.data.map((record: PayrollRecord) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {record.period_start} - {record.period_end}
                  </TableCell>
                  <TableCell>{record.base_salary}</TableCell>
                  <TableCell>{record.allowances}</TableCell>
                  <TableCell>{record.deductions}</TableCell>
                  <TableCell>{record.net_salary}</TableCell>
                  <TableCell>{t(record.status)}</TableCell>
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
