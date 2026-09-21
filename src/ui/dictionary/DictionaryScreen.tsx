import { useEffect, useMemo, useState } from 'react';
import { searchArticles, searchDictionary, type DictEntry, type Dictionary } from '../../dictionary/dictionary';
import { ENGINE_DATA } from '../../engine/data';
import { formatEuros, tariffCents } from '../../engine/tariff';
import { useDictionary } from './context';
import { ArticleLink, CodeLink } from './links';

type Scope = 'app' | 'all' | 'articles';

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'app', label: 'Codes ORL & cabinet' },
  { id: 'all', label: 'Toute la nomenclature' },
  { id: 'articles', label: 'Dispositions générales' },
];

const APP_CODES = new Set(ENGINE_DATA.list.map((c) => c.code));
/** General acts first, then the ORL chapter, then the other chapters (publication order inside). */
const appOrder = (e: DictEntry) => (e.section.part?.startsWith('PREMIERE') ? 0 : e.section.scope.startsWith('ORL') ? 1 : 2);
const KEY = ENGINE_DATA.meta.keyLetter;
const price = (e: DictEntry) => (e.coef != null ? formatEuros(tariffCents(e.coef, KEY)) : formatEuros(Math.round(e.tarif * 100)));

export function DictionaryScreen() {
  const { dict, error, ensureLoaded } = useDictionary();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('app');
  useEffect(ensureLoaded, [ensureLoaded]);
  const { meta } = ENGINE_DATA;

  return (
    <div className="dictionary card">
      <h2>Dictionnaire de la nomenclature</h2>
      <p className="hint">
        Nomenclature des actes et services des médecins, version coordonnée au {meta.version} —{' '}
        <a href={meta.pdfUrl} target="_blank" rel="noreferrer">
          PDF officiel CNS
        </a>{' '}
        ·{' '}
        <a href={meta.sourceUrl} target="_blank" rel="noreferrer">
          toutes les versions
        </a>
        . Touchez un code pour voir son libellé complet, son tarif, les remarques de la nomenclature, les règles de cumul et les
        articles applicables.
      </p>
      <div className="search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={scope === 'articles' ? 'Rechercher dans les articles (ex. cumul, anesthésie)' : 'Code ou mots du libellé (ex. GDE15, audiométrie)'}
          aria-label="Rechercher dans la nomenclature"
        />
      </div>
      <div className="category-tabs" role="tablist" aria-label="Périmètre">
        {SCOPES.map((s) => (
          <button key={s.id} role="tab" aria-selected={scope === s.id} className={scope === s.id ? 'chip active' : 'chip'} onClick={() => setScope(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      {!dict ? (
        <p className="hint">{error ? `Erreur : ${error}` : 'Chargement du dictionnaire…'}</p>
      ) : scope === 'articles' ? (
        <ArticleList dict={dict} query={query} />
      ) : query.trim() ? (
        <SearchResults dict={dict} query={query} scope={scope} />
      ) : scope === 'app' ? (
        <GroupedCodes entries={dict.entries.filter((e) => APP_CODES.has(e.code)).sort((a, b) => appOrder(a) - appOrder(b))} />
      ) : (
        <Chapters dict={dict} />
      )}
    </div>
  );
}

function CodeRow({ e }: { e: DictEntry }) {
  const { favorites } = useDictionary();
  return (
    <li>
      <CodeLink code={e.code} className="row">
        <span className="code">{e.code}</span>
        <span className="dict-row-label">{e.label}</span>
        <span className="price">
          {favorites.includes(e.code) && <span aria-label="favori">★ </span>}
          {price(e)}
        </span>
      </CodeLink>
    </li>
  );
}

function SearchResults({ dict, query, scope }: { dict: Dictionary; query: string; scope: Scope }) {
  const results = searchDictionary(dict, query, scope === 'app' ? APP_CODES : undefined);
  const articles = searchArticles(dict, query).slice(0, 5);
  return (
    <>
      {results.length === 0 && <p className="empty">Aucun code ne correspond à « {query} »{scope === 'app' ? ' dans les codes de l’application — essayez « Toute la nomenclature »' : ''}.</p>}
      <ul className="dict-list">
        {results.map((e) => (
          <CodeRow key={e.code} e={e} />
        ))}
      </ul>
      {articles.length > 0 && (
        <>
          <h3>Articles mentionnant « {query} »</h3>
          <div className="dict-chips">
            {articles.map((a) => (
              <ArticleLink key={a.id} id={a.id}>
                Art. {a.id}
                {a.title ? ` · ${a.title}` : ''}
              </ArticleLink>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/** Codes listed under their section / sub-section headings, in publication order. */
function GroupedCodes({ entries }: { entries: DictEntry[] }) {
  const blocks = useMemo(() => {
    const out: { heading: string; entries: DictEntry[] }[] = [];
    for (const e of entries) {
      const heading = [e.section.chapter, e.section.section, e.section.subsection, e.section.group].filter(Boolean).join(' › ');
      const last = out[out.length - 1];
      if (last && last.heading === heading) last.entries.push(e);
      else out.push({ heading, entries: [e] });
    }
    return out;
  }, [entries]);
  return (
    <>
      {blocks.map((b, i) => (
        <section key={i} className="dict-block">
          <h3>{b.heading}</h3>
          <ul className="dict-list">
            {b.entries.map((e) => (
              <CodeRow key={e.code} e={e} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function Chapters({ dict }: { dict: Dictionary }) {
  const chapters = useMemo(() => {
    const out: { key: string; title: string; entries: DictEntry[] }[] = [];
    for (const e of dict.entries) {
      const key = `${e.section.part}|${e.section.chapter}`;
      const last = out[out.length - 1];
      if (last && last.key === key) last.entries.push(e);
      else out.push({ key, title: `${e.section.part?.startsWith('PREMIERE') ? '1re partie' : '2e partie'} · ${e.section.chapter ?? ''}`, entries: [e] });
    }
    return out;
  }, [dict]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <div className="dict-chapters">
      {chapters.map((c) => (
        <details key={c.key} open={openKey === c.key} onToggle={(e) => (e.currentTarget.open ? setOpenKey(c.key) : openKey === c.key && setOpenKey(null))}>
          <summary>
            {c.title} <small>({c.entries.length} codes)</small>
          </summary>
          {openKey === c.key && <GroupedCodes entries={c.entries} />}
        </details>
      ))}
    </div>
  );
}

function ArticleList({ dict, query }: { dict: Dictionary; query: string }) {
  const articles = searchArticles(dict, query);
  return (
    <ul className="dict-list">
      {articles.map((a) => (
        <li key={a.id}>
          <ArticleLink id={a.id}>
            <span className="code">Art. {a.id === '1' ? '1er' : a.id}</span> <span className="dict-row-label">{a.title ?? a.paragraphs[0].slice(0, 90) + '…'}</span>
          </ArticleLink>
        </li>
      ))}
      {articles.length === 0 && <li className="empty">Aucun article ne contient « {query} ».</li>}
    </ul>
  );
}
