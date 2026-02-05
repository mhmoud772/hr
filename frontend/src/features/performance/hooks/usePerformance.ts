import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPerformanceReview, deletePerformanceReview, getPerformanceReviews, updatePerformanceReview } from "@/features/performance/api/performance";
import type { PerformanceQuery } from "@/features/performance/api/performance";

export const usePerformanceQuery = (params: PerformanceQuery = {}) =>
  useQuery({
    queryKey: ["performance", params],
    queryFn: () => getPerformanceReviews(params),
  });

export const useCreatePerformance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPerformanceReview,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["performance"] }),
  });
};

export const useUpdatePerformance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePerformanceReview>[1] }) =>
      updatePerformanceReview(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["performance"] }),
  });
};

export const useDeletePerformance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePerformanceReview(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["performance"] }),
  });
};
