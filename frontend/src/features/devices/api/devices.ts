// API methods for biometric devices integration
import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import {
  normalizeDevice,
  normalizeDeviceBackupSnapshot,
  normalizeDeviceCommandApproval,
  normalizeDeviceFirmwareRollout,
  normalizeDeviceGroup,
  normalizeDevicePolicy,
  normalizeDeviceSyncLog,
  normalizeDeviceTemplate,
} from "@/shared/lib/normalizers/devices";
import type {
  ApiDevice,
  ApiDeviceBackupSnapshot,
  ApiDeviceCommandApproval,
  ApiDeviceFirmwareRollout,
  ApiDeviceGroup,
  ApiDevicePolicy,
  ApiDeviceSyncLog,
  ApiDeviceTemplate,
  ApiPaginatedDeviceBackupSnapshotList,
  ApiPaginatedDeviceCommandApprovalList,
  ApiPaginatedDeviceFirmwareRolloutList,
  ApiPaginatedDeviceGroupList,
  ApiPaginatedDeviceList,
  ApiPaginatedDevicePolicyList,
  ApiPaginatedDeviceTemplateList,
  ApiDeviceRequest,
  ApiPatchedDeviceRequest,
  ApiDeviceGroupRequest,
  ApiDevicePolicyRequest,
} from "@/types/contracts";
import type {
  DeviceBackupSnapshot,
  Device,
  DeviceCommandApproval,
  DeviceFirmwareRollout,
  DeviceGroup,
  DevicePolicy,
  DeviceSyncLog,
  DeviceTemplate,
} from "../types";

// Ensure API calls use VITE_API_URL from env.
// Example: const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export type DevicesResponse = { results: Device[]; count: number };
export type DiscoverDevicePayload = {
  ipAddress: string;
  port?: number;
  commKey?: string;
};
export type DiscoverDeviceResponse = {
  status: string;
  serialNumber?: string;
  modelName?: string;
  deviceName?: string;
  firmwareVersion?: string;
  platform?: string;
  existingDeviceId?: string | null;
};
export type TestDeviceConnectionPayload = {
  ipAddress: string;
  port?: number;
  commKey?: string;
};
export type TestDeviceConnectionResponse = {
  status: string;
  reachable: boolean;
  latencyMs?: number;
  serialNumber?: string;
  modelName?: string;
  deviceName?: string;
  firmwareVersion?: string;
  platform?: string;
};
export type BulkDeviceCommandPayload = {
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
};
export type BulkDeviceCommandResponse = {
  status: string;
  command: string;
  requested: number;
  queued: number;
  failed: number;
  results: Array<Record<string, unknown>>;
};
export type DeviceHealthReportResponse = {
  generatedAt: string;
  windowDays: number;
  summary: {
    totalDevices: number;
    onlineDevices: number;
    inactiveDevices: number;
    averageFailureRatePercent: number;
  };
  devices: Array<{
    id: string;
    name: string;
    serialNumber: string;
    status: string;
    lastSync?: string | null;
    lastHeartbeat?: string | null;
    uptimePercent: number;
    failureRatePercent: number;
    failedCommands: number;
    totalCommands: number;
    inactive: boolean;
  }>;
};

export type DeviceCommandCenterCatalogResponse = {
  commands: Array<{ code: string; sensitive: boolean }>;
};

export type DeviceCommandCenterQueuePayload = {
  command: string;
  deviceIds?: string[];
  groupId?: string;
  reason?: string;
  payload?: Record<string, unknown>;
};

export type DeviceCommandCenterQueueResponse = {
  status: string;
  command?: string;
  requested?: number;
  queued?: number;
  failed?: number;
  detail?: string;
  results?: Array<Record<string, unknown>>;
  approval?: DeviceCommandApproval;
};

export type DeviceCommandCenterDashboardResponse = {
  generatedAt: string;
  summary: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    primaryEnrollmentDevices: number;
    groups: number;
    policies: number;
    pendingApprovals: number;
    runningRollouts: number;
    activeTemplates: number;
    templateDistributionsLast7Days: number;
    commandsLast7Days: number;
    failedCommandsLast7Days: number;
  };
  highRiskDevices: Array<{
    id: string;
    name: string;
    serialNumber: string;
    status: string;
    failedCommands30Days: number;
    totalCommands30Days: number;
    failureRatePercent: number;
  }>;
  recentCommands: DeviceSyncLog[];
  pendingApprovals: DeviceCommandApproval[];
};

export type PagedList<T> = { results: T[]; count: number };

export const getDevices = async (params: Record<string, unknown> = {}) => {
  const res = await apiClient.get("/devices/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedDeviceList | ApiDevice[],
    normalizeDevice,
  ) as DevicesResponse;
};

export const syncDevice = async (deviceId: string) => {
  const res = await apiClient.post(`/devices/${deviceId}/sync/`);
  return res.data;
};

export const syncDeviceTime = async (deviceId: string) => {
  const res = await apiClient.post(`/devices/${deviceId}/sync-time/`);
  return res.data;
};

export const rebootDevice = async (deviceId: string) => {
  const res = await apiClient.post(`/devices/${deviceId}/reboot/`);
  return res.data;
};

export const pullDeviceLogs = async (deviceId: string, payload?: { limit?: number }) => {
  const res = await apiClient.post(`/devices/${deviceId}/pull-logs/`, payload);
  return res.data;
};

export const pushEmployeeToDevice = async (deviceId: string, employeeCode: string) => {
  const res = await apiClient.post(`/devices/${deviceId}/push-employee/`, { employeeCode });
  return res.data;
};

export const getDeviceSyncLogs = async (deviceId: string) => {
  const res = await apiClient.get(`/devices/${deviceId}/sync_logs/`);
  return (Array.isArray(res.data) ? res.data : []).map((item) =>
    normalizeDeviceSyncLog(item as ApiDeviceSyncLog),
  );
};

export const discoverDevice = async (payload: DiscoverDevicePayload) => {
  const res = await apiClient.post("/devices/discover/", payload);
  return res.data as DiscoverDeviceResponse;
};

export const testDeviceConnection = async (payload: TestDeviceConnectionPayload) => {
  const res = await apiClient.post("/devices/test-connection/", payload);
  return res.data as TestDeviceConnectionResponse;
};

export const bulkDeviceCommand = async (payload: BulkDeviceCommandPayload) => {
  const res = await apiClient.post("/devices/bulk-command/", payload);
  return res.data as BulkDeviceCommandResponse;
};

export const getDeviceHealthReport = async (params?: { days?: number }) => {
  const res = await apiClient.get("/devices/health-report/", { params });
  return res.data as DeviceHealthReportResponse;
};

export const getDeviceGroups = async () => {
  const res = await apiClient.get("/device-groups/");
  return normalizePaginatedList(
    res.data as ApiPaginatedDeviceGroupList | ApiDeviceGroup[],
    normalizeDeviceGroup,
  ) as PagedList<DeviceGroup>;
};

export const createDeviceGroup = async (payload: ApiDeviceGroupRequest) => {
  const res = await apiClient.post("/device-groups/", payload);
  return normalizeDeviceGroup(res.data as ApiDeviceGroup);
};

export const getDevicePolicies = async () => {
  const res = await apiClient.get("/device-policies/");
  return normalizePaginatedList(
    res.data as ApiPaginatedDevicePolicyList | ApiDevicePolicy[],
    normalizeDevicePolicy,
  ) as PagedList<DevicePolicy>;
};

export const createDevicePolicy = async (
  payload: ApiDevicePolicyRequest,
) => {
  const res = await apiClient.post("/device-policies/", payload);
  return normalizeDevicePolicy(res.data as ApiDevicePolicy);
};

export const getDeviceCommandApprovals = async (params?: { status?: string }) => {
  const res = await apiClient.get("/device-command-approvals/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedDeviceCommandApprovalList | ApiDeviceCommandApproval[],
    normalizeDeviceCommandApproval,
  ) as PagedList<DeviceCommandApproval>;
};

export const approveDeviceCommandApproval = async (id: string, executeNow = true) => {
  const res = await apiClient.post(`/device-command-approvals/${id}/approve/`, {
    executeNow,
  });
  return res.data as {
    status: string;
    approval: DeviceCommandApproval;
    execution?: Record<string, unknown>;
  };
};

export const rejectDeviceCommandApproval = async (id: string) => {
  const res = await apiClient.post(`/device-command-approvals/${id}/reject/`);
  return res.data as {
    status: string;
    approval: DeviceCommandApproval;
  };
};

export const getDeviceCommandCenterCatalog = async () => {
  const res = await apiClient.get("/device-command-center/catalog/");
  return res.data as DeviceCommandCenterCatalogResponse;
};

export const queueDeviceCommandCenter = async (payload: DeviceCommandCenterQueuePayload) => {
  const res = await apiClient.post("/device-command-center/queue/", payload);
  return res.data as DeviceCommandCenterQueueResponse;
};

export const getDeviceCommandCenterDashboard = async () => {
  const res = await apiClient.get("/device-command-center/dashboard/");
  return res.data as DeviceCommandCenterDashboardResponse;
};

export const getDeviceTemplates = async (params?: Record<string, unknown>) => {
  const res = await apiClient.get("/device-templates/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedDeviceTemplateList | ApiDeviceTemplate[],
    normalizeDeviceTemplate,
  ) as PagedList<DeviceTemplate>;
};

export const getDeviceFirmwareRollouts = async (params?: Record<string, unknown>) => {
  const res = await apiClient.get("/device-firmware-rollouts/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedDeviceFirmwareRolloutList | ApiDeviceFirmwareRollout[],
    normalizeDeviceFirmwareRollout,
  ) as PagedList<DeviceFirmwareRollout>;
};

export const startDeviceFirmwareRollout = async (id: string) => {
  const res = await apiClient.post(`/device-firmware-rollouts/${id}/start/`);
  return res.data as {
    status: string;
    rolloutId: string;
    targetVersion: string;
    requested: number;
    queued: number;
    failed: number;
    results: Array<Record<string, unknown>>;
  };
};

export const getDeviceBackups = async (params?: Record<string, unknown>) => {
  const res = await apiClient.get("/device-backups/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedDeviceBackupSnapshotList | ApiDeviceBackupSnapshot[],
    normalizeDeviceBackupSnapshot,
  ) as PagedList<DeviceBackupSnapshot>;
};

export const restoreDeviceBackup = async (id: string) => {
  const res = await apiClient.post(`/device-backups/${id}/restore/`);
  return res.data as {
    status: string;
    snapshotId: string;
    restoredDevices: number;
  };
};

export const createDevice = async (data: ApiDeviceRequest) => {
  const res = await apiClient.post("/devices/", data);
  return normalizeDevice(res.data as ApiDevice);
};

export const updateDevice = async (id: string, data: ApiPatchedDeviceRequest) => {
  const res = await apiClient.patch(`/devices/${id}/`, data);
  return normalizeDevice(res.data as ApiDevice);
};

export const deleteDevice = async (id: string) => {
  const res = await apiClient.delete(`/devices/${id}/`);
  return res.data;
};

