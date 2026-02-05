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
import type { AttendanceQuery } from "@/features/attendance/api/attendance";

export const useAttendanceQuery = (params: AttendanceQuery = {}) =>
  useQuery({
    queryKey: ["attendance", params],
    queryFn: () => getAttendance(params),
  });

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttendance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAttendance>[1] }) =>
      updateAttendance(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttendance(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
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

