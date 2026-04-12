import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  FolderSync,
  Layers,
  PlayCircle,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  DatabaseBackup,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import type { DeviceCommandCenterQueuePayload } from "@/features/devices/api/devices";
import {
  useApproveDeviceCommandApproval,
  useCreateDeviceGroup,
  useCreateDevicePolicy,
  useDeviceBackupsQuery,
  useDeviceCommandApprovalsQuery,
  useDeviceCommandCenterCatalogQuery,
  useDeviceCommandCenterDashboardQuery,
  useDeviceFirmwareRolloutsQuery,
  useDeviceGroupsQuery,
  useDevicePoliciesQuery,
  useDeviceTemplatesQuery,
  useQueueDeviceCommandCenter,
  useRejectDeviceCommandApproval,
  useRestoreDeviceBackup,
  useStartDeviceFirmwareRollout,
} from "@/features/devices/hooks/useDevices";

type TargetMode = "selected" | "group";

interface DeviceAdvancedControlPanelProps {
  selectedDeviceIds: string[];
  canManage: boolean;
}

const EMPLOYEE_CODE_COMMANDS = new Set([
  "push_employee",
  "disable_employee",
  "enable_employee",
  "delete_employee",
]);

const commandCodes = [
  "sync",
  "sync_time",
  "reboot",
  "pull_logs",
  "push_employee",
  "disable_employee",
  "enable_employee",
  "delete_employee",
  "clear_logs",
  "apply_policy",
  "distribute_template",
  "firmware_rollout",
] as const;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export function DeviceAdvancedControlPanel({
  selectedDeviceIds,
  canManage,
}: DeviceAdvancedControlPanelProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { toast } = useToast();

  const [targetMode, setTargetMode] = useState<TargetMode>("selected");
  const [command, setCommand] = useState("sync");
  const [groupId, setGroupId] = useState("");
  const [reason, setReason] = useState("");
  const [limit, setLimit] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [rolloutId, setRolloutId] = useState("");
  const [extraPayload, setExtraPayload] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [policyName, setPolicyName] = useState("");
  const [policyTimezone, setPolicyTimezone] = useState("UTC");
  const [policyVerificationMode, setPolicyVerificationMode] = useState<
    "any" | "fingerprint" | "face" | "card"
  >("any");

  const dashboardQuery = useDeviceCommandCenterDashboardQuery({ enabled: canManage });
  const catalogQuery = useDeviceCommandCenterCatalogQuery({ enabled: canManage });
  const groupsQuery = useDeviceGroupsQuery({ enabled: canManage });
  const policiesQuery = useDevicePoliciesQuery({ enabled: canManage });
  const approvalsQuery = useDeviceCommandApprovalsQuery({ status: "pending" }, { enabled: canManage });
  const templatesQuery = useDeviceTemplatesQuery({ is_active: true }, { enabled: canManage });
  const firmwareRolloutsQuery = useDeviceFirmwareRolloutsQuery(undefined, { enabled: canManage });
  const backupsQuery = useDeviceBackupsQuery(undefined, { enabled: canManage });

  const queueMutation = useQueueDeviceCommandCenter();
  const approveMutation = useApproveDeviceCommandApproval();
  const rejectMutation = useRejectDeviceCommandApproval();
  const createGroupMutation = useCreateDeviceGroup();
  const createPolicyMutation = useCreateDevicePolicy();
  const startRolloutMutation = useStartDeviceFirmwareRollout();
  const restoreBackupMutation = useRestoreDeviceBackup();

  const commandLabels = useMemo<Record<string, string>>(
    () => ({
      sync: t("device_command_sync", { defaultValue: "Sync" }),
      sync_time: t("device_command_sync_time", { defaultValue: "Sync Time" }),
      reboot: t("device_command_reboot", { defaultValue: "Reboot" }),
      pull_logs: t("device_command_pull_logs", { defaultValue: "Pull Logs" }),
      push_employee: t("device_command_push_employee", { defaultValue: "Push Employee" }),
      disable_employee: t("device_command_disable_employee", { defaultValue: "Disable Employee" }),
      enable_employee: t("device_command_enable_employee", { defaultValue: "Enable Employee" }),
      delete_employee: t("device_command_delete_employee", { defaultValue: "Delete Employee" }),
      clear_logs: t("device_command_clear_logs", { defaultValue: "Clear Logs" }),
      apply_policy: t("device_command_apply_policy", { defaultValue: "Apply Policy" }),
      distribute_template: t("device_command_distribute_template", { defaultValue: "Distribute Template" }),
      firmware_rollout: t("device_command_firmware_rollout", { defaultValue: "Firmware Rollout" }),
    }),
    [t],
  );

  const getVerificationModeLabel = (mode?: string | null) =>
    t(`verification_mode_${mode || "any"}`, {
      defaultValue:
        mode === "fingerprint"
          ? "Fingerprint"
          : mode === "face"
            ? "Face"
            : mode === "card"
              ? "Card"
              : "Any",
    });

  const getBackupScopeLabel = (scope?: string | null) =>
    t(`backup_scope_${scope || "single"}`, {
      defaultValue: scope === "group" ? "Group" : scope === "global" ? "Global" : "Single device",
    });

  const getStatusLabel = (status?: string | null) =>
    t(`status_${status || "draft"}`, {
      defaultValue:
        status?.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "Draft",
    });

  const commandOptions = useMemo(() => {
    if (catalogQuery.data?.commands?.length) return catalogQuery.data.commands;
    return commandCodes.map((code) => ({
      code,
      sensitive: ["sync_time", "reboot", "clear_logs", "firmware_rollout"].includes(code),
    }));
  }, [catalogQuery.data?.commands]);

  const extractError = (error: unknown) => {
    const apiError = error as AxiosError<{ detail?: string; error?: string }>;
    return apiError.response?.data?.detail || apiError.response?.data?.error || t("generic_error");
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {};
    const normalizedCommand = command.trim();

    if (limit.trim()) {
      const parsedLimit = Number(limit);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        throw new Error(t("invalid_limit", { defaultValue: "Invalid limit value." }));
      }
      payload.limit = Math.floor(parsedLimit);
    }

    if (EMPLOYEE_CODE_COMMANDS.has(normalizedCommand)) {
      if (!employeeCode.trim()) {
        throw new Error(
          t("employee_code_required", { defaultValue: "Employee code is required for this command." }),
        );
      }
      payload.employeeCode = employeeCode.trim();
    }

    if (normalizedCommand === "apply_policy") {
      if (!policyId) {
        throw new Error(t("policy_required", { defaultValue: "Choose a policy first." }));
      }
      payload.policyId = policyId;
    }

    if (normalizedCommand === "distribute_template") {
      if (!templateId.trim()) {
        throw new Error(t("template_required", { defaultValue: "Template id is required." }));
      }
      payload.templateId = templateId.trim();
    }

    if (normalizedCommand === "firmware_rollout") {
      if (!rolloutId.trim()) {
        throw new Error(t("rollout_required", { defaultValue: "Firmware rollout id is required." }));
      }
      payload.rolloutId = rolloutId.trim();
    }

    if (extraPayload.trim()) {
      const parsed = JSON.parse(extraPayload) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(
          t("payload_json_must_object", { defaultValue: "Payload JSON must be an object." }),
        );
      }
      Object.assign(payload, parsed as Record<string, unknown>);
    }

    return payload;
  };

  const handleQueueCommand = async () => {
    if (!canManage) return;
    if (!command) {
      toast({
        title: t("command_required", { defaultValue: "Command is required" }),
        variant: "destructive",
      });
      return;
    }

    if (targetMode === "selected" && selectedDeviceIds.length === 0) {
      toast({
        title: t("no_devices_selected", { defaultValue: "No devices selected" }),
        description: t("select_devices_first", {
          defaultValue: "Select one or more devices from the table first.",
        }),
        variant: "destructive",
      });
      return;
    }

    if (targetMode === "group" && !groupId) {
      toast({
        title: t("group_required", { defaultValue: "Group is required" }),
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = buildPayload();
      const requestPayload: DeviceCommandCenterQueuePayload = {
        command,
        reason: reason.trim() || undefined,
        payload,
      };
      if (targetMode === "selected") {
        requestPayload.deviceIds = selectedDeviceIds;
      } else {
        requestPayload.groupId = groupId;
      }

      const response = await queueMutation.mutateAsync(requestPayload);
      if (response.status === "pending_approval") {
        toast({
          title: t("command_pending_approval", { defaultValue: "Command pending approval" }),
          description: response.detail || t("command_saved_for_approval", { defaultValue: "Saved for approver review." }),
        });
      } else {
        toast({
          title: t("command_queued", { defaultValue: "Command queued" }),
          description: `${response.queued ?? 0}/${response.requested ?? 0}`,
        });
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : extractError(error);
      toast({
        title: t("command_queue_failed", { defaultValue: "Failed to queue command" }),
        description: detail,
        variant: "destructive",
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !canManage) return;
    try {
      await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
      });
      setGroupName("");
      setGroupDescription("");
      toast({
        title: t("group_created", { defaultValue: "Group created" }),
      });
    } catch (error) {
      toast({
        title: t("group_create_failed", { defaultValue: "Failed to create group" }),
        description: extractError(error),
        variant: "destructive",
      });
    }
  };

  const handleCreatePolicy = async () => {
    if (!policyName.trim() || !canManage) return;
    try {
      await createPolicyMutation.mutateAsync({
        name: policyName.trim(),
        timezone: policyTimezone.trim() || "UTC",
        verification_mode: policyVerificationMode,
      });
      setPolicyName("");
      toast({
        title: t("policy_created", { defaultValue: "Policy created" }),
      });
    } catch (error) {
      toast({
        title: t("policy_create_failed", { defaultValue: "Failed to create policy" }),
        description: extractError(error),
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await approveMutation.mutateAsync({ id, executeNow: true });
      const queued = Number((response.execution as { queued?: number } | undefined)?.queued || 0);
      toast({
        title: t("approval_approved", { defaultValue: "Approval accepted" }),
        description: queued > 0 ? t("approval_executed", { defaultValue: "Command executed." }) : undefined,
      });
    } catch (error) {
      toast({
        title: t("approval_failed", { defaultValue: "Approval failed" }),
        description: extractError(error),
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMutation.mutateAsync(id);
      toast({
        title: t("approval_rejected", { defaultValue: "Approval rejected" }),
      });
    } catch (error) {
      toast({
        title: t("reject_failed", { defaultValue: "Reject failed" }),
        description: extractError(error),
        variant: "destructive",
      });
    }
  };

  const handleStartRollout = async (id: string) => {
    if (!canManage) return;
    try {
      const result = await startRolloutMutation.mutateAsync(id);
      toast({
        title: t("rollout_started", { defaultValue: "Rollout started" }),
        description: `${result.queued}/${result.requested}`,
      });
    } catch (error) {
      toast({
        title: t("rollout_start_failed", { defaultValue: "Failed to start rollout" }),
        description: extractError(error),
        variant: "destructive",
      });
    }
  };

  const handleRestoreBackup = async (id: string) => {
    if (!canManage) return;
    try {
      const result = await restoreBackupMutation.mutateAsync(id);
      toast({
        title: t("backup_restored", { defaultValue: "Backup restored" }),
        description: t("restored_devices_count", {
          defaultValue: "Restored devices: {{count}}",
          count: result.restoredDevices,
        }),
      });
    } catch (error) {
      toast({
        title: t("restore_failed", { defaultValue: "Restore failed" }),
        description: extractError(error),
        variant: "destructive",
      });
    }
  };

  const summary = dashboardQuery.data?.summary;
  const pendingApprovals = approvalsQuery.data?.results || [];
  const groups = groupsQuery.data?.results || [];
  const policies = policiesQuery.data?.results || [];
  const templates = templatesQuery.data?.results || [];
  const rollouts = firmwareRolloutsQuery.data?.results || [];
  const backups = backupsQuery.data?.results || [];

  return (
    <Card className="bg-card/90 border border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderSync className="w-5 h-5 text-primary" />
          {t("advanced_device_control", { defaultValue: isRtl ? "التحكم المتقدم بالأجهزة" : "Advanced Device Control" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={selectedDeviceIds.length > 0 ? "info" : "warning"}>
          {selectedDeviceIds.length > 0 ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <AlertTitle>
            {t("selected_devices_count", {
              defaultValue: isRtl ? "الأجهزة المحددة: {{count}}" : "Selected devices: {{count}}",
              count: selectedDeviceIds.length,
            })}
          </AlertTitle>
          <AlertDescription>
            {targetMode === "selected"
              ? t("target_mode_selected_hint", {
                  defaultValue: isRtl
                    ? "وضع الأجهزة المحددة يستخدم الصفوف المحددة في جدول الأجهزة."
                    : "Commands in selected mode use rows selected in the devices table.",
                })
              : t("target_mode_group_hint", {
                  defaultValue: isRtl
                    ? "وضع المجموعة يطبق الأمر على جميع أجهزة المجموعة المختارة."
                    : "Commands in group mode apply to all devices inside the selected group.",
                })}
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">{t("overview", { defaultValue: isRtl ? "نظرة عامة" : "Overview" })}</TabsTrigger>
            <TabsTrigger value="command">{t("command_center", { defaultValue: isRtl ? "مركز الأوامر" : "Command Center" })}</TabsTrigger>
            <TabsTrigger value="governance">{t("governance", { defaultValue: isRtl ? "المجموعات والسياسات" : "Groups & Policies" })}</TabsTrigger>
            <TabsTrigger value="operations">{t("operations", { defaultValue: isRtl ? "العمليات" : "Operations" })}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">{t("total_devices", { defaultValue: "Total" })}</p>
                <p className="text-xl font-semibold">{summary?.totalDevices ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">{t("online", { defaultValue: "Online" })}</p>
                <p className="text-xl font-semibold">{summary?.onlineDevices ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">{t("offline", { defaultValue: "Offline" })}</p>
                <p className="text-xl font-semibold">{summary?.offlineDevices ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">{t("pending_approvals", { defaultValue: "Pending approvals" })}</p>
                <p className="text-xl font-semibold">{summary?.pendingApprovals ?? pendingApprovals.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <p className="text-sm font-semibold">{t("high_risk_devices", { defaultValue: "High risk devices" })}</p>
                {(dashboardQuery.data?.highRiskDevices || []).slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm border border-border/40 rounded px-2 py-1.5">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.serialNumber}</p>
                    </div>
                    <Badge variant={item.failureRatePercent > 20 ? "destructive" : "warning"}>
                      {item.failureRatePercent}%
                    </Badge>
                  </div>
                ))}
                {(dashboardQuery.data?.highRiskDevices || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("no_data", { defaultValue: "No data available" })}</p>
                )}
              </div>

              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <p className="text-sm font-semibold">{t("recent_commands", { defaultValue: "Recent commands" })}</p>
                {(dashboardQuery.data?.recentCommands || []).slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm border border-border/40 rounded px-2 py-1.5">
                    <div>
                      <p className="font-medium">{commandLabels[item.command || ""] || item.command || "-"}</p>
                      <p className="text-xs text-muted-foreground">{item.message || "-"}</p>
                    </div>
                    <Badge
                      variant={
                        item.status === "success"
                          ? "success"
                          : item.status === "failed"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
                {(dashboardQuery.data?.recentCommands || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("no_data", { defaultValue: "No data available" })}</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="command" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>{t("command", { defaultValue: "Command" })}</Label>
                <Select value={command} onValueChange={setCommand}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_command", { defaultValue: "Select command" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {commandOptions.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {commandLabels[item.code] || item.code}
                        {item.sensitive ? ` (${t("sensitive_short", { defaultValue: "Sensitive" })})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("target_mode", { defaultValue: "Target mode" })}</Label>
                <Select value={targetMode} onValueChange={(value) => setTargetMode(value as TargetMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selected">{t("selected_devices", { defaultValue: "Selected devices" })}</SelectItem>
                    <SelectItem value="group">{t("device_group", { defaultValue: "Device group" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetMode === "group" && (
                <div className="space-y-2">
                  <Label>{t("device_group", { defaultValue: "Device group" })}</Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_group", { defaultValue: "Select group" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("reason_optional", { defaultValue: "Reason (optional)" })}</Label>
                <Input value={reason} onChange={(event) => setReason(event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>{t("limit_optional", { defaultValue: "Limit (optional)" })}</Label>
                <Input value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="500" />
              </div>

              {EMPLOYEE_CODE_COMMANDS.has(command) && (
                <div className="space-y-2">
                  <Label>{t("employee_code", { defaultValue: "Employee code" })}</Label>
                  <Input value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} />
                </div>
              )}

              {command === "apply_policy" && (
                <div className="space-y-2">
                  <Label>{t("policy", { defaultValue: "Policy" })}</Label>
                  <Select value={policyId} onValueChange={setPolicyId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_policy", { defaultValue: "Select policy" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {policies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {command === "distribute_template" && (
                <div className="space-y-2">
                  <Label>{t("template_id", { defaultValue: "Template ID" })}</Label>
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_template", { defaultValue: "Select template" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.id.slice(0, 8)}... - {item.employeeCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {command === "firmware_rollout" && (
                <div className="space-y-2">
                  <Label>{t("rollout_id", { defaultValue: "Rollout ID" })}</Label>
                  <Select value={rolloutId} onValueChange={setRolloutId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_rollout", { defaultValue: "Select rollout" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {rollouts.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.target_version} ({getStatusLabel(item.status || "draft")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("extra_payload_json", { defaultValue: "Extra payload (JSON, optional)" })}</Label>
              <Textarea
                value={extraPayload}
                onChange={(event) => setExtraPayload(event.target.value)}
                placeholder='{"key":"value"}'
                className="font-mono text-xs"
              />
            </div>

            <Button
              className="gap-2"
              onClick={handleQueueCommand}
              disabled={!canManage || queueMutation.isPending}
            >
              <PlayCircle className="w-4 h-4" />
              {t("queue_command", { defaultValue: "Queue command" })}
            </Button>

            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-warning" />
                {t("pending_approvals", { defaultValue: "Pending approvals" })}
              </p>
              {pendingApprovals.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("no_pending_approvals", { defaultValue: "No pending approvals." })}</p>
              )}
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="rounded-lg border border-border/60 p-3 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{commandLabels[approval.command] || approval.command}</p>
                      <p className="text-xs text-muted-foreground">
                        {approval.reason || t("no_reason", { defaultValue: "No reason provided" })}
                      </p>
                    </div>
                    <Badge variant="warning">{getStatusLabel(approval.status)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("targets", { defaultValue: "Targets" })}: {approval.deviceIds?.length || 0} -{" "}
                    {t("requested_by", { defaultValue: "Requested by" })}: {approval.requestedByName || "-"} -{" "}
                    {t("expires", { defaultValue: "Expires" })}: {formatDate(approval.expires_at)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(approval.id)}
                      disabled={!canManage || approveMutation.isPending}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {t("approve", { defaultValue: "Approve" })}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(approval.id)}
                      disabled={!canManage || rejectMutation.isPending}
                    >
                      <ShieldX className="w-4 h-4" />
                      {t("reject", { defaultValue: "Reject" })}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="governance" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/60 p-3 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                {t("device_groups", { defaultValue: "Device groups" })}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder={t("group_name", { defaultValue: "Group name" })}
                />
                <Input
                  value={groupDescription}
                  onChange={(event) => setGroupDescription(event.target.value)}
                  placeholder={t("description_optional", { defaultValue: "Description (optional)" })}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateGroup}
                disabled={!canManage || createGroupMutation.isPending || !groupName.trim()}
              >
                {t("create_group", { defaultValue: "Create group" })}
              </Button>
              <div className="space-y-2">
                {groups.map((group) => (
                  <div key={group.id} className="rounded border border-border/50 px-2 py-1.5 text-sm flex items-center justify-between">
                    <span>{group.name}</span>
                    <Badge variant="outline">{group.deviceCount ?? 0}</Badge>
                  </div>
                ))}
                {groups.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("no_data", { defaultValue: "No data available" })}</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 p-3 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                {t("device_policies", { defaultValue: "Device policies" })}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={policyName}
                  onChange={(event) => setPolicyName(event.target.value)}
                  placeholder={t("policy_name", { defaultValue: "Policy name" })}
                />
                <Input
                  value={policyTimezone}
                  onChange={(event) => setPolicyTimezone(event.target.value)}
                  placeholder="UTC"
                />
                <Select
                  value={policyVerificationMode}
                  onValueChange={(value) =>
                    setPolicyVerificationMode(value as "any" | "fingerprint" | "face" | "card")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{getVerificationModeLabel("any")}</SelectItem>
                    <SelectItem value="fingerprint">{getVerificationModeLabel("fingerprint")}</SelectItem>
                    <SelectItem value="face">{getVerificationModeLabel("face")}</SelectItem>
                    <SelectItem value="card">{getVerificationModeLabel("card")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreatePolicy}
                disabled={!canManage || createPolicyMutation.isPending || !policyName.trim()}
              >
                {t("create_policy", { defaultValue: "Create policy" })}
              </Button>
              <div className="space-y-2">
                {policies.map((policy) => (
                  <div key={policy.id} className="rounded border border-border/50 px-2 py-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{policy.name}</span>
                      <Badge variant="outline">{policy.deviceCount ?? 0}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(policy.timezone || "UTC") + " - " + getVerificationModeLabel(policy.verification_mode || "any")}
                    </p>
                  </div>
                ))}
                {policies.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("no_data", { defaultValue: "No data available" })}</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border/60 p-3 space-y-2">
              <p className="text-sm font-semibold">{t("templates", { defaultValue: "Templates" })}</p>
              {templates.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded border border-border/50 px-2 py-1.5 text-xs">
                  <p className="font-medium">{item.employeeCode}</p>
                  <p className="text-muted-foreground">
                    {getVerificationModeLabel(item.templateType || "fingerprint")} #{item.templateIndex ?? 0} - v{item.version ?? 1}
                  </p>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("no_data", { defaultValue: "No data available" })}</p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 p-3 space-y-2">
              <p className="text-sm font-semibold">{t("firmware_rollouts", { defaultValue: "Firmware rollouts" })}</p>
              {rollouts.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded border border-border/50 px-2 py-1.5 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.target_version}</p>
                    <Badge
                      variant={
                        item.status === "completed"
                          ? "success"
                          : item.status === "failed"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {getStatusLabel(item.status || "draft")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">{formatDate(item.created_at)}</p>
                    {(item.status === "draft" || item.status === "failed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartRollout(item.id)}
                        disabled={!canManage || startRolloutMutation.isPending}
                      >
                        {t("start", { defaultValue: "Start" })}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {rollouts.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("no_data", { defaultValue: "No data available" })}</p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 p-3 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <DatabaseBackup className="w-4 h-4 text-primary" />
                {t("backups", { defaultValue: "Backups" })}
              </p>
              {backups.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded border border-border/50 px-2 py-1.5 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.name}</p>
                    <Badge variant="outline">{getBackupScopeLabel(item.scope)}</Badge>
                  </div>
                  <p className="text-muted-foreground">{formatDate(item.created_at)}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      {item.restored_at
                        ? t("last_restored", {
                            defaultValue: "Restored: {{date}}",
                            date: formatDate(item.restored_at),
                          })
                        : t("not_restored", { defaultValue: "Not restored yet" })}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreBackup(item.id)}
                      disabled={!canManage || restoreBackupMutation.isPending}
                    >
                      {t("restore", { defaultValue: "Restore" })}
                    </Button>
                  </div>
                </div>
              ))}
              {backups.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("no_data", { defaultValue: "No data available" })}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
