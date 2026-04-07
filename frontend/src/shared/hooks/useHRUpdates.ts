import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getAuthToken } from "@/shared/lib/api-client";

function getWebSocketUrl() {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const currentHost = window.location.host;
  const configuredApiUrl = import.meta.env.VITE_API_URL;
  const configuredWsHost = import.meta.env.VITE_WS_HOST;

  let backendHost = configuredWsHost || currentHost.replace(/:\d+$/, ":8000");
  if (!configuredWsHost && configuredApiUrl) {
    const apiUrl = new URL(configuredApiUrl, window.location.origin);
    const port =
      apiUrl.port || (apiUrl.protocol === "https:" ? "443" : "80");
    backendHost = `${window.location.hostname}:${port}`;
  }

  const url = new URL(`${proto}//${backendHost}/ws/updates/`);
  const token = getAuthToken();
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

/**
 * A hook that connects to the backend WebSocket for real-time HR updates.
 * When a message is received (e.g., changes to employees, attendance, etc.),
 * it invalidates relevant React Query caches automatically.
 */
export function useHRUpdates() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let reconnectDelay = 1000;
    let isUnmounting = false;

    const connect = () => {
      if (ws.current?.readyState === WebSocket.OPEN) return;

      const wsUrl = getWebSocketUrl();
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("HR Updates WebSocket connected.");
        reconnectDelay = 1000; // Reset delay on successful connection
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "update" && data.message) {
            const { model, action } = data.message;
            // The model is typically the lowercase class name, e.g., 'employee', 'attendance', 'auditlog'
            
            // Invalidate specific queries based on the model name
            // Or broadly invalidate everything if we want to ensure freshness
            
            // Standard approach: mapping backend model names to react-query keys
            const keyMapping: Record<string, string> = {
              'employee': 'employees',
              'attendance': 'attendance',
              'auditlog': 'auditLogs',
              'leave': 'leaves',
              'department': 'departments',
              'jobtitle': 'jobTitles',
              'device': 'devices',
              'payrollrecord': 'payroll',
              'recruitmentcandidate': 'candidates',
              'performancereview': 'performance',
              'trainingrecord': 'training',
              'asset': 'assets',
            };

            const queryKey = keyMapping[model] || model;
            
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            
            // Optional: show a small toast for certain critical updates if desired
            // if (model === 'employee' || model === 'attendance') {
            //   toast.info(t("Data updated in real-time"));
            // }
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message", error);
        }
      };

      socket.onclose = () => {
        if (isUnmounting) return;
        console.log("HR Updates WebSocket disconnected. Reconnecting...");
        // Exponential backoff for reconnection
        reconnectTimeout.current = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 1.5, 30000); // Max 30s
          connect();
        }, reconnectDelay);
      };

      socket.onerror = (error) => {
        if (isUnmounting) return;
        console.warn("HR Updates WebSocket error", error);
        socket.close(); // trigger onclose to reconnect
      };

      ws.current = socket;
    };

    connect();

    return () => {
      isUnmounting = true;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnect on intentional unmount
        ws.current.close();
      }
    };
  }, [queryClient, t]);
}
