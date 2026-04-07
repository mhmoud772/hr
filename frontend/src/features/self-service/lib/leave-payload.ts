import type { Leave } from "@/types/api";
import type { ApiLeaveRequest } from "@/types/contracts";

/**
 * Maps the UI/form Leave model to the API contract shape.
 * This removes all `as any` casts from the component layer.
 */
export interface CreateLeavePayload {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  employee: number;
}

export function buildLeavePayload(request: Partial<Leave>): ApiLeaveRequest {
  if (!request.leaveType) {
    throw new Error("leave_type is required");
  }
  if (!request.startDate) {
    throw new Error("start_date is required");
  }
  if (!request.endDate) {
    throw new Error("end_date is required");
  }
  if (!request.employeeId) {
    throw new Error("employeeId is required");
  }

  return {
    leave_type: request.leaveType,
    start_date: request.startDate,
    end_date: request.endDate,
    reason: request.reason || "",
    employee: parseInt(request.employeeId, 10),
  } as ApiLeaveRequest;
}
