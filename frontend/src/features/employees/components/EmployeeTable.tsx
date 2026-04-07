import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { Employee } from "@/types/api";

interface EmployeeTableProps {
  employees: Employee[];
  canManage: boolean;
  onView: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  actionLoading: string | null;
}

export function EmployeeTable({
  employees,
  canManage,
  onView,
  onEdit,
  onDelete,
  actionLoading,
}: EmployeeTableProps) {
  const { t } = useTranslation();

  const getStatusBadge = (status: Employee["status"]) => {
    const config = {
      active: {
        label: t("active"),
        className: "bg-emerald-500/10 text-emerald-600",
      },
      leave: {
        label: t("on_leave"),
        className: "bg-amber-500/10 text-amber-600",
      },
      inactive: {
        label: t("inactive"),
        className: "bg-muted text-muted-foreground",
      },
    };
    return (
      config[status] || {
        label: t("status"),
        className: "bg-muted text-muted-foreground",
      }
    );
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">{t("employee_id")}</TableHead>
          <TableHead className="text-right">{t("name")}</TableHead>
          <TableHead className="text-right">{t("department")}</TableHead>
          <TableHead className="text-right">{t("job_title")}</TableHead>
          <TableHead className="text-right">{t("hire_date")}</TableHead>
          <TableHead className="text-right">{t("status")}</TableHead>
          <TableHead className="text-right">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => {
          const statusConfig = getStatusBadge(employee.status);
          return (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    {employee.avatarUrl ? (
                      <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  {employee.name}
                </div>
              </TableCell>
              <TableCell>{employee.department || "-"}</TableCell>
              <TableCell>{employee.jobTitle || "-"}</TableCell>
              <TableCell>{employee.hireDate || "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => onView(employee)}
                    >
                      <Eye className="w-4 h-4" />
                      {t("view_details")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => onEdit(employee)}
                      disabled={!canManage}
                    >
                      <Edit className="w-4 h-4" />
                      {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive"
                      onClick={() => onDelete(employee)}
                      disabled={!canManage || actionLoading === employee.id}
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
