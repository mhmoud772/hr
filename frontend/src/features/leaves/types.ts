import type { ID, ISODate } from "@/types/api";

export type LeaveStatus = "pending" | "approved" | "rejected";

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

export interface LeaveBalance {
  id: ID;
  employeeId: ID;
  employeeName?: string;
  leave_type: string;
  total_days: number;
  used_days: number;
  remainingDays?: number;
}
