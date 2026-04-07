import { useMemo } from "react";
import { useDevicesQuery, useDevicesLiveQuery } from "@/features/devices/hooks/useDevices";
import { parseSortValue, sortRows } from "@/shared/lib/tableUtils";
import type { Device } from "@/types/api";

/**
 * A custom hook to manage the synchronization between base database state and live device heartbeat updates.
 */
export function useDeviceLiveState(apiParams: { page: number; search?: string; status?: string }, sortValue: string) {
  const devicesQuery = useDevicesQuery(apiParams);
  const liveDevicesQuery = useDevicesLiveQuery(apiParams, 10000);

  const baseDevices = useMemo(() => devicesQuery.data?.results ?? [], [devicesQuery.data]);
  const liveDevices = useMemo(() => liveDevicesQuery.data?.results ?? [], [liveDevicesQuery.data]);
  
  const liveDevicesById = useMemo(
    () => new Map(liveDevices.map((item) => [item.id, item])),
    [liveDevices]
  );

  const devices = useMemo(
    () =>
      baseDevices.map((device) => {
        const live = liveDevicesById.get(device.id);
        if (!live) return device;
        return {
          ...device,
          status: live.status,
          lastSeen: live.lastSeen,
          lastHeartbeat: live.lastHeartbeat,
          lastSync: live.lastSync,
          employeeCount: live.employeeCount,
        };
      }),
    [baseDevices, liveDevicesById]
  );

  const { key: sortKey, direction } = parseSortValue(sortValue);
  const sortedDevices = useMemo(
    () =>
      sortRows(
        devices,
        sortKey,
        direction,
        {
          name: (device) => device.name,
          status: (device) => device.status,
          location: (device) => device.location,
          serialNumber: (device) => device.serialNumber,
          lastSync: (device) => device.lastSync || "",
          lastSeen: (device) => device.lastSeen || "",
        },
      ),
    [devices, sortKey, direction]
  );

  return {
    devices: sortedDevices,
    isLoading: devicesQuery.isLoading,
    isLiveLoading: liveDevicesQuery.isLoading,
    totalCount: devicesQuery.data?.count ?? devices.length,
    onlineCount: devices.filter((d) => d.status === "online").length,
    offlineDevices: liveDevices.filter((d) => d.status === "offline"),
    refetch: () => {
      devicesQuery.refetch();
      liveDevicesQuery.refetch();
    },
  };
}
