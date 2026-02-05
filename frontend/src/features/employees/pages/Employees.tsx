import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  AlertTriangle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { EmployeeFormDialog } from "@/features/employees/components/EmployeeFormDialog";
import { EmployeeDocumentsSection } from "@/features/employees/components/EmployeeDocumentsSection";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { useToast } from "@/shared/hooks/use-toast";
import {
  useCreateEmployee,
  useCreateEmployeeWithFile,
  useDeleteEmployee,
  useEmployeeSummaryQuery,
  useEmployeesQuery,
  useExportEmployeesCSV,
  useImportEmployeesCSV,
  useUpdateEmployee,
  useUpdateEmployeeWithFile,
} from "@/features/employees/hooks/useEmployees";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import type { Employee } from "@/types/api";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useJobTitlesQuery } from "@/features/job-titles/hooks/useJobTitles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export default function Employees() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isRtl = i18n.language === "ar";

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [jobTitleFilter, setJobTitleFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const employeesQuery = useEmployeesQuery({
    page,
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    department: departmentFilter === "all" ? undefined : departmentFilter,
    job_title: jobTitleFilter === "all" ? undefined : jobTitleFilter,
  });
  const createEmployee = useCreateEmployee();
  const createEmployeeWithFile = useCreateEmployeeWithFile();
  const updateEmployee = useUpdateEmployee();
  const updateEmployeeWithFile = useUpdateEmployeeWithFile();
  const deleteEmployee = useDeleteEmployee();
  const exportEmployees = useExportEmployeesCSV();
  const importEmployees = useImportEmployeesCSV();

  const departmentsQuery = useDepartmentsQuery();
  const jobTitlesQuery = useJobTitlesQuery({});
  const summaryQuery = useEmployeeSummaryQuery(selectedEmployee?.id);

  const canManage = ["system_admin", "admin", "hr_manager"].includes(
    String(user?.role || ""),
  );

  const employees = employeesQuery.data?.results ?? [];
  const totalCount = employeesQuery.data?.count ?? employees.length;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const departmentOptions = useMemo(
    () => (departmentsQuery.data || []).map((dept) => ({ id: String(dept.id), name: dept.name })),
    [departmentsQuery.data],
  );
  const jobTitleOptions = useMemo(
    () => (jobTitlesQuery.data?.results || []).map((job) => ({ id: String(job.id), name: job.name })),
    [jobTitlesQuery.data],
  );

  if (employeesQuery.isLoading) {
    return <LoadingState label={t("loading")} />;
  }

  if (employeesQuery.isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertTriangle}
          title={t("error_loading")}
          actionLabel={t("retry")}
          onAction={() => employeesQuery.refetch()}
        />
      </div>
    );
  }

  const handleAdd = () => {
    setSelectedEmployee(null);
    setFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteOpen(true);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailsOpen(true);
  };

  const confirmDelete = async () => {
    const deleteTarget = selectedEmployee?.id;
    if (!deleteTarget) return;
    setActionLoading(deleteTarget);
    try {
      await deleteEmployee.mutateAsync(deleteTarget);
      toast({
        title: t("employee_deleted"),
        description: t("employee_deleted_desc", { name: selectedEmployee?.name || "" }),
      });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
    setActionLoading(null);
    setDeleteOpen(false);
  };

  const handleSave = async (data: Partial<Employee>, avatarFile?: File | null) => {
    try {
      if (selectedEmployee) {
        setActionLoading(selectedEmployee.id);
        if (avatarFile) {
          const form = new FormData();
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              form.append(key, String(value));
            }
          });
          form.append("avatar", avatarFile);
          await updateEmployeeWithFile.mutateAsync({ id: selectedEmployee.id, data: form });
        } else {
          await updateEmployee.mutateAsync({ id: selectedEmployee.id, data });
        }
        toast({ title: t("employee_updated"), description: t("employee_updated_desc") });
      } else {
        if (avatarFile) {
          const form = new FormData();
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              form.append(key, String(value));
            }
          });
          form.append("avatar", avatarFile);
          await createEmployeeWithFile.mutateAsync(form);
        } else {
          await createEmployee.mutateAsync(data as Employee);
        }
        toast({ title: t("employee_added"), description: t("employee_added_desc") });
      }
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportEmployees.mutateAsync();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "employees.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleImportCSV = async (file: File) => {
    try {
      const result = await importEmployees.mutateAsync(file);
      toast({ title: t("import_employees_success"), description: t("import_employees_success_desc", result) });
      employeesQuery.refetch();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const getStatusBadge = (status: Employee["status"]) => {
    const config = {
      active: { label: t("active"), className: "bg-emerald-500/10 text-emerald-600" },
      leave: { label: t("on_leave"), className: "bg-amber-500/10 text-amber-600" },
      inactive: { label: t("inactive"), className: "bg-muted text-muted-foreground" },
    };
    return config[status] || { label: t("status"), className: "bg-muted text-muted-foreground" };
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("employees_title")}</h1>
          <p className="text-muted-foreground">{t("employees_subtitle")}</p>
        </div>
        <Button className="gap-2" onClick={handleAdd} disabled={!canManage}>
          <Plus className="w-4 h-4" />
          {t("add_employee")}
        </Button>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  placeholder={t("search_employee_placeholder")}
                  className={isRtl ? "pr-10" : "pl-10"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  <SelectItem value="active">{t("status_active")}</SelectItem>
                  <SelectItem value="leave">{t("status_on_leave")}</SelectItem>
                  <SelectItem value="inactive">{t("status_inactive")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t("department")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  {departmentOptions.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={jobTitleFilter} onValueChange={setJobTitleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t("job_title")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  {jobTitleOptions.map((job) => (
                    <SelectItem key={job.id} value={job.name}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
                {t("export")}
              </Button>
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleImportCSV(file);
                  }}
                />
                <Button variant="outline" className="gap-2" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    {t("import")}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t("employees_list_count", { count: totalCount })}</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <EmptyState title={t("no_data")} icon={AlertTriangle} />
          ) : (
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
                            {employee.avatarUrl ? <AvatarImage src={employee.avatarUrl} alt={employee.name} /> : null}
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
                            <DropdownMenuItem className="gap-2" onClick={() => handleView(employee)}>
                              <Eye className="w-4 h-4" />
                              {t("view_details")}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(employee)} disabled={!canManage}>
                              <Edit className="w-4 h-4" />
                              {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => handleDelete(employee)}
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

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={selectedEmployee}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_employee_title")}
        description={t("delete_employee_desc", { name: selectedEmployee?.name || "" })}
        onConfirm={confirmDelete}
      />

      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedEmployee?.name || ""}
        subtitle={selectedEmployee?.jobTitle || ""}
        avatar={
          <Avatar className="w-12 h-12">
            {selectedEmployee?.avatarUrl ? (
              <AvatarImage src={selectedEmployee.avatarUrl} alt={selectedEmployee.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(selectedEmployee?.name || "")}
            </AvatarFallback>
          </Avatar>
        }
        badge={{
          text: getStatusBadge(selectedEmployee?.status || "active").label,
          variant: selectedEmployee?.status === "active" ? "default" : "secondary",
        }}
        details={[
          { label: t("employee_id"), value: selectedEmployee?.id || "" },
          { label: t("email"), value: selectedEmployee?.email || "" },
          { label: t("phone"), value: selectedEmployee?.phone || "" },
          { label: t("department"), value: selectedEmployee?.department || "" },
          { label: t("hire_date"), value: selectedEmployee?.hireDate || "" },
          { label: t("nationality"), value: selectedEmployee?.nationality || "" },
          { label: t("birth_date"), value: selectedEmployee?.birthDate || "" },
          { label: t("address"), value: selectedEmployee?.address || "" },
          { label: t("salary"), value: selectedEmployee?.salary || "" },
          { label: t("contract_status"), value: selectedEmployee?.contractStatus || "" },
        ]}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">{t("attendance_summary")}</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded border p-2">{t("status_present")}: {summaryQuery.data?.attendance.present ?? 0}</div>
              <div className="rounded border p-2">{t("status_absent")}: {summaryQuery.data?.attendance.absent ?? 0}</div>
              <div className="rounded border p-2">{t("status_late")}: {summaryQuery.data?.attendance.late ?? 0}</div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t("leaves_summary")}</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded border p-2">{t("pending")}: {summaryQuery.data?.leaves.pending ?? 0}</div>
              <div className="rounded border p-2">{t("approved")}: {summaryQuery.data?.leaves.approved ?? 0}</div>
              <div className="rounded border p-2">{t("rejected")}: {summaryQuery.data?.leaves.rejected ?? 0}</div>
            </div>
          </div>
          <EmployeeDocumentsSection employeeId={selectedEmployee?.id} canUpload={canManage} />
        </div>
      </DetailsSheet>
    </div>
  );
}
