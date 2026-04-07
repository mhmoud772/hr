import type { ID } from "@/types/api";

export interface Department {
  id: ID;
  name: string;
  parentId?: ID | null;
  managerId?: ID | null;
  managerName?: string;
  employeeCount?: number;
  sortOrder?: number;
}
