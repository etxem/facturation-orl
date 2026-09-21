/**
 * Finds the most favourable valid way to bill a session, among the acts the doctor performed.
 *
 * Two routes are compared (Art. 10):
 *  - "consultation": C17 + technical acts marked CAC (Art. 10 point 1);
 *  - "actes": technical acts alone (any act).
 * Within a route, technical acts are paid 100 % for the highest coefficient, 50 % (suffix R) for the
 * 2nd and 3rd, nothing beyond (Art. 9); acts marked CAT are paid in full. Device and material fees
 * are added for the acts billed (Art. 15, 15quater) and are never reduced.
 *
 * The optimizer never adds or substitutes an act: it only chooses among the selected acts.
 */
import type { EngineData } from './data';
import { conflictsBetween, describeConflict, remindersFor, unmetRequirements } from './rules';
import { applyPercents, eurosToCents, formatEuros, noSutureFeeCents, SUFFIX_PERCENT, tariffCents } from './tariff';
import type {
  BillLine,
  BillOption,
  CodeDef,
  DeviceType,
  DroppedAct,
  Note,
  OptimizationResult,
  Rule,
  SelectedAct,
  SessionOptions,
  Settings,
  Suffix,
} from './types';

interface PreparedAct {
  def: CodeDef & { coef: number };
  sel: SelectedAct;
  baseCents: number;
  suffixes: Suffix[];
  /** Amount with B/L applied, used to break coefficient ties. */
  modCents: number;
  notes: Note[];
}

type Route = BillOption['route'];

const MAX_PAID_REDUCIBLE = 3;

function prepare(selected: SelectedAct[], settings: Settings, data: EngineData): PreparedAct[] {
  const out: PreparedAct[] = [];
  const seen = new Set<string>();
  for (const sel of selected) {
    const def = data.codes.get(sel.code);
    if (!def || def.kind !== 'act' || def.coef == null || seen.has(def.code)) continue;
    seen.add(def.code);
    const baseCents = tariffCents(def.coef, data.meta.keyLetter);
    const suffixes: Suffix[] = [];
    const notes: Note[] = [];
    if (sel.bilateral && def.bilateral && settings.switches.bilateralSmallActs) {
      suffixes.push('B');
      notes.push({
        level: 'warning',
        message: `${def.code} facturé en bilatéral (suffixe B, 150 %) — à valider pour ce type d’acte.`,
        source: 'Art. 9 (opération bilatérale)',
      });
    }
    if (sel.localAnesthesia && def.localAnesthesia === 'allowed') suffixes.push('L');
    out.push({
      def: def as CodeDef & { coef: number },
      sel,
      baseCents,
      suffixes,
      modCents: applyPercents(baseCents, suffixes.map((s) => SUFFIX_PERCENT[s])),
      notes,
    });
  }
  return out;
}

function detailFor(baseCents: number, suffixes: Suffix[]): string {
  return [formatEuros(baseCents), ...suffixes.map((s) => `× ${SUFFIX_PERCENT[s]} % (${s})`)].join(' ');
}

function actLine(a: PreparedAct, reduced: boolean): BillLine {
  const suffixes: Suffix[] = reduced ? [...a.suffixes, 'R'] : [...a.suffixes];
  return {
    code: a.def.code,
    suffixes,
    label: a.def.short,
    kind: 'act',
    baseCents: a.baseCents,
    cents: applyPercents(a.baseCents, suffixes.map((s) => SUFFIX_PERCENT[s])),
    detail: detailFor(a.baseCents, suffixes),
  };
}

function simpleLine(def: CodeDef, keyLetter: number, detail: string): BillLine {
  const cents = def.coef != null ? tariffCents(def.coef, keyLetter) : eurosToCents(def.amount ?? 0);
  return { code: def.code, suffixes: [], label: def.short, kind: def.kind, baseCents: cents, cents, detail };
}

export function optimize(
  selected: SelectedAct[],
  session: SessionOptions,
  settings: Settings,
  data: EngineData,
): OptimizationResult {
  const key = data.meta.keyLetter;
  const sw = settings.switches;
  const acts = prepare(selected, settings, data);
  const n = acts.length;

  // Pairwise conflicts, computed once.
  const hard: (Rule | null)[][] = Array.from({ length: n }, () => Array<Rule | null>(n).fill(null));
  const soft: Rule[][][] = Array.from({ length: n }, () => Array.from({ length: n }, () => [] as Rule[]));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const cs = conflictsBetween(acts[i].def, acts[j].def, data.rules, sw);
      const h = cs.find((c) => c.level === 'hard')?.rule ?? null;
      hard[i][j] = hard[j][i] = h;
      const s = cs.filter((c) => c.level === 'soft').map((c) => c.rule);
      soft[i][j] = soft[j][i] = s;
    }
  }

  const c17 = data.codes.get('C17');
  const r1 = data.codes.get('R1');
  const results: BillOption[] = [];
  let evaluated = 0;

  const evaluate = (route: Route, chosen: number[]): BillOption | null => {
    const chosenActs = chosen.map((i) => acts[i]);
    if (unmetRequirements(new Set(chosenActs.map((a) => a.def.code)), data.rules).length) return null;

    const lines: BillLine[] = [];
    const notes: Note[] = [];
    if (route === 'consultation' && c17) lines.push(simpleLine(c17, key, 'Consultation (Art. 10, cumul avec actes CAC)'));

    // Art. 9 ranking: highest coefficient first (ties: highest amount, then code).
    const reducible = chosenActs
      .filter((a) => !a.def.cat)
      .sort((x, y) => y.def.coef - x.def.coef || y.modCents - x.modCents || x.def.code.localeCompare(y.def.code));
    const paid: PreparedAct[] = [];
    const unpaid: PreparedAct[] = [];
    reducible.forEach((a, rank) => {
      if (rank < MAX_PAID_REDUCIBLE) {
        lines.push(actLine(a, rank > 0));
        paid.push(a);
      } else unpaid.push(a);
    });
    for (const a of chosenActs.filter((x) => x.def.cat)) {
      const line = actLine(a, false);
      line.detail += ' — CAT : plein tarif';
      lines.push(line);
      paid.push(a);
    }
    for (const a of unpaid) {
      lines.push({ ...actLine(a, false), cents: 0, detail: 'Au-delà du 3e acte : non rémunéré (Art. 9)' });
    }

    // Device fees (Art. 15quater) and material fees (Art. 15).
    const feeSources = sw.feeNeedsPaidAct ? paid : [...paid, ...unpaid];
    const deviceCount = new Map<DeviceType, number>();
    for (const a of feeSources) {
      const type = a.def.device;
      const setting = type ? settings.devices[type] : undefined;
      const device = type ? data.devices.find((d) => d.type === type) : undefined;
      if (type && setting?.enabled && device) {
        const cls = device.classes[setting.cls] ?? device.classes.I;
        const feeCode = cls ? (setting.rate === 'plein' ? cls.full : cls.reduced) : undefined;
        const feeDef = feeCode ? data.codes.get(feeCode) : undefined;
        const count = deviceCount.get(type) ?? 0;
        if (feeDef && !(sw.feeOncePerDevice && count >= 1)) {
          deviceCount.set(type, count + 1);
          lines.push({
            ...simpleLine(feeDef, key, `Forfait ${device.label.toLowerCase()} (classe ${setting.cls}, montant ${setting.rate === 'plein' ? 'plein' : 'réduit'}) lié à ${a.def.code}`),
            deviceNumber: setting.number || undefined,
          });
          if (count >= 1) notes.push({ level: 'warning', message: `Plusieurs forfaits ${device.label.toLowerCase()} dans la même séance — à valider.`, source: 'Art. 15quater' });
          if (unpaid.includes(a)) notes.push({ level: 'warning', message: `Forfait appareil ouvert par ${a.def.code}, acte non rémunéré — à valider.`, source: 'Art. 15quater' });
        }
      }
      if (a.def.materialFee) {
        const m = data.codes.get(a.def.materialFee);
        if (m) lines.push({ ...simpleLine(m, key, `Frais de matériel liés à ${a.def.code} (Art. 15, cabinet)`), label: `${m.short} (${a.def.code})` });
      }
      if (a.def.noSutureFee && a.sel.noSuture) {
        const cents = noSutureFeeCents(a.def.coef, key);
        lines.push({
          code: `${a.def.code}M`,
          suffixes: [],
          label: `Frais de matériel sans suture (${a.def.code})`,
          kind: 'materialFee',
          baseCents: cents,
          cents,
          detail: '8 % du coefficient de l’acte (Art. 15)',
        });
      }
    }

    // R1 report (Art. 10 point 2, Art. 18).
    const itemCount = (route === 'consultation' ? 1 : 0) + paid.length;
    if (session.r1 && r1 && itemCount >= 1 && (sw.r1WithSeveralActs || itemCount === 1)) {
      lines.push(simpleLine(r1, key, 'Rapport au médecin traitant (Art. 10, point 2)'));
      if (itemCount > 1) notes.push({ level: 'warning', message: 'R1 cumulé avec la consultation et/ou plusieurs actes — à valider.', source: 'Art. 10, point 2' });
    }

    // Notes.
    for (const a of chosenActs) notes.push(...a.notes);
    for (let x = 0; x < chosen.length; x++) {
      for (let y = x + 1; y < chosen.length; y++) {
        for (const rule of soft[chosen[x]][chosen[y]]) {
          notes.push({
            level: 'warning',
            message: `${acts[chosen[x]].def.code} + ${acts[chosen[y]].def.code} : ${describeConflict(rule)} — à valider.`,
            source: rule.source,
          });
        }
      }
    }
    if (route === 'consultation' && chosenActs.length >= 2) {
      notes.push({ level: 'info', message: 'Consultation + plusieurs actes CAC : 100 % / 50 % / 50 % entre les actes techniques.', source: 'Art. 10, dernier alinéa ; Art. 9' });
    }
    const billedCodes = lines.map((l) => l.code);
    for (const r of remindersFor(billedCodes, data.rules)) notes.push({ level: 'reminder', message: `${r.codes.filter((c) => billedCodes.includes(c)).join(', ')} : ${r.message}`, source: r.source });
    for (const a of chosenActs) if (a.def.apcm) notes.push({ level: 'reminder', message: `${a.def.code} : autorisation préalable du contrôle médical requise (APCM).`, source: 'Art. 3' });

    // Why the other selected acts are not billed.
    const dropped: DroppedAct[] = [];
    const reducibleCount = reducible.length;
    acts.forEach((a, i) => {
      if (chosen.includes(i)) return;
      let reason: string;
      const conflictWith = chosen.find((j) => hard[i][j]);
      if (route === 'consultation' && !a.def.cac) reason = 'Pas de mention CAC : non cumulable avec la consultation (Art. 10).';
      else if (conflictWith !== undefined) reason = `Non cumulable avec ${acts[conflictWith].def.code} : ${describeConflict(hard[i][conflictWith]!)}.`;
      else if (route === 'consultation' && !sw.cacMultiple && chosen.length >= 1) reason = 'Une seule prestation CAC retenue avec la consultation (interprétation stricte).';
      else if (!a.def.cat && reducibleCount >= MAX_PAID_REDUCIBLE) reason = 'Au-delà du 3e acte technique : non rémunéré (Art. 9).';
      else if (unmetRequirements(new Set([...chosenActs.map((c) => c.def.code), a.def.code]), data.rules).some((r) => r.type === 'requiresAnyOf' && r.code === a.def.code))
        reason = 'Ne peut être mis en compte qu’avec un acte principal non sélectionné.';
      else reason = 'Combinaison moins favorable.';
      dropped.push({ code: a.def.code, reason });
    });

    const totalCents = lines.reduce((s, l) => s + l.cents, 0);
    const actCodes = [...paid, ...unpaid].map((a) => a.def.code);
    const title =
      route === 'consultation'
        ? actCodes.length
          ? 'Consultation + actes CAC'
          : 'Consultation seule'
        : 'Actes techniques sans consultation';
    return { route, title, lines, totalCents, dropped, notes: dedupeNotes(notes), actCodes };
  };

  const routes: Route[] = [];
  if (session.clinicalExam && c17) routes.push('consultation');
  routes.push('actes');

  for (const route of routes) {
    const candidates = acts.map((_, i) => i).filter((i) => route === 'actes' || acts[i].def.cac);
    const maxActs = route === 'consultation' && !sw.cacMultiple ? 1 : Infinity;
    const chosen: number[] = [];
    let reducibleChosen = 0;
    const dfs = (k: number) => {
      if (k === candidates.length) {
        if (route === 'actes' && chosen.length === 0) return;
        evaluated++;
        const option = evaluate(route, chosen);
        if (option) results.push(option);
        return;
      }
      const idx = candidates[k];
      const isReducible = !acts[idx].def.cat;
      // A 4th reducible act earns nothing unless it opens a fee (permissive switch).
      const reducibleCap = sw.feeNeedsPaidAct ? MAX_PAID_REDUCIBLE : Infinity;
      if (
        chosen.length < maxActs &&
        !(isReducible && reducibleChosen >= reducibleCap) &&
        chosen.every((j) => !hard[idx][j])
      ) {
        chosen.push(idx);
        if (isReducible) reducibleChosen++;
        dfs(k + 1);
        chosen.pop();
        if (isReducible) reducibleChosen--;
      }
      dfs(k + 1);
    };
    dfs(0);
  }

  const warnings = (o: BillOption) => o.notes.filter((x) => x.level === 'warning').length;
  results.sort(
    (a, b) =>
      b.totalCents - a.totalCents ||
      warnings(a) - warnings(b) ||
      a.lines.length - b.lines.length ||
      (a.route === b.route ? 0 : a.route === 'consultation' ? -1 : 1) ||
      a.actCodes.join().localeCompare(b.actCodes.join()),
  );

  const best = results[0] ?? null;
  const alternatives: BillOption[] = [];
  if (best) {
    const isSubsetOf = (o: BillOption, p: BillOption) => o.route === p.route && o.actCodes.every((c) => p.actCodes.includes(c));
    const otherRoute = results.find((o) => o.route !== best.route);
    const pool = [...(otherRoute ? [otherRoute] : []), ...results.slice(1)];
    for (const o of pool) {
      if (alternatives.length >= 3) break;
      if (o === best || alternatives.includes(o)) continue;
      if ([best, ...alternatives].some((p) => isSubsetOf(o, p))) continue;
      alternatives.push(o);
    }
    alternatives.sort((a, b) => b.totalCents - a.totalCents);
  }

  return {
    best,
    alternatives,
    consultationOnlyCents: session.clinicalExam && c17?.coef != null ? tariffCents(c17.coef, key) : 0,
    evaluated,
  };
}

function dedupeNotes(notes: Note[]): Note[] {
  const seen = new Set<string>();
  const order: Record<Note['level'], number> = { warning: 0, reminder: 1, info: 2 };
  return notes
    .filter((n) => (seen.has(n.message) ? false : (seen.add(n.message), true)))
    .sort((a, b) => order[a.level] - order[b.level]);
}

/** Codes as they are written on the mémoire d'honoraires, e.g. "GFQ18R". */
export function billCode(line: BillLine): string {
  return line.code + line.suffixes.join('');
}
