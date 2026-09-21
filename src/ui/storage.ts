import { useCallback, useState } from 'react';

const PREFIX = 'facturation-orl:';

export function readStored<T>(key: string, parse: (raw: unknown) => T, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode…): settings simply are not remembered.
  }
}

/** useState persisted in localStorage (settings, favourites — never patient data). */
export function usePersistentState<T>(key: string, parse: (raw: unknown) => T, fallback: T) {
  const [value, setValue] = useState<T>(() => readStored(key, parse, fallback));
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeStored(key, v);
        return v;
      });
    },
    [key],
  );
  return [value, update] as const;
}
