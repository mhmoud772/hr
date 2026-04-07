/**
 * useRealtimeNotifications
 * ─────────────────────────
 * نظام إشعارات هجين: WebSocket أولاً مع Polling كنسخة احتياطية.
 *
 * 1. يحاول الاتصال بـ WebSocket /ws/updates/
 * 2. عند وصول رسالة "ping" من الخادم → يرد بـ "pong" (Keepalive)
 * 3. عند وصول إشعار جديد → يُظهر toast + browser notification
 * 4. إذا فشل WebSocket → يتراجع تلقائياً لـ Polling كل 15 ثانية
 * 5. يعيد الاتصال تلقائياً بعد Disconnect (Exponential Backoff)
 */
import { useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getAuthToken } from "@/shared/lib/api-client";
import { useToast } from "@/shared/hooks/use-toast";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeNotification } from "@/shared/lib/normalizers/features";
import type { ApiNotification, ApiPaginatedNotificationList } from "@/types/contracts";
import type { Notification } from "@/types/api";

const POLL_INTERVAL_MS = 20_000;       // fallback polling
const WS_RECONNECT_INITIAL_MS = 1_000; // أول إعادة محاولة
const WS_RECONNECT_MAX_MS = 30_000;    // أقصى انتظار

async function fetchUnread(): Promise<Notification[]> {
  const res = await apiClient.get("/notifications/", { params: { read: false } });
  return normalizePaginatedList(
    res.data as ApiPaginatedNotificationList | ApiNotification[],
    normalizeNotification,
  ).results;
}

function getWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  // في dev، الباك إند على 8000
  const backendHost = import.meta.env.VITE_WS_HOST || host.replace(/:\d+$/, ":8000");
  const url = new URL(`${proto}//${backendHost}/ws/updates/`);
  const token = getAuthToken();
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prevCountRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(WS_RECONNECT_INITIAL_MS);
  const wsReadyRef = useRef(false);

  // ─── Polling Fallback ───────────────────────────────────────────────
  const query = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: fetchUnread,
    refetchInterval: wsReadyRef.current ? false : POLL_INTERVAL_MS,
    staleTime: 10_000,
  });

  const notifications = useMemo(() => query.data ?? [], [query.data]);
  const unreadCount = notifications.length;

  // ─── Toast / Browser Notification ──────────────────────────────────
  const notifyUser = useCallback((title: string, body: string) => {
    toast({ title, description: body });
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/logo.svg" });
    }
  }, [toast]);

  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = unreadCount;
      return;
    }
    if (unreadCount > prevCountRef.current) {
      const newest = notifications[0];
      if (newest) {
        notifyUser(newest.title, newest.description ?? "");
      }
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, notifications, notifyUser]);

  // ─── WebSocket Connection ───────────────────────────────────────────
  const connectWs = useCallback(() => {
    // لا تحاول الاتصال إذا كان هناك اتصال مفتوح
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(getWsUrl());
    } catch {
      return; // المتصفح لا يدعم WebSocket أو URL خاطئ
    }
    wsRef.current = ws;

    ws.onopen = () => {
      wsReadyRef.current = true;
      reconnectDelayRef.current = WS_RECONNECT_INITIAL_MS; // reset backoff
      // أوقف الـ polling عند نجاح الاتصال
      queryClient.setQueryDefaults(["notifications", "unread"], {
        refetchInterval: false,
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ping") {
          // Keepalive — رد بـ pong
          ws.send(JSON.stringify({ type: "pong" }));
        } else if (data.type === "notification" && data.notification) {
          const n = data.notification;
          notifyUser(n.title, n.body ?? "");
          // تحديث الكاش
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } else if (data.type === "update") {
          // بيانات محدّثة من الخادم
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          if (data.payload?.resource) {
            queryClient.invalidateQueries({ queryKey: [data.payload.resource] });
          }
        } else if (data.type === "connected") {
          // أُرسل عند الاتصال — يحتوي على عدد غير المقروءة
          prevCountRef.current = data.unreadCount ?? 0;
        }
      } catch {
        // ليس JSON صالحاً
      }
    };

    ws.onclose = () => {
      wsReadyRef.current = false;
      wsRef.current = null;
      // أعد تشغيل Polling احتياطياً
      queryClient.setQueryDefaults(["notifications", "unread"], {
        refetchInterval: POLL_INTERVAL_MS,
      });
      // إعادة الاتصال مع Exponential Backoff
      const delay = Math.min(reconnectDelayRef.current * 2, WS_RECONNECT_MAX_MS);
      reconnectDelayRef.current = delay;
      reconnectTimerRef.current = setTimeout(connectWs, delay);
    };

    ws.onerror = () => {
      ws.close(); // سيُشغّل onclose تلقائياً
    };
  }, [queryClient, notifyUser]);

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connectWs]);

  // ─── Public API ─────────────────────────────────────────────────────
  const markAllRead = async () => {
    await apiClient.post("/notifications/mark_all_read/");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markRead = async (ids: string[]) => {
    await apiClient.post("/notifications/mark_read/", { ids });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isRealtime: wsReadyRef.current,
    markAllRead,
    markRead,
    refetch: query.refetch,
  };
}

/** يُستدعى مرة واحدة عند تشغيل التطبيق لطلب إذن الإشعارات */
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}
