import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { RefreshCw, Wifi } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import type { Device } from "@/types/api";
import {
  useCreateDevice,
  useUpdateDevice,
  useDiscoverDevice,
  useTestDeviceConnection,
} from "@/features/devices/hooks/useDevices";
import { useAuth } from "@/features/auth/components/AuthProvider";

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device | null;
}

export function DeviceFormDialog({ open, onOpenChange, device }: DeviceFormDialogProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isRtl = i18n.language === "ar";

  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const discoverDeviceMutation = useDiscoverDevice();
  const testConnectionMutation = useTestDeviceConnection();

  const canManage = ["system_admin", "admin", "hr_manager"].includes(
    String(user?.role || ""),
  );

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    ipAddress: "",
    location: "",
    port: 4370,
    commKey: "",
    modelName: "",
    firmwareVersion: "",
    platform: "",
  });

  useEffect(() => {
    if (open) {
      if (device) {
        setFormData({
          name: device.name,
          serialNumber: device.serialNumber,
          ipAddress: device.ipAddress,
          location: device.location,
          port: device.port ?? 4370,
          commKey: device.commKey || "",
          modelName: device.modelName || "",
          firmwareVersion: device.firmwareVersion || "",
          platform: device.platform || "",
        });
      } else {
        setFormData({
          name: "",
          serialNumber: "",
          ipAddress: "",
          location: "",
          port: 4370,
          commKey: "",
          modelName: "",
          firmwareVersion: "",
          platform: "",
        });
      }
      setFormErrors({});
    }
  }, [open, device]);

  const validateForm = (serialOverride?: string) => {
    const errors: Record<string, string> = {};
    const serialValue = (serialOverride ?? formData.serialNumber).trim();
    if (!formData.name.trim()) errors.name = t("device_name_required");
    if (!serialValue) errors.serialNumber = t("serial_required");
    if (!formData.location.trim()) errors.location = t("location_required");
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(formData.ipAddress)) errors.ipAddress = t("invalid_ip");
    if (formData.port < 1 || formData.port > 65535) errors.port = t("invalid_port") || "Invalid port";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const detectSerialFromConnection = async ({
    notifyOnSuccess = false,
    showErrorToast = true,
  }: {
    notifyOnSuccess?: boolean;
    showErrorToast?: boolean;
  } = {}) => {
    const ipAddress = formData.ipAddress.trim();
    if (!ipAddress) {
      setFormErrors((prev) => ({ ...prev, ipAddress: t("invalid_ip") }));
      return "";
    }

    try {
      const discovery = await discoverDeviceMutation.mutateAsync({
        ipAddress,
        port: Number(formData.port) || 4370,
        commKey: formData.commKey || "",
      });
      const serial = String(discovery.serialNumber || "").trim();
      if (!serial) {
        if (showErrorToast) {
          toast({
            title: t("serial_not_detected", { defaultValue: "Serial number was not detected" }),
            description: t("serial_not_detected_desc", { defaultValue: "Enter the serial number manually or verify device connectivity." }),
            variant: "destructive",
          });
        }
        return "";
      }

      setFormData((prev) => ({
        ...prev,
        serialNumber: serial,
        modelName: prev.modelName || (discovery.modelName || ""),
        firmwareVersion: prev.firmwareVersion || (discovery.firmwareVersion || ""),
        platform: prev.platform || (discovery.platform || ""),
      }));
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.serialNumber;
        return next;
      });
      if (notifyOnSuccess) {
        toast({
          title: t("serial_detected", { defaultValue: "Serial number detected" }),
          description: serial,
        });
      }
      return serial;
    } catch {
      if (showErrorToast) {
        toast({
          title: t("serial_detect_failed", { defaultValue: "Failed to detect device serial" }),
          description: t("serial_detect_failed_desc", { defaultValue: "Please verify IP/Port/Comm Key and try again." }),
          variant: "destructive",
        });
      }
      return "";
    }
  };

  const testConnectionFromForm = async () => {
    const ipAddress = formData.ipAddress.trim();
    if (!ipAddress) {
      setFormErrors((prev) => ({ ...prev, ipAddress: t("invalid_ip") }));
      return;
    }
    try {
      const result = await testConnectionMutation.mutateAsync({
        ipAddress,
        port: Number(formData.port) || 4370,
        commKey: formData.commKey || "",
      });
      toast({
        title: t("device_connection_ok", { defaultValue: "Device is reachable" }),
        description: result.latencyMs
          ? `${result.latencyMs} ms${result.serialNumber ? ` - ${result.serialNumber}` : ""}`
          : (result.serialNumber || t("connection_test_success", { defaultValue: "Connection successful" })),
      });
      if (result.serialNumber && !formData.serialNumber.trim()) {
        setFormData((prev) => ({ ...prev, serialNumber: result.serialNumber || prev.serialNumber }));
      }
      setFormData((prev) => ({
        ...prev,
        modelName: prev.modelName || (result.modelName || ""),
        firmwareVersion: prev.firmwareVersion || (result.firmwareVersion || ""),
        platform: prev.platform || (result.platform || ""),
      }));
    } catch (error) {
      const apiError = error as AxiosError<{ detail?: string; error?: string }>;
      const detail = apiError.response?.data?.detail || apiError.response?.data?.error;
      toast({
        title: t("device_connection_failed", { defaultValue: "Connection test failed" }),
        description:
          detail ||
          t("serial_detect_failed_desc", { defaultValue: "Please verify IP/Port/Comm Key and try again." }),
        variant: "destructive",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEditing = Boolean(device);
    const connectionChanged = Boolean(
      device &&
        (formData.ipAddress.trim() !== String(device.ipAddress || "").trim() ||
          Number(formData.port || 4370) !== Number(device.port || 4370) ||
          formData.commKey.trim() !== String(device.commKey || "").trim()),
    );

    let serialValue = formData.serialNumber.trim();
    if (!serialValue || (isEditing && connectionChanged)) {
      const detectedSerial = await detectSerialFromConnection({
        showErrorToast: !isEditing || !serialValue,
      });
      if (detectedSerial) {
        serialValue = detectedSerial;
      }
    }

    if (!validateForm(serialValue)) return;

    const payload = {
      name: formData.name,
      serialNumber: serialValue || formData.serialNumber,
      ipAddress: formData.ipAddress,
      port: Number(formData.port) || 4370,
      commKey: formData.commKey,
      modelName: formData.modelName,
      firmwareVersion: formData.firmwareVersion,
      platform: formData.platform,
      location: formData.location,
    } as Device;

    try {
      if (device) {
        await updateDevice.mutateAsync({ id: device.id, data: { ...device, ...payload } });
        toast({ title: t("device_updated"), description: t("device_updated_desc") });
      } else {
        await createDevice.mutateAsync({
          id: String(Date.now()),
          ...payload,
          status: "offline",
        } as Device);
        toast({ title: t("device_added"), description: t("device_added_desc") });
      }
      onOpenChange(false);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading") });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{device ? t("edit") : t("add_device")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("device_name")}</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("serial_number")}</Label>
              <Input
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void testConnectionFromForm()}
                  disabled={!formData.ipAddress.trim() || testConnectionMutation.isPending}
                >
                  <Wifi className={`w-3 h-3 ${testConnectionMutation.isPending ? "animate-pulse" : ""}`} />
                  {t("test_connection", { defaultValue: "Test connection" })}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void detectSerialFromConnection({ notifyOnSuccess: true })}
                  disabled={!formData.ipAddress.trim() || discoverDeviceMutation.isPending}
                >
                  <RefreshCw className={`w-3 h-3 ${discoverDeviceMutation.isPending ? "animate-spin" : ""}`} />
                  {t("discover_serial", { defaultValue: "Detect serial" })}
                </Button>
              </div>
              {formErrors.serialNumber && (
                <p className="text-xs text-destructive">{formErrors.serialNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("ip_address")}</Label>
              <Input
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="192.168.1.100"
                required
              />
              {formErrors.ipAddress && (
                <p className="text-xs text-destructive">{formErrors.ipAddress}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t("device_port", { defaultValue: "Port" })}</Label>
              <Input
                type="number"
                min={1}
                max={65535}
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                required
              />
              {formErrors.port && <p className="text-xs text-destructive">{formErrors.port}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("device_model", { defaultValue: "Model" })}</Label>
              <Input
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                placeholder="ZKTeco F22"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("platform", { defaultValue: "Platform" })}</Label>
              <Input
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                placeholder="ZEM500"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("firmware_version", { defaultValue: "Firmware" })}</Label>
              <Input
                value={formData.firmwareVersion}
                onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                placeholder="6.60"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("device_comm_key", { defaultValue: "Comm Key" })}</Label>
              <Input
                value={formData.commKey}
                onChange={(e) => setFormData({ ...formData, commKey: e.target.value })}
                placeholder="optional"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("location")}</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
            {formErrors.location && (
              <p className="text-xs text-destructive">{formErrors.location}</p>
            )}
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!canManage}>
              {device ? t("save") : t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
