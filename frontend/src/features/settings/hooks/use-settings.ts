import { useCallback, useEffect, useRef, useState } from "react";
import { getSettings, updateSettings } from "@/features/settings/api/settings";
import type { SettingsPayload } from "@/types/api";

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

export function useSettings<T>(key: keyof SettingsPayload, initialValue: T): UseSettingsResult<T> {
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiSettings = await getSettings();
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
  }, [key, initialValue]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    reload().catch(() => {});
  }, [reload]);

  const save = useCallback(
    async (override?: T) => {
      setSaving(true);
      setError(null);
      try {
        const payload = { [key]: override ?? value } as SettingsPayload;
        const saved = await updateSettings(payload);
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
    [key, value, initialValue],
  );

  const reset = useCallback(() => {
    setValue(initialValue);
    localStorage.setItem(key, JSON.stringify(initialValue));
  }, [initialValue, key]);

  return { value, setValue, loading, saving, error, save, reload, reset };
}

