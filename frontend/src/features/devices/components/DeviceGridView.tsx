import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Wifi,
  WifiOff,
  MoreVertical,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { Device } from "@/types/api";

interface DeviceGridViewProps {
  devices: Device[];
  onView: (device: Device) => void;
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onSync: (id: string) => void;
  canManage: boolean;
}

export function DeviceGridView({
  devices,
  onView,
  onEdit,
  onDelete,
  onSync,
  canManage,
}: DeviceGridViewProps) {
  const { t } = useTranslation();

  const StatusDot = ({ status }: { status: string }) => {
    const online = status === "online";
    return (
      <span className="relative flex h-2.5 w-2.5">
        {online && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${online ? "bg-emerald-500" : "bg-destructive"}`}></span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {devices.map((device) => (
        <Card key={device.id} className="bg-card border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot status={device.status} />
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                {device.model || t("device_badge", { defaultValue: "Device" })}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(device)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("view_details")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit(device)}
                  disabled={!canManage}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSync(device.id)}
                  disabled={!canManage || device.status !== "online"}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("sync_now")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(device)}
                  disabled={!canManage}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="space-y-4">
              <div>
                <CardTitle className="text-base line-clamp-1">{device.name}</CardTitle>
                <p className="text-xs text-muted-foreground font-mono">{device.ipAddress}:{device.port}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted px-2 py-1.5 rounded">
                  <p className="text-muted-foreground mb-0.5">{t("employees")}</p>
                  <p className="font-semibold">{device.employeeCount || 0}</p>
                </div>
                <div className="bg-muted px-2 py-1.5 rounded">
                  <p className="text-muted-foreground mb-0.5">{t("logs_label", { defaultValue: "Logs" })}</p>
                  <p className="font-semibold">{device.logCount || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {device.status === "online" ? (
                  <Wifi className="w-3 h-3 text-emerald-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-destructive" />
                )}
                <span>{device.location || t("no_location")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
