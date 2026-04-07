import type { ID, ISODate } from "@/types/api";

export interface PerformanceReview {
  id: ID;
  employeeId: ID;
  employeeCode?: ID;
  employeeName?: string;
  period: string;
  rating: number;
  reviewer?: ID;
  reviewerName?: string;
  notes?: string;
  created_at?: ISODate;
}
