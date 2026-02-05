import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDevice, deleteDevice, getDevices, updateDevice } from "@/features/devices/api/devices";
import type { Device } from "@/types/api";

export const useDevicesQuery = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ["devices", params],
    queryFn: () => getDevices(params),
  });

export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDevice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Device }) => updateDevice(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDevice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
};
