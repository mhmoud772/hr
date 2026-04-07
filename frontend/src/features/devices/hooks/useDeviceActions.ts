import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import {
  useBulkDeviceCommand,
  useDeleteDevice,
  useSyncDevice,
} from "@/features/devices/hooks/useDevices";
import type { Device } from "@/types/api";

/**
 * A custom hook to manage device-related mutations and selection state.
 */
export function useDeviceActions(refetch?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const deleteMutation = useDeleteDevice();
  const syncMutation = useSyncDevice();
  const syncAllMutation = useBulkDeviceCommand();

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const confirmDelete = async (selectedDevice: Device | null) => {
    if (!selectedDevice) return;
    try {
      await deleteMutation.mutateAsync(selectedDevice.id);
      toast({ title: t("device_deleted"), description: t("device_deleted_desc") });
      if (refetch) refetch();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleSync = async (id: string) => {
    try {
      await syncMutation.mutateAsync(id);
      toast({ title: t("sync_started"), description: t("sync_started_desc") });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleSyncAll = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await syncAllMutation.mutateAsync({ deviceIds: ids, command: "sync" });
      toast({ title: t("sync_started"), description: t("sync_started_desc") });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    confirmDelete,
    handleSync,
    handleSyncAll,
    isDeleting: deleteMutation.isPending,
    isSyncing: syncMutation.isPending || syncAllMutation.isPending,
  };
}
