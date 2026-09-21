import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadDictionary, type Dictionary } from '../../dictionary/dictionary';
import type { Settings } from '../../engine/types';
import { ArticleEntry } from './ArticleEntry';
import { CodeEntry } from './CodeEntry';
import { DictionaryContext, type DictTarget, type DictionaryContextValue } from './context';

interface Props {
  children: ReactNode;
  settings: Settings;
  favorites: string[];
  toggleFavorite: (code: string) => void;
  selectedCodes: Set<string>;
  toggleAct: (code: string) => void;
}

/** Provides the dictionary to the whole app and shows entries in a side panel (full screen on phones). */
export function DictionaryProvider({ children, settings, favorites, toggleFavorite, selectedCodes, toggleAct }: Props) {
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stack, setStack] = useState<DictTarget[]>([]);
  const loading = useRef(false);

  const ensureLoaded = useCallback(() => {
    if (dict || loading.current) return;
    loading.current = true;
    loadDictionary()
      .then((d) => {
        setDict(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => (loading.current = false));
  }, [dict]);

  const open = useCallback(
    (target: DictTarget) => {
      ensureLoaded();
      setStack((s) => {
        const top = s[s.length - 1];
        const same = top && top.kind === target.kind && (top.kind === 'code' ? top.code === (target as { code: string }).code : top.id === (target as { id: string }).id);
        return same ? s : [...s, target];
      });
    },
    [ensureLoaded],
  );
  const close = useCallback(() => setStack([]), []);
  const back = useCallback(() => setStack((s) => s.slice(0, -1)), []);

  const value: DictionaryContextValue = useMemo(
    () => ({ dict, error, ensureLoaded, open, close, favorites, toggleFavorite, selectedCodes, toggleAct }),
    [dict, error, ensureLoaded, open, close, favorites, toggleFavorite, selectedCodes, toggleAct],
  );

  const top = stack[stack.length - 1];

  return (
    <DictionaryContext.Provider value={value}>
      {children}
      {top && (
        <DictionaryDrawer onClose={close} onBack={stack.length > 1 ? back : undefined} entryKey={top.kind === 'code' ? `c:${top.code}` : `a:${top.id}`}>
          {!dict ? (
            <p className="hint">{error ? `Erreur : ${error}` : 'Chargement du dictionnaire…'}</p>
          ) : top.kind === 'code' ? (
            <CodeEntry key={top.code} code={top.code} dict={dict} settings={settings} />
          ) : (
            <ArticleEntry key={top.id} id={top.id} dict={dict} />
          )}
        </DictionaryDrawer>
      )}
    </DictionaryContext.Provider>
  );
}

interface DrawerProps {
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  /** Identifies the entry shown: the panel scrolls back to the top when it changes. */
  entryKey: string;
}

function DictionaryDrawer({ children, onClose, onBack, entryKey }: DrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [entryKey]);
  return (
    <div className="drawer-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Dictionnaire de la nomenclature" tabIndex={-1} ref={panel}>
        <div className="drawer-bar">
          {onBack ? (
            <button className="icon-text" onClick={onBack}>
              ← Retour
            </button>
          ) : (
            <span className="drawer-title">Dictionnaire</span>
          )}
          <button className="icon" aria-label="Fermer" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="drawer-body" ref={body}>
          {children}
        </div>
      </div>
    </div>
  );
}
