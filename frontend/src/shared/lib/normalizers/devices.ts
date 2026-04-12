import type {
  ApiDevice,
  ApiDeviceBackupSnapshot,
  ApiDeviceCommandApproval,
  ApiDeviceFirmwareRollout,
  ApiDeviceGroup,
  ApiDevicePolicy,
  ApiDeviceSyncLog,
  ApiDeviceTemplate,
} from "@/types/contracts";
import type {
  Device,
  DeviceBackupSnapshot,
  DeviceCommandApproval,
  DeviceFirmwareRollout,
  DeviceGroup,
  DevicePolicy,
  DeviceSyncLog,
  DeviceTemplate,
} from "@/features/devices/types";
import {
  asRecord,
  toOptionalBoolean,
  toOptionalId,
  toOptionalNumber,
  toOptionalRecord,
  toOptionalString,
  toRequiredString,
} from "./base";

export function normalizeDevice(raw: ApiDevice | Device | Record<string, unknown>): Device {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    name: toRequiredString(record.name),
    serialNumber: toRequiredString(record.serialNumber ?? record.serial_number),
    ipAddress: toRequiredString(record.ipAddress ?? record.ip_address),
    port: toOptionalNumber(record.port),
    commKey: toOptionalString(record.commKey ?? record.comm_key),
    modelName: toOptionalString(record.modelName ?? record.model_name),
    firmwareVersion: toOptionalString(record.firmwareVersion ?? record.firmware_version),
    platform: toOptionalString(record.platform),
    location: toRequiredString(record.location),
    status: (toOptionalString(record.status) as Device["status"]) ?? "offline",
    lastSync: toOptionalString(record.lastSync ?? record.last_sync),
    lastSeen: toOptionalString(record.lastSeen ?? record.last_seen),
    lastHeartbeat: toOptionalString(record.lastHeartbeat ?? record.last_heartbeat),
    employeeCount: toOptionalNumber(record.employeeCount ?? record.employee_count),
    groupId: toOptionalId(record.groupId ?? record.group_id) ?? null,
    policyId: toOptionalId(record.policyId ?? record.policy_id) ?? null,
    connectionMode: toOptionalString(
      record.connectionMode ?? record.connection_mode,
    ) as Device["connectionMode"] | undefined,
    primaryEnrollment: toOptionalBoolean(
      record.primaryEnrollment ?? record.isPrimaryEnrollment ?? record.is_primary_enrollment,
    ),
  };
}

export function normalizeDeviceSyncLog(
  raw: ApiDeviceSyncLog | DeviceSyncLog | Record<string, unknown>,
): DeviceSyncLog {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    device: toRequiredString(record.device),
    command: toOptionalString(record.command),
    requested_by: toOptionalId(record.requested_by),
    requestedByName: toOptionalString(record.requestedByName),
    reason: toOptionalString(record.reason),
    status: (toOptionalString(record.status) as DeviceSyncLog["status"]) ?? "running",
    message: toOptionalString(record.message),
    started_at: toOptionalString(record.started_at),
    finished_at: toOptionalString(record.finished_at),
  };
}

export function normalizeDeviceGroup(
  raw: ApiDeviceGroup | DeviceGroup | Record<string, unknown>,
): DeviceGroup {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    name: toRequiredString(record.name),
    description: toOptionalString(record.description),
    deviceCount: toOptionalNumber(record.deviceCount),
    created_at: toOptionalString(record.created_at),
    updated_at: toOptionalString(record.updated_at),
  };
}

export function normalizeDevicePolicy(
  raw: ApiDevicePolicy | DevicePolicy | Record<string, unknown>,
): DevicePolicy {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    name: toRequiredString(record.name),
    description: toOptionalString(record.description),
    timezone: toOptionalString(record.timezone),
    heartbeat_interval_seconds: toOptionalNumber(record.heartbeat_interval_seconds),
    auto_sync_time: toOptionalBoolean(record.auto_sync_time),
    verification_mode: toOptionalString(
      record.verification_mode,
    ) as DevicePolicy["verification_mode"] | undefined,
    config: toOptionalRecord(record.config),
    deviceCount: toOptionalNumber(record.deviceCount),
    created_at: toOptionalString(record.created_at),
    updated_at: toOptionalString(record.updated_at),
  };
}

export function normalizeDeviceCommandApproval(
  raw: ApiDeviceCommandApproval | DeviceCommandApproval | Record<string, unknown>,
): DeviceCommandApproval {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    command: toRequiredString(record.command),
    payload: toOptionalRecord(record.payload),
    reason: toOptionalString(record.reason),
    status: (toOptionalString(record.status) as DeviceCommandApproval["status"]) ?? "pending",
    deviceIds: Array.isArray(record.deviceIds) ? record.deviceIds.map(String) : undefined,
    requested_by: toOptionalId(record.requested_by),
    requestedByName: toOptionalString(record.requestedByName),
    approved_by: toOptionalId(record.approved_by),
    approvedByName: toOptionalString(record.approvedByName),
    rejected_by: toOptionalId(record.rejected_by),
    rejectedByName: toOptionalString(record.rejectedByName),
    requested_at: toOptionalString(record.requested_at),
    expires_at: toOptionalString(record.expires_at),
    decided_at: toOptionalString(record.decided_at),
    executed_at: toOptionalString(record.executed_at),
  };
}

export function normalizeDeviceBackupSnapshot(
  raw: ApiDeviceBackupSnapshot | DeviceBackupSnapshot | Record<string, unknown>,
): DeviceBackupSnapshot {
  const record = asRecord(raw);
  const rawScope = toOptionalString(record.scope);
  return {
    id: toRequiredString(record.id),
    name: toRequiredString(record.name),
    scope:
      rawScope === "device"
        ? "single"
        : (rawScope as DeviceBackupSnapshot["scope"]) ?? "single",
    deviceId: toOptionalId(record.deviceId) ?? null,
    deviceGroupId: toOptionalId(record.deviceGroupId) ?? null,
    payload: toOptionalRecord(record.payload),
    created_by: toOptionalId(record.created_by),
    createdByName: toOptionalString(record.createdByName),
    created_at: toOptionalString(record.created_at),
    restored_at: toOptionalString(record.restored_at),
  };
}

export function normalizeDeviceTemplate(
  raw: ApiDeviceTemplate | DeviceTemplate | Record<string, unknown>,
): DeviceTemplate {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    employeeCode: toRequiredString(record.employeeCode),
    sourceDeviceId: toOptionalId(record.sourceDeviceId) ?? null,
    templateType: toOptionalString(record.templateType) as DeviceTemplate["templateType"] | undefined,
    templateIndex: toOptionalNumber(record.templateIndex),
    templateData: toOptionalString(record.templateData),
    templateHash: toOptionalString(record.templateHash),
    version: toOptionalNumber(record.version),
    conflictStrategy: toOptionalString(
      record.conflictStrategy,
    ) as DeviceTemplate["conflictStrategy"] | undefined,
    metadata: toOptionalRecord(record.metadata),
    isActive: toOptionalBoolean(record.isActive),
    lastDistributedAt: toOptionalString(record.lastDistributedAt) ?? null,
    created_at: toOptionalString(record.created_at),
    updated_at: toOptionalString(record.updated_at),
  };
}

export function normalizeDeviceFirmwareRollout(
  raw: ApiDeviceFirmwareRollout | DeviceFirmwareRollout | Record<string, unknown>,
): DeviceFirmwareRollout {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    target_version: toRequiredString(record.target_version),
    deviceGroupId: toOptionalId(record.deviceGroupId) ?? null,
    notes: toOptionalString(record.notes),
    rollout_plan: toOptionalRecord(record.rollout_plan),
    results: toOptionalRecord(record.results),
    status: toOptionalString(record.status) as DeviceFirmwareRollout["status"] | undefined,
    requested_by: toOptionalId(record.requested_by),
    requestedByName: toOptionalString(record.requestedByName),
    created_at: toOptionalString(record.created_at),
    started_at: toOptionalString(record.started_at) ?? null,
    finished_at: toOptionalString(record.finished_at) ?? null,
  };
}
