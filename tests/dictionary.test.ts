import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RawCode } from '../scripts/extract-nomenclature';
import { articlesForCode, buildDictionary, linkify, relevantRemarks, searchDictionary, siblings } from '../src/dictionary/dictionary';
import type { DictionaryData } from '../src/dictionary/types';
import { ENGINE_DATA } from '../src/engine/data';
import { defaultSettings } from '../src/engine/settings';
import { conflictSummary } from '../src/engine/summary';

const root = join(import.meta.dirname, '..');
const data: DictionaryData = JSON.parse(readFileSync(join(root, 'src/data/dictionary.json'), 'utf8'));
const raw: RawCode[] = JSON.parse(readFileSync(join(root, 'sources/raw-codes.json'), 'utf8'));
const dict = buildDictionary(data);

const refsOf = (code: string) =>
  relevantRemarks(dict, code).map((r) => `${r.remark.section.scope}#${r.remark.n}`);

describe('dictionary data', () => {
  it('contains the whole publication', () => {
    expect(dict.entries.length).toBe(raw.length);
    expect(dict.remarks.length).toBe(459);
    expect(dict.articles.map((a) => a.id)).toEqual([
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '15bis', '15ter', '15quater', '15quinquies', '16', '17', '18', '19', '20', '21',
    ]);
    expect(dict.version).toBe(ENGINE_DATA.meta.version);
    expect(dict.pdfUrl).toBe(ENGINE_DATA.meta.pdfUrl);
    expect(dict.pdfUrl).toMatch(/^https:\/\/cns\.public\.lu\/.+\.pdf$/);
  });

  it('knows every code used by the app, with the same tariff', () => {
    for (const c of ENGINE_DATA.list) {
      expect(dict.byCode.get(c.code)?.tarif, c.code).toBe(c.officialTarif);
    }
  });

  it('locates a code in the publication', () => {
    const e = dict.byCode.get('GFQ12')!;
    expect(e.position).toBe('3');
    expect(e.section.subsection).toBe('Sous-section 1 - Examens diagnostiques');
    expect(e.section.scope).toBe('ORL/S1/SS1');
    expect(e.page).toBeGreaterThan(70);
  });

  it('keeps article titles and paragraphs', () => {
    const a9 = dict.articleById.get('9')!;
    expect(a9.title).toBe('Cumul de plusieurs actes techniques');
    expect(a9.paragraphs[0]).toMatch(/^Lorsqu'au cours d'une même séance/);
    expect(a9.paragraphs.some((p) => /lettre "B"/.test(p))).toBe(true);
    expect(dict.articleById.get('10')!.paragraphs.filter((p) => /^\d+\)/.test(p)).length).toBe(13);
  });
});

describe('remarks concerning a code', () => {
  it('GFQ13: remarks naming it, in its sub-section and in the device section', () => {
    const refs = refsOf('GFQ13');
    expect(refs).toEqual(expect.arrayContaining(['ORL/S1/SS1#1', 'ORL/S1/SS1#5', 'ORL/S1/SS1#7', 'ORL/S1/SS1#11', 'ORL/S7#26']));
    expect(refs).not.toContain('ORL/S1/SS1#2'); // about GFQ23–GFQ25 only
    expect(refs).not.toContain('ORL/S1/SS1#3');
  });

  it('GPD13: "autres codes de la présente sous-section" and the GDE12 whitelist', () => {
    expect(refsOf('GPD13')).toEqual(expect.arrayContaining(['ORL/S2/SS3#1', 'ORL/S2/SS3#2', 'ORL/S2/SS1#2']));
  });

  it('1M12: a general remark of its sub-section that names no code', () => {
    expect(refsOf('1M12')).toContain('P2C1/S1/SS1#null');
  });

  it('lists the other codes of the same sub-section', () => {
    const s = siblings(dict, 'GDE14').map((e) => e.code);
    expect(s).toEqual(['GDE15', 'GDE16', 'GDE17', 'GDE18', 'GFE11', 'GDE19']);
  });
});

describe('search', () => {
  it('puts the exact code first', () => {
    expect(searchDictionary(dict, 'gde15')[0].code).toBe('GDE15');
    expect(searchDictionary(dict, 'GFQ1').map((e) => e.code)).toContain('GFQ12');
  });

  it('matches words without accents and can be restricted', () => {
    const appCodes = new Set(ENGINE_DATA.list.map((c) => c.code));
    const r = searchDictionary(dict, 'audiometrie tonale', appCodes).map((e) => e.code);
    expect(r).toEqual(expect.arrayContaining(['GFQ12', 'GFQ13']));
    expect(r.every((c) => appCodes.has(c))).toBe(true);
    expect(searchDictionary(dict, 'cataracte').length).toBeGreaterThan(0); // outside ENT: whole nomenclature
  });
});

describe('linkify', () => {
  const kinds = (text: string) => linkify(text, dict).filter((p) => p.kind !== 'text');

  it('links codes and articles of the regulation', () => {
    expect(kinds('Les codes GFQ11 et GFQ12 ; voir l’article 9 et Art. 15quater.')).toEqual([
      { kind: 'code', code: 'GFQ11' },
      { kind: 'code', code: 'GFQ12' },
      { kind: 'article', id: '9', text: 'article 9' },
      { kind: 'article', id: '15quater', text: 'Art. 15quater' },
    ]);
    expect(kinds('conformément à l’article 1er')).toEqual([{ kind: 'article', id: '1', text: 'article 1er' }]);
  });

  it('does not link articles of other laws or unknown tokens', () => {
    expect(kinds('en vertu de l’article 17, alinéa 3 du Code de la sécurité sociale')).toEqual([]);
    expect(kinds('mention CAC, CAT ou APCM ; COVID-19')).toEqual([]);
  });

  it('keeps the text intact', () => {
    const text = 'Le code GDE12 (position 1) n’est cumulable qu’avec les codes GPD13 et GPD14.';
    expect(linkify(text, dict).map((p) => (p.kind === 'code' ? p.code : p.text)).join('')).toBe(text);
  });
});

describe('entry helpers', () => {
  it('suggests the relevant articles', () => {
    expect(articlesForCode(dict.byCode.get('GFQ12')!)).toEqual(expect.arrayContaining(['4', '9', '10', '15quater']));
    expect(articlesForCode(dict.byCode.get('C17')!)).toEqual(expect.arrayContaining(['4', '5', '10']));
    expect(articlesForCode(dict.byCode.get('GPD16')!)).toContain('13'); // "y compris l'anesthésie locale"
    expect(articlesForCode(dict.byCode.get('R1')!)).toContain('18');
  });

  it('summarises combination conflicts of an act', () => {
    const settings = defaultSettings();
    const gfq13 = conflictSummary(ENGINE_DATA.codes.get('GFQ13')!, ENGINE_DATA.list, ENGINE_DATA.rules, settings.switches);
    expect(gfq13.flatMap((g) => g.codes)).toEqual(expect.arrayContaining(['GFQ11', 'GFQ12', 'GFQ18']));
    const gde12 = conflictSummary(ENGINE_DATA.codes.get('GDE12')!, ENGINE_DATA.list, ENGINE_DATA.rules, settings.switches);
    expect(gde12.some((g) => g.rule.type === 'onlyCombinableWith')).toBe(true);
    expect(gde12.flatMap((g) => g.codes)).not.toContain('GPD13');
  });
});
