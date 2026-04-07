import type { components } from "./api.generated";

type Schemas = components["schemas"];

export type ApiListLike<T> =
  | T[]
  | {
      count?: number | null;
      results?: T[] | null;
    };

export type ApiAttendance = Schemas["Attendance"];
export type ApiAuditLog = Schemas["AuditLog"];
export type ApiAsset = Schemas["Asset"];
export type ApiDepartment = Schemas["Department"];
export type ApiDevice = Schemas["Device"];
export type ApiDeviceBackupSnapshot = Schemas["DeviceBackupSnapshot"];
export type ApiDeviceCommandApproval = Schemas["DeviceCommandApproval"];
export type ApiDeviceFirmwareRollout = Schemas["DeviceFirmwareRollout"];
export type ApiDeviceGroup = Schemas["DeviceGroup"];
export type ApiDevicePolicy = Schemas["DevicePolicy"];
export type ApiDeviceSyncLog = Schemas["DeviceSyncLog"];
export type ApiDeviceTemplate = Schemas["BiometricTemplate"];
export type ApiEmployee = Schemas["Employee"];
export type ApiEmployeeShift = Schemas["EmployeeShift"];
export type ApiJobTitle = Schemas["JobTitle"];
export type ApiLeave = Schemas["Leave"];
export type ApiLeaveBalance = Schemas["LeaveBalance"];
export type ApiNotification = Schemas["Notification"];
export type ApiPaginatedAuditLogList = Schemas["PaginatedAuditLogList"];
export type ApiPaginatedAttendanceList = Schemas["PaginatedAttendanceList"];
export type ApiPaginatedAssetList = Schemas["PaginatedAssetList"];
export type ApiPaginatedDepartmentList = Schemas["PaginatedDepartmentList"];
export type ApiPaginatedDeviceBackupSnapshotList = Schemas["PaginatedDeviceBackupSnapshotList"];
export type ApiPaginatedDeviceCommandApprovalList = Schemas["PaginatedDeviceCommandApprovalList"];
export type ApiPaginatedDeviceFirmwareRolloutList = Schemas["PaginatedDeviceFirmwareRolloutList"];
export type ApiPaginatedDeviceGroupList = Schemas["PaginatedDeviceGroupList"];
export type ApiPaginatedDeviceList = Schemas["PaginatedDeviceList"];
export type ApiPaginatedDevicePolicyList = Schemas["PaginatedDevicePolicyList"];
export type ApiPaginatedDeviceTemplateList = Schemas["PaginatedBiometricTemplateList"];
export type ApiPaginatedEmployeeList = Schemas["PaginatedEmployeeList"];
export type ApiPaginatedEmployeeShiftList = Schemas["PaginatedEmployeeShiftList"];
export type ApiPaginatedJobTitleList = Schemas["PaginatedJobTitleList"];
export type ApiPaginatedLeaveList = Schemas["PaginatedLeaveList"];
export type ApiPaginatedNotificationList = Schemas["PaginatedNotificationList"];
export type ApiPaginatedPayrollRecordList = Schemas["PaginatedPayrollRecordList"];
export type ApiPaginatedPerformanceReviewList = Schemas["PaginatedPerformanceReviewList"];
export type ApiPaginatedRecruitmentCandidateList = Schemas["PaginatedRecruitmentCandidateList"];
export type ApiPaginatedTrainingRecordList = Schemas["PaginatedTrainingRecordList"];
export type ApiPaginatedShiftList = Schemas["PaginatedShiftList"];
export type ApiPayrollRecord = Schemas["PayrollRecord"];
export type ApiPerformanceReview = Schemas["PerformanceReview"];
export type ApiRecruitmentCandidate = Schemas["RecruitmentCandidate"];
export type ApiShift = Schemas["Shift"];
export type ApiTrainingRecord = Schemas["TrainingRecord"];
export type ApiPaginatedUserList = Schemas["PaginatedUserList"];
export type ApiUser = Schemas["User"];
export type ApiUserRequest = Schemas["UserRequest"];
export type ApiPatchedUserRequest = Schemas["PatchedUserRequest"];

// Create/Update Payloads
export type ApiLeaveRequest = Schemas["LeaveRequest"];
export type ApiPatchedLeaveRequest = Schemas["PatchedLeaveRequest"];

export type ApiDepartmentRequest = Schemas["DepartmentRequest"];
export type ApiPatchedDepartmentRequest = Schemas["PatchedDepartmentRequest"];

export type ApiPayrollRecordRequest = Schemas["PayrollRecordRequest"];
export type ApiPatchedPayrollRecordRequest = Schemas["PatchedPayrollRecordRequest"];

export type ApiTrainingRecordRequest = Schemas["TrainingRecordRequest"];
export type ApiPatchedTrainingRecordRequest = Schemas["PatchedTrainingRecordRequest"];

export type ApiRecruitmentCandidateRequest = Schemas["RecruitmentCandidateRequest"];
export type ApiPatchedRecruitmentCandidateRequest = Schemas["PatchedRecruitmentCandidateRequest"];

export type ApiPerformanceReviewRequest = Schemas["PerformanceReviewRequest"];
export type ApiPatchedPerformanceReviewRequest = Schemas["PatchedPerformanceReviewRequest"];

export type ApiEmployeeRequest = Schemas["EmployeeRequest"];
export type ApiPatchedEmployeeRequest = Schemas["PatchedEmployeeRequest"];

export type ApiAttendanceRequest = Schemas["AttendanceRequest"];
export type ApiPatchedAttendanceRequest = Schemas["PatchedAttendanceRequest"];

export type ApiDeviceRequest = Schemas["DeviceRequest"];
export type ApiPatchedDeviceRequest = Schemas["PatchedDeviceRequest"];

export type ApiNotificationRequest = Schemas["NotificationRequest"];

export type ApiDeviceGroupRequest = Schemas["DeviceGroupRequest"];
export type ApiPatchedDeviceGroupRequest = Schemas["PatchedDeviceGroupRequest"];
export type ApiDevicePolicyRequest = Schemas["DevicePolicyRequest"];
export type ApiPatchedDevicePolicyRequest = Schemas["PatchedDevicePolicyRequest"];

export type ApiTokenObtainPairRequest = Schemas["CustomTokenObtainPairRequest"];
export type ApiTokenRefreshRequest = Schemas["TokenRefreshRequest"];
export type ApiTokenRefreshResponse = Schemas["TokenRefresh"];
export type ApiRegisterRequest = Record<string, unknown>; // Still missing in schema

// ── Settings Contracts (manually structured to handle JSON fields) ──

export interface ApiCompanySettings {
  name: string;
  name_en: string;
  email: string;
  phone: string;
  address: string;
  logo_data_url?: string;
  logos?: string[];
}

export interface ApiAttendanceSettings {
  work_start_time: string;
  work_end_time: string;
  late_threshold: string;
  early_leave_threshold: string;
  enable_geolocation: boolean;
  enable_face_recognition: boolean;
}

export interface ApiLeaveSettings {
  annual_leave_default: string;
  sick_leave_default: string;
  emergency_leave_default: string;
  require_approval: boolean;
  approval_levels?: string;
  min_advance_notice: string;
}

export interface ApiNotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  leave_request_notify: boolean;
  attendance_alerts: boolean;
  weekly_reports: boolean;
  notifications_enabled?: boolean;
  digest_frequency?: string;
  digest_time?: string;
  weekly_digest_day?: string;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  templates?: Record<string, unknown>;
}

export interface ApiGeneralSettings {
  theme: string;
  language: string;
  timezone: string;
  time_format?: string;
  week_start?: string;
  work_week_days?: string[];
  weekend_days?: string[];
  holiday_calendar?: Array<{ date: string; name: string; type?: string }>;
  settings_access?: Record<string, string[]>;
  security?: Record<string, unknown>;
}

export interface ApiAISettings {
  enabled: boolean;
  runtime_enabled?: boolean;
  provider: string;
  model_name: string;
  allow_fallback?: boolean;
  access_roles?: string[];
  features?: {
    policy_assistant?: boolean;
    dashboard_summary?: boolean;
  };
}

/** Explicitly override the generated empty Settings schema */
export interface ApiSettings {
  company_settings?: ApiCompanySettings;
  attendance_settings?: ApiAttendanceSettings;
  leave_settings?: ApiLeaveSettings;
  notification_settings?: ApiNotificationSettings;
  general_settings?: ApiGeneralSettings;
  ai_enabled?: boolean;
  ai_settings?: ApiAISettings;
}

export interface ApiSettingsRequest {
  company_settings?: Partial<ApiCompanySettings>;
  attendance_settings?: Partial<ApiAttendanceSettings>;
  leave_settings?: Partial<ApiLeaveSettings>;
  notification_settings?: Partial<ApiNotificationSettings>;
  general_settings?: Partial<ApiGeneralSettings>;
  ai_enabled?: boolean;
  ai_settings?: Partial<ApiAISettings>;
}

// ── AI Contracts (manually defined from backend/apps/ai/serializers.py) ──

/** Request payload for POST /ai/query/ */
export interface ApiAIQueryRequest {
  prompt: string;
  include_context?: boolean;
}

/** Response from /ai/query/ and /ai/dashboard-summary/ */
export interface ApiAIResponse {
  status: string;
  answer: string;
  metadata: Record<string, unknown>;
}

/** Single policy document from GET /ai/policies/ */
export interface ApiPolicyDocument {
  id: number;
  title: string;
  category: "attendance" | "leaves" | "compensation" | "conduct" | "general";
  content: string;
  version: string;
  last_updated: string;
  created_at: string;
}
