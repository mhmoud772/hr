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
import { AlertTriangle } from "lucide-react";
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useAuth } from "@/features/auth/components/AuthProvider";
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

  const leaves = leavesQuery.data?.results ?? [];
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
  const balanceByType = useMemo(() => {
    const map = new Map<string, { total: number; used: number; remaining: number }>();
    balances.forEach((b) => {
      const total = b.total_days ?? 0;
      const used = b.used_days ?? 0;
      map.set(b.leave_type, { total, used, remaining: Math.max(0, total - used) });
    });
    return map;
  }, [balances]);

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
        const updated = await updateLeave.mutateAsync({
          id: selectedRequest.id,
          data: {
            employeeId: data.employeeId || selectedRequest.employeeId,
            leaveType: data.leaveType || selectedRequest.leaveType,
            startDate: data.startDate || selectedRequest.startDate,
            endDate: data.endDate || selectedRequest.endDate,
            reason: data.reason || selectedRequest.reason,
          },
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
        const created = await createLeave.mutateAsync({
          employeeId: data.employeeId,
          leaveType: data.leaveType,
          startDate: data.startDate,
          endDate: data.endDate,
          days: data.days,
          reason: data.reason,
          status: "pending",
        });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("leaves_title")}</h1>
          <p className="text-muted-foreground">{t("leaves_subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <FileText className="w-4 h-4" />
            {t("export_pdf")}
          </Button>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            {t("new_leave_request")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaveTypes.map((type, index) => {
          const balance = balanceByType.get(type.key) || { total: 0, used: 0, remaining: 0 };
          return (
            <Card key={index} className="bg-card border-none shadow-sm">
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
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        type.color === "primary"
                          ? "bg-primary"
                          : type.color === "success"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${balance.total ? (balance.used / balance.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-48">
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
                <SelectTrigger className="w-48">
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
            <div className="flex flex-col sm:flex-row gap-4">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <Button variant="outline" className="gap-2" onClick={() => leavesQuery.refetch()}>
                <Filter className="w-4 h-4" />
                {t("filter")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {t("leave_requests_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <EmptyState title={t("no_data")} icon={Calendar} />
          ) : (
            <Table>
              <TableHeader>
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
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
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
                        <Badge variant="outline">{t(`leave_type_${request.leaveType}`)}</Badge>
                      </TableCell>
                      <TableCell>{request.startDate}</TableCell>
                      <TableCell>{request.endDate}</TableCell>
                      <TableCell className="font-medium">{request.days} {t("days")}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[150px] truncate">{request.reason}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusConfig.className}>
                          <StatusIcon className="w-3 h-3 ml-1" />
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
