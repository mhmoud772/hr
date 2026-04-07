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

export type ReportType = 
  | "attendance" 
  | "leaves" 
  | "payroll" 
  | "recruitment" 
  | "performance" 
  | "training" 
  | "assets" 
  | "audit";

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export * from "../features/employees/types";
export * from "../features/attendance/types";
export * from "../features/devices/types";
export * from "../features/leaves/types";
export * from "../features/structure/types";
export * from "../features/job-titles/types";
export * from "../features/settings/types";
export * from "../features/users/types";
export * from "../features/auth/types";
export * from "../features/audit-logs/types";
export * from "../features/payroll/types";
export * from "../features/recruitment/types";
export * from "../features/performance/types";
export * from "../features/training/types";
export * from "../features/assets/types";
export * from "../features/dashboard/types";
export * from "../features/notifications/types";
