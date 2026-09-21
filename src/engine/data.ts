import nomenclature from '../data/nomenclature.json';
import { DEVICES } from '../data/devices';
import { RULES } from '../data/rules';
import type { CodeDef, DeviceDef, Nomenclature, NomenclatureMeta, Rule } from './types';

export interface EngineData {
  meta: NomenclatureMeta;
  list: CodeDef[];
  codes: Map<string, CodeDef>;
  rules: Rule[];
  devices: DeviceDef[];
}

export function createEngineData(n: Nomenclature, rules: Rule[] = RULES, devices: DeviceDef[] = DEVICES): EngineData {
  return { meta: n.meta, list: n.codes, codes: new Map(n.codes.map((c) => [c.code, c])), rules, devices };
}

export const ENGINE_DATA: EngineData = createEngineData(nomenclature as unknown as Nomenclature);
