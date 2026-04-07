import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveDeviceCommandApproval,
  bulkDeviceCommand,
  createDeviceGroup,
  createDevicePolicy,
  createDevice,
  deleteDevice,
  discoverDevice,
  getDeviceCommandApprovals,
  getDeviceCommandCenterCatalog,
  getDeviceCommandCenterDashboard,
  getDeviceBackups,
  getDeviceFirmwareRollouts,
  getDeviceGroups,
  getDeviceHealthReport,
  getDevicePolicies,
  getDeviceTemplates,
  getDevices,
  startDeviceFirmwareRollout,
  queueDeviceCommandCenter,
  restoreDeviceBackup,
  rejectDeviceCommandApproval,
  testDeviceConnection,
  rebootDevice,
  syncDevice,
  syncDeviceTime,
  pullDeviceLogs,
  pushEmployeeToDevice,
  updateDevice,
} from "@/features/devices/api/devices";
import type { DevicesResponse } from "@/features/devices/api/devices";
import type { Device } from "@/types/api";

type QueryOptions = {
  enabled?: boolean;
};

export const useDevicesQuery = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ["devices", params],
    queryFn: () => getDevices(params),
    enabled: true,
  });

// مباشر للتحديث الدوري (مراقبة الحالة)
export const useDevicesLiveQuery = (
  params: Record<string, unknown> = {},
  refetchInterval = 10000,
) =>
  useQuery({
    queryKey: ["devices", "live", params],
    queryFn: () => getDevices({ ...params, live: true }),
    refetchInterval,
    refetchOnWindowFocus: true,
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["devices"] });
      const previousQueries = queryClient.getQueriesData<DevicesResponse>({ queryKey: ["devices"] });
      queryClient.setQueriesData<DevicesResponse>({ queryKey: ["devices"] }, (old) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          results: old.results.map((device: Device) =>
            device.id === id ? { ...device, ...data } : device,
          ),
        };
      });
      return { previousQueries };
    },
    onError: (err, newDevice, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDevice(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["devices"] });
      const previousQueries = queryClient.getQueriesData<DevicesResponse>({ queryKey: ["devices"] });
      queryClient.setQueriesData<DevicesResponse>({ queryKey: ["devices"] }, (old) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          count: Math.max(0, old.count - 1),
          results: old.results.filter((device: Device) => device.id !== id),
        };
      });
      return { previousQueries };
    },
    onError: (err, id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

export const useSyncDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => syncDevice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
};

export const useSyncDeviceTime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => syncDeviceTime(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
};

export const useRebootDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rebootDevice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
};

export const usePullDeviceLogs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, limit }: { id: string; limit?: number }) => pullDeviceLogs(id, { limit }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
};

export const usePushEmployeeToDevice = () => {
  return useMutation({
    mutationFn: ({ id, employeeCode }: { id: string; employeeCode: string }) =>
      pushEmployeeToDevice(id, employeeCode),
  });
};

export const useDiscoverDevice = () => {
  return useMutation({
    mutationFn: ({
      ipAddress,
      port,
      commKey,
    }: {
      ipAddress: string;
      port?: number;
      commKey?: string;
    }) => discoverDevice({ ipAddress, port, commKey }),
  });
};

export const useTestDeviceConnection = () => {
  return useMutation({
    mutationFn: ({
      ipAddress,
      port,
      commKey,
    }: {
      ipAddress: string;
      port?: number;
      commKey?: string;
    }) => testDeviceConnection({ ipAddress, port, commKey }),
  });
};

export const useBulkDeviceCommand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceIds,
      command,
      reason,
      limit,
      employeeCode,
    }: {
      deviceIds: string[];
      command:
        | "sync"
        | "sync_time"
        | "reboot"
        | "pull_logs"
        | "push_employee"
        | "disable_employee"
        | "enable_employee"
        | "delete_employee"
        | "clear_logs"
        | "apply_policy"
        | "distribute_template"
        | "firmware_rollout";
      reason?: string;
      limit?: number;
      employeeCode?: string;
    }) => bulkDeviceCommand({ deviceIds, command, reason, limit, employeeCode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });
};

export const useDeviceHealthReportQuery = (days = 30) =>
  useQuery({
    queryKey: ["devices", "health-report", days],
    queryFn: () => getDeviceHealthReport({ days }),
  });

export const useDeviceGroupsQuery = (options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["devices", "groups"],
    queryFn: getDeviceGroups,
    enabled: options.enabled ?? true,
  });

export const useCreateDeviceGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeviceGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices", "groups"] }),
  });
};

export const useDevicePoliciesQuery = (options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["devices", "policies"],
    queryFn: getDevicePolicies,
    enabled: options.enabled ?? true,
  });

export const useCreateDevicePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDevicePolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices", "policies"] }),
  });
};

export const useDeviceCommandApprovalsQuery = (
  params?: { status?: string },
  options: QueryOptions = {},
) =>
  useQuery({
    queryKey: ["devices", "approvals", params],
    queryFn: () => getDeviceCommandApprovals(params),
    refetchInterval: 15000,
    enabled: options.enabled ?? true,
  });

export const useApproveDeviceCommandApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, executeNow }: { id: string; executeNow?: boolean }) =>
      approveDeviceCommandApproval(id, executeNow ?? true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices", "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["devices", "command-center", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

export const useRejectDeviceCommandApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectDeviceCommandApproval(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices", "approvals"] }),
  });
};

export const useDeviceCommandCenterCatalogQuery = (options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["devices", "command-center", "catalog"],
    queryFn: getDeviceCommandCenterCatalog,
    staleTime: 60_000,
    enabled: options.enabled ?? true,
  });

export const useQueueDeviceCommandCenter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: queueDeviceCommandCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices", "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["devices", "command-center", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

export const useDeviceCommandCenterDashboardQuery = (options: QueryOptions = {}) =>
  useQuery({
    queryKey: ["devices", "command-center", "dashboard"],
    queryFn: getDeviceCommandCenterDashboard,
    refetchInterval: 15000,
    enabled: options.enabled ?? true,
  });

export const useDeviceTemplatesQuery = (
  params?: Record<string, unknown>,
  options: QueryOptions = {},
) =>
  useQuery({
    queryKey: ["devices", "templates", params],
    queryFn: () => getDeviceTemplates(params),
    staleTime: 60_000,
    enabled: options.enabled ?? true,
  });

export const useDeviceFirmwareRolloutsQuery = (
  params?: Record<string, unknown>,
  options: QueryOptions = {},
) =>
  useQuery({
    queryKey: ["devices", "firmware-rollouts", params],
    queryFn: () => getDeviceFirmwareRollouts(params),
    refetchInterval: 30_000,
    enabled: options.enabled ?? true,
  });

export const useStartDeviceFirmwareRollout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startDeviceFirmwareRollout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices", "firmware-rollouts"] });
      queryClient.invalidateQueries({ queryKey: ["devices", "command-center", "dashboard"] });
    },
  });
};

export const useDeviceBackupsQuery = (
  params?: Record<string, unknown>,
  options: QueryOptions = {},
) =>
  useQuery({
    queryKey: ["devices", "backups", params],
    queryFn: () => getDeviceBackups(params),
    staleTime: 60_000,
    enabled: options.enabled ?? true,
  });

export const useRestoreDeviceBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreDeviceBackup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices", "backups"] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices", "command-center", "dashboard"] });
    },
  });
};
