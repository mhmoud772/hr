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
    ai?: string[];
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

export interface AISettings {
  enabled: boolean;
  runtimeEnabled?: boolean;
  provider: string;
  modelName: string;
  allowFallback?: boolean;
  accessRoles?: string[];
  features?: {
    policyAssistant?: boolean;
    dashboardSummary?: boolean;
  };
}
