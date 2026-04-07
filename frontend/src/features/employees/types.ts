import { ID, ISODate } from "../../types/api";

export type EmployeeStatus = "active" | "leave" | "inactive";
export type ContractStatus = "permanent" | "contract" | "probation" | "terminated";

export interface Employee {
  id: ID;
  employeeCode?: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  departmentId?: ID | null;
  jobTitle?: string;
  jobTitleId?: ID | null;
  hireDate?: ISODate;
  status: EmployeeStatus;
  nationality?: string;
  birthDate?: ISODate;
  address?: string;
  salary?: number;
  contractStatus?: ContractStatus;
  avatar?: string;
  avatarUrl?: string;
}

export interface EmployeeDocument {
  id: ID;
  employeeId: ID;
  title: string;
  doc_type?: string;
  notes?: string;
  file?: string;
  fileUrl?: string;
  filename?: string;
  uploaded_by?: ID;
  uploaded_at?: ISODate;
}
