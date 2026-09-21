import { conflictsBetween } from './rules';
import type { CodeDef, InterpretationId, Rule } from './types';

export interface ConflictGroup {
  rule: Rule;
  level: 'hard' | 'soft';
  codes: string[];
}

/**
 * Every act of the app that cannot be billed with `def` in the same session, grouped by rule
 * ('soft' = allowed only under a permissive interpretation switch).
 */
export function conflictSummary(
  def: CodeDef,
  list: CodeDef[],
  rules: Rule[],
  switches: Record<InterpretationId, boolean>,
): ConflictGroup[] {
  const groups = new Map<string, ConflictGroup>();
  for (const other of list) {
    if (other.kind !== 'act' || other.code === def.code) continue;
    const conflict = conflictsBetween(def, other, rules, switches)[0];
    if (!conflict) continue;
    const key = `${conflict.level}:${conflict.rule.id}`;
    const g = groups.get(key) ?? { rule: conflict.rule, level: conflict.level, codes: [] };
    g.codes.push(other.code);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => (a.level === b.level ? b.codes.length - a.codes.length : a.level === 'hard' ? -1 : 1));
}
