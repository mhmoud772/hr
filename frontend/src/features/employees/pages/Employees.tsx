import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { EmployeeFormDialog } from "@/features/employees/components/EmployeeFormDialog";
import { EmployeeDocumentsSection } from "@/features/employees/components/EmployeeDocumentsSection";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { PageHero } from "@/shared/components/PageHero";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { useTranslation } from "react-i18next";
import type { Employee } from "@/types/api";

import { useEmployeesQuery, useEmployeeSummaryQuery } from "@/features/employees/hooks/useEmployees";
import { useEmployeeFilters } from "../hooks/useEmployeeFilters";
import { useEmployeeActions } from "../hooks/useEmployeeActions";
import { TableToolbar } from "@/shared/components/TableToolbar";
import { EmployeeTable } from "../components/EmployeeTable";
import { Download, Upload, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export default function Employees() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const {
    page,
    setPage,
    search,
    setSearch,
    status,
    setStatus,
    department,
    setDepartment,
    jobTitle,
    setJobTitle,
    apiParams,
    departmentOptions,
    jobTitleOptions,
    isFiltersLoading,
  } = useEmployeeFilters();

  const employeesQuery = useEmployeesQuery(apiParams);
  const summaryQuery = useEmployeeSummaryQuery(selectedEmployee?.id);

  const {
    handleSave,
    confirmDelete,
    handleExportCSV,
    handleImportCSV,
    actionLoading,
  } = useEmployeeActions(() => employeesQuery.refetch());

  const canManage = ["system_admin", "admin", "hr_manager"].includes(
    String(user?.role || ""),
  );

  const employees = employeesQuery.data?.results ?? [];
  const totalCount = employeesQuery.data?.count ?? employees.length;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const activeCount = employees.filter((employee) => employee.status === "active").length;
  const onLeaveCount = employees.filter((employee) => employee.status === "leave").length;
  const inactiveCount = employees.filter((employee) => employee.status === "inactive").length;
  const appliedFilters = [search.trim(), status !== "all" ? status : "", department !== "all" ? department : "", jobTitle !== "all" ? jobTitle : ""].filter(Boolean).length;
  const roleLabel = user?.role ? t(`role_${user.role}`) : t("default_user_role");
  const statusFilterLabel =
    status === "all"
      ? t("status_all")
      : status === "leave"
        ? t("status_on_leave")
        : t(`status_${status}`);

  if (employeesQuery.isLoading || isFiltersLoading) {
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
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("employees_title")}
        subtitle={t("employees_subtitle")}
        metrics={[
          { label: t("total_employees"), value: totalCount, tone: "primary" },
          { label: t("active"), value: activeCount, tone: "success" },
          { label: t("on_leave"), value: onLeaveCount, tone: "warning" },
          { label: t("inactive"), value: inactiveCount, tone: "default" },
        ]}
        actions={
          <Button className="gap-2" onClick={handleAdd} disabled={!canManage}>
            <Plus className="w-4 h-4" />
            {t("add_employee")}
          </Button>
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
                <Users className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("status")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {canManage ? t("enabled") : t("disabled")}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("filter")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{appliedFilters}</p>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary" className="rounded-full bg-background/85 px-3 py-1.5 text-muted-foreground">
            {t("status")}: {statusFilterLabel}
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-background/85 px-3 py-1.5 text-muted-foreground">
            {t("department")}: {department === "all" ? t("status_all") : department}
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-background/85 px-3 py-1.5 text-muted-foreground">
            {t("job_title")}: {jobTitle === "all" ? t("status_all") : jobTitle}
          </Badge>
        </div>
      </PageHero>

      <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
        <CardContent className="p-4">
          <TableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: t("search_employee_placeholder"),
            }}
            filters={
              <>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full sm:w-40 bg-background/50 border-none shadow-none focus:ring-1">
                    <SelectValue placeholder={t("status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("status_all")}</SelectItem>
                    <SelectItem value="active">{t("status_active")}</SelectItem>
                    <SelectItem value="leave">{t("status_on_leave")}</SelectItem>
                    <SelectItem value="inactive">{t("status_inactive")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-full sm:w-48 bg-background/50 border-none shadow-none focus:ring-1">
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
                <Select value={jobTitle} onValueChange={setJobTitle}>
                  <SelectTrigger className="w-full sm:w-48 bg-background/50 border-none shadow-none focus:ring-1">
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
              </>
            }
            actions={
              <>
                <Button variant="outline" size="sm" className="gap-2 bg-background/50" onClick={handleExportCSV}>
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
                  <Button variant="outline" size="sm" className="gap-2 bg-background/50" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                      {t("import")}
                    </span>
                  </Button>
                </label>
              </>
            }
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {t("employees_list_count", { count: totalCount })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <EmptyState title={t("no_data")} icon={AlertTriangle} />
          ) : (
            <EmployeeTable
              employees={employees}
              canManage={canManage}
              onView={handleView}
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

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={selectedEmployee}
        onSave={(data, avatar) => handleSave(selectedEmployee, data, avatar)}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_employee_title")}
        description={t("delete_employee_desc", { name: selectedEmployee?.name || "" })}
        onConfirm={() => confirmDelete(selectedEmployee)}
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
          variant: selectedEmployee?.status === "active" ? "success" : "secondary",
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
