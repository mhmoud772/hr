import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCandidate, deleteCandidate, getCandidates, updateCandidate } from "@/features/recruitment/api/recruitment";
import type { RecruitmentQuery } from "@/features/recruitment/api/recruitment";

export const useRecruitmentQuery = (params: RecruitmentQuery = {}) =>
  useQuery({
    queryKey: ["recruitment", params],
    queryFn: () => getCandidates(params),
  });

export const useCreateCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCandidate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recruitment"] }),
  });
};

export const useUpdateCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCandidate>[1] }) =>
      updateCandidate(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recruitment"] }),
  });
};

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recruitment"] }),
  });
};
