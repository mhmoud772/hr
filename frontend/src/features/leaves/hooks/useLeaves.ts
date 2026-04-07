import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveLeave,
  createLeave,
  deleteLeave,
  getLeaveBalances,
  getLeaves,
  getLeavesReport,
  rejectLeave,
  updateLeave,
  uploadLeaveAttachment,
} from "@/features/leaves/api/leaves";
import type { LeavesQuery } from "@/features/leaves/api/leaves";

type QueryOptions = {
  enabled?: boolean;
};

export const useLeavesQuery = (params: LeavesQuery = {}, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["leaves", params],
    queryFn: () => getLeaves(params),
    enabled: options.enabled ?? true,
  });

export const useCreateLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLeave,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves"] }),
  });
};

export const useUpdateLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateLeave>[1] }) =>
      updateLeave(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves"] }),
  });
};

export const useDeleteLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLeave(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["leaves"] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["leaves"] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueriesData({ queryKey: ["leaves"] }, (old: any) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          results: old.results.filter((item: any) => item.id !== deletedId),
          count: Math.max(0, (old.count || 0) - 1)
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
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
};

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => approveLeave(id, comment),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["leaves"] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["leaves"] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueriesData({ queryKey: ["leaves"] }, (old: any) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          results: old.results.map((item: any) => item.id === id ? { ...item, status: "approved" } : item),
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
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
};

export const useRejectLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => rejectLeave(id, comment),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["leaves"] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["leaves"] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueriesData({ queryKey: ["leaves"] }, (old: any) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          results: old.results.map((item: any) => item.id === id ? { ...item, status: "rejected" } : item),
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
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
};

export const useUploadLeaveAttachment = () =>
  useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadLeaveAttachment(id, file),
  });

export const useLeaveBalancesQuery = (employee?: string, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["leave-balances", employee],
    queryFn: () => getLeaveBalances(employee),
    enabled: options.enabled ?? true,
  });

export const useLeavesReportQuery = (params: { start?: string; end?: string }) =>
  useQuery({
    queryKey: ["leave-report", params],
    queryFn: () => getLeavesReport(params),
  });

