import type { ID } from "@/types/api";

export type TimeRange = "today" | "week" | "month";

export interface AttendanceStatPoint {
  day: string;
  present: number;
  absent: number;
}

export interface DepartmentDistribution {
  name: string;
  value: number;
}

export interface DashboardActivity {
  id: ID;
  name: string;
  action: string;
  time: string;
  type: "attendance" | "leave" | "approved" | "other";
}

export interface DashboardSummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  pendingLeaves: number;
  criticalLeaves?: number;
  adherenceRate?: number;
  averageLateMinutes?: number;
  attendanceStats: AttendanceStatPoint[];
  departmentDistribution: DepartmentDistribution[];
  recentActivities: DashboardActivity[];
}

export interface DashboardPulseLog {
  employee_code: string;
  device: string;
  timestamp: string;
  action: string;
}

export interface DashboardPulse {
  currentlyCheckedIn: number;
  deviceStatus: {
    online: number;
    total: number;
  };
  latestLogs: DashboardPulseLog[];
  lastSync: string | null;
}
