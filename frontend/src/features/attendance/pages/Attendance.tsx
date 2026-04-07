import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { generateAttendanceReport, downloadPDF } from "@/shared/lib/pdf-reports";
import { useTranslation } from "react-i18next";
import {
  useAttendanceQuery,
  useAttendanceSummaryQuery,
  useAttendanceImportHistoryQuery,
} from "@/features/attendance/hooks/useAttendance";
import { getAttendanceReport } from "@/features/attendance/api/attendance";
import { LoadingState } from "@/shared/components/LoadingState";
import { PageHero } from "@/shared/components/PageHero";
import { EmptyState } from "@/shared/components/EmptyState";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { AttendanceFormDialog } from "@/features/attendance/components/AttendanceFormDialog";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";

import { useAttendanceFilters } from "../hooks/useAttendanceFilters";
import { useAttendanceActions } from "../hooks/useAttendanceActions";
import { mapAttendanceToReport } from "../lib/attendance-payload";
import { TableToolbar } from "@/shared/components/TableToolbar";
import { Filter, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { AttendanceTable } from "../components/AttendanceTable";
import { AttendanceImportPanel } from "../components/AttendanceImportPanel";
import type { Attendance as AttendanceRecord } from "../types";

export default function Attendance() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const {
    page,
    setPage,
    search,
    setSearch,
    status,
    setStatus,
    department,
    setDepartment,
    employee,
    setEmployee,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    apiParams,
    summaryDate,
    employees,
    departments,
    isFiltersLoading,
  } = useAttendanceFilters();

  const attendanceQuery = useAttendanceQuery(apiParams);
  const summaryQuery = useAttendanceSummaryQuery(summaryDate);
  const importHistoryQuery = useAttendanceImportHistoryQuery();

  const {
    handleSave,
    confirmDelete,
    handleCloseDay,
    handleImportLogs,
    actionLoading,
    isImporting,
  } = useAttendanceActions(
    () => attendanceQuery.refetch(),
    () => importHistoryQuery.refetch()
  );

  const canManage = ["system_admin", "admin", "hr_manager"].includes(
    String(user?.role || ""),
  );

  const records = attendanceQuery.data?.results ?? [];
  const totalCount = attendanceQuery.data?.count ?? records.length;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const summary = summaryQuery.data || { total: 0, present: 0, absent: 0, late: 0 };
  const roleLabel = user?.role ? t(`role_${user.role}`) : t("default_user_role");
  const selectedStatusLabel =
    status === "all"
      ? t("status_all")
      : status === "present"
        ? t("status_present")
        : status === "absent"
          ? t("status_absent")
          : t("status_late");
  const selectedDepartmentLabel =
    department === "all"
      ? t("status_all")
      : departments.find((dept) => String(dept.id) === department)?.name || department;
  const selectedEmployeeLabel =
    employee === "all"
      ? t("status_all")
      : employees.find((item) => String(item.id) === employee)?.name || employee;
  const importHistory = importHistoryQuery.data || [];

  if (attendanceQuery.isLoading || isFiltersLoading) {
    return <LoadingState label={t("loading")} />;
  }

  const handleAdd = () => {
    setSelectedRecord(null);
    setFormOpen(true);
  };

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setFormOpen(true);
  };

  const handleDelete = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  };

  const handleExportPDF = async () => {
    try {
      const report = await getAttendanceReport({
        start: startDate || undefined,
        end: endDate || undefined,
      });
      const doc = generateAttendanceReport(
        report.map(mapAttendanceToReport),
        startDate || new Date().toISOString().slice(0, 10),
      );
      downloadPDF(doc, "attendance-report");
    } catch {
      // handled by global error boundary or toast in actions if needed
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("attendance_title")}
        subtitle={t("attendance_subtitle")}
        metrics={[
          { label: t("total_employees"), value: summary.total, tone: "primary" },
          { label: t("present_label"), value: summary.present, tone: "success" },
          { label: t("absent_label"), value: summary.absent, tone: "default" },
          { label: t("late_count"), value: summary.late, tone: "warning" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setStartDate(new Date().toISOString().slice(0, 10))}
            >
              <CalendarIcon className="w-4 h-4" />
              {t("today")}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
              <FileText className="w-4 h-4" />
              {t("export_pdf")}
            </Button>
            <Button className="gap-2" onClick={handleAdd} disabled={!canManage}>
              <Plus className="w-4 h-4" />
              {t("add_attendance")}
            </Button>
          </div>
        }
        aside={
          <div className="rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-inner">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("active_session")}
                </p>
                <p className="text-xl font-black tracking-tight text-foreground">
                  {user?.name || user?.username || "-"}
                </p>
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <Clock className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("import_logs")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{importHistory.length}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("status")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {isImporting ? t("loading") : t("sync_devices")}
                </p>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary" className="rounded-full bg-background/85 px-3 py-1.5 text-muted-foreground">
            {t("status")}: {selectedStatusLabel}
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-background/85 px-3 py-1.5 text-muted-foreground">
            {t("department")}: {selectedDepartmentLabel}
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-background/85 px-3 py-1.5 text-muted-foreground">
            {t("employee_name")}: {selectedEmployeeLabel}
          </Badge>
        </div>
      </PageHero>

      <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
        <CardContent className="p-4">
          <TableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: t("search_by_name_or_id"),
            }}
            filters={
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full sm:w-40 bg-background/50 border-none shadow-none focus:ring-1">
                      <SelectValue placeholder={t("status_filter")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("status_all")}</SelectItem>
                      <SelectItem value="present">{t("status_present")}</SelectItem>
                      <SelectItem value="absent">{t("status_absent")}</SelectItem>
                      <SelectItem value="late">{t("status_late")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="w-full sm:w-48 bg-background/50 border-none shadow-none focus:ring-1">
                      <SelectValue placeholder={t("department")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("status_all")}</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={employee} onValueChange={setEmployee}>
                    <SelectTrigger className="w-full sm:w-48 bg-background/50 border-none shadow-none focus:ring-1">
                      <SelectValue placeholder={t("employee_name")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("status_all")}</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{t("from")}:</span>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-36 h-9 bg-background/50 border-none shadow-none focus-visible:ring-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{t("to")}:</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-36 h-9 bg-background/50 border-none shadow-none focus-visible:ring-1"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 bg-background/50" onClick={() => attendanceQuery.refetch()}>
                    <Filter className="w-4 h-4" />
                    {t("filter")}
                  </Button>
                </div>
              </div>
            }
            actions={
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-background/50"
                onClick={() => handleCloseDay(endDate || startDate || new Date().toISOString().slice(0, 10))}
                disabled={!canManage}
              >
                <Check className="w-4 h-4" />
                {t("close_day")}
              </Button>
            }
          />
        </CardContent>
      </Card>

      <AttendanceImportPanel
        onSync={handleImportLogs}
        isLoading={isImporting}
        history={importHistoryQuery.data || []}
        canManage={canManage}
      />

      <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {t("attendance_record")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState title={t("no_data")} icon={Clock} />
          ) : (
            <AttendanceTable
              records={records}
              canManage={canManage}
              onEdit={handleEdit}
              onDelete={handleDelete}
              actionLoading={actionLoading}
            />
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p! - 1))}
                disabled={page === 1}
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p! + 1))}
                disabled={page === totalPages}
              >
                {t("next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AttendanceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        record={selectedRecord}
        onSave={(data) => handleSave(selectedRecord, data)}
        employees={employees}
        isEmployeesLoading={isFiltersLoading}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_attendance_title")}
        description={t("delete_attendance_desc")}
        onConfirm={() => confirmDelete(selectedRecord)}
      />
    </div>
  );
}
