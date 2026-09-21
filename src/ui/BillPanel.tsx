import { useState } from 'react';
import { ENGINE_DATA } from '../engine/data';
import { billCode } from '../engine/optimizer';
import { formatEuros } from '../engine/tariff';
import type { BillOption, Note, OptimizationResult, Settings } from '../engine/types';
import { CodeLink, RichText } from './dictionary/links';

/** Dictionary entry for a bill line ("CGA12M" = material fee without suture of CGA12). */
const entryCode = (code: string) => (ENGINE_DATA.codes.has(code) || !code.endsWith('M') ? code : code.slice(0, -1));

interface Props {
  result: OptimizationResult;
  settings: Settings;
  onReset: () => void;
  onOpenSettings: () => void;
}

export function BillPanel({ result, settings, onReset, onOpenSettings }: Props) {
  const [copied, setCopied] = useState(false);
  const best = result.best;

  if (!best) {
    return (
      <div className="card bill">
        <h2>Facturation</h2>
        <p className="hint">Rien à facturer : sélectionnez un acte ou cochez « Examen clinique réalisé ».</p>
      </div>
    );
  }

  const gain = best.totalCents - result.consultationOnlyCents;
  const undeclared = [
    ...new Set(
      best.actCodes
        .map((c) => ENGINE_DATA.codes.get(c)?.device)
        .filter((d): d is NonNullable<typeof d> => !!d && !settings.devices[d].enabled),
    ),
  ];

  const copy = async () => {
    const text = [
      ...best.lines.map((l) => `${billCode(l)}\t${formatEuros(l.cents)}${l.deviceNumber ? `\tappareil ${l.deviceNumber}` : ''}`),
      `Total\t${formatEuros(best.totalCents)}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="card bill">
      <div className="bill-head">
        <div>
          <h2>Meilleure facturation</h2>
          <p className="route">{best.title}</p>
        </div>
        <div className="total">
          <strong>{formatEuros(best.totalCents)}</strong>
          {result.consultationOnlyCents > 0 && gain !== 0 && (
            <small className={gain > 0 ? 'gain' : 'loss'}>
              {gain > 0 ? '+' : '−'}
              {formatEuros(Math.abs(gain))} vs C17 seule
            </small>
          )}
        </div>
      </div>

      <Lines option={best} />

      <Notes notes={best.notes} />

      {undeclared.length > 0 && (
        <p className="note info">
          ℹ Forfait appareil non compté ({undeclared.map((d) => ENGINE_DATA.devices.find((x) => x.type === d)?.label).join(', ')}) :
          appareil non déclaré dans{' '}
          <button className="link" onClick={onOpenSettings}>
            Réglages
          </button>
          .
        </p>
      )}

      {best.dropped.length > 0 && (
        <div className="dropped">
          <h3>Actes non facturés</h3>
          <ul>
            {best.dropped.map((d) => (
              <li key={d.code}>
                <CodeLink code={d.code} /> <RichText text={d.reason} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions">
        <button className="primary" onClick={copy}>
          {copied ? 'Copié ✓' : 'Copier les codes'}
        </button>
        <button onClick={onReset}>Nouveau patient</button>
      </div>

      {result.alternatives.length > 0 && (
        <details className="alternatives">
          <summary>Autres combinaisons possibles ({result.alternatives.length})</summary>
          {result.alternatives.map((a, i) => (
            <div key={i} className="alternative">
              <div className="alt-head">
                <span>{a.title}</span>
                <strong>{formatEuros(a.totalCents)}</strong>
              </div>
              <p className="alt-codes">
                {a.lines.map((l, j) => (
                  <span key={j}>
                    {j > 0 && ' · '}
                    <CodeLink code={entryCode(l.code)}>{billCode(l)}</CodeLink>
                  </span>
                ))}
              </p>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

function Lines({ option }: { option: BillOption }) {
  return (
    <table className="lines">
      <tbody>
        {option.lines.map((l, i) => (
          <tr key={i} className={l.cents === 0 ? 'unpaid' : undefined}>
            <td className="line-code">
              <CodeLink code={entryCode(l.code)}>
                <span className="code">{l.code}</span>
              </CodeLink>
              {l.suffixes.map((s) => (
                <span key={s} className={`suffix s-${s}`} title={SUFFIX_HELP[s]}>
                  {s}
                </span>
              ))}
            </td>
            <td className="line-label">
              {l.label}
              <small>
                {l.detail}
                {l.deviceNumber ? ` · appareil ${l.deviceNumber}` : ''}
              </small>
            </td>
            <td className="line-amount">{formatEuros(l.cents)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const SUFFIX_HELP: Record<string, string> = {
  R: '2e ou 3e acte technique : 50 % (Art. 9)',
  B: 'Opération bilatérale : 150 % (Art. 9)',
  L: 'Anesthésie locale : 115 % (Art. 13)',
};

const ICON: Record<Note['level'], string> = { warning: '⚠', reminder: '🔔', info: 'ℹ' };

function Notes({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return null;
  return (
    <ul className="notes">
      {notes.map((n, i) => (
        <li key={i} className={`note ${n.level}`}>
          <span aria-hidden>{ICON[n.level]}</span>
          <span>
            {n.level === 'warning' && <span className="badge warn">à valider</span>} <RichText text={n.message} />
            {n.source && <small> — {n.source}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}
