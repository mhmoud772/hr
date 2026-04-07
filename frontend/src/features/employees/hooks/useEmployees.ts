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
import type { Employee } from "@/types/api";
import type { EmployeesQuery, EmployeesResponse } from "@/features/employees/api/employees";

type QueryOptions = {
  enabled?: boolean;
};

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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["employees"] });
      const previousQueries = queryClient.getQueriesData<EmployeesResponse>({ queryKey: ["employees"] });

      queryClient.setQueriesData<EmployeesResponse>({ queryKey: ["employees"] }, (old) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          results: old.results.map((item: Employee) => item.id === id ? { ...item, ...data } : item),
        };
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["employees"] });
      const previousQueries = queryClient.getQueriesData<EmployeesResponse>({ queryKey: ["employees"] });

      queryClient.setQueriesData<EmployeesResponse>({ queryKey: ["employees"] }, (old) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          results: old.results.filter((item: Employee) => item.id !== deletedId),
          count: Math.max(0, (old.count || 0) - 1),
        };
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
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
    mutationFn: (params?: EmployeesQuery) => exportEmployeesCSV(params),
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

export const useEmployeeMeQuery = (options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["employee-me"],
    queryFn: getEmployeeMe,
    enabled: options.enabled ?? true,
  });

