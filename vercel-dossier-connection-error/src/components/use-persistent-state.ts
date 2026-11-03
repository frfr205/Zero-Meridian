"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

const PREFIX = "nm-ui-";

export function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = `${PREFIX}${key}`;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // Invalid or unavailable browser storage should never break a puzzle.
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Memory state remains usable. */ }
  }, [hydrated, storageKey, value]);

  useEffect(() => {
    const reset = () => {
      setValue(initialRef.current);
      try { window.localStorage.removeItem(storageKey); } catch { /* no-op */ }
    };
    window.addEventListener("zero-meridian-reset", reset);
    return () => window.removeEventListener("zero-meridian-reset", reset);
  }, [storageKey]);

  return [value, setValue, hydrated];
}
