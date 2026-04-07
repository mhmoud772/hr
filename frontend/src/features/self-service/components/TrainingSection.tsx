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
import type { TrainingRecord } from "@/features/training/types";

export function TrainingSection({ employeeId }: { employeeId?: string }) {
  const { t } = useTranslation();
  const { trainingQuery } = useSelfServiceData(employeeId);

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle>{t("self_service_training")}</CardTitle>
      </CardHeader>
      <CardContent>
        {trainingQuery.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : trainingQuery.isError ? (
          <EmptyState icon={AlertTriangle} title={t("error_loading")} />
        ) : trainingQuery.data?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("provider")}</TableHead>
                <TableHead>{t("from_date")}</TableHead>
                <TableHead>{t("to_date")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingQuery.data.map((record: TrainingRecord) => (
                <TableRow key={record.id}>
                  <TableCell>{record.title}</TableCell>
                  <TableCell>{record.provider || "-"}</TableCell>
                  <TableCell>{record.start_date || "-"}</TableCell>
                  <TableCell>{record.end_date || "-"}</TableCell>
                  <TableCell>{t(`training_status_${record.status}`)}</TableCell>
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
