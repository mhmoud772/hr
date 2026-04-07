import type { Attendance } from "@/types/api";
import type { ApiAttendanceRequest } from "@/types/contracts";

export type AttendancePayload = Pick<
  ApiAttendanceRequest,
  "date" | "status" | "check_in" | "check_out" | "employee"
>;

/**
 * Maps a partial Attendance object (camelCase) to an API-friendly snake_case object.
 */
export function buildAttendancePayload(data: Partial<Attendance>): AttendancePayload {
  return {
    date: data.date || "",
    status: data.status || "present",
    check_in: data.checkIn || null,
    check_out: data.checkOut || null,
    employee: data.employeeId ? parseInt(String(data.employeeId), 10) : undefined,
  };
}

/**
 * Maps an Attendance record for the PDF report generator.
 */
export function mapAttendanceToReport(record: Attendance) {
  return {
    employeeId: record.employeeId,
    name: record.employeeName || record.employeeId,
    date: record.date,
    checkIn: record.checkIn || "-",
    checkOut: record.checkOut || "-",
    workHours: record.workHours || "-",
    status: record.status,
  };
}
