/**
 * Nomenclature dictionary: every code of the publication with its section, the remarks
 * ("REMARQUES") and the general provisions (Art. 1er–21). Pure functions, loaded on demand.
 */
import { inScope } from '../engine/scope';
import type { DictArticle, DictionaryData, DictRemark, DictSection } from './types';

export interface DictEntry {
  code: string;
  label: string;
  coef: number | null;
  tarif: number;
  page: number;
  position: string | null;
  section: DictSection;
}

export interface DictRemarkEntry extends DictRemark {
  section: DictSection;
}

export interface Dictionary {
  version: string;
  pdfUrl: string;
  entries: DictEntry[];
  byCode: Map<string, DictEntry>;
  remarks: DictRemarkEntry[];
  articles: DictArticle[];
  articleById: Map<string, DictArticle>;
}

export function buildDictionary(data: DictionaryData): Dictionary {
  const entries = data.codes.map(([code, label, coef, tarif, page, position, s]) => ({
    code,
    label,
    coef,
    tarif,
    page,
    position,
    section: data.sections[s],
  }));
  return {
    version: data.version,
    pdfUrl: data.pdfUrl,
    entries,
    byCode: new Map(entries.map((e) => [e.code, e])),
    remarks: data.remarks.map((r) => ({ ...r, section: data.sections[r.s] })),
    articles: data.articles,
    articleById: new Map(data.articles.map((a) => [a.id, a])),
  };
}

const CODE_TOKEN = /\b[0-9A-Z]{2,7}\b/g;

/** Codes of the dictionary mentioned in a text. */
export function codesIn(text: string, dict: Dictionary): string[] {
  return [...new Set((text.match(CODE_TOKEN) ?? []).filter((t) => dict.byCode.has(t)))];
}

export interface RelevantRemark {
  remark: DictRemarkEntry;
  /** The remark names the code explicitly. */
  mentions: boolean;
  /** The remark belongs to the code's own section / sub-section. */
  sameScope: boolean;
}

/**
 * Remarks that concern a code: those of its own section/sub-section that name it, name no code at
 * all or speak about "la présente (sous-)section", plus remarks elsewhere that name it.
 */
export function relevantRemarks(dict: Dictionary, code: string): RelevantRemark[] {
  const entry = dict.byCode.get(code);
  if (!entry) return [];
  const out: RelevantRemark[] = [];
  for (const remark of dict.remarks) {
    const named = codesIn(remark.t, dict);
    const mentions = named.includes(code);
    const sameScope = inScope(entry.section.scope, remark.section.scope);
    const general = named.length === 0 || /présente (sous-)?section/i.test(remark.t);
    if (mentions || (sameScope && general)) out.push({ remark, mentions, sameScope });
  }
  return out;
}

/** Other codes of the same sub-section (or section), in publication order. */
export function siblings(dict: Dictionary, code: string): DictEntry[] {
  const entry = dict.byCode.get(code);
  if (!entry) return [];
  return dict.entries.filter((e) => e.section.scope === entry.section.scope && e.code !== code);
}

/** Articles of the general provisions most relevant to a code. */
export function articlesForCode(entry: DictEntry, extra: { localAnesthesia?: boolean } = {}): string[] {
  const ids = new Set<string>(['4']);
  const { part, chapter } = entry.section;
  const label = entry.label;
  const code = entry.code;
  if (part?.startsWith('PREMIERE')) {
    if (chapter?.startsWith('Chapitre 1 ') || chapter?.startsWith('Chapitre 2 ')) ids.add('5').add('10');
    if (chapter?.startsWith('Chapitre 2 ')) ids.add('6').add('7');
    if (chapter?.startsWith('Chapitre 4 ')) ids.add('7');
    if (chapter?.startsWith('Chapitre 5 ')) ids.add('18').add('10');
  } else {
    ids.add('9').add('10');
    if (extra.localAnesthesia || /anesthésie locale/i.test(label)) ids.add('13');
    if (chapter?.startsWith('Chapitre 3 ')) ids.add('15quater');
    if (/M$/.test(code) || /matériel|location/i.test(label)) ids.add('15');
    if (chapter?.startsWith('Chapitre 8 ') || /échographie|echographie|cone beam/i.test(label)) ids.add('17');
  }
  if (/\bA?PCM\b|\bACM\b/.test(label)) ids.add('3');
  return [...ids];
}

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Searches codes by code (exact match first, then prefix) and by words of the label.
 * `restrictTo` limits the search to a set of codes (e.g. the codes used by the app).
 */
export function searchDictionary(dict: Dictionary, query: string, restrictTo?: Set<string>, limit = 150): DictEntry[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const pool = restrictTo ? dict.entries.filter((e) => restrictTo.has(e.code)) : dict.entries;
  const upper = query.trim().toUpperCase();
  const exact = pool.filter((e) => e.code === upper);
  const prefix = pool.filter((e) => e.code !== upper && e.code.startsWith(upper));
  const terms = q.split(/\s+/);
  const words = pool.filter(
    (e) => !e.code.startsWith(upper) && terms.every((t) => normalize(`${e.code} ${e.label} ${e.section.subsection ?? ''} ${e.section.section ?? ''}`).includes(t)),
  );
  return [...exact, ...prefix, ...words].slice(0, limit);
}

export function searchArticles(dict: Dictionary, query: string): DictArticle[] {
  const q = normalize(query.trim());
  if (!q) return dict.articles;
  const terms = q.split(/\s+/);
  return dict.articles.filter((a) => {
    const hay = normalize(`art ${a.id} article ${a.id} ${a.title ?? ''} ${a.paragraphs.join(' ')}`);
    return terms.every((t) => hay.includes(t));
  });
}

const prettyPart = (p: string) =>
  p.startsWith('PREMIERE') ? '1re partie · Actes généraux' : p.startsWith('DEUXIEME') ? '2e partie · Actes techniques' : p;

/** ["2e partie · Actes techniques", "Chapitre 3 - Oto-Rhino-Laryngologie", "Section 1 - Oreilles", …] */
export function sectionPath(s: DictSection): string[] {
  return [s.part && prettyPart(s.part), s.chapter, s.section, s.subsection, s.group].filter((x): x is string => !!x);
}

/** Link to a page of the official PDF (most browsers honour #page=). */
export const pdfPageUrl = (dict: Pick<Dictionary, 'pdfUrl'>, page: number) => `${dict.pdfUrl}#page=${page}`;

export type TextPart = { kind: 'text'; text: string } | { kind: 'code'; code: string } | { kind: 'article'; id: string; text: string };

// "article 17, alinéa 3 du Code de la sécurité sociale" refers to another law: not linked.
const ARTICLE_REF = /\b(?:article|Art\.)\s*(\d+(?:er|bis|ter|quater|quinquies)?)\b(?![^.;]{0,40}?\bdu Code\b)/gi;

/** Splits a text into plain parts, links to codes and links to articles of the regulation. */
export function linkify(text: string, dict: { byCode: { has(code: string): boolean }; articleById: { has(id: string): boolean } }): TextPart[] {
  const marks: { start: number; end: number; part: TextPart }[] = [];
  for (const m of text.matchAll(CODE_TOKEN)) {
    if (dict.byCode.has(m[0])) marks.push({ start: m.index!, end: m.index! + m[0].length, part: { kind: 'code', code: m[0] } });
  }
  for (const m of text.matchAll(ARTICLE_REF)) {
    const id = m[1].replace(/^(\d+)er$/, '$1');
    if (dict.articleById.has(id)) marks.push({ start: m.index!, end: m.index! + m[0].length, part: { kind: 'article', id, text: m[0] } });
  }
  marks.sort((a, b) => a.start - b.start);
  const parts: TextPart[] = [];
  let pos = 0;
  for (const mk of marks) {
    if (mk.start < pos) continue; // overlapping match
    if (mk.start > pos) parts.push({ kind: 'text', text: text.slice(pos, mk.start) });
    parts.push(mk.part);
    pos = mk.end;
  }
  if (pos < text.length) parts.push({ kind: 'text', text: text.slice(pos) });
  return parts;
}

let cache: Promise<Dictionary> | null = null;

/** Loads the dictionary once (separate hashed asset, precached by the service worker for offline use). */
export function loadDictionary(): Promise<Dictionary> {
  cache ??= fetch(new URL('../data/dictionary.json', import.meta.url).href)
    .then((r) => {
      if (!r.ok) throw new Error(`dictionnaire indisponible (${r.status})`);
      return r.json() as Promise<DictionaryData>;
    })
    .then(buildDictionary)
    .catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
}
