
import { useEffect, useMemo, useState } from "react";
import {
  Fingerprint,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  Settings,
  Search,
  ListChecks,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { useToast } from "@/shared/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { Device, DeviceSyncLog } from "@/types/api";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { useAuth } from "@/features/auth/components/AuthProvider";
import {
  useCreateDevice,
  useDeleteDevice,
  useDevicesQuery,
  useUpdateDevice,
} from "@/features/devices/hooks/useDevices";
import { getDeviceSyncLogs, syncDevice } from "@/features/devices/api/devices";

export default function Devices() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [syncLogs, setSyncLogs] = useState<DeviceSyncLog[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const isRtl = i18n.language === "ar";
  const [statusFilter, setStatusFilter] = useState("all");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    ipAddress: "",
    location: "",
  });

  const canManage = ["system_admin", "admin", "hr_manager"].includes(
    String(user?.role || ""),
  );

  const devicesQuery = useDevicesQuery({
    page,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  const devices = devicesQuery.data?.results ?? [];
  const totalCount = devicesQuery.data?.count ?? devices.length;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const onlineCount = devices.filter((d) => d.status === "online").length;

  useEffect(() => {
    if (!detailsOpen || !selectedDevice?.id) return;
    getDeviceSyncLogs(selectedDevice.id)
      .then(setSyncLogs)
      .catch(() => setSyncLogs([]));
  }, [detailsOpen, selectedDevice?.id]);

  if (devicesQuery.isLoading) {
    return <LoadingState label={t("loading")} />;
  }

  if (devicesQuery.isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={WifiOff}
          title={t("error_loading")}
          actionLabel={t("retry")}
          onAction={() => devicesQuery.refetch()}
        />
      </div>
    );
  }

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t("device_name_required");
    if (!formData.serialNumber.trim()) errors.serialNumber = t("serial_required");
    if (!formData.location.trim()) errors.location = t("location_required");
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(formData.ipAddress)) errors.ipAddress = t("invalid_ip");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    setSelectedDevice(null);
    setFormData({ name: "", serialNumber: "", ipAddress: "", location: "" });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      serialNumber: device.serialNumber,
      ipAddress: device.ipAddress,
      location: device.location,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleDelete = (device: Device) => {
    setSelectedDevice(device);
    setDeleteOpen(true);
  };

  const handleView = (device: Device) => {
    setSelectedDevice(device);
    setDetailsOpen(true);
  };

  const confirmDelete = async () => {
    const deleteTarget = selectedDevice?.id;
    if (!deleteTarget) return;
    try {
      await deleteDevice.mutateAsync(deleteTarget);
      toast({
        title: t("device_deleted"),
        description: t("device_deleted_desc", { name: selectedDevice?.name || "" }),
      });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading") });
    }
    setDeleteOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = {
      name: formData.name,
      serialNumber: formData.serialNumber,
      ipAddress: formData.ipAddress,
      location: formData.location,
    } as Device;

    try {
      if (selectedDevice) {
        await updateDevice.mutateAsync({ id: selectedDevice.id, data: { ...selectedDevice, ...payload } });
        toast({ title: t("device_updated"), description: t("device_updated_desc") });
      } else {
        await createDevice.mutateAsync({
          id: String(Date.now()),
          ...payload,
          status: "offline",
        } as Device);
        toast({ title: t("device_added"), description: t("device_added_desc") });
      }
      setFormOpen(false);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading") });
    }
  };

  const handleSync = async (deviceId: string) => {
    if (!canManage) return;
    setSyncing(deviceId);
    try {
      await syncDevice(deviceId);
      toast({ title: t("sync_success") });
      devicesQuery.refetch();
      if (selectedDevice?.id === deviceId) {
        const logs = await getDeviceSyncLogs(deviceId);
        setSyncLogs(logs);
      }
    } catch {
      toast({ title: t("sync_failed"), variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  const statusLabel = (device: Device) =>
    device.status === "online" ? t("online") : t("offline");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("devices_title")}</h1>
          <p className="text-muted-foreground">{t("devices_subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className={`w-4 h-4 absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
            <Input
              className={`${isRtl ? "pr-9" : "pl-9"} w-56`}
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status_all")}</SelectItem>
              <SelectItem value="online">{t("online")}</SelectItem>
              <SelectItem value="offline">{t("offline")}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!canManage}>
            <Plus className="w-4 h-4 ml-2" />
            {t("add_device")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-sm text-muted-foreground">{t("total_devices")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onlineCount}</p>
              <p className="text-sm text-muted-foreground">{t("online")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount - onlineCount}</p>
              <p className="text-sm text-muted-foreground">{t("offline")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-primary" />
            {t("devices_list")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <EmptyState title={t("no_data")} icon={Fingerprint} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("device_name")}</TableHead>
                  <TableHead>{t("serial_number")}</TableHead>
                  <TableHead>{t("ip_address")}</TableHead>
                  <TableHead>{t("location")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("last_sync")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell className="font-mono text-sm">{device.serialNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{device.ipAddress}</TableCell>
                    <TableCell>{device.location}</TableCell>
                    <TableCell>
                      <Badge variant={device.status === "online" ? "default" : "destructive"}>
                        {device.status === "online" ? (
                          <>
                            <Wifi className="w-3 h-3 ml-1" /> {t("online")}
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3 ml-1" /> {t("offline")}
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{device.lastSync || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(device)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSync(device.id)}
                          disabled={!canManage || syncing === device.id}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(device)} disabled={!canManage}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(device)} disabled={!canManage}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t("previous")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                {t("next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedDevice ? t("edit") : t("add_device")}</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("serial_number")}</Label>
                <Input
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  required
                />
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
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={!canManage}>
                {selectedDevice ? t("save") : t("add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedDevice?.name || ""}
        subtitle={selectedDevice?.serialNumber}
        avatar={
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Fingerprint className="w-6 h-6 text-primary" />
          </div>
        }
        badge={{
          text: selectedDevice ? statusLabel(selectedDevice) : "",
          variant: selectedDevice?.status === "online" ? "default" : "destructive",
        }}
        details={[
          { label: t("ip_address"), value: selectedDevice?.ipAddress || "" },
          { label: t("location"), value: selectedDevice?.location || "" },
          { label: t("last_sync"), value: selectedDevice?.lastSync || "-" },
          { label: t("last_seen"), value: selectedDevice?.lastSeen || "-" },
          { label: t("employee_count"), value: selectedDevice?.employeeCount || 0 },
        ]}
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" disabled>
              <Settings className="w-4 h-4 ml-2" />
              {t("device_settings")}
            </Button>
            <Button className="flex-1" onClick={() => selectedDevice && handleSync(selectedDevice.id)} disabled={!canManage}>
              <RefreshCw className="w-4 h-4 ml-2" />
              {t("sync_now")}
            </Button>
          </div>
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="w-4 h-4 text-primary" />
              <span className="font-medium">{t("sync_logs")}</span>
            </div>
            {syncLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("no_data")}</p>
            ) : (
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <span>{log.message || log.status}</span>
                    <Badge variant={log.status === "success" ? "default" : "secondary"}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DetailsSheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_device_title")}
        description={t("delete_device_desc", { name: selectedDevice?.name || "" })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
