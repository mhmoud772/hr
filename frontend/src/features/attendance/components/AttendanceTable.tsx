import React from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { Attendance } from "@/types/api";

interface AttendanceTableProps {
  records: Attendance[];
  canManage: boolean;
  onEdit: (record: Attendance) => void;
  onDelete: (record: Attendance) => void;
  actionLoading: string | null;
}

export function AttendanceTable({
  records,
  canManage,
  onEdit,
  onDelete,
  actionLoading,
}: AttendanceTableProps) {
  const { t } = useTranslation();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
            <CheckCircle className="w-3 h-3 ml-1" />
            {t("status_present")}
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
            <XCircle className="w-3 h-3 ml-1" />
            {t("status_absent")}
          </Badge>
        );
      case "late":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
            <AlertCircle className="w-3 h-3 ml-1" />
            {t("status_late")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">{t("employee_id")}</TableHead>
          <TableHead className="text-right">{t("employee_name")}</TableHead>
          <TableHead className="text-right">{t("check_in_time")}</TableHead>
          <TableHead className="text-right">{t("check_out_time")}</TableHead>
          <TableHead className="text-right">{t("work_hours")}</TableHead>
          <TableHead className="text-right">{t("status")}</TableHead>
          <TableHead className="text-right">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">{record.employeeId}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {(record.employeeName || record.employeeId).charAt(0)}
                </div>
                {record.employeeName || record.employeeId}
              </div>
            </TableCell>
            <TableCell className="font-mono">{record.checkIn || "-"}</TableCell>
            <TableCell className="font-mono">{record.checkOut || "-"}</TableCell>
            <TableCell className="font-mono">{record.workHours || "-"}</TableCell>
            <TableCell>{getStatusBadge(record.status)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(record)}
                  disabled={!canManage}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(record)}
                  disabled={!canManage || actionLoading === record.id}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
