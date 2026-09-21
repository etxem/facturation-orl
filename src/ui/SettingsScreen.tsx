import { ENGINE_DATA } from '../engine/data';
import { INTERPRETATIONS } from '../engine/settings';
import { formatEuros } from '../engine/tariff';
import type { DeviceClass, DeviceSetting, Settings } from '../engine/types';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onResetUsage: () => void;
}

const feeEuros = (code: string) => formatEuros(Math.round((ENGINE_DATA.codes.get(code)?.amount ?? 0) * 100));

export function SettingsScreen({ settings, onChange, onResetUsage }: Props) {
  const setDevice = (type: keyof Settings['devices'], patch: Partial<DeviceSetting>) =>
    onChange({ ...settings, devices: { ...settings.devices, [type]: { ...settings.devices[type], ...patch } } });
  const { meta } = ENGINE_DATA;

  return (
    <div className="settings">
      <section className="card">
        <h2>Appareils déclarés à la CNS</h2>
        <p className="hint">
          Les forfaits pour frais d’utilisation d’appareil ne sont dus que pour un appareil installé au cabinet et déclaré à la CNS
          (identifiant unique). Montant plein jusqu’au seuil annuel d’activité ou jusqu’à l’amortissement (5 ans), puis montant
          réduit pour le reste de l’année.
        </p>
        <div className="devices">
          {ENGINE_DATA.devices.map((d) => {
            const s = settings.devices[d.type];
            const classes = Object.entries(d.classes) as [DeviceClass, { full: string; reduced: string; range: string }][];
            const current = d.classes[s.cls] ?? d.classes.I!;
            return (
              <div key={d.type} className={s.enabled ? 'device-card on' : 'device-card'}>
                <label className="check-row">
                  <input type="checkbox" checked={s.enabled} onChange={(e) => setDevice(d.type, { enabled: e.target.checked })} />
                  <span>
                    <strong>{d.label}</strong>
                    <small>
                      Actes : {d.acts.join(', ')} · seuil {d.threshold} actes/an
                    </small>
                  </span>
                </label>
                {s.enabled && (
                  <div className="device-fields">
                    {classes.length > 1 && (
                      <label>
                        Classe
                        <select value={d.classes[s.cls] ? s.cls : 'I'} onChange={(e) => setDevice(d.type, { cls: e.target.value as DeviceClass })}>
                          {classes.map(([cls, c]) => (
                            <option key={cls} value={cls}>
                              {cls} ({c.range})
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div className="segmented" role="group" aria-label="Montant">
                      <button className={s.rate === 'plein' ? 'active' : ''} aria-pressed={s.rate === 'plein'} onClick={() => setDevice(d.type, { rate: 'plein' })}>
                        Plein {current.full} · {feeEuros(current.full)}
                      </button>
                      <button className={s.rate === 'reduit' ? 'active' : ''} aria-pressed={s.rate === 'reduit'} onClick={() => setDevice(d.type, { rate: 'reduit' })}>
                        Réduit {current.reduced} · {feeEuros(current.reduced)}
                      </button>
                    </div>
                    <label>
                      N° d’appareil CNS
                      <input type="text" value={s.number} placeholder="facultatif" onChange={(e) => setDevice(d.type, { number: e.target.value })} />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>Interprétations (zones grises)</h2>
        <p className="hint">
          Par défaut, l’application suit le texte de la nomenclature à la lettre. Ces points sont à confirmer auprès de la CNS ou de
          l’AMMD ; les résultats qui en dépendent sont marqués <span className="badge warn">à valider</span>.
        </p>
        <ul className="switches">
          {INTERPRETATIONS.map((i) => (
            <li key={i.id}>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={settings.switches[i.id]}
                  onChange={(e) => onChange({ ...settings, switches: { ...settings.switches, [i.id]: e.target.checked } })}
                />
                <span>
                  <strong>{i.label}</strong>
                  <small>
                    {i.help} <em>({i.source}{settings.switches[i.id] === i.defaultValue ? ', réglage par défaut' : ', modifié'})</em>
                  </small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Favoris</h2>
        <p className="hint">L’onglet « Favoris » classe les actes selon leur fréquence d’utilisation sur cet appareil.</p>
        <button onClick={onResetUsage}>Réinitialiser les favoris</button>
      </section>

      <section className="card">
        <h2>Données</h2>
        <p>
          Nomenclature CNS, version coordonnée au <strong>{meta.version}</strong> — lettre-clé <strong>{meta.keyLetter.toLocaleString('fr-FR', { minimumFractionDigits: 4 })}</strong>{' '}
          (cote d’application {meta.cote.toLocaleString('fr-FR')}, valable depuis le {meta.validFrom}).
        </p>
        <p>
          <a href={meta.pdfUrl} target="_blank" rel="noreferrer">
            Nomenclature officielle (PDF, version coordonnée au {meta.version})
          </a>{' '}
          ·{' '}
          <a href={meta.sourceUrl} target="_blank" rel="noreferrer">
            toutes les versions sur cns.public.lu
          </a>
          . Seules les publications au Journal officiel font foi.
        </p>
      </section>
    </div>
  );
}
