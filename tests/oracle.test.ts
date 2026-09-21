/**
 * Cross-checks the optimizer against a deliberately naive brute force (every subset, both routes,
 * no pruning) on random selections, and checks invariants of the proposed bill.
 */
import { describe, expect, it } from 'vitest';
import { ENGINE_DATA } from '../src/engine/data';
import { optimize } from '../src/engine/optimizer';
import { conflictsBetween, unmetRequirements } from '../src/engine/rules';
import { defaultSettings, INTERPRETATIONS } from '../src/engine/settings';
import { applyPercents, noSutureFeeCents, tariffCents } from '../src/engine/tariff';
import type { CodeDef, DeviceType, SelectedAct, SessionOptions, Settings } from '../src/engine/types';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5) >>> 0) / 4294967296);
}

const key = ENGINE_DATA.meta.keyLetter;
const cabinetActs = ENGINE_DATA.list.filter((c) => c.cabinet && c.kind === 'act');
const tariff = (c: CodeDef) => tariffCents(c.coef!, key);

function naiveBest(selected: SelectedAct[], session: SessionOptions, settings: Settings): number {
  const sw = settings.switches;
  const acts = selected.map((s) => {
    const def = ENGINE_DATA.codes.get(s.code)!;
    const pct: number[] = [];
    if (s.bilateral && def.bilateral && sw.bilateralSmallActs) pct.push(150);
    if (s.localAnesthesia && def.localAnesthesia === 'allowed') pct.push(115);
    return { def, sel: s, pct };
  });
  let best = -1;
  const routes = session.clinicalExam ? ['consultation', 'actes'] : ['actes'];
  for (const route of routes) {
    for (let mask = 0; mask < 1 << acts.length; mask++) {
      const sub = acts.filter((_, i) => mask & (1 << i));
      if (route === 'actes' && sub.length === 0) continue;
      if (route === 'consultation' && sub.some((a) => !a.def.cac)) continue;
      if (route === 'consultation' && !sw.cacMultiple && sub.length > 1) continue;
      let ok = true;
      for (let i = 0; i < sub.length && ok; i++)
        for (let j = i + 1; j < sub.length && ok; j++)
          if (conflictsBetween(sub[i].def, sub[j].def, ENGINE_DATA.rules, sw).some((c) => c.level === 'hard')) ok = false;
      if (!ok || unmetRequirements(new Set(sub.map((a) => a.def.code)), ENGINE_DATA.rules).length) continue;

      let total = route === 'consultation' ? tariff(ENGINE_DATA.codes.get('C17')!) : 0;
      const red = sub
        .filter((a) => !a.def.cat)
        .sort((x, y) => y.def.coef! - x.def.coef! || applyPercents(tariff(y.def), y.pct) - applyPercents(tariff(x.def), x.pct) || x.def.code.localeCompare(y.def.code));
      const paid = [...red.slice(0, 3), ...sub.filter((a) => a.def.cat)];
      red.slice(0, 3).forEach((a, r) => (total += applyPercents(tariff(a.def), r === 0 ? a.pct : [...a.pct, 50])));
      sub.filter((a) => a.def.cat).forEach((a) => (total += applyPercents(tariff(a.def), a.pct)));
      const feeActs = sw.feeNeedsPaidAct ? paid : sub;
      const seenDevices = new Set<DeviceType>();
      for (const a of feeActs) {
        const t = a.def.device;
        if (t && settings.devices[t].enabled && !(sw.feeOncePerDevice && seenDevices.has(t))) {
          seenDevices.add(t);
          const dev = ENGINE_DATA.devices.find((d) => d.type === t)!;
          const cls = dev.classes[settings.devices[t].cls] ?? dev.classes.I!;
          const fee = ENGINE_DATA.codes.get(settings.devices[t].rate === 'plein' ? cls!.full : cls!.reduced)!;
          total += Math.round(fee.amount! * 100);
        }
        if (a.def.materialFee) total += tariff(ENGINE_DATA.codes.get(a.def.materialFee)!);
        if (a.def.noSutureFee && a.sel.noSuture) total += noSutureFeeCents(a.def.coef!, key);
      }
      const items = (route === 'consultation' ? 1 : 0) + paid.length;
      if (session.r1 && items >= 1 && (sw.r1WithSeveralActs || items === 1)) total += tariff(ENGINE_DATA.codes.get('R1')!);
      best = Math.max(best, total);
    }
  }
  return best;
}

describe('optimizer vs naive brute force', () => {
  const random = rng(20260921);
  const pick = <T,>(arr: T[]) => arr[Math.floor(random() * arr.length)];
  const deviceTypes: DeviceType[] = ['audiometre', 'impedancemetre', 'endoscope', 'echographe', 'rhinomanometre', 'pea', 'vng'];

  for (let t = 0; t < 400; t++) {
    const size = 1 + Math.floor(random() * 8);
    const codes = new Set<string>();
    // Bias towards the ear/nose/throat diagnostics so that many rules interact.
    const pool = random() < 0.6 ? cabinetActs.filter((c) => ['oreille', 'nez', 'pharynx', 'echo'].includes(c.category)) : cabinetActs;
    while (codes.size < size) codes.add(pick(pool).code);
    const selected: SelectedAct[] = [...codes].map((code) => ({
      code,
      bilateral: random() < 0.3,
      localAnesthesia: random() < 0.3,
      noSuture: random() < 0.5,
    }));
    const settings = defaultSettings();
    for (const d of deviceTypes) {
      if (random() < 0.6) settings.devices[d] = { enabled: true, cls: pick(['I', 'II', 'III'] as const), rate: random() < 0.7 ? 'plein' : 'reduit', number: '' };
    }
    for (const i of INTERPRETATIONS) if (random() < 0.25) settings.switches[i.id] = !settings.switches[i.id];
    const session: SessionOptions = { r1: random() < 0.3, clinicalExam: random() < 0.9 };

    it(`case ${t}: ${[...codes].join(' ')}`, () => {
      const result = optimize(selected, session, settings, ENGINE_DATA);
      const expected = naiveBest(selected, session, settings);
      expect(result.best?.totalCents ?? -1).toBe(expected);
      if (!result.best) return;
      const b = result.best;
      // Invariants.
      expect(b.lines.reduce((s, l) => s + l.cents, 0)).toBe(b.totalCents);
      for (const code of b.actCodes) expect(codes.has(code)).toBe(true);
      if (b.route === 'consultation') for (const code of b.actCodes) expect(ENGINE_DATA.codes.get(code)!.cac).toBe(true);
      const paidReducible = b.lines.filter((l) => l.kind === 'act' && l.cents > 0 && !ENGINE_DATA.codes.get(l.code)!.cat);
      expect(paidReducible.length).toBeLessThanOrEqual(3);
      expect(paidReducible.filter((l) => !l.suffixes.includes('R')).length).toBeLessThanOrEqual(1);
    });
  }
});
