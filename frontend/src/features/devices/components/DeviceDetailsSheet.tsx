import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { Button } from "@/shared/ui/button";
import {
  Fingerprint,
  Wifi,
  WifiOff,
  MapPin,
  Network,
  Clock3,
  Power,
  Download,
  UserPlus,
  Key,
  Server,
  Settings,
  Activity,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Device, DeviceSyncLog } from "@/types/api";
import { Input } from "@/shared/ui/input";
import { useToast } from "@/shared/hooks/use-toast";
import {
  formatDeviceDate,
  formatDeviceRelativeTime,
} from "@/features/devices/lib/device-time";
import {
  usePullDeviceLogs,
  usePushEmployeeToDevice,
  useRebootDevice,
  useSyncDevice,
  useSyncDeviceTime,
} from "@/features/devices/hooks/useDevices";
import { getDeviceSyncLogs } from "@/features/devices/api/devices";
import { useAuth } from "@/features/auth/components/AuthProvider";

interface DeviceDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
}

export function DeviceDetailsSheet({
  open,
  onOpenChange,
  device,
}: DeviceDetailsSheetProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isRtl = i18n.language === "ar";

  const [syncLogs, setSyncLogs] = useState<DeviceSyncLog[]>([]);
  const [logsLimit, setLogsLimit] = useState<number | "">("");
  const [employeeCodeInput, setEmployeeCodeInput] = useState("");
  const [showCommKey, setShowCommKey] = useState(false);

  const syncDeviceMutation = useSyncDevice();
  const syncTimeMutation = useSyncDeviceTime();
  const rebootMutation = useRebootDevice();
  const pullLogsMutation = usePullDeviceLogs();
  const pushEmployeeMutation = usePushEmployeeToDevice();

  const canManage = ["system_admin", "admin", "hr_manager"].includes(
    String(user?.role || ""),
  );
  const permissionSet = new Set([...(user?.permissions || []), ...(user?.role_permissions || [])]);
  const canSyncTime = canManage && (
    ["system_admin", "admin"].includes(String(user?.role || "")) ||
    permissionSet.has("devices") ||
    permissionSet.has("devices.manage_sensitive") ||
    permissionSet.has("devices.sync_time")
  );
  const canReboot = canManage && (
    ["system_admin", "admin"].includes(String(user?.role || "")) ||
    permissionSet.has("devices") ||
    permissionSet.has("devices.manage_sensitive") ||
    permissionSet.has("devices.reboot")
  );
  const locale = i18n.language === "ar" ? "ar" : "en-US";

  const extractErrorMessage = (error: unknown) => {
    const apiError = error as AxiosError<{ detail?: string; error?: string }>;
    return (
      apiError.response?.data?.detail ||
      apiError.response?.data?.error ||
      (error instanceof Error ? error.message : t("generic_error", { defaultValue: "Something went wrong." }))
    );
  };

  const showActionError = (title: string, error: unknown) => {
    toast({
      title,
      description: extractErrorMessage(error),
      variant: "destructive",
    });
  };

  useEffect(() => {
    if (!open || !device?.id) return;
    getDeviceSyncLogs(device.id)
      .then(setSyncLogs)
      .catch(() => setSyncLogs([]));
  }, [open, device?.id]);

  const maskCommKey = (key?: string) => {
    if (!key) return "-";
    if (key.length <= 4) return "****";
    return "*".repeat(key.length - 4) + key.slice(-4);
  };

  const handleSync = async () => {
    if (!device || !canManage) return;
    try {
      await syncDeviceMutation.mutateAsync(device.id);
      const logs = await getDeviceSyncLogs(device.id);
      setSyncLogs(logs);
    } catch (error) {
      showActionError(t("sync_failed", { defaultValue: "Sync failed" }), error);
    }
  };

  const handleSyncTime = async () => {
    if (!device || !canManage) return;
    try {
      await syncTimeMutation.mutateAsync(device.id);
      const logs = await getDeviceSyncLogs(device.id);
      setSyncLogs(logs);
    } catch (error) {
      showActionError(t("sync_time_failed", { defaultValue: "Failed to sync device time" }), error);
    }
  };

  const handleReboot = async () => {
    if (!device || !canManage) return;
    try {
      await rebootMutation.mutateAsync(device.id);
    } catch (error) {
      showActionError(t("reboot_failed", { defaultValue: "Failed to reboot device" }), error);
    }
  };

  const handlePullLogs = async () => {
    if (!device || !canManage) return;
    try {
      await pullLogsMutation.mutateAsync({
        id: device.id,
        limit: logsLimit === "" ? undefined : Number(logsLimit),
      });
      const logs = await getDeviceSyncLogs(device.id);
      setSyncLogs(logs);
    } catch (error) {
      showActionError(t("pull_logs_failed", { defaultValue: "Failed to pull logs" }), error);
    }
  };

  const handlePushEmployee = async () => {
    if (!device || !canManage || !employeeCodeInput.trim()) return;
    try {
      await pushEmployeeMutation.mutateAsync({
        id: device.id,
        employeeCode: employeeCodeInput.trim(),
      });
      setEmployeeCodeInput("");
    } catch (error) {
      showActionError(t("push_employee_failed", { defaultValue: "Failed to push employee" }), error);
    }
  };

  if (!device) return null;

  const isOnline = device.status === "online";
  const lastContactValue = device.lastSeen || device.lastHeartbeat;
  const recentLogs = syncLogs.slice(0, 6);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? "left" : "right"}
        dir={isRtl ? "rtl" : "ltr"}
        className="w-[95vw] max-w-2xl sm:max-w-3xl overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Fingerprint className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-xl font-bold">
                  {device.name}
                </SheetTitle>
                <Badge
                  variant={isOnline ? "success" : "destructive"}
                  className="gap-1"
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3" /> {t("online")}
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" /> {t("offline")}
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {device.serialNumber}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block mb-1">
                {t("status", { defaultValue: "Status" })}
              </span>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-success" />
                ) : (
                  <WifiOff className="w-4 h-4 text-destructive" />
                )}
                <span className="font-medium">
                  {isOnline ? t("online") : t("offline")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {lastContactValue
                  ? `${t("last_contact")}: ${formatDeviceRelativeTime(lastContactValue, locale)}`
                  : t("no_data", { defaultValue: "No data available" })}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block mb-1">
                {t("last_sync", { defaultValue: "Last Sync" })}
              </span>
              <div className="font-medium text-sm truncate">
                {device.lastSync ? formatDeviceDate(device.lastSync, locale) : t("never_synced")}
              </div>
              {device.lastSync && (
                <span className="text-xs text-muted-foreground">
                  {formatDeviceRelativeTime(device.lastSync, locale)}
                </span>
              )}
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block mb-1">
                {t("last_contact")}
              </span>
              <div className="font-medium text-sm truncate">
                {lastContactValue ? formatDeviceDate(lastContactValue, locale) : "-"}
              </div>
              {lastContactValue && (
                <span className="text-xs text-muted-foreground">
                  {formatDeviceRelativeTime(lastContactValue, locale)}
                </span>
              )}
            </div>
          </section>

          <Separator />

          {/* Device Information Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">
                {t("device_info", { defaultValue: "Device Information" })}
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("device_id", { defaultValue: "Device ID" })}
                </span>
                <span className="font-mono text-sm break-all">{device.id}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("model", { defaultValue: "Model" })}
                </span>
                <span className="font-medium">{device.modelName || "-"}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("platform", { defaultValue: "Platform" })}
                </span>
                <span className="font-medium">{device.platform || "-"}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("firmware_version", { defaultValue: "Firmware" })}
                </span>
                <span className="font-medium">{device.firmwareVersion || "-"}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 sm:col-span-2">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("location", { defaultValue: "Location" })}
                </span>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{device.location}</span>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 sm:col-span-2">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("department", { defaultValue: "Department" })}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/5">
                    {device.departmentName || "-"}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("employee_count", { defaultValue: "Employees" })}
                </span>
                <span className="text-2xl font-bold leading-none">
                  {device.employeeCount || 0}
                </span>
              </div>
            </div>
          </section>

          <Separator />

          {/* Network Settings Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">
                {t("network_settings", { defaultValue: "Network Settings" })}
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("ip_address", { defaultValue: "IP Address" })}
                </span>
                <span className="font-mono font-medium">
                  {device.ipAddress}
                </span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("port", { defaultValue: "Port" })}
                </span>
                <span className="font-mono font-medium">
                  {device.port || 4370}
                </span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 sm:col-span-2">
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("comm_key", { defaultValue: "Communication Key" })}
                </span>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-mono font-medium">
                    {showCommKey
                      ? device.commKey || "-"
                      : maskCommKey(device.commKey)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setShowCommKey(!showCommKey)}
                  >
                    {showCommKey ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Actions Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">
                {t("actions", { defaultValue: "Actions" })}
              </h3>
            </div>

            <div className="space-y-3">
              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleSyncTime}
                  disabled={!canSyncTime || syncTimeMutation.isPending}
                >
                  <Clock3 className={`w-4 h-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                  {t("sync_time", { defaultValue: "Sync Time" })}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSync}
                  disabled={!canManage || syncDeviceMutation.isPending}
                >
                  <Activity className={`w-4 h-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                  {t("sync_now")}
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={handleReboot}
                  disabled={!canReboot || rebootMutation.isPending}
                >
                  <Power className={`w-4 h-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                  {t("reboot", { defaultValue: "Reboot" })}
                </Button>
              </div>

              {/* Pull Logs & Push Employee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">
                      {t("pull_logs", { defaultValue: "Pull Logs" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder={t("limit", { defaultValue: "Limit" })}
                      value={logsLimit}
                      onChange={(e) =>
                        setLogsLimit(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-24 h-8"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePullLogs}
                      disabled={!canManage || pullLogsMutation.isPending}
                    >
                      {t("run", { defaultValue: "Run" })}
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">
                      {t("push_employee", { defaultValue: "Push Employee" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t("employee_code", { defaultValue: "Code" })}
                      value={employeeCodeInput}
                      onChange={(e) => setEmployeeCodeInput(e.target.value)}
                      className="h-8"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePushEmployee}
                      disabled={
                        !canManage ||
                        pushEmployeeMutation.isPending ||
                        !employeeCodeInput.trim()
                      }
                    >
                      {t("send", { defaultValue: "Send" })}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sync Logs */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{t("sync_logs")}</span>
                </div>
                {syncLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("no_data", { defaultValue: "No data available" })}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate">
                            {log.message || log.status}
                          </p>
                          {log.command && (
                            <p className="text-[11px] text-muted-foreground">
                              {log.command}{log.reason ? ` • ${log.reason}` : ""}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            {formatDeviceDate(log.finished_at || log.started_at, locale)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            log.status === "success"
                              ? "success"
                              : log.status === "failed"
                                ? "destructive"
                                : "warning"
                          }
                          className="ml-2 shrink-0"
                        >
                          {log.status}
                        </Badge>
                      </div>
                    ))}
                    {syncLogs.length > recentLogs.length && (
                      <p className="text-xs text-muted-foreground">
                        +{syncLogs.length - recentLogs.length}{" "}
                        {t("more", { defaultValue: "more" })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
