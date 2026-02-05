import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployee,
  createEmployeeWithFile,
  deleteEmployee,
  exportEmployeesCSV,
  getEmployees,
  getEmployeeSummary,
  importEmployeesCSV,
  updateEmployee,
  updateEmployeeWithFile,
  getEmployeeMe,
} from "@/features/employees/api/employees";
import type { EmployeesQuery } from "@/features/employees/api/employees";

export const useEmployeesQuery = (params: EmployeesQuery = {}) =>
  useQuery({
    queryKey: ["employees", params],
    queryFn: () => getEmployees(params),
  });

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateEmployee>[1] }) =>
      updateEmployee(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
};

export const useCreateEmployeeWithFile = () =>
  useMutation({
    mutationFn: createEmployeeWithFile,
  });

export const useUpdateEmployeeWithFile = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => updateEmployeeWithFile(id, data),
  });

export const useExportEmployeesCSV = () =>
  useMutation({
    mutationFn: exportEmployeesCSV,
  });

export const useImportEmployeesCSV = () =>
  useMutation({
    mutationFn: (file: File) => importEmployeesCSV(file),
  });

export const useEmployeeSummaryQuery = (id?: string) =>
  useQuery({
    queryKey: ["employee-summary", id],
    queryFn: () => (id ? getEmployeeSummary(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });

export const useEmployeeMeQuery = () =>
  useQuery({
    queryKey: ["employee-me"],
    queryFn: getEmployeeMe,
  });

