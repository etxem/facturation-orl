import { describe, expect, it } from 'vitest';
import { ENGINE_DATA } from '../src/engine/data';
import { billCode, optimize } from '../src/engine/optimizer';
import { defaultSettings } from '../src/engine/settings';
import type { DeviceType, InterpretationId, OptimizationResult, SelectedAct, SessionOptions, Settings } from '../src/engine/types';

const SESSION: SessionOptions = { r1: false, clinicalExam: true };

function settingsWith(devices: DeviceType[] = [], switches: Partial<Record<InterpretationId, boolean>> = {}): Settings {
  const s = defaultSettings();
  for (const d of devices) s.devices[d] = { enabled: true, cls: 'I', rate: 'plein', number: '' };
  Object.assign(s.switches, switches);
  return s;
}

function run(codes: (string | SelectedAct)[], settings = settingsWith(), session: Partial<SessionOptions> = {}): OptimizationResult {
  const selected = codes.map((c) => (typeof c === 'string' ? { code: c } : c));
  return optimize(selected, { ...SESSION, ...session }, settings, ENGINE_DATA);
}

const codesOf = (r: OptimizationResult) => r.best!.lines.map(billCode);
const euros = (cents: number) => cents / 100;

describe('scenarios from the plan (§1.4)', () => {
  it('hearing loss with audiometer + impedancemeter: C17 + GFQ12 + GFQ18R + GDE11R + fees = 165,00 €', () => {
    const r = run(['GDE11', 'GFQ11', 'GFQ12', 'GFQ13', 'GFQ18'], settingsWith(['audiometre', 'impedancemetre']));
    expect(euros(r.best!.totalCents)).toBe(165);
    expect(codesOf(r).sort()).toEqual(['C17', 'GDE11R', 'GFM11', 'GFM41', 'GFQ12', 'GFQ18R'].sort());
    const alt = r.alternatives.find((a) => a.actCodes.includes('GFQ13'));
    expect(alt && euros(alt.totalCents)).toBe(156);
  });

  it('hearing loss without declared devices: C17 + GFQ13 + GDE11R = 146,50 €', () => {
    const r = run(['GDE11', 'GFQ11', 'GFQ12', 'GFQ13', 'GFQ18']);
    expect(euros(r.best!.totalCents)).toBe(146.5);
    expect(codesOf(r).sort()).toEqual(['C17', 'GDE11R', 'GFQ13'].sort());
  });

  it('dysphonia: billing without consultation is better (GFE11 + GDE11R + GDD11 = 134,20 €)', () => {
    const r = run(['GDE11', 'GDE14', 'GDE15', 'GFE11'], settingsWith(['endoscope']));
    expect(r.best!.route).toBe('actes');
    expect(euros(r.best!.totalCents)).toBe(134.2);
    expect(codesOf(r).sort()).toEqual(['GDD11', 'GDE11R', 'GFE11'].sort());
    const consultation = r.alternatives.find((a) => a.route === 'consultation');
    expect(consultation && euros(consultation.totalCents)).toBe(115.4);
    const dropped = Object.fromEntries(r.best!.dropped.map((d) => [d.code, d.reason]));
    expect(dropped.GDE15).toMatch(/Non cumulable avec GFE11/);
  });

  it('BPPV: C17 + GZQ11 + GFQ19R + GDE11R = 180,40 €', () => {
    const r = run(['GDE11', 'GFQ19', 'GZQ11']);
    expect(euros(r.best!.totalCents)).toBe(180.4);
    expect(codesOf(r).sort()).toEqual(['C17', 'GDE11R', 'GFQ19R', 'GZQ11'].sort());
    expect(r.alternatives.some((a) => a.route === 'actes' && euros(a.totalCents) === 132)).toBe(true);
  });

  it('thyroid nodule: GCM12 + GDE14R + 1M52R + GCJ11 = 142,30 € (no consultation)', () => {
    const r = run(['GCM12', '1M52', 'GDE14'], settingsWith(['echographe']));
    expect(r.best!.route).toBe('actes');
    expect(euros(r.best!.totalCents)).toBe(142.3);
    expect(codesOf(r).sort()).toEqual(['1M52R', 'GCJ11', 'GCM12', 'GDE14R'].sort());
    const consultation = r.alternatives.find((a) => a.route === 'consultation');
    expect(consultation && euros(consultation.totalCents)).toBe(108.2);
  });
});

describe('Art. 10 — consultation and CAC acts', () => {
  it('a non-CAC act cannot accompany the consultation', () => {
    const r = run(['GDE15']);
    // C17 alone (48,40) vs GDE15 alone (61,10): the technical act wins.
    expect(r.best!.route).toBe('actes');
    expect(euros(r.best!.totalCents)).toBe(61.1);
    const consultation = r.alternatives.find((a) => a.route === 'consultation')!;
    expect(consultation.dropped[0].reason).toMatch(/Pas de mention CAC/);
  });

  it('without clinical examination only technical acts can be billed', () => {
    const r = run(['GDE11'], settingsWith(), { clinicalExam: false });
    expect(r.best!.route).toBe('actes');
    expect(codesOf(r)).toEqual(['GDE11']);
    expect(r.consultationOnlyCents).toBe(0);
  });

  it('with no act selected the consultation alone is proposed', () => {
    const r = run([]);
    expect(codesOf(r)).toEqual(['C17']);
    expect(euros(r.best!.totalCents)).toBe(48.4);
  });

  it('strict interpretation: only one CAC act with the consultation', () => {
    const r = run(['GDE11', 'GFQ19', 'GZQ11'], settingsWith([], { cacMultiple: false }));
    expect(euros(r.best!.totalCents)).toBe(144.1); // C17 + GZQ11
    expect(codesOf(r).sort()).toEqual(['C17', 'GZQ11'].sort());
  });
});

describe('Art. 9 — several technical acts', () => {
  it('pays 100 % / 50 % / 50 % and nothing for the 4th act', () => {
    const r = run(['GDE11', 'GFQ12', 'GFQ18', 'GFQ19']);
    expect(codesOf(r)).toEqual(['C17', 'GFQ12', 'GFQ19R', 'GDE11R']);
    const dropped = r.best!.dropped.find((d) => d.code === 'GFQ18');
    expect(dropped?.reason).toMatch(/3e acte/);
  });

  it('ranks by coefficient, not by amount after suffixes', () => {
    // GPD19 (20,05) bilateral would be worth more than GPD... use GRB11 (12,03) B vs GFQ12 (12,21).
    const r = run([{ code: 'GRB11', bilateral: true }, 'GFQ12']);
    const lines = r.best!.lines.map(billCode);
    expect(lines).toEqual(['C17', 'GFQ12', 'GRB11BR']);
  });

  it('applies local anesthesia (L) and material fees', () => {
    const r = run([{ code: '2L71', localAnesthesia: true }]);
    expect(r.best!.route).toBe('actes');
    expect(codesOf(r)).toEqual(['2L71L', '2L71M']);
    expect(euros(r.best!.totalCents)).toBe(70.1); // 51,80 + 18,30
  });

  it('ignores L when the label already includes local anesthesia', () => {
    const r = run([{ code: 'GPD16', localAnesthesia: true }]);
    expect(codesOf(r)).toContain('GPD16');
    expect(codesOf(r)).not.toContain('GPD16L');
  });

  it('bills a bilateral act with B and flags it', () => {
    const r = run([{ code: 'GQD11', bilateral: true }]);
    expect(codesOf(r)).toEqual(['C17', 'GQD11B']);
    expect(euros(r.best!.totalCents)).toBe(89.4); // 48,40 + 41,00
    expect(r.best!.notes.some((n) => n.level === 'warning' && /bilatéral/.test(n.message))).toBe(true);
  });

  it('does not apply B when the switch is off', () => {
    const r = run([{ code: 'GQD11', bilateral: true }], settingsWith([], { bilateralSmallActs: false }));
    expect(codesOf(r)).toEqual(['C17', 'GQD11']);
  });
});

describe('ORL remarks and grey zones', () => {
  it('GDE12 whitelist: not with allergy tests (literal reading)', () => {
    const r = run(['GDE12', 'WFB11']);
    expect(codesOf(r)).toEqual(['C17', 'WFB11', 'WFB11M']);
    expect(euros(r.best!.totalCents)).toBe(84.6);
  });

  it('GDE12 whitelist limited to the nose section when the switch is off', () => {
    const r = run(['GDE12', 'WFB11'], settingsWith([], { gde12WholeSession: false }));
    expect(codesOf(r)).toEqual(['C17', 'GDE12', 'WFB11R', 'WFB11M']);
    expect(euros(r.best!.totalCents)).toBe(102.5);
    expect(r.best!.notes.some((n) => n.level === 'warning')).toBe(true);
  });

  it('GDE12 remains compatible with anterior packing GPD13', () => {
    const r = run(['GDE12', 'GPD13']);
    expect(codesOf(r).sort()).toEqual(['C17', 'GDE12R', 'GPD13'].sort());
  });

  it('pharyngo-laryngeal explorations exclude each other', () => {
    const r = run(['GDE14', 'GDE15', 'GDE16']);
    const acts = r.best!.actCodes;
    expect(acts.length).toBe(1);
  });

  it('septoplasty-type exclusivity: GPD19 excludes other nose-surgery codes', () => {
    const r = run(['GPD19', 'GPD17']);
    expect(r.best!.actCodes.length).toBe(1);
  });

  it('microscope overlap is allowed by default but flagged', () => {
    const r = run(['GDE11', 'GQD11']);
    expect(codesOf(r).sort()).toEqual(['C17', 'GDE11', 'GQD11R'].sort());
    expect(r.best!.notes.some((n) => n.level === 'warning' && /partie intégrante/.test(n.message))).toBe(true);
    const strict = run(['GDE11', 'GQD11'], settingsWith([], { microscopeOverlap: false }));
    expect(strict.best!.actCodes.length).toBe(1);
  });

  it('echography "first session" and "next session" exclude each other', () => {
    const r = run(['GCM13', 'GCM14'], settingsWith(['echographe']));
    expect(r.best!.actCodes).toEqual(['GCM13']);
  });

  it('several echographies: allowed with a warning, one fee per device', () => {
    const r = run(['GCM11', 'GCM12'], settingsWith(['echographe']));
    expect(codesOf(r).filter((c) => c.startsWith('GCJ'))).toEqual(['GCJ11']);
    expect(r.best!.notes.some((n) => n.level === 'warning')).toBe(true);
  });

  it('reduced device amount when configured', () => {
    const s = settingsWith(['endoscope']);
    s.devices.endoscope.rate = 'reduit';
    s.devices.endoscope.cls = 'II';
    const r = run(['GDE15'], s);
    expect(codesOf(r)).toEqual(['GDE15', 'GDD22']);
    expect(euros(r.best!.totalCents)).toBe(63.1);
  });

  it('one device fee per device, or one per act when the switch is off', () => {
    expect(codesOf(run(['GFQ12', 'GFQ26'], settingsWith(['audiometre']))).filter((c) => c === 'GFM11').length).toBe(1);
    const r = run(['GFQ12', 'GFQ26'], settingsWith(['audiometre'], { feeOncePerDevice: false }));
    expect(codesOf(r).filter((c) => c === 'GFM11').length).toBe(2);
  });

  it('reminds frequency limits', () => {
    const r = run(['GRD11']);
    expect(r.best!.notes.some((n) => n.level === 'reminder' && /4 fois/.test(n.message))).toBe(true);
  });
});

describe('R1 report', () => {
  it('is added when requested and flagged when cumulated with several acts', () => {
    const r = run(['GDE11'], settingsWith(), { r1: true });
    expect(codesOf(r)).toEqual(['C17', 'GDE11', 'R1']);
    expect(euros(r.best!.totalCents)).toBe(125.4);
    expect(r.best!.notes.some((n) => /R1 cumulé/.test(n.message))).toBe(true);
  });

  it('strict reading: R1 with a single other act', () => {
    const r = run(['GDE11'], settingsWith([], { r1WithSeveralActs: false }), { r1: true });
    expect(codesOf(r)).toEqual(['C17', 'R1']);
    expect(euros(r.best!.totalCents)).toBe(97.2);
  });
});
