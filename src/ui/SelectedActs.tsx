import { ENGINE_DATA } from '../engine/data';
import type { SelectedAct, SessionOptions, Settings } from '../engine/types';
import { CodeLink } from './dictionary/links';

interface Props {
  selected: SelectedAct[];
  session: SessionOptions;
  onToggle: (code: string) => void;
  onUpdate: (code: string, patch: Partial<SelectedAct>) => void;
  onSession: (s: SessionOptions) => void;
  settings: Settings;
}

export function SelectedActs({ selected, session, onToggle, onUpdate, onSession, settings }: Props) {
  return (
    <div className="card selected-acts">
      <h2>Actes réalisés</h2>
      {selected.length === 0 ? (
        <p className="hint">Touchez les actes effectués pendant la séance. La consultation C17 est évaluée automatiquement.</p>
      ) : (
        <ul>
          {selected.map((s) => {
            const def = ENGINE_DATA.codes.get(s.code)!;
            const bilateral = def.bilateral && settings.switches.bilateralSmallActs;
            return (
              <li key={s.code}>
                <div className="selected-head">
                  <CodeLink code={def.code} className="selected-link">
                    <span className="code">{def.code}</span> <span className="selected-label">{def.short}</span>
                  </CodeLink>
                  <button className="icon" aria-label={`Retirer ${def.code}`} onClick={() => onToggle(def.code)}>
                    ×
                  </button>
                </div>
                {(bilateral || def.localAnesthesia === 'allowed' || def.noSutureFee) && (
                  <div className="modifiers">
                    {bilateral && (
                      <Toggle on={!!s.bilateral} onChange={(v) => onUpdate(def.code, { bilateral: v })} label="Bilatéral (B)" />
                    )}
                    {def.localAnesthesia === 'allowed' && (
                      <Toggle on={!!s.localAnesthesia} onChange={(v) => onUpdate(def.code, { localAnesthesia: v })} label="Anesthésie locale par infiltration (L)" />
                    )}
                    {def.noSutureFee && <Toggle on={!!s.noSuture} onChange={(v) => onUpdate(def.code, { noSuture: v })} label="Sans suture (+ matériel)" />}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="session-options">
        <label className="check-row">
          <input type="checkbox" checked={session.clinicalExam} onChange={(e) => onSession({ ...session, clinicalExam: e.target.checked })} />
          <span>
            Examen clinique réalisé
            <small>Décochez pour une séance technique sans examen (série) : pas de consultation possible (Art. 10).</small>
          </span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={session.r1} onChange={(e) => onSession({ ...session, r1: e.target.checked })} />
          <span>
            Rapport R1 au médecin traitant
            <small>Si l’ordonnance demande expressément un avis et que vous ne poursuivez pas le traitement (Art. 18).</small>
          </span>
        </label>
      </div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button className={on ? 'toggle on' : 'toggle'} aria-pressed={on} onClick={() => onChange(!on)}>
      {label}
    </button>
  );
}
