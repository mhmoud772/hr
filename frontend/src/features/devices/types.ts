import type { ID, ISODate } from "@/types/api";

export type DeviceStatus = "online" | "offline";

export interface Device {
  id: ID;
  name: string;
  serialNumber: string;
  ipAddress: string;
  port?: number;
  commKey?: string;
  modelName?: string;
  firmwareVersion?: string;
  platform?: string;
  location: string;
  status: DeviceStatus;
  lastSync?: string;
  lastSeen?: string;
  lastHeartbeat?: string;
  employeeCount?: number;
  groupId?: ID | null;
  policyId?: ID | null;
  departmentId?: ID | null;
  departmentName?: string;
  connectionMode?: "sdk" | "adms";
  primaryEnrollment?: boolean;
}

export interface DeviceSyncLog {
  id: ID;
  device: ID;
  command?: string;
  requested_by?: ID;
  requestedByName?: string;
  reason?: string;
  status: "success" | "failed" | "running";
  message?: string;
  started_at?: ISODate;
  finished_at?: ISODate;
}

export interface DeviceGroup {
  id: ID;
  name: string;
  description?: string;
  deviceCount?: number;
  created_at?: ISODate;
  updated_at?: ISODate;
}

export interface DevicePolicy {
  id: ID;
  name: string;
  description?: string;
  timezone?: string;
  heartbeat_interval_seconds?: number;
  auto_sync_time?: boolean;
  verification_mode?: "any" | "fingerprint" | "face" | "card";
  config?: Record<string, unknown>;
  deviceCount?: number;
  created_at?: ISODate;
  updated_at?: ISODate;
}

export type DeviceCommandApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "executed";

export interface DeviceCommandApproval {
  id: ID;
  command: string;
  payload?: Record<string, unknown>;
  reason?: string;
  status: DeviceCommandApprovalStatus;
  deviceIds?: ID[];
  requested_by?: ID;
  requestedByName?: string;
  approved_by?: ID;
  approvedByName?: string;
  rejected_by?: ID;
  rejectedByName?: string;
  requested_at?: ISODate;
  expires_at?: ISODate;
  decided_at?: ISODate;
  executed_at?: ISODate;
}

export interface DeviceTemplate {
  id: ID;
  employeeCode: string;
  sourceDeviceId?: ID | null;
  templateType?: "fingerprint" | "face" | "card";
  templateIndex?: number;
  templateData?: string;
  templateHash?: string;
  version?: number;
  conflictStrategy?: "last_write_wins" | "manual_review";
  metadata?: Record<string, unknown>;
  isActive?: boolean;
  lastDistributedAt?: ISODate | null;
  created_at?: ISODate;
  updated_at?: ISODate;
}

export interface DeviceFirmwareRollout {
  id: ID;
  target_version: string;
  deviceGroupId?: ID | null;
  notes?: string;
  rollout_plan?: Record<string, unknown>;
  results?: Record<string, unknown>;
  status?: "draft" | "running" | "completed" | "failed" | "cancelled";
  requested_by?: ID;
  requestedByName?: string;
  created_at?: ISODate;
  started_at?: ISODate | null;
  finished_at?: ISODate | null;
}

export interface DeviceBackupSnapshot {
  id: ID;
  name: string;
  scope: "single" | "group" | "global";
  deviceId?: ID | null;
  deviceGroupId?: ID | null;
  payload?: Record<string, unknown>;
  created_by?: ID;
  createdByName?: string;
  created_at?: ISODate;
  restored_at?: ISODate | null;
}
