import React from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Eye, Edit, Trash2, RefreshCw, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { Device } from "@/types/api";

interface DeviceTableViewProps {
  devices: Device[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onView: (device: Device) => void;
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onSync: (id: string) => void;
  canManage: boolean;
  formatDate: (val?: string | null) => string;
}

export function DeviceTableView({
  devices,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onSync,
  canManage,
  formatDate,
}: DeviceTableViewProps) {
  const { t } = useTranslation();

  const allSelected =
    devices.length > 0 && devices.every((d) => selectedIds.has(d.id));

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() =>
                onSelectAll(allSelected ? [] : devices.map((d) => d.id))
              }
            />
          </TableHead>
          <TableHead>{t("device_name")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("location")}</TableHead>
          <TableHead>{t("serial_number")}</TableHead>
          <TableHead>{t("last_seen")}</TableHead>
          <TableHead className="text-right">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.map((device) => (
          <TableRow key={device.id}>
            <TableCell>
              <Checkbox
                checked={selectedIds.has(device.id)}
                onCheckedChange={() => onToggleSelection(device.id)}
              />
            </TableCell>
            <TableCell className="font-medium">
              <div className="flex flex-col">
                {device.name}
                <span className="text-xs text-muted-foreground font-normal">
                  {device.ipAddress}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <StatusDot status={device.status} />
                <Badge
                  variant="secondary"
                  className={
                    device.status === "online"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-destructive/10 text-destructive"
                  }
                >
                  {t(device.status === "online" ? "online_label" : "offline_label")}
                </Badge>
              </div>
            </TableCell>
            <TableCell>{device.location || "-"}</TableCell>
            <TableCell className="font-mono text-xs">
              {device.serialNumber}
            </TableCell>
            <TableCell className="text-xs">
              {formatDate(device.lastSeen)}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
