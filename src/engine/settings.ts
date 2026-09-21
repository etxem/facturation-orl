import type { DeviceType, InterpretationId, Settings } from './types';

export interface InterpretationDef {
  id: InterpretationId;
  label: string;
  help: string;
  source: string;
  /** Default = literal reading of the regulation (see README). */
  defaultValue: boolean;
}

export const INTERPRETATIONS: InterpretationDef[] = [
  {
    id: 'cacMultiple',
    label: 'Consultation cumulable avec plusieurs actes CAC',
    help: 'L’article 9 (100 % / 50 % / 50 %) s’applique entre les actes techniques cumulés avec la consultation. Désactivé : une seule prestation CAC avec la consultation.',
    source: 'Art. 10, point 1 et dernier alinéa',
    defaultValue: true,
  },
  {
    id: 'feeNeedsPaidAct',
    label: 'Forfait appareil / frais de matériel seulement si l’acte lié est rémunéré',
    help: 'Désactivé : un acte non rémunéré (au-delà du 3e acte) ouvre quand même le forfait appareil ou les frais de matériel.',
    source: 'Art. 15, 15quater ; ORL sect. 7, rem. 24–30',
    defaultValue: true,
  },
  {
    id: 'feeOncePerDevice',
    label: 'Un seul forfait par appareil et par séance',
    help: 'Désactivé : un forfait par acte utilisant l’appareil (ex. audiométrie + otoémissions → 2 forfaits audiomètre).',
    source: 'Art. 15quater',
    defaultValue: true,
  },
  {
    id: 'gde12WholeSession',
    label: 'Listes blanches GDE12 / GDE13 appliquées à toute la séance',
    help: 'Lecture littérale : la rhinoscopie GDE12 n’est cumulable qu’avec GPD11/13/14/15/16/17/19, GND11, GNE11, GZE11 et GPE11 — donc pas avec otoscopie, audiométrie, laryngoscopie ou prick tests. Désactivé : la restriction ne vaut qu’entre actes « Nez et sinus ».',
    source: 'ORL sect. 2, s.-sect. 1, rem. 2 et 3',
    defaultValue: true,
  },
  {
    id: 'bilateralSmallActs',
    label: 'Suffixe B (bilatéral, +50 %) pour les petits actes unilatéraux',
    help: 'Même opération des deux côtés en une séance : cérumen, paracentèse, aérateurs, injection transtympanique, cornets… Désactivé : l’acte n’est compté qu’une fois.',
    source: 'Art. 9, alinéa « opération bilatérale »',
    defaultValue: true,
  },
  {
    id: 'r1WithSeveralActs',
    label: 'Rapport R1 cumulable avec la consultation ET des actes techniques',
    help: 'Art. 10, point 2 : « un rapport et un autre acte général ou technique ». Désactivé : R1 seulement avec un seul autre acte.',
    source: 'Art. 10, point 2 ; Art. 18',
    defaultValue: true,
  },
  {
    id: 'microscopeOverlap',
    label: 'Otoscopie au microscope (GDE11) cumulable avec un acte réalisé sous microscope',
    help: 'Aucune remarque ne l’interdit (GQD11, GRB11, GRB12, GRD11, GRD12, GSB11), mais l’Art. 9 exclut le cumul avec une prestation dont elle fait partie intégrante.',
    source: 'Art. 9, dernier alinéa',
    defaultValue: true,
  },
  {
    id: 'multipleEchographies',
    label: 'Plusieurs échographies ORL dans la même séance (régions différentes)',
    help: 'Art. 17 : plusieurs procédés d’imagerie sur le même organe ne sont pas cumulables. Désactivé : une seule échographie par séance.',
    source: 'Art. 17',
    defaultValue: true,
  },
];

const DEVICE_TYPES: DeviceType[] = ['audiometre', 'impedancemetre', 'endoscope', 'echographe', 'rhinomanometre', 'pea', 'vng'];

export function defaultSettings(): Settings {
  return {
    devices: Object.fromEntries(
      DEVICE_TYPES.map((t) => [t, { enabled: false, cls: 'I', rate: 'plein', number: '' }]),
    ) as Settings['devices'],
    switches: Object.fromEntries(INTERPRETATIONS.map((i) => [i.id, i.defaultValue])) as Settings['switches'],
  };
}

/** Tolerant merge of settings read from storage (unknown or missing fields fall back to defaults). */
export function mergeSettings(stored: unknown): Settings {
  const base = defaultSettings();
  if (!stored || typeof stored !== 'object') return base;
  const s = stored as Partial<Settings>;
  for (const t of DEVICE_TYPES) {
    const d = s.devices?.[t];
    if (d && typeof d === 'object') {
      base.devices[t] = {
        enabled: typeof d.enabled === 'boolean' ? d.enabled : false,
        cls: d.cls === 'II' || d.cls === 'III' ? d.cls : 'I',
        rate: d.rate === 'reduit' ? 'reduit' : 'plein',
        number: typeof d.number === 'string' ? d.number : '',
      };
    }
  }
  for (const i of INTERPRETATIONS) {
    const v = s.switches?.[i.id];
    if (typeof v === 'boolean') base.switches[i.id] = v;
  }
  return base;
}
