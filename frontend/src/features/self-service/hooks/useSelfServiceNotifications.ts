import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/features/notifications/api/notifications";
import type { Notification } from "@/types/api";

export function useSelfServiceNotifications() {
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [search, setSearch] = useState("");

  const notificationsQuery = useQuery({
    queryKey: ["notifications", filter, search],
    queryFn: () =>
      getNotifications({
        read:
          filter === "all" ? undefined : filter === "read" ? true : false,
        search: search || undefined,
      }),
    refetchInterval: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => notificationsQuery.refetch(),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => notificationsQuery.refetch(),
  });

  const notifications: Notification[] = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalCount = notifications.length;

  return {
    notificationsQuery,
    notifications,
    unreadCount,
    totalCount,
    filter,
    setFilter,
    search,
    setSearch,
    markRead: (ids: string[]) => markReadMutation.mutate(ids),
    markAllRead: () => markAllReadMutation.mutate(),
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}
