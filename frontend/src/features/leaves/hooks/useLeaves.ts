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

export const useLeavesQuery = (params: LeavesQuery = {}) =>
  useQuery({
    queryKey: ["leaves", params],
    queryFn: () => getLeaves(params),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves"] }),
  });
};

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => approveLeave(id, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves"] }),
  });
};

export const useRejectLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => rejectLeave(id, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves"] }),
  });
};

export const useUploadLeaveAttachment = () =>
  useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadLeaveAttachment(id, file),
  });

export const useLeaveBalancesQuery = (employee?: string) =>
  useQuery({
    queryKey: ["leave-balances", employee],
    queryFn: () => getLeaveBalances(employee),
  });

export const useLeavesReportQuery = (params: { start?: string; end?: string }) =>
  useQuery({
    queryKey: ["leave-report", params],
    queryFn: () => getLeavesReport(params),
  });

