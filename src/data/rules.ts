import type { Rule } from '../engine/types';

/**
 * Combination rules. Each ORL remark of the publication is referenced in `refs` ("<scope>#<n>");
 * the test suite checks that every remark of chapter 3 is covered.
 *
 * Sources: règlement grand-ducal modifié du 21 décembre 1998 (nomenclature des actes et services des
 * médecins), version coordonnée CNS au 01.09.2026.
 */

const src = (s: string) => `ORL, ${s}`;

export const RULES: Rule[] = [
  // ── Section 1 « Oreilles », sous-section 1 « Examens diagnostiques » ─────────────────────────────
  { id: 'orl-s1-ss1-audiometries', type: 'mutuallyExclusive', codes: ['GFQ11', 'GFQ12', 'GFQ13', 'GFQ14', 'GFQ15'], source: src('sect. 1, s.-sect. 1, rem. 1'), refs: ['ORL/S1/SS1#1'] },
  { id: 'orl-s1-ss1-pea', type: 'mutuallyExclusive', codes: ['GFQ23', 'GFQ24', 'GFQ25'], source: src('sect. 1, s.-sect. 1, rem. 2'), refs: ['ORL/S1/SS1#2'] },
  { id: 'orl-s1-ss1-oea', type: 'mutuallyExclusive', codes: ['GFQ26', 'GFQ27'], source: src('sect. 1, s.-sect. 1, rem. 3'), refs: ['ORL/S1/SS1#3'] },
  { id: 'orl-s1-ss1-vestib', type: 'mutuallyExclusive', codes: ['GFQ28', 'GFQ29'], source: src('sect. 1, s.-sect. 1, rem. 4'), refs: ['ORL/S1/SS1#4'] },
  { id: 'orl-s1-ss1-gfq13-gfq18', type: 'mutuallyExclusive', codes: ['GFQ13', 'GFQ18'], source: src('sect. 1, s.-sect. 1, rem. 5'), refs: ['ORL/S1/SS1#5'] },
  { id: 'orl-s1-ss1-gfq17-once', type: 'reminder', codes: ['GFQ17'], message: 'Une seule fois par dispositif de correction auditive.', source: src('sect. 1, s.-sect. 1, rem. 6'), refs: ['ORL/S1/SS1#6'] },
  { id: 'orl-s1-ss1-specialty', type: 'info', message: 'Examens audiométriques, impédancemétrie, PEA et OEA réservés aux ORL ; ENG, posturographie et vHIT aux ORL, neurologues et pédiatres.', source: src('sect. 1, s.-sect. 1, rem. 11–12'), refs: ['ORL/S1/SS1#11', 'ORL/S1/SS1#12'] },

  // ── Section 1, sous-section 2 « Chirurgie de l'oreille » ────────────────────────────────────────
  { id: 'orl-s1-ss2-gqp11-gqq11', type: 'mutuallyExclusive', codes: ['GQP11', 'GQQ11'], source: src('sect. 1, s.-sect. 2, rem. 1'), refs: ['ORL/S1/SS2#1'] },
  { id: 'orl-s1-ss2-grd11-grd12', type: 'mutuallyExclusive', codes: ['GRD11', 'GRD12'], source: src('sect. 1, s.-sect. 2, rem. 2'), refs: ['ORL/S1/SS2#2'] },
  { id: 'orl-s1-ss2-grq11-grq12', type: 'mutuallyExclusive', codes: ['GRQ11', 'GRQ12'], source: src('sect. 1, s.-sect. 2, rem. 3'), refs: ['ORL/S1/SS2#3'] },
  { id: 'orl-s1-ss2-grq13-gre11', type: 'mutuallyExclusive', codes: ['GRQ13', 'GRE11'], source: src('sect. 1, s.-sect. 2, rem. 4'), refs: ['ORL/S1/SS2#4'] },
  { id: 'orl-s1-ss2-mastoid', type: 'mutuallyExclusive', codes: ['GZC12', 'GZC13', 'GZC14', 'GZC16'], source: src('sect. 1, s.-sect. 2, rem. 5'), refs: ['ORL/S1/SS2#5'] },
  { id: 'orl-s1-ss2-gsb11-gzc15', type: 'exclusiveInScope', codes: ['GSB11', 'GZC15'], scope: 'ORL/S1/SS2', source: src('sect. 1, s.-sect. 2, rem. 6'), refs: ['ORL/S1/SS2#6'] },
  { id: 'orl-s1-ss2-gqq12-size', type: 'reminder', codes: ['GQQ12'], message: 'Uniquement si la tumeur maligne mesure au moins 0,5 cm dans son grand axe.', source: src('sect. 1, s.-sect. 2, rem. 7'), refs: ['ORL/S1/SS2#7'] },
  { id: 'orl-s1-ss2-grd11-limits', type: 'reminder', codes: ['GRD11'], message: 'Max. 4 fois par patient ; uniquement si une intervention d’oreille est prévue (GRB11, GRB12, GRQ11…) et qu’aucune n’a déjà été facturée pour ce patient.', source: src('sect. 1, s.-sect. 2, rem. 8'), refs: ['ORL/S1/SS2#8'] },
  { id: 'orl-s1-ss2-grd12-limits', type: 'reminder', codes: ['GRD12'], message: 'Max. 4 fois, après une intervention d’oreille (GRB11, GRB12, GRQ11…) facturée pour ce patient.', source: src('sect. 1, s.-sect. 2, rem. 9'), refs: ['ORL/S1/SS2#9'] },
  { id: 'orl-s1-ss2-assistance', type: 'info', message: 'Assistance opératoire uniquement pour GQA12, GZP11 et GZC11.', source: src('sect. 1, s.-sect. 2, rem. 10'), refs: ['ORL/S1/SS2#10'] },

  // ── Section 1, sous-section 3 « Implants » ──────────────────────────────────────────────────────
  { id: 'orl-s1-ss3-gsb12-gsb13', type: 'mutuallyExclusive', codes: ['GSB12', 'GSB13'], source: src('sect. 1, s.-sect. 3, rem. 1'), refs: ['ORL/S1/SS3#1'] },
  { id: 'orl-s1-ss3-gra', type: 'mutuallyExclusive', codes: ['GRA11', 'GRA12', 'GRA13'], source: src('sect. 1, s.-sect. 3, rem. 2'), refs: ['ORL/S1/SS3#2'] },
  { id: 'orl-s1-ss3-gsa11-gsa12', type: 'mutuallyExclusive', codes: ['GSA11', 'GSA12'], source: src('sect. 1, s.-sect. 3, rem. 3'), refs: ['ORL/S1/SS3#3'] },
  { id: 'orl-s1-ss3-gsa13', type: 'mutuallyExclusive', codes: ['GSA13', 'GSQ11', 'GSA14'], source: src('sect. 1, s.-sect. 3, rem. 4'), refs: ['ORL/S1/SS3#4'] },
  { id: 'orl-s1-ss3-gza', type: 'mutuallyExclusive', codes: ['GZA11', 'GZA12'], source: src('sect. 1, s.-sect. 3, rem. 5'), refs: ['ORL/S1/SS3#5'] },
  { id: 'orl-s1-ss3-per-ear', type: 'reminder', codes: ['GSB12', 'GSB13', 'GRA11', 'GRA12', 'GSA11'], message: 'Max. 2 fois par oreille.', source: src('sect. 1, s.-sect. 3, rem. 6'), refs: ['ORL/S1/SS3#6'] },
  { id: 'orl-s1-ss3-gsa12', type: 'reminder', codes: ['GSA12'], message: 'Max. 2 fois par patient et seulement si GSA11 n’a jamais été facturé.', source: src('sect. 1, s.-sect. 3, rem. 7'), refs: ['ORL/S1/SS3#7'] },
  { id: 'orl-s1-ss3-assistance', type: 'info', message: 'Assistance opératoire uniquement pour GSA11 et GSA12.', source: src('sect. 1, s.-sect. 3, rem. 8'), refs: ['ORL/S1/SS3#8'] },

  // ── Section 2 « Nez et sinus », sous-section 1 « Examens diagnostiques » ────────────────────────
  { id: 'orl-s2-ss1-all', type: 'scopeMutuallyExclusive', scope: 'ORL/S2/SS1', source: src('sect. 2, s.-sect. 1, rem. 1'), refs: ['ORL/S2/SS1#1'] },
  {
    id: 'orl-s2-ss1-gde12-whitelist',
    type: 'onlyCombinableWith',
    code: 'GDE12',
    allowed: ['GPD13', 'GPD14', 'GPD15', 'GPD16', 'GPD17', 'GND11', 'GNE11', 'GPD11', 'GZE11', 'GPE11', 'GPD19'],
    wholeSessionSwitch: 'gde12WholeSession',
    scopeWhenSwitchOff: 'ORL/S2',
    source: src('sect. 2, s.-sect. 1, rem. 2'),
    refs: ['ORL/S2/SS1#2'],
  },
  {
    id: 'orl-s2-ss1-gde13-whitelist',
    type: 'onlyCombinableWith',
    code: 'GDE13',
    allowed: ['GND11'],
    wholeSessionSwitch: 'gde12WholeSession',
    scopeWhenSwitchOff: 'ORL/S2',
    source: src('sect. 2, s.-sect. 1, rem. 3'),
    refs: ['ORL/S2/SS1#3'],
  },
  { id: 'orl-s2-ss1-specialty', type: 'info', message: 'Rhinométrie et rhinomanométrie réservées aux ORL.', source: src('sect. 2, s.-sect. 1, rem. 5'), refs: ['ORL/S2/SS1#5'] },

  // ── Section 2, sous-section 3 « Chirurgie du nez » ──────────────────────────────────────────────
  { id: 'orl-s2-ss3-gpd13-gpd14', type: 'mutuallyExclusive', codes: ['GPD13', 'GPD14'], source: src('sect. 2, s.-sect. 3, rem. 1'), refs: ['ORL/S2/SS3#1'] },
  { id: 'orl-s2-ss3-exclusive', type: 'exclusiveInScope', codes: ['GPD11', 'GPD12', 'GPA11', 'GPE11', 'GPD18', 'GPD19'], scope: 'ORL/S2/SS3', source: src('sect. 2, s.-sect. 3, rem. 2'), refs: ['ORL/S2/SS3#2'] },
  { id: 'orl-s2-ss3-assistance', type: 'info', message: 'Assistance opératoire uniquement pour GZP12.', source: src('sect. 2, s.-sect. 3, rem. 3'), refs: ['ORL/S2/SS3#3'] },

  // ── Section 2, sous-section 4 « Chirurgie des sinus » ───────────────────────────────────────────
  { id: 'orl-s2-ss4-gnd11-gne11', type: 'mutuallyExclusive', codes: ['GND11', 'GNE11'], source: src('sect. 2, s.-sect. 4, rem. 1'), refs: ['ORL/S2/SS4#1'] },
  { id: 'orl-s2-ss4-sinusitis', type: 'mutuallyExclusive', codes: ['GND12', 'GNP11', 'GND13', 'GND14'], source: src('sect. 2, s.-sect. 4, rem. 2'), refs: ['ORL/S2/SS4#2'] },
  { id: 'orl-s2-ss4-gne11-gnd14', type: 'mutuallyExclusive', codes: ['GNE11', 'GND14'], source: src('sect. 2, s.-sect. 4, rem. 3'), refs: ['ORL/S2/SS4#3'] },
  { id: 'orl-s2-ss4-gnd15', type: 'exclusiveInScope', codes: ['GND15'], scope: 'ORL/S2', source: src('sect. 2, s.-sect. 4, rem. 4'), refs: ['ORL/S2/SS4#4'] },
  { id: 'orl-s2-ss4-gne11-limit', type: 'reminder', codes: ['GNE11'], message: 'Max. 3 fois par patient.', source: src('sect. 2, s.-sect. 4, rem. 5'), refs: ['ORL/S2/SS4#5'] },

  // ── Section 3 « Glandes salivaires, pharynx, larynx et trachée » ────────────────────────────────
  { id: 'orl-s3-ss1-all', type: 'scopeMutuallyExclusive', scope: 'ORL/S3/SS1', source: src('sect. 3, s.-sect. 1, rem. 1'), refs: ['ORL/S3/SS1#1'] },
  { id: 'orl-s3-ss2-gud11-gup11', type: 'mutuallyExclusive', codes: ['GUD11', 'GUP11'], source: src('sect. 3, s.-sect. 2, rem. 1'), refs: ['ORL/S3/SS2#1'] },
  { id: 'orl-s3-ss2-gua12-gua13', type: 'mutuallyExclusive', codes: ['GUA12', 'GUA13'], source: src('sect. 3, s.-sect. 2, rem. 2'), refs: ['ORL/S3/SS2#2'] },
  { id: 'orl-s3-ss2-gue11', type: 'exclusiveInScope', codes: ['GUE11'], scope: 'ORL/S3/SS2', source: src('sect. 3, s.-sect. 2, rem. 3'), refs: ['ORL/S3/SS2#3'] },
  { id: 'orl-s3-ss2-gua11-gua13-limit', type: 'reminder', codes: ['GUA11', 'GUA13'], message: 'Max. 2 fois par patient.', source: src('sect. 3, s.-sect. 2, rem. 4'), refs: ['ORL/S3/SS2#4'] },
  { id: 'orl-s3-ss2-gua12-limit', type: 'reminder', codes: ['GUA12'], message: 'Max. 2 fois par parotide.', source: src('sect. 3, s.-sect. 2, rem. 5'), refs: ['ORL/S3/SS2#5'] },
  { id: 'orl-s3-ss2-gue11-indication', type: 'reminder', codes: ['GUE11'], message: 'Uniquement dans le cadre d’une sialoadénite récidivante.', source: src('sect. 3, s.-sect. 2, rem. 6'), refs: ['ORL/S3/SS2#6'] },
  { id: 'orl-s3-ss2-assistance', type: 'info', message: 'Assistance opératoire uniquement pour GUP11, GUA11, GUA12 et GUA13.', source: src('sect. 3, s.-sect. 2, rem. 7'), refs: ['ORL/S3/SS2#7'] },
  { id: 'orl-s3-ss3-gtd', type: 'mutuallyExclusive', codes: ['GTD11', 'GTD12'], source: src('sect. 3, s.-sect. 3, rem. 1'), refs: ['ORL/S3/SS3#1'] },
  { id: 'orl-s3-ss3-gvd14', type: 'exclusiveInScope', codes: ['GVD14'], scope: 'ORL/S3/SS3', source: src('sect. 3, s.-sect. 3, rem. 2'), refs: ['ORL/S3/SS3#2'] },
  { id: 'orl-s3-ss3-limit', type: 'reminder', codes: ['GVD11', 'GVD12', 'GVD13', 'GVD14'], message: 'Max. 3 fois par patient.', source: src('sect. 3, s.-sect. 3, rem. 3'), refs: ['ORL/S3/SS3#3'] },
  { id: 'orl-s3-ss3-assistance', type: 'info', message: 'Assistance opératoire uniquement pour GZP13.', source: src('sect. 3, s.-sect. 3, rem. 4'), refs: ['ORL/S3/SS3#4'] },
  { id: 'orl-s3-ss4-pharyngectomies', type: 'mutuallyExclusive', codes: ['GVP11', 'GVD15', 'GZQ12'], source: src('sect. 3, s.-sect. 4, rem. 1'), refs: ['ORL/S3/SS4#1'] },
  { id: 'orl-s3-ss4-exclusive', type: 'exclusiveInScope', codes: ['GVP12', 'GZP14', 'GZQ13', 'GZQ14'], scope: 'ORL/S3/SS4', source: src('sect. 3, s.-sect. 4, rem. 2'), refs: ['ORL/S3/SS4#2'] },
  { id: 'orl-s3-ss4-gzb11-specialty', type: 'info', message: 'GZB11 réservé aux ORL.', source: src('sect. 3, s.-sect. 4, rem. 3'), refs: ['ORL/S3/SS4#3'] },
  { id: 'orl-s3-ss4-assistance', type: 'info', message: 'Assistance opératoire uniquement pour GVP11, GVD15, GVP12, GZP14, GZQ12, GZQ13 et GZQ14.', source: src('sect. 3, s.-sect. 4, rem. 4'), refs: ['ORL/S3/SS4#4'] },
  { id: 'orl-s3-ss5-all', type: 'scopeMutuallyExclusive', scope: 'ORL/S3/SS5', source: src('sect. 3, s.-sect. 5, rem. 1'), refs: ['ORL/S3/SS5#1'] },
  { id: 'orl-s3-ss5-gwe17-18', type: 'reminder', codes: ['GWE17', 'GWE18'], message: 'Une seule fois par patient.', source: src('sect. 3, s.-sect. 5, rem. 2'), refs: ['ORL/S3/SS5#2'] },
  { id: 'orl-s3-ss5-gwe18-delay', type: 'reminder', codes: ['GWE18'], message: 'Entre 3 et 6 mois après la facturation de GWE17.', source: src('sect. 3, s.-sect. 5, rem. 3'), refs: ['ORL/S3/SS5#3'] },
  { id: 'orl-s3-ss5-assistance', type: 'info', message: 'Assistance opératoire uniquement pour GWP11, GZA13, GWE22, GWE23, GWA11 et GWA12.', source: src('sect. 3, s.-sect. 5, rem. 4'), refs: ['ORL/S3/SS5#4'] },
  { id: 'orl-s3-ss6-tracheo', type: 'mutuallyExclusive', codes: ['GXA11', 'GXD11', 'GXD12'], source: src('sect. 3, s.-sect. 6, rem. 1'), refs: ['ORL/S3/SS6#1'] },
  { id: 'orl-s3-ss6-prosthesis', type: 'mutuallyExclusive', codes: ['GZE12', 'GZE13'], source: src('sect. 3, s.-sect. 6, rem. 2'), refs: ['ORL/S3/SS6#2'] },
  { id: 'orl-s3-ss6-gxa12', type: 'exclusiveInScope', codes: ['GXA12'], scope: 'ORL/S3/SS6', source: src('sect. 3, s.-sect. 6, rem. 3'), refs: ['ORL/S3/SS6#3'] },
  { id: 'orl-s3-ss6-assistance', type: 'info', message: 'Assistance opératoire uniquement pour GXA11, GXD11, GXD12 et GXA12.', source: src('sect. 3, s.-sect. 6, rem. 4'), refs: ['ORL/S3/SS6#4'] },

  // ── Section 4 « Chirurgie du cou » ───────────────────────────────────────────────────────────────
  { id: 'orl-s4-thyroid', type: 'mutuallyExclusive', codes: ['GYA11', 'GYA12'], source: src('sect. 4, rem. 1'), refs: ['ORL/S4#1'] },
  { id: 'orl-s4-gya13-limit', type: 'reminder', codes: ['GYA13'], message: 'Max. 2 fois par patient.', source: src('sect. 4, rem. 2'), refs: ['ORL/S4#2'] },
  { id: 'orl-s4-gya14-15-limit', type: 'reminder', codes: ['GYA14', 'GYA15'], message: 'Max. 3 fois par patient.', source: src('sect. 4, rem. 3'), refs: ['ORL/S4#3'] },

  // ── Section 5 « Divers » ─────────────────────────────────────────────────────────────────────────
  { id: 'orl-s5-lymph', type: 'mutuallyExclusive', codes: ['GGB11', 'GZB12', 'GZB13', 'GZB14'], source: src('sect. 5, rem. 1'), refs: ['ORL/S5#1'] },
  { id: 'orl-s5-cysts', type: 'mutuallyExclusive', codes: ['GYA16', 'GZA14'], source: src('sect. 5, rem. 2'), refs: ['ORL/S5#2'] },
  { id: 'orl-s5-per-side', type: 'reminder', codes: ['GZB13', 'GZB14'], message: 'Une seule fois par côté.', source: src('sect. 5, rem. 3'), refs: ['ORL/S5#3'] },
  {
    id: 'orl-s5-gaq12-requires',
    type: 'requiresAnyOf',
    code: 'GAQ12',
    anyOf: ['GSC11', 'GRE11', 'GRC11', 'GRQ12', 'GQQ13', 'GRQ13', 'GZC12', 'GZC13', 'GZC14', 'GZC15', 'GZC16', 'GRA11', 'GRA12', 'GRA13', 'GSA11', 'GSA12', 'GZA11', 'GZA12', 'GYA11', 'GYA12', 'GYA13', 'GYA14', 'GYA15', 'GUA11', 'GUA12', 'GUA13'],
    source: src('sect. 5, rem. 4'),
    refs: ['ORL/S5#4'],
  },
  {
    id: 'orl-s5-gzr11-requires',
    type: 'requiresAnyOf',
    code: 'GZR11',
    anyOf: ['GPD17', 'GND11', 'GNE11', 'GPE12', 'GPE13', 'GND12', 'GNP11', 'GND13', 'GND14', 'GND15'],
    source: src('sect. 5, rem. 5'),
    refs: ['ORL/S5#5'],
  },
  { id: 'orl-s5-assistance', type: 'info', message: 'Assistance opératoire uniquement pour GGB11, GZB12, GZB13, GZB14, GYA16 et GZA14.', source: src('sect. 5, rem. 6'), refs: ['ORL/S5#6'] },

  // ── Section 6 « Echographies » et section 7 « Forfaits pour frais d'utilisation d'appareil » ─────
  { id: 'orl-s6-specialty', type: 'info', message: 'Échographies GCM11–GCM14 réservées aux ORL.', source: src('sect. 6, rem. 1'), refs: ['ORL/S6#1'] },
  {
    id: 'orl-devices',
    type: 'info',
    message:
      'Forfaits pour frais d’utilisation d’appareil : uniquement pour un appareil installé au cabinet et déclaré à la CNS, et seulement si l’acte lié est mis en compte au cours de la même séance. Montant plein (suffixe 1) jusqu’au seuil annuel d’activité ou jusqu’à l’amortissement, puis montant réduit (suffixe 2). Voir Réglages.',
    source: 'Art. 15quater ; ORL, sect. 7',
    refs: [
      'ORL/S1/SS1#7', 'ORL/S1/SS1#8', 'ORL/S1/SS1#9', 'ORL/S1/SS1#10', 'ORL/S2/SS1#4', 'ORL/S3/SS1#2', 'ORL/S6#2',
      ...Array.from({ length: 30 }, (_, i) => `ORL/S7#${i + 1}`),
    ],
  },
  {
    id: 'orl-echo-first-next',
    type: 'mutuallyExclusive',
    codes: ['GCM13', 'GCM14'],
    message: 'Écho-Doppler « première séance » et « séance suivante » s’excluent.',
    source: 'ORL, sect. 6 (libellés des positions 3 et 4)',
  },

  // ── Zones grises (interrupteurs dans Réglages) ───────────────────────────────────────────────────
  {
    id: 'grey-microscope-overlap',
    type: 'crossExclusive',
    a: ['GDE11'],
    b: ['GQD11', 'GRB11', 'GRB12', 'GRD11', 'GRD12', 'GSB11'],
    permissiveSwitch: 'microscopeOverlap',
    message: 'L’otoscopie au microscope pourrait être considérée comme partie intégrante d’un acte réalisé sous microscope (Art. 9 : « aucune prestation ne peut être cumulée avec une prestation dont elle fait partie intégrante »).',
    source: 'Art. 9, dernier alinéa (interprétation)',
  },
  {
    id: 'grey-multiple-echographies',
    type: 'mutuallyExclusive',
    codes: ['GCM11', 'GCM12', 'GCM13', 'GCM14'],
    permissiveSwitch: 'multipleEchographies',
    message: 'Plusieurs échographies dans la même séance : cumul seulement pour des organes/régions différents (Art. 17 : procédés d’imagerie sur le même organe non cumulables).',
    source: 'Art. 17 (interprétation)',
  },

  // ── Autres chapitres (codes du catalogue) ────────────────────────────────────────────────────────
  {
    id: 'allergo-exclusive',
    type: 'mutuallyExclusive',
    codes: ['WFB11', 'WFB12', 'WFB13', 'WFB14', 'WFQ11', 'WFB15', 'WFB16', 'WFD11', 'WFD12', 'WPD11', 'WPB11', 'WPB12', 'WPB13', 'WQQ11'],
    source: 'Médecine interne spécialisée, s.-sect. 4 Allergologie, rem. 1',
  },
  { id: 'allergo-wfq11', type: 'reminder', codes: ['WFQ11'], message: 'Uniquement à la pose.', source: 'Allergologie, rem. 4' },
  { id: 'allergo-wfb16', type: 'reminder', codes: ['WFB16'], message: 'Uniquement après un prick test négatif lors de la même séance (le prick est compris dans WFB16).', source: 'Allergologie, rem. 5' },
  { id: 'allergo-wpd11', type: 'reminder', codes: ['WPD11'], message: 'Max. 2 fois par période de 12 mois ; immunothérapie limitée à 60 mois par allergène.', source: 'Allergologie, rem. 6' },
  { id: 'allergo-age', type: 'reminder', codes: ['WFB13', 'WFB14', 'GFQ15'], message: 'Condition d’âge du patient (voir libellé).', source: 'Libellés WFB13, WFB14, GFQ15' },
  { id: 'derm-cla12-cla14', type: 'crossExclusive', a: ['CLA11', 'CLQ11', 'CLA12', 'CLQ12'], b: ['CLA13', 'CLQ13', 'CLA14', 'CLQ14'], source: 'Dermatologie, rem. 2' },
  { id: 'infiltrations', type: 'reminder', codes: ['1M12'], message: 'Infiltrations non cumulables entre elles pour la même région ; infiltrations superficielles non facturables.', source: 'Médecine générale, s.-sect. 1 Infiltrations' },
  { id: 'r1-conditions', type: 'reminder', codes: ['R1'], message: 'R1 : l’ordonnance du médecin traitant (identifié par son code) doit demander expressément un avis, et vous ne poursuivez pas vous-même le traitement.', source: 'Art. 18' },
];
