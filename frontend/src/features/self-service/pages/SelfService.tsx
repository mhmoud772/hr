import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  GraduationCap,
  IdCard,
  Package,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Wallet,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { PageHero } from "@/shared/components/PageHero";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import { LeaveRequestDialog } from "@/features/leaves/components/LeaveRequestDialog";
import { EmployeeDocumentsSection } from "@/features/employees/components/EmployeeDocumentsSection";
import { AIPolicyAssistant } from "@/features/ai/components/AIPolicyAssistant";
import { useAIStatus } from "@/shared/hooks/useAIStatus";

// ── Components ───────────────────────────────────────────────────────────────
import { ProfileSection } from "../components/ProfileSection";
import { AttendanceSection } from "../components/AttendanceSection";
import { LeavesTable, LeaveBalances, ApprovalsTable } from "../components/LeavesSection";
import { PayrollSection } from "../components/PayrollSection";
import { AssetsSection } from "../components/AssetsSection";
import { TrainingSection } from "../components/TrainingSection";
import { PerformanceSection } from "../components/PerformanceSection";
import { NotificationsSection } from "../components/NotificationsSection";
import { SecuritySection } from "../components/SecuritySection";
import { LeaveDetailsSheet } from "../components/LeaveDetailsSheet";

// ── Hooks ────────────────────────────────────────────────────────────────────
import { useSelfServiceProfile } from "../hooks/useSelfServiceProfile";
import { useSelfServiceLeaves } from "../hooks/useSelfServiceLeaves";
import { useSelfServiceNotifications } from "../hooks/useSelfServiceNotifications";

export default function SelfService() {
  const { t } = useTranslation();
  const { isAIEnabled } = useAIStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "profile"
  );

  const { employee, employeeQuery } = useSelfServiceProfile();
  const {
    leaveDialogOpen,
    setLeaveDialogOpen,
    selectedLeave,
    detailsOpen,
    setDetailsOpen,
    openDetails,
    handleSave: handleLeaveSave,
  } = useSelfServiceLeaves(employee?.id);

  const { unreadCount } = useSelfServiceNotifications();
  const summaryCards = [
    {
      key: "employee-code",
      label: t("employee_id"),
      value: employee?.employeeCode || employee?.id || "-",
      icon: IdCard,
    },
    {
      key: "department",
      label: t("department"),
      value: employee?.department || "-",
      icon: Building2,
    },
    {
      key: "job-title",
      label: t("job_title"),
      value: employee?.jobTitle || "-",
      icon: BriefcaseBusiness,
    },
  ];
  const summaryMetrics = summaryCards.map((item) => ({
    label: item.label,
    value: item.value,
    icon: item.icon,
    tone: "primary" as const,
  }));
  const employeeInitials = (employee?.name || "-")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const tabItems = [
    { value: "profile", label: t("my_profile"), icon: UserCircle2 },
    { value: "attendance", label: t("my_attendance"), icon: CalendarDays },
    { value: "leaves", label: t("my_leaves"), icon: CalendarDays },
    { value: "balances", label: t("self_service_balances"), icon: Wallet },
    { value: "approvals", label: t("self_service_approvals"), icon: ShieldCheck },
    { value: "payroll", label: t("self_service_payroll"), icon: Wallet },
    { value: "assets", label: t("self_service_assets"), icon: Package },
    { value: "training", label: t("self_service_training"), icon: GraduationCap },
    { value: "performance", label: t("self_service_performance"), icon: BarChart3 },
    {
      value: "notifications",
      label: t("self_service_notifications"),
      icon: Bell,
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
    },
    { value: "security", label: t("self_service_security"), icon: ShieldCheck },
    { value: "documents", label: t("my_documents"), icon: FileText },
    ...(isAIEnabled
      ? [{ value: "ai-assistant", label: t("ai_assistant"), icon: Sparkles, accent: true }]
      : []),
  ];

  // Sync tab from URL
  useEffect(() => {
    const nextTab = searchParams.get("tab") || "profile";
    if (nextTab !== activeTab) setActiveTab(nextTab);
  }, [searchParams, activeTab]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", value);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // Handle redirect if AI is disabled but selected
  useEffect(() => {
    if (!isAIEnabled && activeTab === "ai-assistant") {
      handleTabChange("profile");
    }
  }, [isAIEnabled, activeTab, handleTabChange]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("self_service_title")}
        subtitle={t("self_service_subtitle")}
        metrics={summaryMetrics}
        aside={
          <div className="rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-inner">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border border-border/60 shadow-sm">
                <AvatarImage src={employee?.avatarUrl || employee?.avatar} alt={employee?.name || "employee"} />
                <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                  {employeeInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <p className="truncate text-xl font-black tracking-tight text-foreground">
                  {employee?.name || "-"}
                </p>
                <p className="truncate text-sm text-muted-foreground">{employee?.email || "-"}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="secondary" className="rounded-full bg-card text-muted-foreground">
                    {employee?.department || t("department")}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full bg-card text-muted-foreground">
                    {employee?.jobTitle || t("job_title")}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {t("self_service_security")}
                  </span>
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{t("manage_account")}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {t("self_service_notifications")}
                  </span>
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-black tracking-tight text-foreground">{unreadCount}</p>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-muted-foreground shadow-sm">
                  <Bell className="h-4 w-4" />
                  <span>{t("self_service_notifications")}</span>
                  {unreadCount > 0 ? (
                    <Badge variant="destructive" className="rounded-full px-2 py-0 text-[10px]">
                      {unreadCount}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                      0
                    </Badge>
                  )}
                </div>
                {isAIEnabled ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-primary shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    <span>{t("ai_assistant")}</span>
                  </div>
                ) : null}
        </div>
      </PageHero>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-[28px] border border-border/60 bg-card/80 p-3 shadow-sm md:grid-cols-3 xl:grid-cols-6">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`group h-auto min-h-[84px] flex-col items-start gap-3 rounded-2xl border border-transparent bg-background/55 px-4 py-3 text-start shadow-sm transition-all hover:border-primary/20 hover:bg-primary/5 data-[state=active]:border-primary/20 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${
                "accent" in tab && tab.accent ? "border-primary/10 bg-primary/5" : ""
              }`}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <tab.icon className="h-4 w-4" />
                </span>
                {"badge" in tab && tab.badge ? (
                  <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                    {tab.badge}
                  </Badge>
                ) : null}
              </div>
              <span className="line-clamp-2 text-sm font-semibold leading-5">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <ProfileSection />
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <AttendanceSection />
        </TabsContent>

        <TabsContent value="leaves" className="mt-0">
          <LeavesTable
            employeeId={employee?.id?.toString()}
            onOpenDetails={openDetails}
            onOpenRequestDialog={() => setLeaveDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="balances" className="mt-0">
          <LeaveBalances employeeId={employee?.id?.toString()} />
        </TabsContent>

        <TabsContent value="approvals" className="mt-0">
          <ApprovalsTable
            employeeId={employee?.id?.toString()}
            onOpenDetails={openDetails}
          />
        </TabsContent>

        <TabsContent value="payroll" className="mt-0">
          <PayrollSection employeeId={employee?.id?.toString()} />
        </TabsContent>

        <TabsContent value="assets" className="mt-0">
          <AssetsSection employeeId={employee?.id?.toString()} />
        </TabsContent>

        <TabsContent value="training" className="mt-0">
          <TrainingSection employeeId={employee?.id?.toString()} />
        </TabsContent>

        <TabsContent value="performance" className="mt-0">
          <PerformanceSection employeeId={employee?.id?.toString()} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <SecuritySection />
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <EmployeeDocumentsSection employeeId={employee?.id} canUpload />
        </TabsContent>

        {isAIEnabled && (
          <TabsContent value="ai-assistant" className="mt-0">
            <div className="mx-auto max-w-3xl py-4">
              <AIPolicyAssistant />
            </div>
          </TabsContent>
        )}
      </Tabs>

      <LeaveRequestDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onSave={handleLeaveSave}
        employees={employee ? [employee] : []}
        isEmployeesLoading={employeeQuery.isLoading}
      />

      <LeaveDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        leave={selectedLeave}
      />
    </div>
  );
}
