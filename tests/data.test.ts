import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RawCode, RawRemark } from '../scripts/extract-nomenclature';
import { CATALOG } from '../src/data/catalog';
import { DEVICES } from '../src/data/devices';
import { RULES } from '../src/data/rules';
import { ENGINE_DATA } from '../src/engine/data';
import { scopeOf } from '../src/engine/scope';
import { tariffCents } from '../src/engine/tariff';

const read = <T>(file: string): T => JSON.parse(readFileSync(join(import.meta.dirname, '..', 'sources', file), 'utf8'));
const raw = read<RawCode[]>('raw-codes.json');
const rawRemarks = read<RawRemark[]>('raw-remarks.json');
const rawMeta = read<{ version: string; keyLetter: number }>('raw-meta.json');
const rawByCode = new Map(raw.map((r) => [r.code, r]));
const key = ENGINE_DATA.meta.keyLetter;

describe('nomenclature data', () => {
  it('uses the key letter and version of the extracted publication', () => {
    expect(ENGINE_DATA.meta.keyLetter).toBe(rawMeta.keyLetter);
    expect(ENGINE_DATA.meta.version).toBe(rawMeta.version);
    expect(ENGINE_DATA.meta.keyLetter).toBe(5.2346);
  });

  it('reproduces the official tariff of every coefficient-based code of the whole publication', () => {
    const mismatches = raw
      .filter((r) => r.coef != null)
      .filter((r) => tariffCents(r.coef!, rawMeta.keyLetter) !== Math.round(r.tarif * 100))
      .map((r) => `${r.code}: ${r.coef} → official ${r.tarif}`);
    expect(raw.length).toBeGreaterThan(3000);
    expect(mismatches).toEqual([]);
  });

  it('matches the publication for every code shipped with the app', () => {
    for (const c of ENGINE_DATA.list) {
      const r = rawByCode.get(c.code);
      expect(r, c.code).toBeDefined();
      expect(c.officialTarif, c.code).toBe(r!.tarif);
      if (c.kind === 'deviceFee') {
        expect(c.amount, c.code).toBe(r!.tarif);
      } else {
        expect(c.coef, c.code).toBe(r!.coef);
        expect(tariffCents(c.coef!, key), c.code).toBe(Math.round(r!.tarif * 100));
      }
    }
  });

  it('contains the whole ORL chapter and every catalogue code', () => {
    const orl = raw.filter((r) => r.part?.startsWith('DEUXIEME') && r.chapter?.startsWith('Chapitre 3 -'));
    expect(orl.length).toBe(192);
    for (const r of orl) expect(ENGINE_DATA.codes.has(r.code), r.code).toBe(true);
    for (const c of CATALOG) {
      expect(ENGINE_DATA.codes.get(c.code)?.cabinet, c.code).toBe(true);
    }
  });

  it('flags CAC acts from the official labels', () => {
    const cac = ENGINE_DATA.list.filter((c) => c.cac).map((c) => c.code);
    for (const code of ['GDE11', 'GFQ12', 'GFQ18', 'GDE12', 'GDE14', 'GQD11', 'GRB11', 'GPD13', 'GZQ11', 'WFB11', 'CGA12', '1M52']) {
      expect(cac, code).toContain(code);
    }
    for (const code of ['GDE15', 'GDE16', 'GFE11', 'GCM12', 'GBQ11', 'GPD19', 'GRB12', '2L71']) {
      expect(cac, code).not.toContain(code);
    }
  });

  it('knows which acts already include local anesthesia', () => {
    for (const code of ['GPD11', 'GPD16', 'GZD11']) expect(ENGINE_DATA.codes.get(code)?.localAnesthesia, code).toBe('included');
  });

  it('links every device to existing acts and fee codes', () => {
    for (const d of DEVICES) {
      for (const a of d.acts) expect(ENGINE_DATA.codes.get(a)?.device, a).toBe(d.type);
      for (const cls of Object.values(d.classes)) {
        expect(ENGINE_DATA.codes.get(cls!.full)?.kind).toBe('deviceFee');
        expect(ENGINE_DATA.codes.get(cls!.reduced)?.kind).toBe('deviceFee');
      }
    }
  });
});

describe('rule coverage', () => {
  it('maps every remark of the ORL chapter to a rule', () => {
    const covered = new Set(RULES.flatMap((r) => r.refs ?? []));
    const orlRemarks = rawRemarks.filter((r) => r.part?.startsWith('DEUXIEME') && r.chapter?.startsWith('Chapitre 3 -'));
    expect(orlRemarks.length).toBe(109);
    const missing = orlRemarks
      .map((r) => `${scopeOf(r.part, r.chapter, r.section, r.subsection)}#${r.number}`)
      .filter((ref) => !covered.has(ref));
    expect(missing).toEqual([]);
  });

  it('only references remarks that exist', () => {
    const existing = new Set(rawRemarks.map((r) => `${scopeOf(r.part, r.chapter, r.section, r.subsection)}#${r.number}`));
    const unknown = RULES.flatMap((r) => r.refs ?? []).filter((ref) => !existing.has(ref));
    expect(unknown).toEqual([]);
  });

  it('only references codes of the publication', () => {
    for (const rule of RULES) {
      const codes =
        'codes' in rule ? rule.codes : rule.type === 'crossExclusive' ? [...rule.a, ...rule.b] : rule.type === 'onlyCombinableWith' ? [rule.code, ...rule.allowed] : rule.type === 'requiresAnyOf' ? [rule.code, ...rule.anyOf] : [];
      for (const c of codes) expect(rawByCode.has(c), `${rule.id}: ${c}`).toBe(true);
    }
  });
});
