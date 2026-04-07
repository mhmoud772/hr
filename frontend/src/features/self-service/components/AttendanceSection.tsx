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

export function AttendanceSection() {
  const { t } = useTranslation();
  const { attendanceQuery } = useSelfServiceData();

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle>{t("my_attendance")}</CardTitle>
      </CardHeader>
      <CardContent>
        {attendanceQuery.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : attendanceQuery.isError ? (
          <EmptyState icon={AlertTriangle} title={t("error_loading")} />
        ) : attendanceQuery.data?.results?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("check_in_time")}</TableHead>
                <TableHead>{t("check_out_time")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceQuery.data.results.slice(0, 10).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{t(`status_${item.status}`)}</TableCell>
                  <TableCell>{item.checkIn || "-"}</TableCell>
                  <TableCell>{item.checkOut || "-"}</TableCell>
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
