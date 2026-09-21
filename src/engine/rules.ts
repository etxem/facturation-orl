import { inScope } from './scope';
import type { CodeDef, InterpretationId, Rule } from './types';

export type ConflictLevel = 'hard' | 'soft';

export interface Conflict {
  level: ConflictLevel;
  rule: Rule;
}

type Switches = Record<InterpretationId, boolean>;

/**
 * Checks whether two codes may be billed in the same session.
 * - 'hard': forbidden by the nomenclature (or by a grey-zone rule whose permissive switch is off);
 * - 'soft': allowed only thanks to a permissive interpretation switch → flagged "à valider".
 */
export function pairConflict(a: CodeDef, b: CodeDef, rule: Rule, switches: Switches): ConflictLevel | null {
  if (a.code === b.code) return null;
  const permissive = (id?: InterpretationId): ConflictLevel => (id && switches[id] ? 'soft' : 'hard');
  switch (rule.type) {
    case 'mutuallyExclusive':
      return rule.codes.includes(a.code) && rule.codes.includes(b.code) ? permissive(rule.permissiveSwitch) : null;
    case 'crossExclusive': {
      const hit =
        (rule.a.includes(a.code) && rule.b.includes(b.code)) || (rule.a.includes(b.code) && rule.b.includes(a.code));
      return hit ? permissive(rule.permissiveSwitch) : null;
    }
    case 'scopeMutuallyExclusive':
      return inScope(a.scope, rule.scope) && inScope(b.scope, rule.scope) ? 'hard' : null;
    case 'exclusiveInScope': {
      const hit =
        (rule.codes.includes(a.code) && inScope(b.scope, rule.scope)) ||
        (rule.codes.includes(b.code) && inScope(a.scope, rule.scope));
      return hit ? 'hard' : null;
    }
    case 'onlyCombinableWith': {
      const other = a.code === rule.code ? b : b.code === rule.code ? a : null;
      if (!other || other.kind !== 'act' || rule.allowed.includes(other.code)) return null;
      const wholeSession = !rule.wholeSessionSwitch || switches[rule.wholeSessionSwitch];
      if (wholeSession) return 'hard';
      return rule.scopeWhenSwitchOff && inScope(other.scope, rule.scopeWhenSwitchOff) ? 'hard' : 'soft';
    }
    default:
      return null;
  }
}

/** All conflicts between two codes, hard ones first. */
export function conflictsBetween(a: CodeDef, b: CodeDef, rules: Rule[], switches: Switches): Conflict[] {
  const out: Conflict[] = [];
  for (const rule of rules) {
    const level = pairConflict(a, b, rule, switches);
    if (level) out.push({ level, rule });
  }
  return out.sort((x, y) => (x.level === y.level ? 0 : x.level === 'hard' ? -1 : 1));
}

/** Dependency rules ("ne peut être mis en compte qu'avec…") not satisfied by a set of codes. */
export function unmetRequirements(codes: Set<string>, rules: Rule[]): Rule[] {
  return rules.filter((r) => r.type === 'requiresAnyOf' && codes.has(r.code) && !r.anyOf.some((c) => codes.has(c)));
}

/** Reminder rules (frequency limits, conditions) that concern at least one of the codes. */
export function remindersFor(codes: Iterable<string>, rules: Rule[]): Extract<Rule, { type: 'reminder' }>[] {
  const set = new Set(codes);
  return rules.filter((r): r is Extract<Rule, { type: 'reminder' }> => r.type === 'reminder' && r.codes.some((c) => set.has(c)));
}

/** Short French explanation of why two codes cannot (or may only arguably) be combined. */
export function describeConflict(rule: Rule): string {
  switch (rule.type) {
    case 'mutuallyExclusive':
    case 'crossExclusive':
      return rule.message ?? `non cumulables entre eux (${rule.source})`;
    case 'scopeMutuallyExclusive':
      return `les codes de la même sous-section ne sont pas cumulables entre eux (${rule.source})`;
    case 'exclusiveInScope':
      return `${rule.codes.join(', ')} non cumulable(s) avec les autres codes de la même ${rule.scope.split('/').length > 2 ? 'sous-section' : 'section'} (${rule.source})`;
    case 'onlyCombinableWith':
      return `${rule.code} n’est cumulable qu’avec ${rule.allowed.join(', ')} (${rule.source})`;
    case 'requiresAnyOf':
      return `${rule.code} ne peut être mis en compte qu’avec ${rule.anyOf.slice(0, 6).join(', ')}${rule.anyOf.length > 6 ? '…' : ''} (${rule.source})`;
    default:
      return rule.source;
  }
}
