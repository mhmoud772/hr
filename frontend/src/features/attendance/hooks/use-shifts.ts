import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShifts, createShift, updateShift, deleteShift, getEmployeeShifts, createEmployeeShift, updateEmployeeShift, deleteEmployeeShift } from "../api/shifts";
import { useToast } from "@/shared/hooks/use-toast";
import type { Shift, EmployeeShift } from "@/types/api";

export const useShifts = () => {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: getShifts,
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Shift>) => createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: "Success", description: "Shift created successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Shift> }) => updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: "Success", description: "Shift updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: "Success", description: "Shift deleted successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
  return useMutation({
    mutationFn: (data: Partial<EmployeeShift>) => createEmployeeShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-shifts"] });
      toast({ title: "Success", description: "Employee assigned to shift." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
};

export const useDeleteEmployeeShift = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => deleteEmployeeShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-shifts"] });
      toast({ title: "Success", description: "Shift assignment removed." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
};
