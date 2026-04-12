import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useDashboardSummary, useDashboardPulse } from "@/features/dashboard/hooks/useDashboard";
import { PulseCard } from "@/features/dashboard/components/PulseCard";
import type { TimeRange } from "@/types/api";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { Link, useNavigate } from "react-router-dom";
import { PageHero } from "@/shared/components/PageHero";
import { OnboardingFlow } from "@/features/onboarding/components/OnboardingFlow";
import { Button } from "@/shared/ui/button";
import { AIDashboardSummary } from "@/features/ai/components/AIDashboardSummary";
import { useAIStatus } from "@/shared/hooks/useAIStatus";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = React.useState<TimeRange>("week");
  const { data, isLoading, isError, refetch } = useDashboardSummary(range);
  const { data: pulseData, isLoading: pulseLoading } = useDashboardPulse();
  const { isAIEnabled } = useAIStatus();
  const isRtl = i18n.language === "ar";
  const timeLocale = isRtl ? ar : enUS;

  const presentKey = t("present_label");
  const absentKey = t("absent_label");

  const attendanceData = (data?.attendanceStats || []).map((item) => ({
    day: item.day,
    [presentKey]: item.present,
    [absentKey]: item.absent,
  }));

  const attendanceSeriesPresent = (data?.attendanceStats || []).map((item) => item.present);
  const attendanceSeriesAbsent = (data?.attendanceStats || []).map((item) => item.absent);
  const attendanceSeriesAdherence = (data?.attendanceStats || []).map((item) => {
    const total = item.present + item.absent;
    return total > 0 ? Math.round((item.present / total) * 100) : 0;
  });

  const buildTrend = (series: number[], unit = "%", asPercentChange = true) => {
    if (series.length < 2) return undefined;
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    const change = asPercentChange && prev !== 0 ? ((last - prev) / prev) * 100 : last - prev;
    return {
      value: Math.round(Math.abs(change) * 10) / 10,
      isPositive: change >= 0,
      unit,
      label: t("vs_previous_day"),
    };
  };

  const departmentData = (data?.departmentDistribution || []).map((item, index) => ({
    name: item.name,
    value: item.value,
    color: [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ][index % 5],
  }));

  const recentActivities = data?.recentActivities || [];

  const totalEmployees = data?.totalEmployees ?? 0;
  const presentToday = data?.presentToday ?? 0;
  const absentToday = data?.absentToday ?? 0;
  const pendingLeaves = data?.pendingLeaves ?? 0;
  const criticalLeaves = data?.criticalLeaves ?? 0;
  const adherenceRate = data?.adherenceRate ?? 0;
  const averageLateMinutes = data?.averageLateMinutes ?? 0;

  const canSeeLeaves = ["admin", "system_admin", "hr_manager"].includes(String(user?.role || ""));
  const rangeLabel =
    range === "today" ? t("range_today") : range === "month" ? t("range_month") : t("range_week");
  const roleLabel = user?.role ? t(`role_${user.role}`) : t("default_user_role");
  const displayName = user?.name || user?.username || "-";
  const dashboardHeroMetrics = [
    {
      label: t("filter_range"),
      value: rangeLabel,
      icon: Calendar,
      tone: "primary" as const,
    },
    {
      label: t("current_workforce"),
      value: totalEmployees,
      icon: Users,
      tone: "primary" as const,
    },
    {
      label: t("active_devices"),
      value: pulseData?.deviceStatus?.online ?? 0,
      icon: Activity,
      tone: "success" as const,
    },
    {
      label: t("adherence_rate"),
      value: `${adherenceRate}%`,
      icon: TrendingUp,
      tone: "success" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertTriangle}
          title={t("error_loading")}
          actionLabel={t("retry")}
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const cards = [
    {
      id: "total_employees",
      title: t("current_workforce"),
      value: totalEmployees,
      icon: Users,
      variant: "primary" as const,
      link: "/employees",
      visible: true,
    },
    {
      id: "present_today",
      title: t("present_today"),
      value: presentToday,
      icon: UserCheck,
      variant: "success" as const,
      link: "/attendance",
      visible: true,
      trend: buildTrend(attendanceSeriesPresent, "%", true),
      sparkline: attendanceSeriesPresent,
    },
    {
      id: "absent",
      title: t("absent"),
      value: absentToday,
      icon: UserX,
      variant: "warning" as const,
      link: "/attendance",
      visible: true,
      trend: buildTrend(attendanceSeriesAbsent, "%", true),
      sparkline: attendanceSeriesAbsent,
    },
    {
      id: "leave_requests",
      title: t("leave_requests"),
      value: pendingLeaves,
      icon: Calendar,
      variant: "default" as const,
      link: "/leaves",
      visible: canSeeLeaves,
    },
    {
      id: "critical_leaves",
      title: t("critical_leaves"),
      value: criticalLeaves,
      icon: AlertTriangle,
      variant: "warning" as const,
      link: "/leaves",
      visible: canSeeLeaves,
    },
    {
      id: "adherence_rate",
      title: t("adherence_rate"),
      value: `${adherenceRate}%`,
      icon: TrendingUp,
      variant: "success" as const,
      link: "/attendance",
      visible: true,
      trend: buildTrend(attendanceSeriesAdherence, "%", false),
      sparkline: attendanceSeriesAdherence,
    },
    {
      id: "average_late",
      title: t("average_late_minutes"),
      value: `${averageLateMinutes}`,
      icon: Activity,
      variant: "default" as const,
      link: "/attendance",
      visible: true,
    },
  ].filter((card) => card.visible);
  const spotlightMetrics = [
    {
      key: "present",
      label: t("present_today"),
      value: presentToday,
      icon: UserCheck,
      accent: "text-success",
    },
    {
      key: "leaves",
      label: t("leave_requests"),
      value: pendingLeaves,
      icon: Calendar,
      accent: "text-warning",
    },
    {
      key: "departments",
      label: t("department_distribution"),
      value: departmentData.length,
      icon: TrendingUp,
      accent: "text-warning",
    },
  ];
  const cardSpanMap: Record<string, string> = {
    total_employees: "xl:col-span-4",
    present_today: "xl:col-span-4",
    absent: "xl:col-span-4",
    leave_requests: "xl:col-span-3",
    critical_leaves: "xl:col-span-3",
    adherence_rate: "xl:col-span-3",
    average_late: "xl:col-span-3",
  };

  const formatActivityTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return formatDistanceToNow(parsed, { addSuffix: true, locale: timeLocale });
  };

  const formatActivityType = (value: string) => {
    if (value === "attendance") return t("attendance");
    if (value === "leave") return t("leaves");
    return value;
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <OnboardingFlow />
      {isAIEnabled && <AIDashboardSummary />}

      <PageHero
        title={t("dashboard_title")}
        subtitle={t("dashboard_subtitle")}
        metrics={dashboardHeroMetrics}
        actions={
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button variant="secondary" size="sm" onClick={() => navigate("/onboarding")}>
              {t("onboarding_open_full")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => localStorage.removeItem(`onboarding:${user?.id || "guest"}`)}
            >
              {t("onboarding_restart")}
            </Button>
            <div className="w-full sm:w-48">
              <Select value={range} onValueChange={(value) => setRange(value as TimeRange)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filter_range")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t("range_today")}</SelectItem>
                  <SelectItem value="week">{t("range_week")}</SelectItem>
                  <SelectItem value="month">{t("range_month")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        aside={
          <div className="grid gap-3 rounded-[28px] border border-border/60 bg-background/80 p-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
                <Badge variant="secondary" className="rounded-full border border-primary/10 bg-primary/10 px-3 py-1 text-primary">
                  {t("dashboard")}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {spotlightMetrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3 shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <metric.icon className={`h-4 w-4 ${metric.accent}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        {metric.label}
                      </span>
                    </div>
                    <p className="text-2xl font-black tracking-tight text-foreground">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary" className="rounded-full bg-background/85 px-3 py-1.5 text-muted-foreground">
            {t("filter_range")}: {rangeLabel}
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-background/85 px-3 py-1.5 text-muted-foreground">
            {t("role")}: {roleLabel}
          </Badge>
          {isAIEnabled ? (
            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
              {t("ai_assistant")}
            </Badge>
          ) : null}
        </div>
      </PageHero>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
        {cards.map((card) => (
          <div key={card.id} className={cardSpanMap[card.id] || "xl:col-span-3"}>
            <Link to={card.link} className="block group relative transition-transform duration-300 hover:-translate-y-1">
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                variant={card.variant}
                trend={card.trend}
                sparkline={card.sparkline}
              />
              <div
                className={`absolute top-4 ${isRtl ? "left-4 translate-x-1" : "right-4 -translate-x-1"} opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-muted-foreground`}
              >
                {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_420px]">
        {/* Attendance Chart */}
        <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {t("weekly_attendance_stats")}
              </CardTitle>
                <Badge variant="secondary" className="w-fit rounded-full bg-muted/70 text-muted-foreground">
                  {rangeLabel}
                </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis type="number" />
                  <YAxis dataKey="day" type="category" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      direction: isRtl ? "rtl" : "ltr",
                    }}
                  />
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <Bar
                    dataKey={presentKey}
                    fill="url(#colorPresent)"
                    radius={isRtl ? [4, 0, 0, 4] : [0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey={absentKey}
                    fill="url(#colorAbsent)"
                    radius={isRtl ? [4, 0, 0, 4] : [0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={AlertTriangle} title={t("no_data")} />
            )}
          </CardContent>
        </Card>

        {/* Pulse & Department Stack */}
        <div className="space-y-6">
          <PulseCard data={pulseData} isLoading={pulseLoading} />
          
          <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t("department_distribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {departmentData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    {departmentData.map((dept) => (
                      <div key={dept.name} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: dept.color }}
                        />
                        <span className="text-muted-foreground">{dept.name}</span>
                        <span className="font-medium">{dept.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState icon={AlertTriangle} title={t("no_data")} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">{t("recent_activities")}</CardTitle>
            <Badge variant="secondary" className="w-fit rounded-full bg-muted/70 text-muted-foreground">
              {recentActivities.length} / 10
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/50 p-4 transition-all duration-300 hover:scale-[1.01] hover:bg-accent/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === "attendance"
                          ? "bg-primary/10 text-primary"
                          : activity.type === "leave"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                      }`}
                    >
                      {activity.type === "attendance" ? (
                        <Clock className="w-5 h-5" />
                      ) : activity.type === "leave" ? (
                        <Calendar className="w-5 h-5" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.name}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge variant="secondary" className="rounded-full bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                      {formatActivityType(activity.type)}
                    </Badge>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {formatActivityTime(activity.time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={AlertTriangle} title={t("no_activity")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}



