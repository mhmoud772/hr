import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAsset, deleteAsset, getAssets, updateAsset } from "@/features/assets/api/assets";
import type { AssetsQuery } from "@/features/assets/api/assets";

type QueryOptions = {
  enabled?: boolean;
};

export const useAssetsQuery = (params: AssetsQuery = {}, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["assets", params],
    queryFn: () => getAssets(params),
    enabled: options.enabled ?? true,
  });

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAsset>[1] }) =>
      updateAsset(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });
};
