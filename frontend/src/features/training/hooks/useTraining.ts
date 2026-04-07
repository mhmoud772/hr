import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTrainingRecord, deleteTrainingRecord, getTrainingRecords, updateTrainingRecord } from "@/features/training/api/training";
import type { TrainingQuery } from "@/features/training/api/training";

type QueryOptions = {
  enabled?: boolean;
};

export const useTrainingQuery = (params: TrainingQuery = {}, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["training", params],
    queryFn: () => getTrainingRecords(params),
    enabled: options.enabled ?? true,
  });

export const useCreateTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTrainingRecord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training"] }),
  });
};

export const useUpdateTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTrainingRecord>[1] }) =>
      updateTrainingRecord(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training"] }),
  });
};

export const useDeleteTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrainingRecord(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training"] }),
  });
};
