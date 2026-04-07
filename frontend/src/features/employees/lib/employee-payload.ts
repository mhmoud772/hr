import type { Employee } from "@/types/api";
import type { ApiEmployeeRequest, ApiPatchedEmployeeRequest } from "@/types/contracts";

type EmployeePayload = Partial<ApiEmployeeRequest>;
type PatchedEmployeePayload = Partial<ApiPatchedEmployeeRequest>;

/**
 * Maps a partial Employee object (camelCase) to an ApiEmployeeRequest (snake_case)
 * for creation or full updates.
 */
export function buildEmployeePayload(input: Partial<Employee>): ApiEmployeeRequest {
  const payload: EmployeePayload = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    status: input.status,
    nationality: input.nationality,
    address: input.address,
    salary: input.salary !== undefined ? String(input.salary) : undefined,
    contract_status: input.contractStatus,
    department: input.departmentId ? parseInt(String(input.departmentId), 10) : undefined,
    job_title: input.jobTitleId ? parseInt(String(input.jobTitleId), 10) : undefined,
  };

  if (input.employeeCode) payload.employee_code = input.employeeCode;
  if (input.hireDate) payload.hire_date = input.hireDate;
  if (input.birthDate) payload.birth_date = input.birthDate;

  return payload as ApiEmployeeRequest;
}

/**
 * Maps a partial Employee object (camelCase) to an ApiPatchedEmployeeRequest (snake_case)
 * for incremental updates (PATCH).
 */
export function buildPatchedEmployeePayload(input: Partial<Employee>): ApiPatchedEmployeeRequest {
  const payload: PatchedEmployeePayload = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.email !== undefined) payload.email = input.email;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.status !== undefined) payload.status = input.status;
  if (input.nationality !== undefined) payload.nationality = input.nationality;
  if (input.address !== undefined) payload.address = input.address;
  if (input.salary !== undefined) payload.salary = String(input.salary);
  if (input.contractStatus !== undefined) payload.contract_status = input.contractStatus;
  if (input.departmentId !== undefined) payload.department = input.departmentId ? parseInt(String(input.departmentId), 10) : null;
  if (input.jobTitleId !== undefined) payload.job_title = input.jobTitleId ? parseInt(String(input.jobTitleId), 10) : null;
  
  if (input.employeeCode !== undefined) payload.employee_code = input.employeeCode;
  if (input.hireDate !== undefined) payload.hire_date = input.hireDate;
  if (input.birthDate !== undefined) payload.birth_date = input.birthDate;

  return payload as ApiPatchedEmployeeRequest;
}
