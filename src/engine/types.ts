export type CodeKind = 'consultation' | 'report' | 'act' | 'deviceFee' | 'materialFee';

export type CategoryId =
  | 'oreille'
  | 'nez'
  | 'pharynx'
  | 'glandes'
  | 'echo'
  | 'allergo'
  | 'peau'
  | 'bloc'
  | 'general';

export type DeviceType =
  | 'echographe'
  | 'endoscope'
  | 'audiometre'
  | 'rhinomanometre'
  | 'impedancemetre'
  | 'pea'
  | 'vng';

export type DeviceClass = 'I' | 'II' | 'III';

/** One entry of the nomenclature as used by the app (generated into src/data/nomenclature.json). */
export interface CodeDef {
  code: string;
  /** Official label from the CNS publication. */
  label: string;
  /** Short French label for tiles. */
  short: string;
  kind: CodeKind;
  /** Coefficient (tariff = coefficient × key letter). Null for fixed-amount device fees. */
  coef: number | null;
  /** Fixed amount in euros (device fees only). */
  amount?: number;
  /** Official tariff printed in the publication (used by tests). */
  officialTarif: number;
  /** Scope path, e.g. "ORL/S1/SS2" = chapter 3, section 1, sub-section 2. */
  scope: string;
  /** Human readable location in the nomenclature. */
  location: string;
  category: CategoryId;
  /** Shown in the practice ("cabinet") catalogue of version 1. */
  cabinet: boolean;
  /** "Cumul avec consultation" (Art. 10 point 1). */
  cac: boolean;
  /** "Cumul à plein tarif avec autre acte technique" (Art. 9). */
  cat: boolean;
  apcm: boolean;
  /** Local anesthesia supplement (suffix L, Art. 13). */
  localAnesthesia: 'allowed' | 'included' | 'no';
  /** One-sided act for which the bilateral suffix B can be applied (Art. 9). */
  bilateral: boolean;
  /** Device whose usage fee can accompany this act. */
  device?: DeviceType;
  /** Material fee code billed with this act in the practice (Art. 15). */
  materialFee?: string;
  /** "Frais de matériel sans suture" (8 % of the coefficient, Art. 15 al. 3). */
  noSutureFee?: boolean;
  keywords: string[];
  /** Conditions to remember (age, frequency…), displayed on the tile. */
  notes: string[];
}

export interface NomenclatureMeta {
  version: string;
  keyLetter: number;
  cote: number;
  validFrom: string;
  /** CNS page listing all versions of the nomenclature. */
  sourceUrl: string;
  /** Official PDF of the version used by the app. */
  pdfUrl: string;
}

export interface Nomenclature {
  meta: NomenclatureMeta;
  codes: CodeDef[];
}

export type InterpretationId =
  | 'cacMultiple'
  | 'feeNeedsPaidAct'
  | 'feeOncePerDevice'
  | 'gde12WholeSession'
  | 'bilateralSmallActs'
  | 'r1WithSeveralActs'
  | 'microscopeOverlap'
  | 'multipleEchographies';

interface RuleBase {
  id: string;
  /** Where the rule comes from, e.g. "ORL, section 1, sous-section 1, remarque 1". */
  source: string;
  /** Remarks of the publication implemented by this rule, as "<scope>#<number>". */
  refs?: string[];
}

/**
 * A combination rule. Exclusion rules carrying `permissiveSwitch` are grey zones: they only apply when
 * that interpretation switch is OFF; when it is ON the combination is allowed but flagged "à valider".
 */
export type Rule = RuleBase &
  (
    | { type: 'mutuallyExclusive'; codes: string[]; permissiveSwitch?: InterpretationId; message?: string }
    | { type: 'crossExclusive'; a: string[]; b: string[]; permissiveSwitch?: InterpretationId; message?: string }
    | { type: 'scopeMutuallyExclusive'; scope: string }
    | { type: 'exclusiveInScope'; codes: string[]; scope: string }
    | {
        type: 'onlyCombinableWith';
        code: string;
        allowed: string[];
        /** When this switch is OFF, the whitelist only applies to acts inside `scopeWhenSwitchOff`. */
        wholeSessionSwitch?: InterpretationId;
        scopeWhenSwitchOff?: string;
      }
    | { type: 'requiresAnyOf'; code: string; anyOf: string[] }
    | { type: 'reminder'; codes: string[]; message: string }
    | { type: 'info'; message: string }
  );

export interface DeviceDef {
  type: DeviceType;
  label: string;
  classes: Partial<Record<DeviceClass, { full: string; reduced: string; range: string }>>;
  acts: string[];
  threshold: number;
  source: string;
}

export interface DeviceSetting {
  enabled: boolean;
  cls: DeviceClass;
  rate: 'plein' | 'reduit';
  number: string;
}

export interface Settings {
  devices: Record<DeviceType, DeviceSetting>;
  switches: Record<InterpretationId, boolean>;
}

/** An act the doctor performed, with its per-act modifiers. */
export interface SelectedAct {
  code: string;
  bilateral?: boolean;
  localAnesthesia?: boolean;
  /** For skin biopsies/lesions: no suture was done → 8 % material fee. */
  noSuture?: boolean;
}

export interface SessionOptions {
  /** R1 report conditions fulfilled (referral asking for an opinion, no follow-up by her). */
  r1: boolean;
  /** A clinical examination took place (otherwise no consultation can be billed, Art. 10). */
  clinicalExam: boolean;
}

export type Suffix = 'R' | 'B' | 'L';

export interface BillLine {
  code: string;
  suffixes: Suffix[];
  label: string;
  kind: CodeKind;
  /** Tariff before suffixes, in cents. */
  baseCents: number;
  /** Final amount in cents. */
  cents: number;
  /** Human readable computation, e.g. "28,20 € × 50 %". */
  detail: string;
  /** Device number for device fees. */
  deviceNumber?: string;
}

export type NoteLevel = 'info' | 'warning' | 'reminder';

export interface Note {
  level: NoteLevel;
  message: string;
  source?: string;
}

export interface DroppedAct {
  code: string;
  reason: string;
}

export interface BillOption {
  route: 'consultation' | 'actes';
  title: string;
  lines: BillLine[];
  totalCents: number;
  /** Selected acts that are not billed in this option, with the reason. */
  dropped: DroppedAct[];
  notes: Note[];
  /** Codes of the acts billed (without fees) — identifies the combination. */
  actCodes: string[];
}

export interface OptimizationResult {
  best: BillOption | null;
  alternatives: BillOption[];
  /** Amount of "C17 seule" for comparison (0 if no consultation possible). */
  consultationOnlyCents: number;
  evaluated: number;
}
