import { apiClient, unwrapList } from "@/shared/lib/api-client";
import type { Notification } from "@/types/api";

export type NotificationsQuery = {
  read?: boolean;
  search?: string;
  channel?: string;
};

export const getNotifications = async (params: NotificationsQuery = {}) => {
  const res = await apiClient.get("/notifications/", { params });
  return unwrapList<Notification>(res.data);
};

export const sendNotification = async (data: Notification) => {
  const res = await apiClient.post("/notifications/", data);
  return res.data as Notification;
};

export const markNotificationsRead = async (ids: string[]) => {
  const res = await apiClient.post("/notifications/mark_read/", { ids });
  return res.data as { updated: number };
};

export const markAllNotificationsRead = async () => {
  const res = await apiClient.post("/notifications/mark_all_read/");
  return res.data as { updated: number };
};

export const subscribeToNotifications = (onMessage: (msg: Notification) => void) => {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const items = await getNotifications();
      items.forEach(onMessage);
    } catch {
      // ignore polling errors
    }
    if (active) {
      setTimeout(poll, 15000);
    }
  };
  poll();
  return () => {
    active = false;
  };
};

// Example: subscribe to WebSocket notifications
// import { subscribeToNotifications } from '@/features/notifications/api/notifications';
//   const ws = subscribeToNotifications((msg) => {

