import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { useEmployeeMeQuery, useUpdateEmployee } from "@/features/employees/hooks/useEmployees";
import { useAttendanceQuery } from "@/features/attendance/hooks/useAttendance";
import { useLeavesQuery, useCreateLeave, useUploadLeaveAttachment, useLeaveBalancesQuery } from "@/features/leaves/hooks/useLeaves";
import { LeaveRequestDialog } from "@/features/leaves/components/LeaveRequestDialog";
import { EmployeeDocumentsSection } from "@/features/employees/components/EmployeeDocumentsSection";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { AlertTriangle } from "lucide-react";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { useToast } from "@/shared/hooks/use-toast";
import { useTrainingQuery } from "@/features/training/hooks/useTraining";
import { usePerformanceQuery } from "@/features/performance/hooks/usePerformance";
import { usePayrollQuery } from "@/features/payroll/hooks/usePayroll";
import { useAssetsQuery } from "@/features/assets/hooks/useAssets";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getNotifications, markAllNotificationsRead, markNotificationsRead } from "@/features/notifications/api/notifications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useSearchParams } from "react-router-dom";
import type { Asset, Employee, Leave, LeaveApproval, PayrollRecord, TrainingRecord, PerformanceReview, Notification } from "@/types/api";

export default function SelfService() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    email: "",
    phone: "",
    address: "",
    nationality: "",
    birthDate: "",
  });
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notificationSearch, setNotificationSearch] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const { toast } = useToast();
  const employeeQuery = useEmployeeMeQuery();
  const attendanceQuery = useAttendanceQuery();
  const leavesQuery = useLeavesQuery();
  const balancesQuery = useLeaveBalancesQuery(employeeQuery.data?.id);
  const createLeave = useCreateLeave();
  const uploadAttachment = useUploadLeaveAttachment();
  const updateEmployee = useUpdateEmployee();
  const trainingQuery = useTrainingQuery({ employee: employeeQuery.data?.id });
  const performanceQuery = usePerformanceQuery({ employee: employeeQuery.data?.id });
  const payrollQuery = usePayrollQuery({ employee: employeeQuery.data?.id });
  const assetsQuery = useAssetsQuery();
  const notificationsQuery = useQuery({
    queryKey: ["notifications", notificationFilter, notificationSearch],
    queryFn: () =>
      getNotifications({
        read: notificationFilter === "all" ? undefined : notificationFilter === "read",
        search: notificationSearch || undefined,
      }),
    refetchInterval: 15000,
  });
  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => notificationsQuery.refetch(),
  });
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => notificationsQuery.refetch(),
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((note: Notification) => !note.read).length;
  const totalNotifications = notifications.length;

  const employee = employeeQuery.data as Employee | undefined;
  const employeeList = useMemo(() => (employee ? [employee] : []), [employee]);
  const balances = useMemo(() => balancesQuery.data ?? [], [balancesQuery.data]);
  const balanceByType = useMemo(() => {
    const map = new Map<string, { total: number; used: number; remaining: number }>();
    balances.forEach((b) => {
      const total = b.total_days ?? 0;
      const used = b.used_days ?? 0;
      map.set(b.leave_type, { total, used, remaining: Math.max(0, total - used) });
    });
    return map;
  }, [balances]);

  const handleLeaveSave = async (request: Partial<Leave>, files: File[]) => {
    const created = await createLeave.mutateAsync(request);
    if (files.length && created?.id) {
      for (const file of files) {
        await uploadAttachment.mutateAsync({ id: created.id, file });
      }
    }
    leavesQuery.refetch();
  };

  useEffect(() => {
    const nextTab = searchParams.get("tab") || "profile";
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (!employee) return;
    setProfileForm({
      email: employee.email || "",
      phone: employee.phone || "",
      address: employee.address || "",
      nationality: employee.nationality || "",
      birthDate: employee.birthDate || "",
    });
  }, [employee]);

  const handleProfileSave = async () => {
    if (!employee) return;
    setSavingProfile(true);
    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        data: {
          ...employee,
          email: profileForm.email,
          phone: profileForm.phone,
          address: profileForm.address,
          nationality: profileForm.nationality,
          birthDate: profileForm.birthDate,
        },
      });
      toast({ title: t("self_service_profile_updated") });
      employeeQuery.refetch();
      setIsEditingProfile(false);
    } catch {
      toast({
        title: t("self_service_profile_update_failed"),
        description: t("error_loading"),
        variant: "destructive",
      });
    }
    setSavingProfile(false);
  };

  const openLeaveDetails = (leave: Leave) => {
    setSelectedLeave(leave);
    setDetailsOpen(true);
  };

  const assignedAssets = useMemo(() => {
    const items = assetsQuery.data ?? [];
    if (!employee?.id) return items;
    return items.filter((asset) => String(asset.assignedTo || "") === String(employee.id));
  }, [assetsQuery.data, employee?.id]);

  const leaveTypes = [
    { key: "annual", color: "primary" },
    { key: "sick", color: "success" },
    { key: "emergency", color: "warning" },
    { key: "unpaid", color: "muted" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("self_service_title")}</h1>
        <p className="text-muted-foreground">{t("self_service_subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", value);
          return next;
        }, { replace: true });
      }} className="space-y-4">
        <TabsList className="bg-muted/50 flex flex-wrap">
          <TabsTrigger value="profile">{t("my_profile")}</TabsTrigger>
          <TabsTrigger value="attendance">{t("my_attendance")}</TabsTrigger>
          <TabsTrigger value="leaves">{t("my_leaves")}</TabsTrigger>
          <TabsTrigger value="balances">{t("self_service_balances")}</TabsTrigger>
          <TabsTrigger value="approvals">{t("self_service_approvals")}</TabsTrigger>
          <TabsTrigger value="payroll">{t("self_service_payroll")}</TabsTrigger>
          <TabsTrigger value="assets">{t("self_service_assets")}</TabsTrigger>
          <TabsTrigger value="training">{t("self_service_training")}</TabsTrigger>
          <TabsTrigger value="performance">{t("self_service_performance")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("self_service_notifications")}</TabsTrigger>
          <TabsTrigger value="security">{t("self_service_security")}</TabsTrigger>
          <TabsTrigger value="documents">{t("my_documents")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("my_profile")}</CardTitle>
              <Button
                variant="outline"
                onClick={() => setIsEditingProfile((prev) => !prev)}
                disabled={employeeQuery.isLoading || employeeQuery.isError}
              >
                {isEditingProfile ? t("cancel") : t("edit")}
              </Button>
            </CardHeader>
            <CardContent>
              {employeeQuery.isLoading ? (
                <LoadingState label={t("loading")} />
              ) : employeeQuery.isError ? (
                <EmptyState icon={AlertTriangle} title={t("error_loading")} />
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">{t("full_name_label")}</p>
                      <p className="font-medium">{employee?.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("employee_id")}</p>
                      <p className="font-medium">{employee?.id || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("department")}</p>
                      <p className="font-medium">{employee?.department || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("job_title")}</p>
                      <p className="font-medium">{employee?.jobTitle || "-"}</p>
                    </div>
                  </div>

                  {isEditingProfile ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground mb-1">{t("email")}</p>
                        <Input
                          type="email"
                          value={profileForm.email}
                          onChange={(event) =>
                            setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">{t("phone")}</p>
                        <Input
                          value={profileForm.phone}
                          onChange={(event) =>
                            setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">{t("nationality")}</p>
                        <Input
                          value={profileForm.nationality}
                          onChange={(event) =>
                            setProfileForm((prev) => ({ ...prev, nationality: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">{t("birth_date")}</p>
                        <Input
                          type="date"
                          value={profileForm.birthDate}
                          onChange={(event) =>
                            setProfileForm((prev) => ({ ...prev, birthDate: event.target.value }))
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1">{t("address")}</p>
                        <Textarea
                          value={profileForm.address}
                          onChange={(event) =>
                            setProfileForm((prev) => ({ ...prev, address: event.target.value }))
                          }
                          rows={3}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button onClick={handleProfileSave} disabled={savingProfile}>
                          {savingProfile ? t("saving") : t("save_changes")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground">{t("email")}</p>
                        <p className="font-medium">{employee?.email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("phone")}</p>
                        <p className="font-medium">{employee?.phone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("nationality")}</p>
                        <p className="font-medium">{employee?.nationality || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("birth_date")}</p>
                        <p className="font-medium">{employee?.birthDate || "-"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">{t("address")}</p>
                        <p className="font-medium">{employee?.address || "-"}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
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
        </TabsContent>

        <TabsContent value="leaves">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("my_leaves")}</CardTitle>
              <Button onClick={() => setLeaveOpen(true)}>{t("request_leave")}</Button>
            </CardHeader>
            <CardContent>
              {leavesQuery.isLoading ? (
                <LoadingState label={t("loading")} />
              ) : leavesQuery.isError ? (
                <EmptyState icon={AlertTriangle} title={t("error_loading")} />
              ) : leavesQuery.data?.results?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("leave_type_label")}</TableHead>
                      <TableHead>{t("from_date")}</TableHead>
                      <TableHead>{t("to_date")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leavesQuery.data.results.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{t(`leave_type_${item.leaveType}`)}</TableCell>
                        <TableCell>{item.startDate}</TableCell>
                        <TableCell>{item.endDate}</TableCell>
                        <TableCell>{t(item.status)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => openLeaveDetails(item)}>
                            {t("view_details")}
                          </Button>
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
        </TabsContent>

        <TabsContent value="balances">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle>{t("self_service_balances")}</CardTitle>
            </CardHeader>
            <CardContent>
              {balancesQuery.isLoading ? (
                <LoadingState label={t("loading")} />
              ) : balancesQuery.isError ? (
                <EmptyState icon={AlertTriangle} title={t("error_loading")} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {leaveTypes.map((type) => {
                    const balance = balanceByType.get(type.key) || { total: 0, used: 0, remaining: 0 };
                    return (
                      <Card key={type.key} className="bg-muted/40 border-none shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{t(`leave_type_${type.key}`)}</span>
                            <Badge variant="outline">{balance.remaining} {t("days")}</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                              <span>{t("total_balance")}</span>
                              <span>{balance.total} {t("days")}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>{t("used_balance")}</span>
                              <span>{balance.used} {t("days")}</span>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${balance.total ? (balance.used / balance.total) * 100 : 0}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle>{t("self_service_approvals")}</CardTitle>
            </CardHeader>
            <CardContent>
              {leavesQuery.isLoading ? (
                <LoadingState label={t("loading")} />
              ) : leavesQuery.isError ? (
                <EmptyState icon={AlertTriangle} title={t("error_loading")} />
              ) : leavesQuery.data?.results?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("leave_type_label")}</TableHead>
                      <TableHead>{t("from_date")}</TableHead>
                      <TableHead>{t("to_date")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("approval_log")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leavesQuery.data.results.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{t(`leave_type_${item.leaveType}`)}</TableCell>
                        <TableCell>{item.startDate}</TableCell>
                        <TableCell>{item.endDate}</TableCell>
                        <TableCell>{t(item.status)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => openLeaveDetails(item)}>
                            {t("view_details")}
                          </Button>
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
        </TabsContent>

        <TabsContent value="payroll">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle>{t("self_service_payroll")}</CardTitle>
            </CardHeader>
            <CardContent>
              {payrollQuery.isLoading ? (
                <LoadingState label={t("loading")} />
              ) : payrollQuery.isError ? (
                <EmptyState icon={AlertTriangle} title={t("error_loading")} />
              ) : payrollQuery.data?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("period")}</TableHead>
                      <TableHead>{t("base_salary")}</TableHead>
                      <TableHead>{t("allowances")}</TableHead>
                      <TableHead>{t("deductions")}</TableHead>
                      <TableHead>{t("net_salary")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollQuery.data.map((record: PayrollRecord) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.period_start} - {record.period_end}
                        </TableCell>
                        <TableCell>{record.base_salary}</TableCell>
                        <TableCell>{record.allowances}</TableCell>
                        <TableCell>{record.deductions}</TableCell>
                        <TableCell>{record.net_salary}</TableCell>
                        <TableCell>{t(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">{t("no_data")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle>{t("self_service_assets")}</CardTitle>
            </CardHeader>
            <CardContent>
              {assetsQuery.isLoading ? (
                <LoadingState label={t("loading")} />
              ) : assetsQuery.isError ? (
                <EmptyState icon={AlertTriangle} title={t("error_loading")} />
              ) : assignedAssets.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("asset_name")}</TableHead>
                      <TableHead>{t("serial_number")}</TableHead>
                      <TableHead>{t("category")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedAssets.map((asset: Asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.serial_number || "-"}</TableCell>
                        <TableCell>{asset.category || "-"}</TableCell>
                        <TableCell>{t(`asset_status_${asset.status}`)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">{t("no_data")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle>{t("self_service_training")}</CardTitle>
            </CardHeader>
            <CardContent>
              {trainingQuery.isLoading ? (
                <LoadingState label={t("loading")} />
              ) : trainingQuery.isError ? (
                <EmptyState icon={AlertTriangle} title={t("error_loading")} />
              ) : trainingQuery.data?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("title")}</TableHead>
                      <TableHead>{t("provider")}</TableHead>
                      <TableHead>{t("from_date")}</TableHead>
                      <TableHead>{t("to_date")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingQuery.data.map((record: TrainingRecord) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.title}</TableCell>
                        <TableCell>{record.provider || "-"}</TableCell>
                        <TableCell>{record.start_date || "-"}</TableCell>
                        <TableCell>{record.end_date || "-"}</TableCell>
                        <TableCell>{t(`training_status_${record.status}`)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">{t("no_data")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
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
                        <TableCell className="max-w-[240px] truncate">{review.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">{t("no_data")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("self_service_notifications")}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t("status_all")} {totalNotifications}</Badge>
                  <Badge variant={unreadCount ? "default" : "outline"}>{t("status_unread")} {unreadCount}</Badge>
                </div>
                <Input
                  value={notificationSearch}
                  onChange={(event) => setNotificationSearch(event.target.value)}
                  placeholder={t("search")}
                  className="w-52"
                />
                <Select value={notificationFilter} onValueChange={setNotificationFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("status_all")}</SelectItem>
                    <SelectItem value="unread">{t("status_unread")}</SelectItem>
                    <SelectItem value="read">{t("status_read")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending || notificationsQuery.isLoading || unreadCount === 0}
                >
                  {t("mark_all_read")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notificationsQuery.isLoading ? (
                <LoadingState label={t("loading")} />
              ) : notificationsQuery.isError ? (
                <EmptyState icon={AlertTriangle} title={t("error_loading")} />
              ) : notifications.length ? (
                <div className="space-y-3">
                  {notifications.map((note: Notification) => (
                    <div key={note.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{note.title}</p>
                        <p className="text-sm text-muted-foreground">{note.description || "-"}</p>
                        <p className="text-xs text-muted-foreground mt-1">{note.createdAt || ""}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={note.read ? "outline" : "default"}>
                          {note.read ? t("status_read") : t("status_unread")}
                        </Badge>
                        {!note.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markReadMutation.mutate([note.id])}
                            disabled={markReadMutation.isPending}
                          >
                            {t("mark_read")}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("no_data")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle>{t("self_service_security")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("self_service_security_hint")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => (window.location.href = "/settings?tab=security")}>
                  {t("change_password")}
                </Button>
                <Badge variant="outline">{t("self_service_mfa_hint")}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <EmployeeDocumentsSection employeeId={employee?.id} canUpload />
        </TabsContent>
      </Tabs>

      <LeaveRequestDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onSave={handleLeaveSave}
        employees={employeeList}
        isEmployeesLoading={employeeQuery.isLoading}
      />

      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedLeave?.employeeName || employee?.name || ""}
        subtitle={`${t("leave_details_title")} ${selectedLeave ? t(`leave_type_${selectedLeave.leaveType}`) : ""}`}
        details={[
          { label: t("from_date"), value: selectedLeave?.startDate || "" },
          { label: t("to_date"), value: selectedLeave?.endDate || "" },
          { label: t("status"), value: selectedLeave ? t(selectedLeave.status) : "" },
        ]}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">{t("approval_log")}</h4>
            <div className="space-y-2">
              {(selectedLeave?.approvals || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_data")}</p>
              ) : (
                (selectedLeave?.approvals || []).map((approval: LeaveApproval) => (
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
