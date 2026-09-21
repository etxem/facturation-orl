import { useMemo, useState } from 'react';
import { ENGINE_DATA } from '../engine/data';
import { remindersFor } from '../engine/rules';
import { formatEuros, tariffCents } from '../engine/tariff';
import type { CategoryId, CodeDef, Settings } from '../engine/types';
import { useDictionary } from './dictionary/context';

type Tab = 'favoris' | Exclude<CategoryId, 'bloc' | 'general'>;

const TABS: { id: Tab; label: string }[] = [
  { id: 'favoris', label: '★ Favoris' },
  { id: 'oreille', label: 'Oreille' },
  { id: 'nez', label: 'Nez & sinus' },
  { id: 'pharynx', label: 'Pharynx & larynx' },
  { id: 'glandes', label: 'Cou & glandes' },
  { id: 'echo', label: 'Échographie' },
  { id: 'allergo', label: 'Allergologie' },
  { id: 'peau', label: 'Peau, plaies & bouche' },
];

/** Suggestions shown in "Les plus utilisés" until usage statistics exist. */
const SUGGESTIONS = ['GDE11', 'GFQ12', 'GFQ13', 'GFQ18', 'GDE14', 'GDE15', 'GFE11', 'GDE12', 'GQD11', 'GFQ19', 'GZQ11', 'GPD13'];
const FREQUENT_COUNT = 12;

const ACTS = ENGINE_DATA.list.filter((c) => c.kind === 'act' && c.cabinet);
const KEY = ENGINE_DATA.meta.keyLetter;
const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const HAYSTACK = new Map(ACTS.map((c) => [c.code, normalize([c.code, c.short, c.label, ...c.keywords].join(' '))]));

interface Props {
  selected: Set<string>;
  usage: Record<string, number>;
  favorites: string[];
  settings: Settings;
  onToggle: (code: string) => void;
  onToggleFavorite: (code: string) => void;
}

export function CodeCatalog({ selected, usage, favorites, settings, onToggle, onToggleFavorite }: Props) {
  const [tab, setTab] = useState<Tab>('favoris');
  const [query, setQuery] = useState('');

  const favoriteDefs = useMemo(
    () => favorites.map((c) => ENGINE_DATA.codes.get(c)).filter((c): c is CodeDef => c?.kind === 'act'),
    [favorites],
  );
  const frequent = useMemo(() => {
    const used = ACTS.filter((c) => (usage[c.code] ?? 0) > 0 && !favorites.includes(c.code)).sort(
      (a, b) => (usage[b.code] ?? 0) - (usage[a.code] ?? 0) || a.code.localeCompare(b.code),
    );
    if (used.length > 0) return { title: 'Les plus utilisés', list: used.slice(0, FREQUENT_COUNT) };
    const suggestions = SUGGESTIONS.filter((c) => !favorites.includes(c)).map((c) => ENGINE_DATA.codes.get(c)!);
    return { title: 'Suggestions', list: suggestions };
  }, [usage, favorites]);

  const shown: CodeDef[] = useMemo(() => {
    const q = normalize(query.trim());
    if (q) {
      const terms = q.split(/\s+/);
      return ACTS.filter((c) => terms.every((t) => HAYSTACK.get(c.code)!.includes(t)));
    }
    return tab === 'favoris' ? [] : ACTS.filter((c) => c.category === tab);
  }, [query, tab]);

  const tile = (c: CodeDef) => (
    <CodeTile
      key={c.code}
      def={c}
      selected={selected.has(c.code)}
      favorite={favorites.includes(c.code)}
      settings={settings}
      onToggle={onToggle}
      onToggleFavorite={onToggleFavorite}
    />
  );

  return (
    <div className="catalog">
      <div className="search">
        <input
          type="search"
          placeholder="Rechercher un acte ou un code (ex. audiogramme, GDE15, épistaxis)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un acte"
        />
      </div>
      {!query && (
        <div className="category-tabs" role="tablist" aria-label="Catégories">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'chip active' : 'chip'} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {!query && tab === 'favoris' ? (
        <>
          <h3 className="tiles-heading">Mes favoris</h3>
          {favoriteDefs.length === 0 ? (
            <p className="hint">Touchez ☆ sur un acte, dans n’importe quelle catégorie ou dans le dictionnaire, pour l’épingler ici.</p>
          ) : (
            <div className="tiles">{favoriteDefs.map(tile)}</div>
          )}
          {frequent.list.length > 0 && (
            <>
              <h3 className="tiles-heading">
                {frequent.title}
                {frequent.title === 'Les plus utilisés' && <small> mis à jour à chaque nouveau patient</small>}
              </h3>
              <div className="tiles">{frequent.list.map(tile)}</div>
            </>
          )}
        </>
      ) : (
        <>
          {shown.length === 0 && <p className="empty">Aucun acte ne correspond à « {query} ». Le dictionnaire couvre toute la nomenclature.</p>}
          <div className="tiles">{shown.map(tile)}</div>
        </>
      )}
    </div>
  );
}

interface TileProps {
  def: CodeDef;
  selected: boolean;
  favorite: boolean;
  settings: Settings;
  onToggle: (code: string) => void;
  onToggleFavorite: (code: string) => void;
}

function CodeTile({ def, selected, favorite, settings, onToggle, onToggleFavorite }: TileProps) {
  const { open } = useDictionary();
  const reminders = remindersFor([def.code], ENGINE_DATA.rules);
  const deviceOn = def.device ? settings.devices[def.device].enabled : false;
  return (
    <div className={selected ? 'tile selected' : 'tile'}>
      <button className="tile-main" aria-pressed={selected} onClick={() => onToggle(def.code)} title={def.label}>
        <span className="code">{def.code}</span>
        <span className="tile-label">{def.short}</span>
        <span className="tile-bottom">
          <span className="badges">
            {def.cac ? <span className="badge cac">CAC</span> : <span className="badge nocac">non CAC</span>}
            {deviceOn && <span className="badge device">+ forfait</span>}
            {(def.materialFee || def.noSutureFee) && <span className="badge device">+ matériel</span>}
            {reminders.length > 0 && <span className="badge remind">conditions</span>}
            {!def.cabinet && <span className="badge">bloc</span>}
          </span>
          <span className="price">{formatEuros(tariffCents(def.coef!, KEY))}</span>
        </span>
      </button>
      <span className="tile-tools">
        <button
          className={favorite ? 'tool star on' : 'tool star'}
          aria-pressed={favorite}
          aria-label={favorite ? `Retirer ${def.code} des favoris` : `Ajouter ${def.code} aux favoris`}
          title={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={() => onToggleFavorite(def.code)}
        >
          {favorite ? '★' : '☆'}
        </button>
        <button className="tool info" aria-label={`Informations sur ${def.code}`} title="Dictionnaire" onClick={() => open({ kind: 'code', code: def.code })}>
          <span className="info-glyph" aria-hidden>
            i
          </span>
        </button>
      </span>
      {selected && (
        <span className="check" aria-hidden>
          ✓
        </span>
      )}
    </div>
  );
}
