import { useMemo } from 'react';
import { ENGINE_DATA } from '../engine/data';
import { optimize } from '../engine/optimizer';
import { formatEuros } from '../engine/tariff';
import type { SelectedAct, SessionOptions, Settings } from '../engine/types';
import { BillPanel } from './BillPanel';
import { CodeCatalog } from './CodeCatalog';
import { SelectedActs } from './SelectedActs';

interface Props {
  settings: Settings;
  selected: SelectedAct[];
  session: SessionOptions;
  usage: Record<string, number>;
  favorites: string[];
  onToggleAct: (code: string) => void;
  onUpdateAct: (code: string, patch: Partial<SelectedAct>) => void;
  onSession: (s: SessionOptions) => void;
  onToggleFavorite: (code: string) => void;
  onNewPatient: () => void;
  onOpenSettings: () => void;
}

export function SessionScreen(p: Props) {
  const { settings, selected, session } = p;
  const result = useMemo(() => optimize(selected, session, settings, ENGINE_DATA), [selected, session, settings]);
  const selectedCodes = useMemo(() => new Set(selected.map((s) => s.code)), [selected]);

  return (
    <div className="session">
      <section className="catalog-column" aria-label="Actes">
        <CodeCatalog
          selected={selectedCodes}
          usage={p.usage}
          favorites={p.favorites}
          settings={settings}
          onToggle={p.onToggleAct}
          onToggleFavorite={p.onToggleFavorite}
        />
      </section>

      <section className="bill-column" id="facture" aria-label="Facturation">
        <SelectedActs selected={selected} session={session} settings={settings} onToggle={p.onToggleAct} onUpdate={p.onUpdateAct} onSession={p.onSession} />
        <BillPanel result={result} settings={settings} onReset={p.onNewPatient} onOpenSettings={p.onOpenSettings} />
      </section>

      <a className="mobile-total" href="#facture" aria-label="Voir la facturation">
        <span>{selected.length ? `${selected.length} acte${selected.length > 1 ? 's' : ''}` : 'Aucun acte'}</span>
        <strong>{formatEuros(result.best?.totalCents ?? 0)}</strong>
        <span className="chevron" aria-hidden>
          ↓
        </span>
      </a>
    </div>
  );
}
