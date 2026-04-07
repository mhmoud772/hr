import type {
  ApiAttendance,
  ApiEmployeeShift,
  ApiLeave,
  ApiLeaveBalance,
  ApiShift,
} from "@/types/contracts";
import type {
  Attendance,
  Shift,
  EmployeeShift,
} from "@/features/attendance/types";
import type {
  Leave,
  LeaveBalance,
} from "@/features/leaves/types";
import {
  asRecord,
  toOptionalNumber,
  toOptionalString,
  toRequiredString,
} from "./base";

export function normalizeAttendance(raw: ApiAttendance | Attendance | Record<string, unknown>): Attendance {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    employeeId: toRequiredString(record.employeeId ?? record.employee),
    employeeCode: toOptionalString(record.employeeCode ?? record.employee_code),
    employeeName: toOptionalString(record.employeeName ?? record.employee_name),
    department: toOptionalString(record.department),
    date: toRequiredString(record.date),
    status: (toOptionalString(record.status) as Attendance["status"]) ?? "present",
    checkIn: toOptionalString(record.checkIn ?? record.check_in),
    checkOut: toOptionalString(record.checkOut ?? record.check_out),
    workHours: toOptionalString(record.workHours ?? record.work_hours),
    lateMinutes: toOptionalNumber(record.lateMinutes ?? record.late_minutes),
    earlyLeaveMinutes: toOptionalNumber(
      record.earlyLeaveMinutes ?? record.early_leave_minutes,
    ),
  };
}

export function normalizeLeave(raw: ApiLeave | Leave | Record<string, unknown>): Leave {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    employeeId: toRequiredString(record.employeeId ?? record.employee),
    employeeName: toOptionalString(record.employeeName ?? record.employee_name),
    department: toOptionalString(record.department),
    leaveType: toRequiredString(record.leaveType ?? record.leave_type),
    startDate: toRequiredString(record.startDate ?? record.start_date),
    endDate: toRequiredString(record.endDate ?? record.end_date),
    days: toOptionalNumber(record.days),
    reason: toOptionalString(record.reason),
    status: (toOptionalString(record.status) as Leave["status"]) ?? "pending",
    created_at: toOptionalString(record.created_at),
    updated_at: toOptionalString(record.updated_at),
    approvals: Array.isArray(record.approvals) ? (record.approvals as Leave["approvals"]) : undefined,
    attachments: Array.isArray(record.attachments) ? (record.attachments as Leave["attachments"]) : undefined,
  };
}

export function normalizeLeaveBalance(
  raw: ApiLeaveBalance | LeaveBalance | Record<string, unknown>,
): LeaveBalance {
  const record = asRecord(raw);
  const totalDays = toOptionalNumber(record.total_days) ?? 0;
  const usedDays = toOptionalNumber(record.used_days) ?? 0;
  return {
    id: toRequiredString(record.id),
    employeeId: toRequiredString(record.employeeId ?? record.employee),
    employeeName: toOptionalString(record.employeeName ?? record.employee_name),
    leave_type: toRequiredString(record.leave_type),
    total_days: totalDays,
    used_days: usedDays,
    remainingDays: toOptionalNumber(record.remainingDays) ?? totalDays - usedDays,
  };
}

export function normalizeShift(raw: ApiShift | Shift | Record<string, unknown>): Shift {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    name: toRequiredString(record.name),
    start_time: toRequiredString(record.start_time),
    end_time: toRequiredString(record.end_time),
    grace_period_minutes: toOptionalNumber(record.grace_period_minutes),
    description: toOptionalString(record.description),
    created_at: toOptionalString(record.created_at),
  };
}

export function normalizeEmployeeShift(
  raw: ApiEmployeeShift | EmployeeShift | Record<string, unknown>,
): EmployeeShift {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    employeeId: toRequiredString(record.employeeId ?? record.employee),
    employeeCode: toOptionalString(record.employeeCode ?? record.employee_code),
    employeeName: toOptionalString(record.employeeName ?? record.employee_name),
    shift: toRequiredString(record.shift),
    shiftName: toOptionalString(record.shiftName ?? record.shift_name),
    start_date: toRequiredString(record.start_date),
    end_date: toOptionalString(record.end_date),
    created_at: toOptionalString(record.created_at),
  };
}
