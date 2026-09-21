import { useCallback, useMemo, useState } from 'react';
import { ENGINE_DATA } from '../engine/data';
import { defaultSettings, mergeSettings } from '../engine/settings';
import type { SelectedAct, SessionOptions } from '../engine/types';
import { DictionaryProvider } from './dictionary/DictionaryProvider';
import { DictionaryScreen } from './dictionary/DictionaryScreen';
import { Disclaimer } from './Disclaimer';
import { RulesScreen } from './RulesScreen';
import { SessionScreen } from './SessionScreen';
import { SettingsScreen } from './SettingsScreen';
import { usePersistentState } from './storage';

type Tab = 'seance' | 'dictionnaire' | 'regles' | 'reglages';

const TABS: { id: Tab; label: string }[] = [
  { id: 'seance', label: 'Séance' },
  { id: 'dictionnaire', label: 'Dictionnaire' },
  { id: 'regles', label: 'Règles' },
  { id: 'reglages', label: 'Réglages' },
];

const NEW_SESSION: SessionOptions = { r1: false, clinicalExam: true };

const parseUsage = (raw: unknown): Record<string, number> =>
  raw && typeof raw === 'object'
    ? Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter(([, v]) => typeof v === 'number') as [string, number][])
    : {};

const parseFavorites = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((c): c is string => typeof c === 'string' && ENGINE_DATA.codes.get(c)?.kind === 'act') : [];

export function App() {
  const [tab, setTab] = useState<Tab>('seance');
  const [settings, setSettings] = usePersistentState('settings', mergeSettings, defaultSettings());
  const [usage, setUsage] = usePersistentState('usage', parseUsage, {});
  const [favorites, setFavorites] = usePersistentState('favorites', parseFavorites, []);
  const [acknowledged, setAcknowledged] = usePersistentState('disclaimer-v1', (v) => v === true, false);

  // Current session (kept in memory only — never stored).
  const [selected, setSelected] = useState<SelectedAct[]>([]);
  const [session, setSession] = useState<SessionOptions>(NEW_SESSION);
  // "Les plus utilisés" is ordered by usage frozen at the start of the session, so that tiles do not
  // move under the finger; it is refreshed for the next patient.
  const [usageSnapshot, setUsageSnapshot] = useState(usage);

  const selectedCodes = useMemo(() => new Set(selected.map((s) => s.code)), [selected]);

  const toggleAct = useCallback(
    (code: string) => {
      if (selectedCodes.has(code)) {
        setSelected((prev) => prev.filter((s) => s.code !== code));
      } else {
        setUsage((u) => ({ ...u, [code]: (u[code] ?? 0) + 1 }));
        setSelected((prev) => [...prev, { code }]);
      }
    },
    [selectedCodes, setUsage],
  );
  const updateAct = (code: string, patch: Partial<SelectedAct>) =>
    setSelected((prev) => prev.map((s) => (s.code === code ? { ...s, ...patch } : s)));
  const toggleFavorite = useCallback(
    (code: string) => setFavorites((f) => (f.includes(code) ? f.filter((c) => c !== code) : [...f, code])),
    [setFavorites],
  );
  const newPatient = () => {
    setSelected([]);
    setSession(NEW_SESSION);
    setUsageSnapshot(usage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { meta } = ENGINE_DATA;

  return (
    <DictionaryProvider settings={settings} favorites={favorites} toggleFavorite={toggleFavorite} selectedCodes={selectedCodes} toggleAct={toggleAct}>
      <div className="app">
        <header className="app-header">
          <div className="brand">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width={32} height={32} />
            <div>
              <h1>Facturation ORL</h1>
              <p className="subtitle">
                <a href={meta.pdfUrl} target="_blank" rel="noreferrer" title="Ouvrir la nomenclature officielle (PDF, cns.public.lu)">
                  Nomenclature CNS {meta.version}
                </a>{' '}
                · lettre-clé {meta.keyLetter.toLocaleString('fr-FR', { minimumFractionDigits: 4 })}
              </p>
            </div>
          </div>
          <nav className="tabs" aria-label="Sections">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        <main>
          {tab === 'seance' && (
            <SessionScreen
              settings={settings}
              selected={selected}
              session={session}
              usage={usageSnapshot}
              favorites={favorites}
              onToggleAct={toggleAct}
              onUpdateAct={updateAct}
              onSession={setSession}
              onToggleFavorite={toggleFavorite}
              onNewPatient={newPatient}
              onOpenSettings={() => setTab('reglages')}
            />
          )}
          {tab === 'dictionnaire' && <DictionaryScreen />}
          {tab === 'regles' && <RulesScreen />}
          {tab === 'reglages' && <SettingsScreen settings={settings} onChange={setSettings} onResetUsage={() => setUsage({})} />}
        </main>

        {!acknowledged && <Disclaimer onAccept={() => setAcknowledged(true)} />}
      </div>
    </DictionaryProvider>
  );
}
