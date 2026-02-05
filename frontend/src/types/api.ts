export type ID = string;
export type ISODate = string;

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type EmployeeStatus = "active" | "leave" | "inactive";

export interface Employee {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  hireDate?: ISODate;
  status: EmployeeStatus;
  nationality?: string;
  birthDate?: ISODate;
  address?: string;
  salary?: number;
  contractStatus?: "permanent" | "contract" | "probation" | "terminated";
  avatar?: string;
  avatarUrl?: string;
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface Attendance {
  id: ID;
  employeeId: ID;
  employeeName?: string;
  department?: string;
  date: ISODate;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  workHours?: string;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
}

export type DeviceStatus = "online" | "offline";

export interface Device {
  id: ID;
  name: string;
  serialNumber: string;
  ipAddress: string;
  location: string;
  status: DeviceStatus;
  lastSync?: string;
  lastSeen?: string;
  employeeCount?: number;
}

export interface DeviceSyncLog {
  id: ID;
  device: ID;
  status: "success" | "failed" | "running";
  message?: string;
  started_at?: ISODate;
  finished_at?: ISODate;
}

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface Leave {
  id: ID;
  employeeId: ID;
  employeeName?: string;
  department?: string;
  leaveType: string;
  startDate: ISODate;
  endDate: ISODate;
  days?: number;
  reason?: string;
  status: LeaveStatus;
  created_at?: ISODate;
  updated_at?: ISODate;
  approvals?: LeaveApproval[];
  attachments?: LeaveAttachment[];
}

export interface LeaveApproval {
  id: ID;
  approver?: ID;
  approverName?: string;
  status: "approved" | "rejected";
  comment?: string;
  level?: number;
  decided_at?: ISODate;
}

export interface LeaveAttachment {
  id: ID;
  filename?: string;
  url?: string;
  uploaded_at?: ISODate;
  uploaded_by?: ID;
}

export interface LeaveBalance {
  id: ID;
  employeeId: ID;
  employeeName?: string;
  leave_type: string;
  total_days: number;
  used_days: number;
  remainingDays?: number;
}

export interface Notification {
  id: ID;
  title: string;
  description?: string;
  read?: boolean;
  createdAt?: ISODate;
  type?: "info" | "warning" | "success" | "error";
}

export interface Department {
  id: ID;
  name: string;
  parentId?: ID | null;
  managerId?: ID | null;
  managerName?: string;
  employeeCount?: number;
  sortOrder?: number;
}

export interface JobTitle {
  id: ID;
  name: string;
  nameEn?: string;
  department?: string;
  level: string;
  minSalary?: number;
  maxSalary?: number;
  employee_count?: number;
  description?: string;
}

export interface CompanySettings {
  name: string;
  nameEn: string;
  email: string;
  phone: string;
  address: string;
  logoDataUrl?: string;
  logos?: string[];
}

export interface AttendanceSettings {
  workStartTime: string;
  workEndTime: string;
  lateThreshold: string;
  earlyLeaveThreshold: string;
  enableGeolocation: boolean;
  enableFaceRecognition: boolean;
}

export interface LeaveSettings {
  annualLeaveDefault: string;
  sickLeaveDefault: string;
  emergencyLeaveDefault: string;
  requireApproval: boolean;
  approvalLevels?: string;
  minAdvanceNotice: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  leaveRequestNotify: boolean;
  attendanceAlerts: boolean;
  weeklyReports: boolean;
  notificationsEnabled?: boolean;
  digestFrequency?: "instant" | "daily" | "weekly";
  digestTime?: string;
  weeklyDigestDay?: "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  templates?: {
    leaveRequest?: { emailSubject?: string; emailBody?: string; smsBody?: string };
    leaveApproved?: { emailSubject?: string; emailBody?: string; smsBody?: string };
    leaveRejected?: { emailSubject?: string; emailBody?: string; smsBody?: string };
    attendanceAlert?: { emailSubject?: string; emailBody?: string; smsBody?: string };
    weeklyReport?: { emailSubject?: string; emailBody?: string; smsBody?: string };
  };
}

export interface GeneralSettings {
  theme: string;
  language: string;
  timezone: string;
  timeFormat?: "12" | "24";
  weekStart?: "sat" | "sun" | "mon";
  workWeekDays?: string[];
  weekendDays?: string[];
  holidayCalendar?: { date: string; name: string; type?: string }[];
  settingsAccess?: {
    company?: string[];
    general?: string[];
    attendance?: string[];
    leaves?: string[];
    notifications?: string[];
    security?: string[];
    backup?: string[];
    audit?: string[];
  };
  security?: {
    mfaEnabled?: boolean;
    mfaRequired?: boolean;
    passwordMinLength?: number;
    passwordRequireUpper?: boolean;
    passwordRequireNumber?: boolean;
    passwordRequireSymbol?: boolean;
    passwordExpiryDays?: number;
  };
}

export interface SettingsPayload {
  "company-settings"?: CompanySettings;
  "attendance-settings"?: AttendanceSettings;
  "leave-settings"?: LeaveSettings;
  "notification-settings"?: NotificationSettings;
  "general-settings"?: GeneralSettings;
}

export interface User {
  id: ID;
  name: string;
  username?: string;
  role: string;
  email?: string;
  is_active?: boolean;
  last_login?: ISODate;
  must_change_password?: boolean;
  permissions?: string[];
}

export interface EmployeeDocument {
  id: ID;
  employeeId: ID;
  title: string;
  doc_type?: string;
  notes?: string;
  file?: string;
  fileUrl?: string;
  filename?: string;
  uploaded_by?: ID;
  uploaded_at?: ISODate;
}

export interface AuditLog {
  id: ID;
  user?: ID | null;
  userName?: string;
  action: "create" | "update" | "delete";
  model_name: string;
  object_id: string;
  changes?: Record<string, { from: string; to: string }>;
  created_at?: ISODate;
}

export interface PayrollRecord {
  id: ID;
  employeeId: ID;
  period_start: ISODate;
  period_end: ISODate;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: "draft" | "approved" | "paid";
  created_at?: ISODate;
}

export interface RecruitmentCandidate {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  status: "applied" | "screening" | "interview" | "offered" | "hired" | "rejected";
  source?: string;
  notes?: string;
  applied_at?: ISODate;
}

export interface PerformanceReview {
  id: ID;
  employeeId: ID;
  period: string;
  rating: number;
  reviewer?: ID;
  reviewerName?: string;
  notes?: string;
  created_at?: ISODate;
}

export interface TrainingRecord {
  id: ID;
  employeeId: ID;
  title: string;
  provider?: string;
  start_date?: ISODate;
  end_date?: ISODate;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

export interface Asset {
  id: ID;
  name: string;
  serial_number?: string;
  category?: string;
  status: "available" | "assigned" | "maintenance" | "retired";
  assignedTo?: ID | null;
  assigned_at?: ISODate;
  notes?: string;
}

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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  user: User;
}
