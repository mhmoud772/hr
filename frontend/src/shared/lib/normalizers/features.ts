import type {
  ApiAsset,
  ApiAuditLog,
  ApiNotification,
  ApiPayrollRecord,
  ApiPerformanceReview,
  ApiRecruitmentCandidate,
  ApiTrainingRecord,
} from "@/types/contracts";
import type { Asset } from "@/features/assets/types";
import type { AuditLog } from "@/features/audit-logs/types";
import type { Notification } from "@/features/notifications/types";
import type { PayrollRecord } from "@/features/payroll/types";
import type { PerformanceReview } from "@/features/performance/types";
import type { RecruitmentCandidate } from "@/features/recruitment/types";
import type { TrainingRecord } from "@/features/training/types";
import {
  asRecord,
  toOptionalBoolean,
  toOptionalId,
  toOptionalNumber,
  toOptionalRecord,
  toOptionalString,
  toRequiredString,
} from "./base";

export function normalizeAsset(raw: ApiAsset | Asset | Record<string, unknown>): Asset {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    name: toRequiredString(record.name),
    serial_number: toOptionalString(record.serial_number),
    category: toOptionalString(record.category),
    status: (toOptionalString(record.status) as Asset["status"]) ?? "available",
    assignedTo: toOptionalId(record.assignedTo ?? record.assigned_to) ?? null,
    assignedToCode:
      toOptionalId(record.assignedToCode ?? record.assigned_to_code) ?? null,
    assignedToName: toOptionalString(record.assignedToName ?? record.assigned_to_name),
    assigned_at: toOptionalString(record.assigned_at),
    notes: toOptionalString(record.notes),
  };
}

export function normalizeAuditLog(
  raw: ApiAuditLog | AuditLog | Record<string, unknown>,
): AuditLog {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    user: toOptionalId(record.user) ?? null,
    userName: toOptionalString(record.userName ?? record.user_name),
    action: (toOptionalString(record.action) as AuditLog["action"]) ?? "update",
    model_name: toRequiredString(record.model_name),
    object_id: toRequiredString(record.object_id),
    changes: toOptionalRecord(record.changes) as AuditLog["changes"] | undefined,
    created_at: toOptionalString(record.created_at),
  };
}

export function normalizePayrollRecord(
  raw: ApiPayrollRecord | PayrollRecord | Record<string, unknown>,
): PayrollRecord {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    employeeId: toRequiredString(record.employeeId ?? record.employee),
    employeeCode: toOptionalString(record.employeeCode ?? record.employee_code),
    employeeName: toOptionalString(record.employeeName ?? record.employee_name),
    period_start: toRequiredString(record.period_start),
    period_end: toRequiredString(record.period_end),
    base_salary: toOptionalNumber(record.base_salary) ?? 0,
    allowances: toOptionalNumber(record.allowances) ?? 0,
    deductions: toOptionalNumber(record.deductions) ?? 0,
    net_salary: toOptionalNumber(record.net_salary) ?? 0,
    status: (toOptionalString(record.status) as PayrollRecord["status"]) ?? "draft",
    created_at: toOptionalString(record.created_at),
  };
}

export function normalizePerformanceReview(
  raw: ApiPerformanceReview | PerformanceReview | Record<string, unknown>,
): PerformanceReview {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    employeeId: toRequiredString(record.employeeId ?? record.employee),
    employeeCode: toOptionalString(record.employeeCode ?? record.employee_code),
    employeeName: toOptionalString(record.employeeName ?? record.employee_name),
    period: toRequiredString(record.period),
    rating: toOptionalNumber(record.rating) ?? 0,
    reviewer: toOptionalId(record.reviewer),
    reviewerName: toOptionalString(record.reviewerName ?? record.reviewer_name),
    notes: toOptionalString(record.notes),
    created_at: toOptionalString(record.created_at),
  };
}

export function normalizeRecruitmentCandidate(
  raw: ApiRecruitmentCandidate | RecruitmentCandidate | Record<string, unknown>,
): RecruitmentCandidate {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    name: toRequiredString(record.name),
    email: toOptionalString(record.email),
    phone: toOptionalString(record.phone),
    position: toRequiredString(record.position),
    status: (toOptionalString(record.status) as RecruitmentCandidate["status"]) ?? "applied",
    source: toOptionalString(record.source),
    notes: toOptionalString(record.notes),
    applied_at: toOptionalString(record.applied_at),
  };
}

export function normalizeTrainingRecord(
  raw: ApiTrainingRecord | TrainingRecord | Record<string, unknown>,
): TrainingRecord {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    employeeId: toRequiredString(record.employeeId ?? record.employee),
    employeeCode: toOptionalString(record.employeeCode ?? record.employee_code),
    employeeName: toOptionalString(record.employeeName ?? record.employee_name),
    title: toRequiredString(record.title),
    provider: toOptionalString(record.provider),
    start_date: toOptionalString(record.start_date),
    end_date: toOptionalString(record.end_date),
    status: (toOptionalString(record.status) as TrainingRecord["status"]) ?? "planned",
    notes: toOptionalString(record.notes),
  };
}

export function normalizeNotification(
  raw: ApiNotification | Notification | Record<string, unknown>,
): Notification {
  const record = asRecord(raw);
  const status = toOptionalString(record.status);
  return {
    id: toRequiredString(record.id),
    title: toRequiredString(record.title),
    description: toOptionalString(record.description ?? record.body),
    read: toOptionalBoolean(record.read) ?? (status === "sent"),
    createdAt: toOptionalString(record.createdAt ?? record.created_at),
    type:
      (toOptionalString(record.type) as Notification["type"]) ||
      (status === "failed" ? "error" : status === "sent" ? "success" : "info"),
  };
}
