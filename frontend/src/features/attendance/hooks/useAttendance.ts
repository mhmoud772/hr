import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closeAttendanceDay,
  createAttendance,
  deleteAttendance,
  getAttendance,
  getAttendanceImportHistory,
  getAttendanceSummary,
  importAttendanceLogs,
  updateAttendance,
} from "@/features/attendance/api/attendance";
import type { Attendance, AttendanceQuery } from "@/features/attendance/api/attendance";
import type { AttendanceResponse } from "@/features/attendance/api/attendance";
import { isOfflineSyncError } from "@/shared/lib/api-client";

type QueryOptions = {
  enabled?: boolean;
};

export const useAttendanceQuery = (params: AttendanceQuery = {}, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["attendance", params],
    queryFn: () => getAttendance(params),
    enabled: options.enabled ?? true,
  });

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttendance,
    onMutate: async (newRecord) => {
      await queryClient.cancelQueries({ queryKey: ["attendance"] });
      const previousQueries = queryClient.getQueriesData<AttendanceResponse>({ queryKey: ["attendance"] });

      queryClient.setQueriesData<AttendanceResponse>({ queryKey: ["attendance"] }, (old) => {
        if (!old || !old.results) return old;
        const optimisticRecord = {
          ...(newRecord as Attendance),
          id: `temp-${Date.now()}`,
        };
        return {
          ...old,
          // Optimistically add the new record with a fake ID to the top
          results: [optimisticRecord, ...old.results],
          count: (old.count || 0) + 1,
        };
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      // If it's an offline sync error, we actually want to KEEP the optimistic update!
      // But standard Axios error will be thrown. We can differentiate by checking err.isOfflineSync
      if (context?.previousQueries && !isOfflineSyncError(err)) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: (data, err) => {
      // Don't invalidate if it's queued offline, otherwise it will revert the optimistic update
      // since the GET cache won't have the new item until synced.
      if (!isOfflineSyncError(err)) {
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      }
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAttendance>[1] }) =>
      updateAttendance(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["attendance"] });
      const previousQueries = queryClient.getQueriesData<AttendanceResponse>({ queryKey: ["attendance"] });

      queryClient.setQueriesData<AttendanceResponse>({ queryKey: ["attendance"] }, (old) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          results: old.results.map((item) => item.id === id ? { ...item, ...data } : item),
        };
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries && !isOfflineSyncError(err)) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: (data, err) => {
      if (!isOfflineSyncError(err)) {
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      }
    },
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttendance(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["attendance"] });
      const previousQueries = queryClient.getQueriesData<AttendanceResponse>({ queryKey: ["attendance"] });

      queryClient.setQueriesData<AttendanceResponse>({ queryKey: ["attendance"] }, (old) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          results: old.results.filter((item) => item.id !== deletedId),
          count: Math.max(0, (old.count || 0) - 1),
        };
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries && !isOfflineSyncError(err)) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: (data, err) => {
      if (!isOfflineSyncError(err)) {
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      }
    },
  });
};

export const useAttendanceSummaryQuery = (date?: string) =>
  useQuery({
    queryKey: ["attendance-summary", date],
    queryFn: () => getAttendanceSummary(date),
  });

export const useCloseAttendanceDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => closeAttendanceDay(date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
};

export const useImportAttendanceLogs = () =>
  useMutation({
    mutationFn: (source: string) => importAttendanceLogs(source),
  });

export const useAttendanceImportHistoryQuery = () =>
  useQuery({
    queryKey: ["attendance-import-history"],
    queryFn: getAttendanceImportHistory,
  });

