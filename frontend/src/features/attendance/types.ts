import type { ID, ISODate } from "../../types/api";

export type AttendanceStatus = "present" | "absent" | "late";

export interface Attendance {
  id: ID;
  employeeId: ID;
  employeeCode?: ID;
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

export interface Shift {
  id: ID;
  name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes?: number;
  description?: string;
  created_at?: ISODate;
}

export interface EmployeeShift {
  id: ID;
  employeeId: ID;
  employeeCode?: string;
  employeeName?: string;
  shift: ID;
  shiftName?: string;
  start_date: ISODate;
  end_date?: ISODate;
  created_at?: ISODate;
}

