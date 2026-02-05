import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createJobTitle, deleteJobTitle, getJobTitles, updateJobTitle } from "@/features/job-titles/api/job-titles";
import type { JobTitlesQuery } from "@/features/job-titles/api/job-titles";

export function useJobTitlesQuery(params: JobTitlesQuery) {
  return useQuery({
    queryKey: ["job-titles", params],
    queryFn: () => getJobTitles(params),
  });
}

export function useCreateJobTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJobTitle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-titles"] }),
  });
}

export function useUpdateJobTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateJobTitle>[1] }) =>
      updateJobTitle(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-titles"] }),
  });
}

export function useDeleteJobTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteJobTitle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-titles"] }),
  });
}
