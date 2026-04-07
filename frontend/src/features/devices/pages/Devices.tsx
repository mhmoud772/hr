import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, FolderSync } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHero } from "@/shared/components/PageHero";
import { DeviceDetailsSheet } from "@/features/devices/components/DeviceDetailsSheet";
import { DeviceFormDialog } from "@/features/devices/components/DeviceFormDialog";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeviceHealthReportQuery } from "@/features/devices/hooks/useDevices";

import { useDeviceFilters } from "../hooks/useDeviceFilters";
import { useDeviceLiveState } from "../hooks/useDeviceLiveState";
import { useDeviceActions } from "../hooks/useDeviceActions";
import { DeviceStats } from "../components/DeviceStats";
import { DeviceFilterBar } from "../components/DeviceFilterBar";
import { DeviceTableView } from "../components/DeviceTableView";
import { DeviceGridView } from "../components/DeviceGridView";
import { DeviceHealthAlert } from "../components/DeviceHealthAlert";
import type { Device } from "@/types/api";

export default function Devices() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  const {
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortValue,
    setSortValue,
    viewMode,
    setViewMode,
  } = useDeviceFilters();

  const {
    devices,
    isLoading,
    totalCount,
    onlineCount,
    offlineDevices,
    refetch,
  } = useDeviceLiveState(
    { page, search: search || undefined, status: statusFilter === "all" ? undefined : statusFilter },
    sortValue
  );

  const {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    confirmDelete,
    handleSync,
    handleSyncAll,
    isDeleting,
    isSyncing,
  } = useDeviceActions(refetch);

  const healthReportQuery = useDeviceHealthReportQuery(30);
  const healthIssues = useMemo(
    () =>
      (healthReportQuery.data?.devices || [])
        .filter((item) => item.inactive || item.failureRatePercent > 0)
        .slice(0, 5),
    [healthReportQuery.data?.devices]
  );

  if (isLoading) return <LoadingState label={t("loading")} />;

  const formatDisplayDate = (value?: string | null) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString(i18n.language === "ar" ? "ar-SA" : "en-US");
    } catch {
      return value;
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("devices_title")}
        subtitle={t("devices_subtitle")}
        icon={FolderSync}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleSyncAll(Array.from(selectedIds))}
              disabled={selectedIds.size === 0 || isSyncing}
            >
              <FolderSync className="w-4 h-4" />
              {t("sync_selected")}
            </Button>
            <Button className="gap-2" onClick={() => { setSelectedDevice(null); setFormOpen(true); }}>
              <Plus className="w-4 h-4" />
              {t("add_device")}
            </Button>
          </div>
        }
      />

      <DeviceStats
        totalCount={totalCount}
        onlineCount={onlineCount}
        offlineCount={offlineDevices.length}
      />

      <DeviceHealthAlert
        healthIssues={healthIssues}
        allHealthRows={healthReportQuery.data?.devices || []}
        showDetails={showHealthDetails}
        setShowDetails={setShowHealthDetails}
        isLoading={healthReportQuery.isLoading}
      />

      <DeviceFilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isRtl={isRtl}
      />

      {devices.length === 0 ? (
        <EmptyState title={t("no_devices_found")} icon={RefreshCw} />
      ) : viewMode === "table" ? (
        <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
          <DeviceTableView
            devices={devices}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onSelectAll={selectAll}
            onView={(d) => { setSelectedDevice(d); setDetailsOpen(true); }}
            onEdit={(d) => { setSelectedDevice(d); setFormOpen(true); }}
            onDelete={(d) => { setSelectedDevice(d); setDeleteOpen(true); }}
            onSync={handleSync}
            canManage={true}
            formatDate={formatDisplayDate}
          />
        </div>
      ) : (
        <DeviceGridView
          devices={devices}
          onView={(d) => { setSelectedDevice(d); setDetailsOpen(true); }}
          onEdit={(d) => { setSelectedDevice(d); setFormOpen(true); }}
          onDelete={(d) => { setSelectedDevice(d); setDeleteOpen(true); }}
          onSync={handleSync}
          canManage={true}
        />
      )}

      {/* Pagination component can be added here if needed, consistent with Employees.tsx */}

      <DeviceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        device={selectedDevice}
        onSuccess={refetch}
      />

      <DeviceDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        device={selectedDevice}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_device_title")}
        description={t("delete_device_desc")}
        onConfirm={() => confirmDelete(selectedDevice)}
        loading={isDeleting}
      />
    </div>
  );
}
