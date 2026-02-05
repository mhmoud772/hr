import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "@/features/structure/api/departments";
import type { DepartmentsQuery } from "@/features/structure/api/departments";

export function useDepartmentsQuery(params: DepartmentsQuery = {}) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: () => getDepartments(params),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateDepartment>[1] }) =>
      updateDepartment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}
