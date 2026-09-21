/**
 * Builds the data shipped with the app from the raw extraction (sources/raw-*.json):
 *  - src/data/nomenclature.json: codes used by the optimizer (ORL chapter + curated catalogue);
 *  - src/data/dictionary.json: the whole publication (codes, remarks, general provisions) for the
 *    dictionary, loaded on demand.
 *
 * Usage: npm run build-data
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOG } from '../src/data/catalog';
import { DEVICES } from '../src/data/devices';
import { RULES } from '../src/data/rules';
import { scopeOf } from '../src/engine/scope';
import type { DictCode, DictionaryData, DictRemark, DictSection } from '../src/dictionary/types';
import type { CodeDef, CodeKind, Nomenclature } from '../src/engine/types';
import type { RawArticle, RawCode, RawRemark } from './extract-nomenclature';

const ROOT = join(import.meta.dirname, '..');
const readJson = <T>(file: string): T => JSON.parse(readFileSync(join(ROOT, 'sources', file), 'utf8'));
const raw = readJson<RawCode[]>('raw-codes.json');
const rawRemarks = readJson<RawRemark[]>('raw-remarks.json');
const rawArticles = readJson<RawArticle[]>('raw-articles.json');
const rawMeta = readJson<{ version: string; keyLetter: number; cote: number; validFrom: string; pdfUrl: string | null }>('raw-meta.json');

const SOURCE_URL =
  'https://cns.public.lu/fr/assure/publications/legislations/ammd/cns-ammd-med-tableau.html';

const byCode = new Map(raw.map((r) => [r.code, r]));
const catalog = new Map(CATALOG.map((c) => [c.code, c]));
const deviceOf = new Map(DEVICES.flatMap((d) => d.acts.map((a) => [a, d.type] as const)));
const deviceFeeCodes = new Set(
  DEVICES.flatMap((d) => Object.values(d.classes).flatMap((c) => (c ? [c.full, c.reduced] : []))),
);

const isOrl = (r: RawCode) => r.part?.startsWith('DEUXIEME') && r.chapter?.startsWith('Chapitre 3 -');

function shorten(label: string): string {
  const cut = label.replace(/\s*-\s*(CAC|CAT)\b.*$/, '').replace(/, par (toute voie d'abord|voie externe)$/, '');
  return cut.length > 70 ? cut.slice(0, 67).replace(/\s+\S*$/, '') + '…' : cut;
}

function build(r: RawCode, kind: CodeKind): CodeDef {
  const c = catalog.get(r.code);
  const label = r.label;
  const derivedLocal: CodeDef['localAnesthesia'] =
    /y compris l'anesthésie locale|anesthésie locale comprise/i.test(label)
      ? 'included'
      : kind !== 'act' || /anesthésie générale|sommeil induit/i.test(label)
        ? 'no'
        : 'allowed';
  const location = [r.chapter, r.section, r.subsection].filter(Boolean).join(' › ');
  return {
    code: r.code,
    label,
    short: c?.short ?? shorten(label),
    kind,
    coef: kind === 'deviceFee' ? null : r.coef,
    ...(kind === 'deviceFee' ? { amount: r.tarif } : {}),
    officialTarif: r.tarif,
    scope: scopeOf(r.part, r.chapter, r.section, r.subsection),
    location,
    category: c?.category ?? 'bloc',
    cabinet: c ? (c.cabinet ?? true) : false,
    cac: /-\s*CAC\b/.test(label),
    cat: /-\s*CAT\b/.test(label),
    apcm: /\bAPCM\b/.test(label),
    localAnesthesia: derivedLocal === 'included' ? 'included' : (c?.localAnesthesia ?? derivedLocal),
    bilateral: c?.bilateral ?? /unilatéral|par côté/i.test(label),
    ...(deviceOf.has(r.code) ? { device: deviceOf.get(r.code) } : {}),
    ...(c?.materialFee ? { materialFee: c.materialFee } : {}),
    ...(c?.noSutureFee ? { noSutureFee: true } : {}),
    keywords: c?.keywords ?? [],
    notes: [],
  };
}

const out = new Map<string, CodeDef>();
const errors: string[] = [];

// 1. The whole ORL chapter (acts and device fees).
for (const r of raw.filter(isOrl)) {
  out.set(r.code, build(r, deviceFeeCodes.has(r.code) ? 'deviceFee' : (catalog.get(r.code)?.kind ?? 'act')));
}

// 2. Curated codes of other chapters, and their material fees.
for (const c of CATALOG) {
  const r = byCode.get(c.code);
  if (!r) {
    errors.push(`catalog: ${c.code} not found in the publication`);
    continue;
  }
  if (!out.has(c.code)) out.set(c.code, build(r, c.kind ?? 'act'));
  if (c.materialFee) {
    const m = byCode.get(c.materialFee);
    if (!m) errors.push(`catalog: material fee ${c.materialFee} not found`);
    else out.set(m.code, build(m, 'materialFee'));
  }
}

// 3. Consistency checks.
for (const d of DEVICES) {
  for (const a of d.acts) if (!out.has(a)) errors.push(`devices: act ${a} missing`);
  for (const cls of Object.values(d.classes)) {
    for (const code of [cls?.full, cls?.reduced]) if (code && !out.has(code)) errors.push(`devices: fee ${code} missing`);
  }
}
const unknownInRules = new Set<string>();
for (const rule of RULES) {
  const codes =
    rule.type === 'mutuallyExclusive' || rule.type === 'exclusiveInScope' || rule.type === 'reminder'
      ? rule.codes
      : rule.type === 'crossExclusive'
        ? [...rule.a, ...rule.b]
        : rule.type === 'onlyCombinableWith'
          ? [rule.code, ...rule.allowed]
          : rule.type === 'requiresAnyOf'
            ? [rule.code, ...rule.anyOf]
            : [];
  for (const code of codes) if (!byCode.has(code)) errors.push(`rules: ${rule.id} references unknown code ${code}`);
  for (const code of codes) if (byCode.has(code) && !out.has(code)) unknownInRules.add(code);
}

if (!rawMeta.pdfUrl) errors.push('raw-meta.json has no pdfUrl: re-run the extraction with the URL of the PDF (see README)');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const data: Nomenclature = {
  meta: {
    version: rawMeta.version,
    keyLetter: rawMeta.keyLetter,
    cote: rawMeta.cote,
    validFrom: rawMeta.validFrom,
    sourceUrl: SOURCE_URL,
    pdfUrl: rawMeta.pdfUrl!,
  },
  codes: [...out.values()],
};
writeFileSync(join(ROOT, 'src/data/nomenclature.json'), JSON.stringify(data, null, 1) + '\n');

// Dictionary: the whole publication, sections stored once.
const sections: DictSection[] = [];
const sectionIndex = new Map<string, number>();
const sectionOf = (x: { part: string | null; chapter: string | null; section: string | null; subsection: string | null; group?: string | null }) => {
  const k = [x.part, x.chapter, x.section, x.subsection, x.group ?? null].join('|');
  let i = sectionIndex.get(k);
  if (i === undefined) {
    i = sections.length;
    sectionIndex.set(k, i);
    sections.push({ part: x.part, chapter: x.chapter, section: x.section, subsection: x.subsection, group: x.group ?? null, scope: scopeOf(x.part, x.chapter, x.section, x.subsection) });
  }
  return i;
};
const dictionary: DictionaryData = {
  version: rawMeta.version,
  pdfUrl: rawMeta.pdfUrl!,
  sections,
  codes: raw.map((r): DictCode => [r.code, r.label, r.coef, r.tarif, r.page, r.position, sectionOf(r)]),
  remarks: rawRemarks.map((r): DictRemark => ({ s: sectionOf(r), n: r.number, t: r.text, p: r.page })),
  articles: rawArticles,
};
writeFileSync(join(ROOT, 'src/data/dictionary.json'), JSON.stringify(dictionary) + '\n');

const cabinet = data.codes.filter((c) => c.cabinet && c.kind === 'act');
console.log(
  `nomenclature.json: ${data.codes.length} codes (${cabinet.length} practice acts, ` +
    `${data.codes.filter((c) => c.kind === 'deviceFee').length} device fees, ` +
    `${data.codes.filter((c) => c.kind === 'materialFee').length} material fees), version ${data.meta.version}, key letter ${data.meta.keyLetter}`,
);
console.log(
  `dictionary.json: ${dictionary.codes.length} codes, ${dictionary.remarks.length} remarks, ${dictionary.articles.length} articles, ${sections.length} sections`,
);
if (unknownInRules.size) console.log(`(rules also mention codes outside the app catalogue: ${[...unknownInRules].join(', ')})`);
