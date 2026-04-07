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
import type { PerformanceReview } from "@/features/performance/types";

export function PerformanceSection({ employeeId }: { employeeId?: string }) {
  const { t } = useTranslation();
  const { performanceQuery } = useSelfServiceData(employeeId);

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle>{t("self_service_performance")}</CardTitle>
      </CardHeader>
      <CardContent>
        {performanceQuery.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : performanceQuery.isError ? (
          <EmptyState icon={AlertTriangle} title={t("error_loading")} />
        ) : performanceQuery.data?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("period")}</TableHead>
                <TableHead>{t("rating")}</TableHead>
                <TableHead>{t("reviewer")}</TableHead>
                <TableHead>{t("notes")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceQuery.data.map((review: PerformanceReview) => (
                <TableRow key={review.id}>
                  <TableCell>{review.period}</TableCell>
                  <TableCell>{review.rating}</TableCell>
                  <TableCell>{review.reviewerName || "-"}</TableCell>
                  <TableCell className="max-w-[240px] truncate">
                    {review.notes || "-"}
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
