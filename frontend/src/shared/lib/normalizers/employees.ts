import type { ApiDepartment, ApiEmployee, ApiJobTitle } from "@/types/contracts";
import type { Employee } from "@/features/employees/types";
import type { Department } from "@/features/structure/types";
import type { JobTitle } from "@/features/job-titles/types";
import {
  asRecord,
  toOptionalId,
  toOptionalNumber,
  toOptionalReferenceId,
  toOptionalString,
  toRequiredString,
} from "./base";

export function normalizeEmployee(raw: ApiEmployee | Employee | Record<string, unknown>): Employee {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    employeeCode: toOptionalString(record.employeeCode ?? record.employee_code),
    name: toRequiredString(record.name),
    email: toRequiredString(record.email),
    phone: toOptionalString(record.phone),
    department: toOptionalString(record.department_name ?? record.department),
    departmentId:
      toOptionalId(record.departmentId) ??
      toOptionalReferenceId(record.department) ??
      null,
    jobTitle: toOptionalString(record.jobTitle ?? record.job_title_name ?? record.job_title),
    jobTitleId:
      toOptionalId(record.jobTitleId) ??
      toOptionalReferenceId(record.job_title) ??
      null,
    hireDate: toOptionalString(record.hireDate ?? record.hire_date),
    status: (toOptionalString(record.status) as Employee["status"]) ?? "active",
    nationality: toOptionalString(record.nationality),
    birthDate: toOptionalString(record.birthDate ?? record.birth_date),
    address: toOptionalString(record.address),
    salary: toOptionalNumber(record.salary),
    contractStatus: toOptionalString(
      record.contractStatus ?? record.contract_status,
    ) as Employee["contractStatus"] | undefined,
    avatar: toOptionalString(record.avatar),
    avatarUrl: toOptionalString(record.avatarUrl ?? record.avatar),
  };
}

export function normalizeDepartment(raw: ApiDepartment | Department | Record<string, unknown>): Department {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    name: toRequiredString(record.name),
    parentId: toOptionalId(record.parentId ?? record.parent) ?? null,
    managerId: toOptionalId(record.managerId ?? record.manager) ?? null,
    managerName: toOptionalString(record.managerName ?? record.manager_name),
    employeeCount: toOptionalNumber(record.employeeCount ?? record.employee_count),
    sortOrder: toOptionalNumber(record.sortOrder ?? record.sort_order),
  };
}

export function normalizeJobTitle(raw: ApiJobTitle | JobTitle | Record<string, unknown>): JobTitle {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    name: toRequiredString(record.name),
    nameEn: toOptionalString(record.nameEn ?? record.name_en),
    department: toOptionalString(record.departmentName ?? record.department_name ?? record.department),
    departmentId:
      toOptionalId(record.departmentId) ??
      toOptionalReferenceId(record.department) ??
      null,
    level: (toRequiredString(record.level) as JobTitle["level"]),
    minSalary: toOptionalNumber(record.minSalary ?? record.min_salary),
    maxSalary: toOptionalNumber(record.maxSalary ?? record.max_salary),
    employee_count: toOptionalNumber(record.employee_count),
    description: toOptionalString(record.description),
  };
}
