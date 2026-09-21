/**
 * Extracts the tariff table of the CNS "nomenclature des actes et services des médecins"
 * (version coordonnée PDF published on cns.public.lu) into machine-readable JSON.
 *
 * Usage: npm run extract -- [path/to/nomenclature.pdf] [URL of that PDF on cns.public.lu]
 * Output (in sources/):
 *   raw-meta.json      version date, key-letter value, cote d'application, source URL
 *   raw-codes.json     every tariff line: code, coefficient, official tariff, label, section path
 *   raw-remarks.json   every "REMARQUE(S)" item with the scope it belongs to
 *   raw-articles.json  the general provisions (Art. 1er to 21) paragraph by paragraph
 *
 * The PDF lays the table out in fixed columns (label | code | coefficient | tariff), so rows are
 * rebuilt from the x/y positions of the text items rather than from the text stream order.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const SOURCES = join(import.meta.dirname, '..', 'sources');

// Column boundaries (PDF points, A4 portrait) measured on the 2026 publications.
const CODE_MIN_X = 425;
const COEF_MIN_X = 480;
const TARIF_MIN_X = 535;
const POSITION_MAX_X = 45; // "12) Libellé…" starts left of this; remarks are indented further

interface Item { x: number; y: number; w: number; s: string }
interface Row { y: number; page: number; label: string; labelX: number; code?: string; coef?: string; tarif?: string }

export interface RawCode {
  code: string;
  coef: number | null;
  tarif: number;
  label: string;
  position: string | null;
  part: string | null;
  chapter: string | null;
  section: string | null;
  subsection: string | null;
  group: string | null;
  page: number;
}

export interface RawRemark {
  number: string | null;
  text: string;
  part: string | null;
  chapter: string | null;
  section: string | null;
  subsection: string | null;
  page: number;
}

export interface RawArticle {
  id: string;
  title: string | null;
  paragraphs: string[];
  page: number;
}

interface Line { x: number; text: string; page: number }

const num = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function joinItems(items: Item[]): string {
  let out = '';
  let prevEnd: number | null = null;
  for (const it of items) {
    if (prevEnd !== null && it.x - prevEnd > 1) out += ' ';
    out += it.s;
    prevEnd = it.x + it.w;
  }
  return out;
}

async function readRows(pdfPath: string): Promise<{ rows: Row[]; pageTexts: string[]; lines: Line[] }> {
  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await getDocument({ data, verbosity: 0 }).promise;
  const rows: Row[] = [];
  const pageTexts: string[] = [];
  const allLines: Line[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items: Item[] = [];
    for (const it of tc.items) {
      if (!('str' in it) || it.str.trim() === '') continue;
      items.push({ x: it.transform[4], y: it.transform[5], w: it.width, s: it.str });
    }
    // Group items into rows (same baseline within 2pt), top to bottom.
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const grouped: Item[][] = [];
    for (const it of items) {
      const last = grouped[grouped.length - 1];
      if (last && Math.abs(last[0].y - it.y) <= 2) last.push(it);
      else grouped.push([it]);
    }
    const lines: string[] = [];
    for (const g of grouped) {
      g.sort((a, b) => a.x - b.x);
      const labelItems = g.filter((i) => i.x < CODE_MIN_X);
      const row: Row = { y: g[0].y, page: p, label: clean(joinItems(labelItems)), labelX: labelItems[0]?.x ?? 999 };
      for (const i of g) {
        const s = i.s.trim();
        if (i.x >= CODE_MIN_X && i.x < COEF_MIN_X && /^[A-Z0-9]{2,7}$/.test(s)) row.code = s;
        else if (i.x >= COEF_MIN_X && i.x < TARIF_MIN_X && /^[\d.]+,\d+$/.test(s)) row.coef = s;
        else if (i.x >= TARIF_MIN_X && /^[\d.]+,\d+$/.test(s)) row.tarif = s;
      }
      rows.push(row);
      lines.push(joinItems(g));
      allLines.push({ x: g[0].x, text: clean(joinItems(g)), page: p });
    }
    pageTexts.push(lines.join('\n'));
  }
  return { rows, pageTexts, lines: allLines };
}

/**
 * General provisions: a line directly followed by "Art. N.-" and not ending a sentence is that
 * article's title; lines indented to ~96pt open a paragraph, lines starting with "•" or "1)" open a
 * list item, anything else continues the current paragraph.
 */
const ARTICLE_START = /^Art\.\s*(\d+(?:er|bis|ter|quater|quinquies)?)\s*\.?\s*-\s*(.*)$/;

function parseArticles(allLines: Line[]): RawArticle[] {
  const lines = allLines.filter((l) => !/^\d{1,3}$/.test(l.text)); // drop page numbers
  const articles: RawArticle[] = [];
  let current: RawArticle | null = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (current && /^Tableau des actes et services/.test(l.text)) break; // (also in the table of contents)
    const art = l.text.match(ARTICLE_START);
    if (art) {
      const prev = lines[i - 1];
      const title = prev && !ARTICLE_START.test(prev.text) && !/[.;:,]$/.test(prev.text) && !/^(•|\d+\))/.test(prev.text) ? prev.text : null;
      current = { id: art[1].replace(/^(\d+)er$/, '$1'), title, paragraphs: [art[2]], page: l.page };
      articles.push(current);
      continue;
    }
    if (!current) continue; // cover page, table of contents
    if (ARTICLE_START.test(lines[i + 1]?.text ?? '') && !/[.;:,]$/.test(l.text) && !/^(•|\d+\))/.test(l.text)) continue; // next article's title
    const opensParagraph = (l.x >= 88 && l.x <= 100) || /^(•|\d+\)|-\s)/.test(l.text);
    if (opensParagraph) current.paragraphs.push(l.text);
    else current.paragraphs[current.paragraphs.length - 1] += ' ' + l.text;
  }
  for (const a of articles) a.paragraphs = a.paragraphs.map(clean).filter(Boolean);
  return articles;
}

function parse(rows: Row[]) {
  const codes: RawCode[] = [];
  const remarks: RawRemark[] = [];
  const ctx = { part: null as string | null, chapter: null as string | null, section: null as string | null, subsection: null as string | null, group: null as string | null };
  let inTable = false;
  let mode: 'positions' | 'remarks' = 'positions';
  let entry: { position: string | null; label: string; page: number; code?: string; coef?: string; tarif?: string } | null = null;
  let remark: RawRemark | null = null;

  const flushEntry = () => {
    if (entry?.code && entry.tarif) {
      codes.push({
        code: entry.code,
        coef: entry.coef ? num(entry.coef) : null,
        tarif: num(entry.tarif),
        label: clean(entry.label),
        position: entry.position,
        ...ctx,
        page: entry.page,
      });
    }
    entry = null;
  };
  const flushRemark = () => {
    if (remark) remarks.push({ ...remark, text: clean(remark.text) });
    remark = null;
  };

  for (const r of rows) {
    const l = r.label;
    if (!inTable) {
      if (/^PREMIERE PARTIE : ACTES GENERAUX$/.test(l) && r.page > 10) inTable = true;
      else continue;
    }
    if (/^Modifications portées au règlement/.test(l)) { flushEntry(); flushRemark(); break; }
    if (/^Code\s+Coeff\.?\s+Tarif$/.test(l) || (l === 'Code' && !r.code)) continue;
    if (/^\d{1,3}$/.test(l) && !r.code && !r.coef) continue; // page number

    const heading = l.match(/^(PREMIERE PARTIE|DEUXIEME PARTIE)\s*:|^(Chapitre|Section|Sous-section)\s+\d+[a-z]*\s+-\s+/);
    if (heading && !r.code) {
      flushEntry(); flushRemark(); mode = 'positions';
      if (heading[1]) { ctx.part = l; ctx.chapter = ctx.section = ctx.subsection = ctx.group = null; }
      else if (heading[2] === 'Chapitre') { ctx.chapter = l; ctx.section = ctx.subsection = ctx.group = null; }
      else if (heading[2] === 'Section') { ctx.section = l; ctx.subsection = ctx.group = null; }
      else { ctx.subsection = l; ctx.group = null; }
      continue;
    }
    if (/^REMARQUES?\s*:?$/.test(l)) { flushEntry(); flushRemark(); mode = 'remarks'; continue; }

    const posMatch = l.match(/^(\d+[a-z]?)\)\s*(.*)$/);
    const isPositionStart = !!posMatch && r.labelX < POSITION_MAX_X && (r.code !== undefined || mode === 'positions' || r.labelX < POSITION_MAX_X);
    const groupMatch = l.match(/^([a-z])\)\s+(.*)$/);

    if (mode === 'remarks') {
      if (r.code || (posMatch && r.labelX < POSITION_MAX_X)) {
        // A new tariff position ends the remarks block (remarks placed before positions).
        flushRemark(); mode = 'positions';
      } else {
        const remStart = l.match(/^(\d+)[).]\s*(.*)$/);
        // Remarks are numbered 1, 2, 3… — a line starting with another number is the end of a
        // wrapped sentence such as "(position\n6)."
        const expected = remark?.number ? Number(remark.number) + 1 : 1;
        if (remStart && Number(remStart[1]) === expected) { flushRemark(); remark = { number: remStart[1], text: remStart[2], ...ctx, page: r.page }; }
        else if (remark) remark.text += ' ' + l;
        else remark = { number: null, text: l, ...ctx, page: r.page };
        continue;
      }
    }

    if (groupMatch && !r.code && r.labelX < POSITION_MAX_X) { flushEntry(); ctx.group = l; continue; }

    if (isPositionStart && posMatch) {
      flushEntry();
      entry = { position: posMatch[1], label: posMatch[2], page: r.page };
    } else if (l) {
      if (!entry) entry = { position: null, label: '', page: r.page };
      else if (entry.code && r.code) { flushEntry(); entry = { position: null, label: '', page: r.page }; }
      entry.label += ' ' + l;
    }
    if (r.code) {
      if (!entry) entry = { position: null, label: '', page: r.page };
      if (entry.code) { flushEntry(); entry = { position: null, label: '', page: r.page }; }
      entry.code = r.code; entry.coef = r.coef; entry.tarif = r.tarif;
    }
  }
  flushEntry(); flushRemark();
  return { codes, remarks };
}

function parseMeta(pageTexts: string[]) {
  const first = pageTexts[0];
  const version = first.match(/VERSION COORDONNEE AU (\d{2}\.\d{2}\.\d{4})/)?.[1] ?? null;
  const tablePage = pageTexts.find((t) => /Valeur lettre-cl/.test(t) && /Valable à partir du/.test(t)) ?? '';
  const keyLetter = tablePage.match(/(?:^|\s)(\d,\d{4})(?:\s|$)/m)?.[1] ?? null;
  const cote = tablePage.match(/(\d{3},\d{2})/)?.[1] ?? null;
  const validFrom = tablePage.match(/Valable à partir du:\s*(\d{2}\.\d{2}\.\d{4})/)?.[1] ?? null;
  return { version, keyLetter: keyLetter ? num(keyLetter) : null, cote: cote ? num(cote) : null, validFrom };
}

async function main() {
  const arg = process.argv[2];
  const pdfUrl = process.argv[3] ?? null;
  const pdf = arg ?? join(SOURCES, readdirSync(SOURCES).filter((f) => f.endsWith('.pdf')).sort().pop() ?? '');
  const { rows, pageTexts, lines } = await readRows(pdf);
  const meta = {
    ...parseMeta(pageTexts),
    sourceFile: pdf.split('/').pop(),
    pdfUrl,
    extractedAt: new Date().toISOString().slice(0, 10),
  };
  const { codes, remarks } = parse(rows);
  const articles = parseArticles(lines);

  writeFileSync(join(SOURCES, 'raw-meta.json'), JSON.stringify(meta, null, 2) + '\n');
  writeFileSync(join(SOURCES, 'raw-codes.json'), JSON.stringify(codes, null, 1) + '\n');
  writeFileSync(join(SOURCES, 'raw-remarks.json'), JSON.stringify(remarks, null, 1) + '\n');
  writeFileSync(join(SOURCES, 'raw-articles.json'), JSON.stringify(articles, null, 1) + '\n');
  console.log(`articles: ${articles.map((a) => a.id).join(', ')}`);
  if (!pdfUrl) console.warn('No PDF URL given: pass it as second argument so that the app can link to the official PDF.');

  const dup = codes.filter((c, i) => codes.findIndex((d) => d.code === c.code) !== i).map((c) => c.code);
  const byChapter = new Map<string, number>();
  for (const c of codes) byChapter.set(`${c.part?.slice(0, 16)} › ${c.chapter}`, (byChapter.get(`${c.part?.slice(0, 16)} › ${c.chapter}`) ?? 0) + 1);
  console.log('meta', meta);
  console.log(`codes: ${codes.length}, remarks: ${remarks.length}, duplicates: ${dup.length ? dup.join(', ') : 'none'}`);
  for (const [k, v] of byChapter) console.log(`  ${v.toString().padStart(4)}  ${k}`);
}

await main();
