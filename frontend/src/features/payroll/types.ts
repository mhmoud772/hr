import type { ID, ISODate } from "@/types/api";

export interface PayrollRecord {
  id: ID;
  employeeId: ID;
  employeeCode?: ID;
  employeeName?: string;
  period_start: ISODate;
  period_end: ISODate;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: "draft" | "approved" | "paid";
  created_at?: ISODate;
}
