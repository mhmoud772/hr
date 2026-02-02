import { useState, useEffect } from "react";

export function useSettings<T>(key: string, initialValue: T) {
  const [settings, setSettings] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialValue;
      }
    }
    return initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(settings));
  }, [key, settings]);

  return [settings, setSettings] as const;
}
