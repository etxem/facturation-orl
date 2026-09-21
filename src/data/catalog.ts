import type { CategoryId, CodeKind } from '../engine/types';

/**
 * Curated catalogue: the codes an ENT doctor bills in her practice ("cabinet"), with short labels and
 * categories for the UI. Every other code of the ORL chapter is imported automatically as a "bloc"
 * (operating room) code, hidden in version 1. Codes of other chapters must be listed here to be used.
 *
 * Flags (CAC, CAT, local anesthesia included, unilateral…) are derived from the official label by
 * scripts/build-data.ts; the fields below override them when needed.
 */
export interface CatalogEntry {
  code: string;
  short: string;
  category: CategoryId;
  kind?: CodeKind;
  cabinet?: boolean;
  bilateral?: boolean;
  localAnesthesia?: 'allowed' | 'included' | 'no';
  materialFee?: string;
  noSutureFee?: boolean;
  keywords?: string[];
}

const DIAG = { localAnesthesia: 'no' as const };
const PROC = { localAnesthesia: 'allowed' as const };

export const CATALOG: CatalogEntry[] = [
  // ── Actes généraux ────────────────────────────────────────────────────────────────────────────
  { code: 'C17', short: 'Consultation ORL', category: 'general', kind: 'consultation', ...DIAG },
  { code: 'R1', short: 'Rapport détaillé au médecin traitant', category: 'general', kind: 'report', ...DIAG },

  // ── Oreille ───────────────────────────────────────────────────────────────────────────────────
  { code: 'GDE11', short: 'Otoscopie au microscope', category: 'oreille', ...DIAG, keywords: ['otoscopie', 'microscope', 'tympan'] },
  { code: 'GFQ11', short: 'Audiométrie vocale', category: 'oreille', ...DIAG, keywords: ['audiogramme', 'vocale', 'audition'] },
  { code: 'GFQ12', short: 'Audiométrie tonale (CA + CO)', category: 'oreille', ...DIAG, keywords: ['audiogramme', 'tonale', 'audition', 'surdité'] },
  { code: 'GFQ13', short: 'Audiométrie tonale + vocale / recrutement', category: 'oreille', ...DIAG, keywords: ['audiogramme', 'tonale', 'vocale', 'audition'] },
  { code: 'GFQ14', short: 'Audiométrie à balayage de fréquence', category: 'oreille', ...DIAG, keywords: ['audiométrie', 'dépistage'] },
  { code: 'GFQ15', short: 'Audiométrie comportementale (< 6 ans)', category: 'oreille', ...DIAG, keywords: ['enfant', 'audiométrie'] },
  { code: 'GFQ16', short: 'Bilan auditif central', category: 'oreille', ...DIAG, keywords: ['central', 'dichotique'] },
  { code: 'GFQ17', short: 'Contrôle audioprothèse en champ libre', category: 'oreille', ...DIAG, keywords: ['appareil auditif', 'prothèse', 'champ libre'] },
  { code: 'GFQ18', short: 'Tympanométrie / impédancemétrie', category: 'oreille', ...DIAG, keywords: ['tympanogramme', 'réflexe stapédien', 'impédance'] },
  { code: 'GFQ19', short: 'Examen labyrinthique (manœuvre positionnelle)', category: 'oreille', ...DIAG, keywords: ['vertige', 'VPPB', 'dix-hallpike'] },
  { code: 'GZQ11', short: 'Manœuvre libératoire (VPPB)', category: 'oreille', ...DIAG, keywords: ['vertige', 'VPPB', 'epley', 'sémont'] },
  { code: 'GFQ26', short: 'Otoémissions acoustiques (OEA)', category: 'oreille', ...DIAG, keywords: ['OEA', 'dépistage', 'nourrisson'] },
  { code: 'GFQ27', short: 'Produits de distorsion (DPOAE)', category: 'oreille', ...DIAG, keywords: ['DPOAE', 'otoémissions'] },
  { code: 'GFQ23', short: 'PEA – seuil onde V', category: 'oreille', ...DIAG, keywords: ['potentiels évoqués', 'PEA', 'BERA'] },
  { code: 'GFQ24', short: 'PEA automatiques (dépistage)', category: 'oreille', ...DIAG, keywords: ['potentiels évoqués', 'PEA', 'dépistage'] },
  { code: 'GFQ25', short: 'PEV otolithiques (VEMP)', category: 'oreille', ...DIAG, keywords: ['VEMP', 'vestibulaire', 'sacculaire'] },
  { code: 'GFQ21', short: 'ENG + épreuve rotatoire', category: 'oreille', ...DIAG, keywords: ['vertige', 'vestibulaire', 'VNG', 'fauteuil'] },
  { code: 'GFQ22', short: 'ENG + épreuve calorique', category: 'oreille', ...DIAG, keywords: ['vertige', 'vestibulaire', 'VNG', 'calorique'] },
  { code: 'GFQ28', short: 'Posturographie dynamique', category: 'oreille', ...DIAG, keywords: ['vertige', 'équilibre', 'posturographie'] },
  { code: 'GFQ29', short: 'vHIT (video Head Impulse Test)', category: 'oreille', ...DIAG, keywords: ['vertige', 'vHIT', 'vestibulaire'] },
  { code: 'GCK11', short: 'Cone beam du rocher', category: 'oreille', ...DIAG, keywords: ['imagerie', 'cone beam', 'rocher'] },
  { code: 'GQD11', short: 'Bouchon de cérumen / corps étranger (microscope)', category: 'oreille', ...DIAG, bilateral: true, keywords: ['cérumen', 'bouchon', 'corps étranger', 'conduit'] },
  { code: 'GRB11', short: 'Paracentèse du tympan', category: 'oreille', ...PROC, bilateral: true, keywords: ['otite', 'paracentèse', 'myringotomie'] },
  { code: 'GRB12', short: 'Aérateur transtympanique (par côté)', category: 'oreille', ...PROC, bilateral: true, keywords: ['yoyo', 'diabolo', 'drain', 'aérateur'] },
  { code: 'GSB11', short: 'Injection transtympanique', category: 'oreille', ...PROC, bilateral: true, keywords: ['surdité brusque', 'corticoïdes', 'acouphènes', 'neuronite'] },
  { code: 'GRD11', short: 'Soins pré-op. otite chronique (microscope)', category: 'oreille', ...DIAG, keywords: ['otite chronique', 'soins', 'aspiration'] },
  { code: 'GRD12', short: 'Soins post-op. otite chronique (microscope)', category: 'oreille', ...DIAG, keywords: ['otite chronique', 'soins', 'post-opératoire'] },
  { code: 'GQA11', short: 'Othématome – traitement chirurgical', category: 'oreille', ...PROC, bilateral: true, keywords: ['othématome', 'pavillon'] },
  { code: 'GSQ12', short: 'Réglage d’implant cochléaire', category: 'oreille', ...DIAG, keywords: ['implant cochléaire', 'réglage'] },

  // ── Nez & sinus ───────────────────────────────────────────────────────────────────────────────
  { code: 'GDE12', short: 'Rhinoscopie antérieure (± biopsie)', category: 'nez', ...DIAG, keywords: ['rhinoscopie', 'nez', 'fosses nasales', 'biopsie'] },
  { code: 'GDE13', short: 'Sinuscopie exploratrice', category: 'nez', ...DIAG, keywords: ['sinus', 'sinuscopie'] },
  { code: 'GCK12', short: 'Cone beam des sinus', category: 'nez', ...DIAG, keywords: ['imagerie', 'cone beam', 'sinus', 'scanner'] },
  { code: 'GFQ31', short: 'Rhinométrie acoustique', category: 'nez', ...DIAG, keywords: ['obstruction nasale', 'rhinométrie'] },
  { code: 'GFQ32', short: 'Rhinométrie acoustique + provocation', category: 'nez', ...DIAG, keywords: ['obstruction nasale', 'rhinométrie', 'provocation'] },
  { code: 'GBQ11', short: 'Rhinomanométrie', category: 'nez', ...DIAG, keywords: ['obstruction nasale', 'rhinomanométrie'] },
  { code: 'GBQ12', short: 'Rhinomanométrie avant/après test pharmacodynamique', category: 'nez', ...DIAG, keywords: ['obstruction nasale', 'rhinomanométrie'] },
  { code: 'GFQ33', short: 'Olfactométrie / gustométrie', category: 'nez', ...DIAG, keywords: ['odorat', 'anosmie', 'goût', 'olfaction'] },
  { code: 'GAQ11', short: 'Potentiels évoqués olfactifs', category: 'nez', ...DIAG, keywords: ['odorat', 'anosmie', 'olfaction'] },
  { code: 'GPD13', short: 'Tamponnement antérieur (épistaxis)', category: 'nez', ...PROC, keywords: ['épistaxis', 'saignement', 'méchage'] },
  { code: 'GPD16', short: 'Cautérisation / électrocoagulation muqueuse nasale', category: 'nez', keywords: ['épistaxis', 'cautérisation', 'tache vasculaire'] },
  { code: 'GPD11', short: 'Corps étranger du nez', category: 'nez', keywords: ['corps étranger', 'enfant'] },
  { code: 'GPD15', short: 'Incision hématome / abcès de la cloison', category: 'nez', ...PROC, keywords: ['hématome', 'abcès', 'cloison'] },
  { code: 'GPD17', short: 'Ablation de polypes nasaux (par séance)', category: 'nez', ...PROC, keywords: ['polypes', 'polypose'] },
  { code: 'GPE11', short: 'Synéchie nasale (traitement)', category: 'nez', ...PROC, keywords: ['synéchie'] },
  { code: 'GPD19', short: 'Réduction de cornet (unilatérale)', category: 'nez', ...PROC, bilateral: true, keywords: ['cornet', 'turbinoplastie', 'radiofréquence', 'conchotomie'] },
  { code: 'GPD12', short: 'Réduction fracture des os propres du nez', category: 'nez', ...PROC, keywords: ['fracture', 'nez', 'traumatisme'] },
  { code: 'GZE11', short: 'Bloc ganglion sphéno-palatin (endoscopique)', category: 'nez', ...DIAG, keywords: ['sphéno-palatin', 'algie', 'bloc'] },
  { code: 'GND11', short: 'Lavage / aspiration / instillation d’un sinus', category: 'nez', ...PROC, keywords: ['sinus', 'lavage', 'ponction'] },
  { code: 'GNE11', short: 'Nettoyage post-op. sinus (endoscopique)', category: 'nez', ...PROC, keywords: ['post-opératoire', 'sinus', 'croûtes'] },

  // ── Pharynx & larynx ──────────────────────────────────────────────────────────────────────────
  { code: 'GDE14', short: 'Pharyngo-laryngoscopie indirecte (optique)', category: 'pharynx', ...DIAG, keywords: ['larynx', 'optique rigide', 'dysphonie', 'cordes vocales'] },
  { code: 'GDE15', short: 'Nasofibroscopie (naso-pharyngo-laryngoscopie)', category: 'pharynx', ...DIAG, keywords: ['fibroscopie', 'nasofibroscopie', 'larynx', 'cavum'] },
  { code: 'GDE16', short: 'Nasofibroscopie avec biopsie', category: 'pharynx', ...DIAG, keywords: ['fibroscopie', 'biopsie', 'larynx', 'cavum'] },
  { code: 'GFE11', short: 'Stroboscopie laryngée', category: 'pharynx', ...DIAG, keywords: ['stroboscopie', 'voix', 'dysphonie', 'cordes vocales'] },
  { code: 'GZD11', short: 'Corps étranger pharynx/larynx (sans endoscopie)', category: 'pharynx', keywords: ['arête', 'corps étranger', 'gorge'] },
  { code: 'GZP14', short: 'Incision abcès péri-amygdalien / pharyngé', category: 'pharynx', ...PROC, keywords: ['phlegmon', 'abcès', 'amygdale', 'angine'] },
  { code: 'GXD11', short: 'Changement de canule de trachéotomie', category: 'pharynx', ...DIAG, keywords: ['trachéotomie', 'canule'] },
  { code: 'GZE13', short: 'Changement de prothèse phonatoire', category: 'pharynx', ...DIAG, keywords: ['prothèse phonatoire', 'laryngectomie', 'provox'] },

  // ── Glandes, cou & cytologie ──────────────────────────────────────────────────────────────────
  { code: '1M52', short: 'Cytoponction / ponction-biopsie superficielle', category: 'glandes', ...DIAG, keywords: ['cytoponction', 'nodule', 'thyroïde', 'ganglion', 'FNA'] },
  { code: '1M41', short: 'Ponction d’une collection superficielle', category: 'glandes', ...DIAG, keywords: ['ponction', 'kyste', 'abcès'] },
  { code: '1M42', short: 'Ponction d’une collection profonde', category: 'glandes', ...DIAG, keywords: ['ponction', 'collection'] },
  { code: '1M12', short: 'Infiltration nerf / ganglion profond tête-cou', category: 'glandes', ...DIAG, keywords: ['infiltration', 'nerf', 'névralgie', 'occipital'] },
  { code: 'GUE11', short: 'Sialendoscopie (lavage, bougirage)', category: 'glandes', ...PROC, keywords: ['sialendoscopie', 'glande salivaire', 'parotidite'] },
  { code: 'GUD11', short: 'Calcul salivaire – incision muqueuse endobuccale', category: 'glandes', ...PROC, keywords: ['lithiase', 'calcul', 'Wharton'] },
  { code: 'GUD12', short: 'Grenouillette (marsupialisation)', category: 'glandes', ...PROC, keywords: ['grenouillette', 'kyste', 'sublinguale'] },
  { code: '2F11', short: 'Exérèse de ganglion(s) pour histologie', category: 'glandes', ...PROC, keywords: ['adénopathie', 'ganglion', 'biopsie'] },

  // ── Échographie ───────────────────────────────────────────────────────────────────────────────
  { code: 'GCM12', short: 'Échographie thyroïde et cou', category: 'echo', ...DIAG, keywords: ['thyroïde', 'nodule', 'cou', 'échographie'] },
  { code: 'GCM11', short: 'Échographie ORL (autre région)', category: 'echo', ...DIAG, keywords: ['parotide', 'glande', 'échographie'] },
  { code: 'GCM13', short: 'Écho-Doppler vaisseaux (1re séance)', category: 'echo', ...DIAG, keywords: ['doppler', 'carotide', 'vaisseaux'] },
  { code: 'GCM14', short: 'Écho-Doppler vaisseaux (séance suivante, 6 mois)', category: 'echo', ...DIAG, keywords: ['doppler', 'contrôle', 'vaisseaux'] },

  // ── Allergologie ──────────────────────────────────────────────────────────────────────────────
  { code: 'WFB11', short: 'Prick tests (extraits commerciaux)', category: 'allergo', ...DIAG, materialFee: 'WFB11M', keywords: ['prick', 'allergie', 'rhinite', 'tests cutanés'] },
  { code: 'WFB12', short: 'Prick tests ≥ 6 allergènes + natifs / médicaments', category: 'allergo', ...DIAG, materialFee: 'WFB12M', keywords: ['prick', 'allergie', 'tests cutanés'] },
  { code: 'WFB13', short: 'Prick-to-prick aliments natifs (≥ 6 ans)', category: 'allergo', ...DIAG, materialFee: 'WFB13M', keywords: ['prick-to-prick', 'alimentaire'] },
  { code: 'WFB14', short: 'Prick-to-prick aliments natifs (< 6 ans)', category: 'allergo', ...DIAG, materialFee: 'WFB14M', keywords: ['prick-to-prick', 'alimentaire', 'enfant'] },
  { code: 'WFQ11', short: 'Patch tests (pose)', category: 'allergo', ...DIAG, materialFee: 'WFQ11M', keywords: ['patch', 'contact', 'eczéma'] },
  { code: 'WFB15', short: 'IDR médicaments / venins (concentration unique)', category: 'allergo', ...DIAG, keywords: ['intradermo', 'venin', 'médicament'] },
  { code: 'WFB16', short: 'IDR concentrations croissantes (prick compris)', category: 'allergo', ...DIAG, keywords: ['intradermo', 'venin', 'médicament'] },
  { code: 'WPD11', short: 'Initiation immunothérapie sublinguale', category: 'allergo', ...DIAG, keywords: ['désensibilisation', 'ITA', 'sublinguale'] },
  { code: 'WPB11', short: 'Immunothérapie sous-cutanée (séance)', category: 'allergo', ...DIAG, keywords: ['désensibilisation', 'ITA', 'injection'] },

  // ── Peau, plaies & bouche ─────────────────────────────────────────────────────────────────────
  { code: 'CGA12', short: 'Biopsie peau visage/cou ou muqueuse', category: 'peau', ...PROC, noSutureFee: true, keywords: ['biopsie', 'peau', 'muqueuse', 'histologie'] },
  { code: 'CLA12', short: 'Destruction 1–4 lésions bénignes (visage/cou)', category: 'peau', ...PROC, noSutureFee: true, keywords: ['verrue', 'kératose', 'lésion', 'destruction'] },
  { code: 'CLA14', short: 'Destruction > 4 lésions bénignes (visage/cou)', category: 'peau', ...PROC, noSutureFee: true, keywords: ['verrue', 'kératose', 'lésions', 'destruction'] },
  { code: 'CLA16', short: 'Exérèse naevus < 1 cm (visage/cou)', category: 'peau', ...PROC, noSutureFee: true, keywords: ['naevus', 'grain de beauté', 'exérèse'] },
  { code: 'CLA18', short: 'Exérèse tumeur maligne < 1 cm (visage/cou)', category: 'peau', ...PROC, noSutureFee: true, keywords: ['carcinome', 'basocellulaire', 'exérèse'] },
  { code: 'CLA19', short: 'Exérèse tumeur / naevus > 1 cm, sans fil sous-cutané', category: 'peau', ...PROC, noSutureFee: true, keywords: ['carcinome', 'naevus', 'exérèse'] },
  { code: 'CLA21', short: 'Exérèse tumeur / naevus > 1 cm, avec fil sous-cutané', category: 'peau', ...PROC, noSutureFee: true, keywords: ['carcinome', 'naevus', 'exérèse'] },
  { code: '2L71', short: 'Suture plaie superficielle (< 5 points)', category: 'peau', ...PROC, materialFee: '2L71M', keywords: ['plaie', 'suture', 'traumatisme'] },
  { code: '2L72', short: 'Suture plaie profonde / multiple (≥ 5 points)', category: 'peau', ...PROC, materialFee: '2L72M', keywords: ['plaie', 'suture', 'traumatisme'] },
  { code: '2L76', short: 'Suture secondaire (> 12 h, ≥ 5 points)', category: 'peau', ...PROC, materialFee: '2L76M', keywords: ['plaie', 'suture'] },
  { code: '2G01', short: 'Incision petite collection superficielle', category: 'peau', ...PROC, keywords: ['abcès', 'furoncle', 'incision'] },
  { code: '2G02', short: 'Incision collection volumineuse ou profonde', category: 'peau', ...PROC, keywords: ['abcès', 'incision', 'drainage'] },
  { code: '2G51', short: 'Extraction corps étranger superficiel (incision)', category: 'peau', ...PROC, materialFee: '2G51M', keywords: ['corps étranger', 'incision'] },
  { code: '2G55', short: 'Excision petites tumeurs sous-cutanées', category: 'peau', ...PROC, materialFee: '2G55M', keywords: ['kyste', 'lipome', 'excision'] },
  { code: '2G56', short: 'Excision tumeur sous-cutanée 2–5 cm', category: 'peau', ...PROC, materialFee: '2G56M', keywords: ['kyste', 'lipome', 'excision'] },
  { code: '2G57', short: 'Excision tumeurs cutanées / sous-cutanées étendues', category: 'peau', ...PROC, materialFee: '2G57M', keywords: ['kyste', 'tumeur', 'excision'] },
  { code: '1M80', short: 'Détersion et pansement grande plaie', category: 'peau', ...DIAG, materialFee: '1M80M', keywords: ['plaie', 'pansement', 'détersion'] },
  { code: '9S51', short: 'Biopsie buccale', category: 'peau', ...PROC, keywords: ['biopsie', 'bouche', 'langue', 'muqueuse'] },
  { code: '9S52', short: 'Frein de langue / lèvre (excision-suture)', category: 'peau', ...PROC, keywords: ['frein', 'langue', 'ankyloglossie'] },
  { code: '9S53', short: 'Plastie d’allongement du frein', category: 'peau', ...PROC, keywords: ['frein', 'langue', 'frénotomie'] },
  { code: '9S61', short: 'Incision abcès buccal / pharyngo-laryngé (voie buccale)', category: 'peau', ...PROC, keywords: ['abcès', 'bouche', 'incision'] },
  { code: '9S65', short: 'Résection lésion bénigne de la bouche', category: 'peau', ...PROC, keywords: ['lésion', 'bouche', 'mucocèle'] },
  { code: '9F31', short: 'Réduction luxation temporo-mandibulaire', category: 'peau', ...DIAG, keywords: ['mâchoire', 'luxation', 'ATM'] },
];
