import { useMemo, useState } from "react";
import {
  Plus,
  Calendar,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { DatePicker } from "@/shared/ui/date-picker";
import { Button } from "@/shared/ui/button";
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
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import { LeaveRequestDialog } from "@/features/leaves/components/LeaveRequestDialog";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { useToast } from "@/shared/hooks/use-toast";
import { generateLeavesReport, downloadPDF } from "@/shared/lib/pdf-reports";
import { useTranslation } from "react-i18next";
import type { Leave, LeaveAttachment, LeaveApproval } from "@/types/api";
import type { ApiLeaveRequest, ApiPatchedLeaveRequest } from "@/types/contracts";
import {
  useApproveLeave,
  useCreateLeave,
  useDeleteLeave,
  useLeaveBalancesQuery,
  useLeavesQuery,
  useRejectLeave,
  useUpdateLeave,
  useUploadLeaveAttachment,
} from "@/features/leaves/hooks/useLeaves";
import { getLeavesReport } from "@/features/leaves/api/leaves";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { PageHero } from "@/shared/components/PageHero";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const leaveTypes = [
  { key: "annual", color: "primary" },
  { key: "sick", color: "success" },
  { key: "emergency", color: "warning" },
  { key: "unpaid", color: "muted" },
];

export default function Leaves() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRtl = i18n.language === "ar";
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Leave | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const leavesQuery = useLeavesQuery({
    page,
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    leave_type: typeFilter === "all" ? undefined : typeFilter,
    department: departmentFilter === "all" ? undefined : departmentFilter,
    start: startDate || undefined,
    end: endDate || undefined,
  });
  const createLeave = useCreateLeave();
  const updateLeave = useUpdateLeave();
  const deleteLeave = useDeleteLeave();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const uploadAttachment = useUploadLeaveAttachment();
  const balancesQuery = useLeaveBalancesQuery();
  const employeesQuery = useEmployeesQuery();
  const departmentsQuery = useDepartmentsQuery();

  const rawLeaves = leavesQuery.data?.results;
  const leaves = rawLeaves ?? [];
  const totalCount = leavesQuery.data?.count ?? leaves.length;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const canManage = ["system_admin", "admin", "hr_manager", "supervisor"].includes(
    String(user?.role || ""),
  );

  const balances = useMemo(
    () => balancesQuery.data ?? [],
    [balancesQuery.data],
  );
  const leaveStatusSummary = useMemo(
    () =>
      (rawLeaves ?? []).reduce(
        (acc, item) => {
          acc[item.status] += 1;
          return acc;
        },
        { pending: 0, approved: 0, rejected: 0 } as Record<Leave["status"], number>,
      ),
    [rawLeaves],
  );
  const balanceByType = useMemo(() => {
    const map = new Map<string, { total: number; used: number; remaining: number }>();
    balances.forEach((b) => {
      const total = b.total_days ?? 0;
      const used = b.used_days ?? 0;
      map.set(b.leave_type, { total, used, remaining: Math.max(0, total - used) });
    });
    return map;
  }, [balances]);
  const totalRemainingDays = useMemo(
    () =>
      balances.reduce(
        (sum, balance) => sum + Math.max(0, (balance.total_days ?? 0) - (balance.used_days ?? 0)),
        0,
      ),
    [balances],
  );
  const leaveHeroMetrics = [
    {
      label: t("leave_requests"),
      value: totalCount,
      icon: Calendar,
      tone: "primary" as const,
    },
    {
      label: t("pending"),
      value: leaveStatusSummary.pending,
      icon: Hourglass,
      tone: "warning" as const,
    },
    {
      label: t("approved"),
      value: leaveStatusSummary.approved,
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: t("remaining_balance"),
      value: `${totalRemainingDays} ${t("days")}`,
      icon: Clock,
      tone: "primary" as const,
    },
  ];

  if (leavesQuery.isLoading) {
    return <LoadingState label={t("loading")} />;
  }

  if (leavesQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t("error_loading")}
        actionLabel={t("retry")}
        onAction={() => leavesQuery.refetch()}
      />
    );
  }

  const handleAdd = () => {
    setSelectedRequest(null);
    setFormOpen(true);
  };

  const handleEdit = (request: Leave) => {
    setSelectedRequest(request);
    setFormOpen(true);
  };

  const handleDelete = (request: Leave) => {
    setSelectedRequest(request);
    setDeleteOpen(true);
  };

  const handleView = (request: Leave) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const handleApprove = async (request: Leave) => {
    setActionLoading(request.id);
    try {
      await approveLeave.mutateAsync({ id: request.id });
      toast({ title: t("approved") });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleReject = async (request: Leave) => {
    setActionLoading(request.id);
    try {
      await rejectLeave.mutateAsync({ id: request.id });
      toast({ title: t("rejected") });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
    setActionLoading(null);
  };

  const confirmDelete = async () => {
    const deleteTarget = selectedRequest?.id;
    if (!deleteTarget) return;
    setActionLoading(deleteTarget);
    try {
      await deleteLeave.mutateAsync(deleteTarget);
      toast({
        title: t("leave_deleted"),
        description: t("leave_deleted_desc"),
      });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
    setActionLoading(null);
    setDeleteOpen(false);
  };

  const handleSave = async (data: Partial<Leave>, files: File[]) => {
    if (selectedRequest) {
      setActionLoading(selectedRequest.id);
      try {
        const updatePayload: ApiPatchedLeaveRequest = {
          employee: parseInt(String(data.employeeId || selectedRequest.employeeId), 10),
          leave_type: data.leaveType || selectedRequest.leaveType,
          start_date: data.startDate || selectedRequest.startDate,
          end_date: data.endDate || selectedRequest.endDate,
          reason: data.reason || selectedRequest.reason,
        };
        const updated = await updateLeave.mutateAsync({
          id: selectedRequest.id,
          data: updatePayload,
        });
        if (files.length > 0) {
          await Promise.all(files.map((file) => uploadAttachment.mutateAsync({ id: updated.id, file })));
        }
        toast({ title: t("leave_updated"), description: t("leave_updated_desc") });
      } catch {
        toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
      }
      setActionLoading(null);
    } else {
      try {
        const employeeId = data.employeeId ? parseInt(data.employeeId, 10) : undefined;
        const leaveType = data.leaveType;
        const start = data.startDate;
        const end = data.endDate;
        if (!employeeId || !leaveType || !start || !end) {
          throw new Error("Missing required leave payload fields");
        }
        const createPayload: ApiLeaveRequest = {
          employee: employeeId,
          leave_type: leaveType,
          start_date: start,
          end_date: end,
          days: data.days,
          reason: data.reason,
          status: "pending",
        };
        const created = await createLeave.mutateAsync(createPayload);
        if (files.length > 0) {
          await Promise.all(files.map((file) => uploadAttachment.mutateAsync({ id: created.id, file })));
        }
        toast({ title: t("leave_added"), description: t("leave_added_desc") });
      } catch {
        toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
      }
    }
  };

  const handleExportPDF = async () => {
    try {
      const report = await getLeavesReport({ start: startDate || undefined, end: endDate || undefined });
      const doc = generateLeavesReport(report as Leave[]);
      downloadPDF(doc, "leaves-report");
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const getStatusConfig = (status: Leave["status"]) => {
    const config = {
      approved: { label: t("approved"), icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600" },
      rejected: { label: t("rejected"), icon: XCircle, className: "bg-destructive/10 text-destructive" },
      pending: { label: t("pending"), icon: Hourglass, className: "bg-amber-500/10 text-amber-600" },
    };
    return config[status];
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const departmentOptions = departmentsQuery.data ?? [];
  const leaveHighlights = [
    {
      key: "pending",
      label: t("pending"),
      value: leaveStatusSummary.pending,
      icon: Hourglass,
      className: "text-amber-600",
      shellClassName: "border-amber-200/60 bg-amber-500/10",
    },
    {
      key: "approved",
      label: t("approved"),
      value: leaveStatusSummary.approved,
      icon: CheckCircle2,
      className: "text-emerald-600",
      shellClassName: "border-emerald-200/60 bg-emerald-500/10",
    },
    {
      key: "rejected",
      label: t("rejected"),
      value: leaveStatusSummary.rejected,
      icon: XCircle,
      className: "text-destructive",
      shellClassName: "border-destructive/20 bg-destructive/10",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("leaves_title")}
        subtitle={t("leaves_subtitle")}
        metrics={leaveHeroMetrics}
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
              <FileText className="w-4 h-4" />
              {t("export_pdf")}
            </Button>
            <Button className="gap-2" onClick={handleAdd}>
              <Plus className="w-4 h-4" />
              {t("new_leave_request")}
            </Button>
          </>
        }
        aside={
          <div className="grid gap-3 rounded-[28px] border border-border/60 bg-background/80 p-4 shadow-inner">
            <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("leave_balance_overview")}
                </span>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{t("leave_balance_hint")}</p>
            </div>
              {leaveHighlights.map((item) => (
                <div
                  key={item.key}
                  className={`rounded-2xl border px-4 py-3 shadow-sm ${item.shellClassName}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {item.label}
                    </span>
                    <item.icon className={`h-4 w-4 ${item.className}`} />
                  </div>
                  <p className="text-2xl font-black tracking-tight text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaveTypes.map((type, index) => {
          const balance = balanceByType.get(type.key) || { total: 0, used: 0, remaining: 0 };
          const usagePercent = balance.total ? Math.min(100, (balance.used / balance.total) * 100) : 0;
          return (
            <Card key={index} className="overflow-hidden border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
              <div
                className={`h-1.5 w-full ${
                  type.color === "primary"
                    ? "bg-primary"
                    : type.color === "success"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                }`}
              />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">{t(`leave_type_${type.key}`)}</span>
                  <Calendar
                    className={`w-5 h-5 ${
                      type.color === "primary"
                        ? "text-primary"
                        : type.color === "success"
                          ? "text-emerald-600"
                          : "text-amber-600"
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("total_balance")}</span>
                    <span className="font-medium">{balance.total} {t("days")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("used_balance")}</span>
                    <span className="font-medium">{balance.used} {t("days")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("remaining_balance")}</span>
                    <span
                      className={`font-bold ${
                        type.color === "primary"
                          ? "text-primary"
                          : type.color === "success"
                            ? "text-emerald-600"
                            : "text-amber-600"
                      }`}
                    >
                      {balance.remaining} {t("days")}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("used_balance")}</span>
                    <span>{Math.round(usagePercent)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        type.color === "primary"
                          ? "bg-primary"
                          : type.color === "success"
                            ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="pt-2 text-xs text-muted-foreground">
                    {t("leave_balance_hint")}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            {t("leave_filters_title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("leave_filters_desc")}</p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_180px_220px_220px]">
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="approved">{t("approved")}</SelectItem>
                  <SelectItem value="rejected">{t("rejected")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("leave_type_label")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.key} value={type.key}>
                      {t(`leave_type_${type.key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("department")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  {departmentOptions.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
              <div className="space-y-2">
                <Label>{t("from_date")}</Label>
                <DatePicker value={startDate} onChange={setStartDate} placeholder={t("from_date")} />
              </div>
              <div className="space-y-2">
                <Label>{t("to_date")}</Label>
                <DatePicker value={endDate} onChange={setEndDate} placeholder={t("to_date")} />
              </div>
              <Button variant="outline" className="gap-2 self-end" onClick={() => leavesQuery.refetch()}>
                <Filter className="w-4 h-4" />
                {t("filter")}
              </Button>
              <Button
                variant="ghost"
                className="self-end"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setDepartmentFilter("all");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                {t("clear")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-border/60 bg-card shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t("leave_requests_title")}
            </CardTitle>
            <Badge variant="secondary" className="w-fit rounded-full bg-muted text-muted-foreground">
              {t("records_count", { count: totalCount })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {leaves.length === 0 ? (
            <EmptyState title={t("no_data")} icon={Calendar} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/60">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-right">{t("employee_name")}</TableHead>
                    <TableHead className="text-right">{t("leave_type_label")}</TableHead>
                    <TableHead className="text-right">{t("from_date")}</TableHead>
                    <TableHead className="text-right">{t("to_date")}</TableHead>
                    <TableHead className="text-right">{t("days_count")}</TableHead>
                    <TableHead className="text-right">{t("reason")}</TableHead>
                    <TableHead className="text-right">{t("status")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((request) => {
                    const statusConfig = getStatusConfig(request.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <TableRow key={request.id} className="transition-colors hover:bg-accent/25">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 ring-4 ring-primary/5">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {getInitials(request.employeeName || request.employeeId)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.employeeName || request.employeeId}</p>
                              <p className="text-xs text-muted-foreground">{request.employeeId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full bg-background">
                            {t(`leave_type_${request.leaveType}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.startDate}</TableCell>
                        <TableCell>{request.endDate}</TableCell>
                        <TableCell className="font-medium">{request.days} {t("days")}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground">{request.reason}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`rounded-full ${statusConfig.className}`}>
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => handleView(request)}>
                                <Eye className="w-4 h-4" />
                                {t("view_details")}
                              </DropdownMenuItem>
                              {request.status === "pending" && canManage && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 text-emerald-600"
                                    onClick={() => handleApprove(request)}
                                    disabled={actionLoading === request.id}
                                  >
                                    <Check className="w-4 h-4" />
                                    {t("approve")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="gap-2 text-destructive"
                                    onClick={() => handleReject(request)}
                                    disabled={actionLoading === request.id}
                                  >
                                    <X className="w-4 h-4" />
                                    {t("reject")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2"
                                    onClick={() => handleEdit(request)}
                                    disabled={actionLoading === request.id}
                                  >
                                    <Edit className="w-4 h-4" />
                                    {t("edit")}
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => handleDelete(request)}
                                disabled={!canManage || actionLoading === request.id}
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
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {t("showing_page")} {page} {t("of")} {totalPages}
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

      <LeaveRequestDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        request={selectedRequest}
        onSave={handleSave}
        employees={employeesQuery.data?.results || []}
        isEmployeesLoading={employeesQuery.isLoading}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_leave_title")}
        description={t("delete_leave_desc")}
        onConfirm={confirmDelete}
      />

      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedRequest?.employeeName || ""}
        subtitle={`${t("leave_details_title")} ${selectedRequest ? t(`leave_type_${selectedRequest.leaveType}`) : ""}`}
        avatar={
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(selectedRequest?.employeeName || selectedRequest?.employeeId || "")}
            </AvatarFallback>
          </Avatar>
        }
        badge={{
          text: getStatusConfig(selectedRequest?.status || "pending").label,
          variant:
            selectedRequest?.status === "approved"
              ? "default"
              : selectedRequest?.status === "rejected"
                ? "destructive"
                : "secondary",
        }}
        details={[
          { label: t("employee_id"), value: selectedRequest?.employeeId || "" },
          { label: t("leave_type_label"), value: selectedRequest ? t(`leave_type_${selectedRequest.leaveType}`) : "" },
          { label: t("from_date"), value: selectedRequest?.startDate || "" },
          { label: t("to_date"), value: selectedRequest?.endDate || "" },
          { label: t("days_count"), value: `${selectedRequest?.days || 0} ${t("days")}` },
        ]}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">{t("reason")}</h4>
            <p className="text-muted-foreground text-sm">{selectedRequest?.reason}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t("attachments")}</h4>
            <div className="space-y-2">
              {(selectedRequest?.attachments || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_data")}</p>
              ) : (
                (selectedRequest?.attachments || []).map((att: LeaveAttachment) => (
                  <a key={att.id} className="text-sm text-primary underline" href={att.url} target="_blank" rel="noreferrer">
                    {att.filename}
                  </a>
                ))
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t("approval_log")}</h4>
            <div className="space-y-2">
              {(selectedRequest?.approvals || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_data")}</p>
              ) : (
                (selectedRequest?.approvals || []).map((approval: LeaveApproval) => (
                  <div key={approval.id} className="flex items-center justify-between text-sm">
                    <span>
                      {approval.approverName || "-"} • {t(approval.status)}
                    </span>
                    <span className="text-muted-foreground">{approval.decided_at || ""}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DetailsSheet>
    </div>
  );
}
