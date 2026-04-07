import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPayroll, deletePayroll, getPayroll, updatePayroll } from "@/features/payroll/api/payroll";
import type { PayrollQuery } from "@/features/payroll/api/payroll";

type QueryOptions = {
  enabled?: boolean;
};

export const usePayrollQuery = (params: PayrollQuery = {}, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["payroll", params],
    queryFn: () => getPayroll(params),
    enabled: options.enabled ?? true,
  });

export const useCreatePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayroll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
  });
};

export const useUpdatePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePayroll>[1] }) =>
      updatePayroll(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
  });
};

export const useDeletePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePayroll(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
  });
};
