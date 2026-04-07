import type { ID, ISODate } from "@/types/api";

export interface TrainingRecord {
  id: ID;
  employeeId: ID;
  employeeCode?: ID;
  employeeName?: string;
  title: string;
  provider?: string;
  start_date?: ISODate;
  end_date?: ISODate;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}
