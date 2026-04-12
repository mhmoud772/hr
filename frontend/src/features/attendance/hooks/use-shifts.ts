import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShifts, createShift, updateShift, deleteShift, getEmployeeShifts, createEmployeeShift, updateEmployeeShift, deleteEmployeeShift } from "../api/shifts";
import { useToast } from "@/shared/hooks/use-toast";
import type { Shift, EmployeeShift } from "@/types/api";
import { useTranslation } from "react-i18next";

export const useShifts = () => {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: getShifts,
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: Partial<Shift>) => createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: t("success"), description: t("shift_added") });
    },
    onError: (err: Error) => {
      toast({ title: t("error"), description: err.message || t("generic_error"), variant: "destructive" });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Shift> }) => updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: t("success"), description: t("shift_updated") });
    },
    onError: (err: Error) => {
      toast({ title: t("error"), description: err.message || t("generic_error"), variant: "destructive" });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: t("success"), description: t("shift_deleted") });
    },
    onError: (err: Error) => {
      toast({ title: t("error"), description: err.message || t("generic_error"), variant: "destructive" });
    },
  });
};

export const useEmployeeShifts = (filters: { employee__employee_code?: string; shift?: string }) => {
  return useQuery({
    queryKey: ["employee-shifts", filters],
    queryFn: () => getEmployeeShifts(filters),
  });
};

export const useCreateEmployeeShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: Partial<EmployeeShift>) => createEmployeeShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-shifts"] });
      toast({ title: t("success"), description: t("shift_assignment_created") });
    },
    onError: (err: Error) => {
      toast({ title: t("error"), description: err.message || t("generic_error"), variant: "destructive" });
    },
  });
};

export const useDeleteEmployeeShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => deleteEmployeeShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-shifts"] });
      toast({ title: t("success"), description: t("shift_assignment_removed") });
    },
    onError: (err: Error) => {
      toast({ title: t("error"), description: err.message || t("generic_error"), variant: "destructive" });
    },
  });
};
