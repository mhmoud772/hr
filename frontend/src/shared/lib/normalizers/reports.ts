import type {
  DashboardPulse,
  DashboardPulseLog,
  DashboardSummary,
} from "@/features/dashboard/types";
import {
  asRecord,
  toOptionalNumber,
  toOptionalString,
  toRequiredString,
} from "./base";

export function normalizeDashboardPulseLog(raw: DashboardPulseLog | Record<string, unknown>): DashboardPulseLog {
  const record = asRecord(raw);
  return {
    employee_code: toRequiredString(record.employee_code),
    device: toRequiredString(record.device),
    timestamp: toRequiredString(record.timestamp),
    action: toRequiredString(record.action),
  };
}

export function normalizeDashboardPulse(raw: DashboardPulse | Record<string, unknown>): DashboardPulse {
  const record = asRecord(raw);
  const deviceStatus = asRecord(record.deviceStatus);
  const latestLogs = Array.isArray(record.latestLogs) ? record.latestLogs : [];
  return {
    currentlyCheckedIn:
      toOptionalNumber(record.currentlyCheckedIn ?? record.currently_checked_in) ?? 0,
    deviceStatus: {
      online: toOptionalNumber(deviceStatus.online) ?? 0,
      total: toOptionalNumber(deviceStatus.total) ?? 0,
    },
    latestLogs: latestLogs.map((item) => normalizeDashboardPulseLog(item as Record<string, unknown>)),
    lastSync: toOptionalString(record.lastSync ?? record.last_sync) ?? null,
  };
}

export function normalizeDashboardSummary(raw: DashboardSummary | Record<string, unknown>): DashboardSummary {
  const record = asRecord(raw);
  const rawAttendanceStats = Array.isArray(record.attendanceStats)
    ? record.attendanceStats
    : Array.isArray(record.attendance_stats)
      ? record.attendance_stats
      : [];
  const rawDepartmentStats = Array.isArray(record.departmentDistribution)
    ? record.departmentDistribution
    : Array.isArray(record.departmentStats)
      ? record.departmentStats
      : [];
  const rawRecentActivities = Array.isArray(record.recentActivities)
    ? record.recentActivities
    : Array.isArray(record.activityFeed)
      ? record.activityFeed
      : [];

  return {
    totalEmployees: toOptionalNumber(record.totalEmployees ?? record.total_employees) ?? 0,
    presentToday: toOptionalNumber(record.presentToday ?? record.present_today) ?? 0,
    absentToday:
      toOptionalNumber(record.absentToday ?? record.absent_today) ??
      Math.max(
        0,
        (toOptionalNumber(record.totalEmployees ?? record.total_employees) ?? 0) -
          (toOptionalNumber(record.presentToday ?? record.present_today) ?? 0),
      ),
    pendingLeaves: toOptionalNumber(record.pendingLeaves ?? record.pending_leaves) ?? 0,
    criticalLeaves: toOptionalNumber(record.criticalLeaves ?? record.critical_leaves) ?? 0,
    adherenceRate: toOptionalNumber(record.adherenceRate ?? record.adherence_rate) ?? 0,
    averageLateMinutes:
      toOptionalNumber(record.averageLateMinutes ?? record.average_late_minutes) ?? 0,
    attendanceStats: rawAttendanceStats.map((item) => {
      const row = asRecord(item);
      return {
        day: toRequiredString(row.day ?? row.date),
        present: toOptionalNumber(row.present) ?? 0,
        absent: toOptionalNumber(row.absent) ?? 0,
      };
    }),
    departmentDistribution: rawDepartmentStats.map((item) => {
      const row = asRecord(item);
      return {
        name: toRequiredString(row.name),
        value: toOptionalNumber(row.value ?? row.count) ?? 0,
      };
    }),
    recentActivities: rawRecentActivities.map((item) => {
      const row = asRecord(item);
      return {
        id: toRequiredString(row.id),
        name: toRequiredString(row.name, "Activity"),
        action: toRequiredString(row.action),
        time: toRequiredString(row.time),
        type: (toOptionalString(row.type) as DashboardSummary["recentActivities"][number]["type"]) ?? "other",
      };
    }),
  };
}
