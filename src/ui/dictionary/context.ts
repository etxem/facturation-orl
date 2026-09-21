import { createContext, useContext } from 'react';
import type { Dictionary } from '../../dictionary/dictionary';

export type DictTarget = { kind: 'code'; code: string } | { kind: 'article'; id: string };

export interface DictionaryContextValue {
  /** Loaded dictionary, or null while loading. */
  dict: Dictionary | null;
  error: string | null;
  ensureLoaded: () => void;
  open: (target: DictTarget) => void;
  close: () => void;
  favorites: string[];
  toggleFavorite: (code: string) => void;
  selectedCodes: Set<string>;
  toggleAct: (code: string) => void;
}

export const DictionaryContext = createContext<DictionaryContextValue | null>(null);

export function useDictionary(): DictionaryContextValue {
  const ctx = useContext(DictionaryContext);
  if (!ctx) throw new Error('useDictionary must be used inside <DictionaryProvider>');
  return ctx;
}
