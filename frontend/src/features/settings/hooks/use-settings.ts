import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/features/settings/api/settings";
import type { ApiSettings, ApiSettingsRequest } from "@/types/contracts";

type UseSettingsResult<T> = {
  value: T;
  setValue: (next: T) => void;
  loading: boolean;
  saving: boolean;
  error: string | null;
  save: (override?: T) => Promise<boolean>;
  reload: () => Promise<void>;
  reset: () => void;
};

type UseSettingsOptions = {
  enabled?: boolean;
};

export function useSettings<T>(
  key: keyof ApiSettings,
  initialValue: T,
  options: UseSettingsOptions = {},
): UseSettingsResult<T> {
  const enabled = options.enabled !== false;
  const queryClient = useQueryClient();
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialValue;
      }
    }
    return initialValue;
  });
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiSettings = await getSettings();
      queryClient.setQueryData(["settings"], apiSettings);
      if (apiSettings && Object.prototype.hasOwnProperty.call(apiSettings, key)) {
        const next = apiSettings[key] as T;
        const merged =
          next && typeof next === "object"
            ? ({ ...(initialValue as object), ...(next as object) } as T)
            : next;
        setValue(merged);
        localStorage.setItem(key, JSON.stringify(merged));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [enabled, key, initialValue, queryClient]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (mountedRef.current) return;
    mountedRef.current = true;
    reload().catch(() => {});
  }, [enabled, reload]);

  const save = useCallback(
    async (override?: T) => {
      if (!enabled) {
        setError("Not authorized to access this settings section");
        return false;
      }
      setSaving(true);
      setError(null);
      try {
        const apiPayload = { [key]: override ?? value } as ApiSettingsRequest;
        const saved = await updateSettings(apiPayload);
        queryClient.setQueryData(["settings"], saved);
        if (saved && Object.prototype.hasOwnProperty.call(saved, key)) {
          const next = saved[key] as T;
          const merged =
            next && typeof next === "object"
              ? ({ ...(initialValue as object), ...(next as object) } as T)
              : next;
          setValue(merged);
          localStorage.setItem(key, JSON.stringify(merged));
        } else {
          localStorage.setItem(key, JSON.stringify(override ?? value));
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save settings");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [enabled, key, value, initialValue, queryClient],
  );

  const reset = useCallback(() => {
    setValue(initialValue);
    localStorage.setItem(key, JSON.stringify(initialValue));
  }, [initialValue, key]);

  return { value, setValue, loading, saving, error, save, reload, reset };
}

