import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "borapass:selected-city";

type Selected = { id: string; name: string; state: string | null } | null;

const listeners = new Set<(v: Selected) => void>();
let current: Selected = null;

function read(): Selected {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Selected) : null;
  } catch {
    return null;
  }
}

export function useSelectedCity() {
  const [city, setCity] = useState<Selected>(current);

  useEffect(() => {
    if (current === null) current = read();
    setCity(current);
    const cb = (v: Selected) => setCity(v);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const update = useCallback((v: Selected) => {
    current = v;
    if (typeof window !== "undefined") {
      if (v) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
      else window.localStorage.removeItem(STORAGE_KEY);
    }
    listeners.forEach((l) => l(v));
  }, []);

  return [city, update] as const;
}
