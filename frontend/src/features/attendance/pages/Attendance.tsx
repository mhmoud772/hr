import { useMemo, useState } from "react";
import {
  Clock,
  Calendar as CalendarIcon,
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Check,
  X,
  Edit,
  Trash2,
  ListChecks,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { generateAttendanceReport, downloadPDF } from "@/shared/lib/pdf-reports";
import { useTranslation } from "react-i18next";
import type { Attendance } from "@/types/api";
import {
  useAttendanceQuery,
  useAttendanceSummaryQuery,
  useCloseAttendanceDay,
  useCreateAttendance,
  useDeleteAttendance,
  useImportAttendanceLogs,
  useAttendanceImportHistoryQuery,
  useUpdateAttendance,
} from "@/features/attendance/hooks/useAttendance";
import { getAttendanceReport } from "@/features/attendance/api/attendance";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { useToast } from "@/shared/hooks/use-toast";
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { AttendanceFormDialog } from "@/features/attendance/components/AttendanceFormDialog";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";

export default function Attendance() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isRtl = i18n.language === "ar";

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const attendanceQuery = useAttendanceQuery({
    page,
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    department: departmentFilter === "all" ? undefined : departmentFilter,
    employee: employeeFilter === "all" ? undefined : employeeFilter,
    start: startDate || undefined,
    end: endDate || undefined,
  });
  const summaryDate = startDate || new Date().toISOString().slice(0, 10);
  const summaryQuery = useAttendanceSummaryQuery(summaryDate);
  const createAttendance = useCreateAttendance();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();
  const closeDay = useCloseAttendanceDay();
  const importLogs = useImportAttendanceLogs();
  const importHistoryQuery = useAttendanceImportHistoryQuery();

  const employeesQuery = useEmployeesQuery();
  const departmentsQuery = useDepartmentsQuery();

  const canManage = ["system_admin", "admin", "hr_manager"].includes(
    String(user?.role || ""),
  );

  const records = attendanceQuery.data?.results ?? [];
  const totalCount = attendanceQuery.data?.count ?? records.length;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const summaryStats = useMemo(() => {
    const data = summaryQuery.data || { total: 0, present: 0, absent: 0, late: 0 };
    return [
      { label: t("total_employees"), value: data.total, icon: Clock, color: "primary" },
      { label: t("present_label"), value: data.present, icon: CheckCircle, color: "success" },
      { label: t("absent_label"), value: data.absent, icon: XCircle, color: "destructive" },
      { label: t("late_count"), value: data.late, icon: AlertCircle, color: "warning" },
    ];
  }, [summaryQuery.data, t]);

  if (attendanceQuery.isLoading) {
    return <LoadingState label={t("loading")} />;
  }

  if (attendanceQuery.isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t("error_loading")}
        actionLabel={t("retry")}
        onAction={() => attendanceQuery.refetch()}
      />
    );
  }

  const handleAdd = () => {
    setSelectedRecord(null);
    setFormOpen(true);
  };

  const handleEdit = (record: Attendance) => {
    setSelectedRecord(record);
    setFormOpen(true);
  };

  const handleDelete = (record: Attendance) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    const target = selectedRecord?.id;
    if (!target) return;
    setActionLoading(target);
    try {
      await deleteAttendance.mutateAsync(target);
      toast({ title: t("attendance_deleted"), description: t("attendance_deleted_desc") });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
    setActionLoading(null);
    setDeleteOpen(false);
  };

  const handleSave = async (data: Partial<Attendance>) => {
    try {
      if (selectedRecord) {
        setActionLoading(selectedRecord.id);
        await updateAttendance.mutateAsync({ id: selectedRecord.id, data });
        toast({ title: t("attendance_updated"), description: t("attendance_updated_desc") });
      } else {
        await createAttendance.mutateAsync(data);
        toast({ title: t("attendance_added"), description: t("attendance_added_desc") });
      }
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleExportPDF = async () => {
    try {
      const report = await getAttendanceReport({ start: startDate || undefined, end: endDate || undefined });
      const doc = generateAttendanceReport(
        report.map((record) => ({
          employeeId: record.employeeId,
          name: record.employeeName || record.employeeId,
          date: record.date,
          checkIn: record.checkIn || "-",
          checkOut: record.checkOut || "-",
          workHours: record.workHours || "-",
          status: record.status,
        })),
        startDate || new Date().toISOString().slice(0, 10),
      );
      downloadPDF(doc, "attendance-report");
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleCloseDay = async () => {
    const date = endDate || startDate || new Date().toISOString().slice(0, 10);
    try {
      const result = await closeDay.mutateAsync(date);
      toast({ title: t("attendance_closed"), description: t("attendance_closed_desc", { count: result.updated }) });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleImportLogs = async () => {
    try {
      await importLogs.mutateAsync("device");
      toast({ title: t("attendance_imported") });
      importHistoryQuery.refetch();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("attendance_title")}</h1>
          <p className="text-muted-foreground">{t("attendance_subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setStartDate(new Date().toISOString().slice(0, 10))}>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="bg-card border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stat.color === 'primary' ? 'bg-primary/10 text-primary' :
                  stat.color === 'success' ? 'bg-emerald-500/10 text-emerald-600' :
                  stat.color === 'destructive' ? 'bg-destructive/10 text-destructive' :
                  'bg-amber-500/10 text-amber-600'
                }`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  placeholder={t("search_by_name_or_id")}
                  className={isRtl ? "pr-10" : "pl-10"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t("status_filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  <SelectItem value="present">{t("status_present")}</SelectItem>
                  <SelectItem value="absent">{t("status_absent")}</SelectItem>
                  <SelectItem value="late">{t("status_late")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t("department")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  {(departmentsQuery.data || []).map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t("employee_name")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  {(employeesQuery.data?.results || []).map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <Button variant="outline" className="gap-2" onClick={() => attendanceQuery.refetch()}>
                <Filter className="w-4 h-4" />
                {t("filter")}
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleCloseDay} disabled={!canManage}>
                <Check className="w-4 h-4" />
                {t("close_day")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            {t("import_logs")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Button variant="outline" className="gap-2" onClick={handleImportLogs} disabled={!canManage}>
              <RefreshCw className="w-4 h-4" />
              {t("sync_devices")}
            </Button>
          </div>
          {importHistoryQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : (importHistoryQuery.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("no_data")}</p>
          ) : (
            <div className="space-y-2">
              {importHistoryQuery.data?.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <span>{log.message || log.status}</span>
                  <span className="text-muted-foreground">{log.created_at || ""}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
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
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(record)} disabled={!canManage}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(record)}
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
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t("previous")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
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
        onSave={handleSave}
        employees={employeesQuery.data?.results || []}
        isEmployeesLoading={employeesQuery.isLoading}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_attendance_title")}
        description={t("delete_attendance_desc")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
