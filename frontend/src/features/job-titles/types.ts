import type { ID } from "@/types/api";

export interface JobTitle {
  id: ID;
  name: string;
  nameEn?: string;
  department?: string;
  departmentId?: ID | null;
  level: string;
  minSalary?: number;
  maxSalary?: number;
  employee_count?: number;
  description?: string;
}
