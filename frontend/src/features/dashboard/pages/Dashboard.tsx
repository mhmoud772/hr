import React from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
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
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboard";
import type { TimeRange } from "@/types/api";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [range, setRange] = React.useState<TimeRange>("week");
  const { data, isLoading, isError, refetch } = useDashboardSummary(range);
  const isRtl = i18n.language === "ar";

  const presentKey = t("present_label");
  const absentKey = t("absent_label");

  const attendanceData = (data?.attendanceStats || []).map((item) => ({
    day: item.day,
    [presentKey]: item.present,
    [absentKey]: item.absent,
  }));

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

  if (isLoading) {
    return <LoadingState label={t("loading")} />;
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
      title: t("total_employees"),
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
    },
    {
      id: "absent",
      title: t("absent"),
      value: absentToday,
      icon: UserX,
      variant: "warning" as const,
      link: "/attendance",
      visible: true,
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("dashboard_title")}
          </h1>
          <p className="text-muted-foreground">{t("dashboard_subtitle")}</p>
        </div>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.id} to={card.link} className="block">
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              variant={card.variant}
            />
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2 bg-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t("weekly_attendance_stats")}
            </CardTitle>
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
                  <Bar
                    dataKey={presentKey}
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey={absentKey}
                    fill="hsl(var(--destructive))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={AlertTriangle} title={t("no_data")} />
            )}
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="bg-card border-none shadow-sm">
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
                <div className="grid grid-cols-2 gap-2 mt-4">
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

      {/* Recent Activity */}
      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t("recent_activities")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === "attendance"
                          ? "bg-primary/10 text-primary"
                          : activity.type === "leave"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-emerald-500/10 text-emerald-600"
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
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
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

