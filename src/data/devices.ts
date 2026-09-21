import type { DeviceDef, DeviceType } from '../engine/types';

/**
 * "Forfaits pour frais d'utilisation d'appareil" of the ORL chapter (Art. 15quater, chapitre 3,
 * section 7, remarques 1–30). Full amount = 4-position code + suffix 1, reduced amount = suffix 2.
 */
export const DEVICES: DeviceDef[] = [
  {
    type: 'audiometre',
    label: 'Audiomètre',
    classes: {
      I: { full: 'GFM11', reduced: 'GFM12', range: '5 000 – 24 999,99 €' },
      II: { full: 'GFM21', reduced: 'GFM22', range: '≥ 25 000 € (chambre insonorisée incluse possible)' },
    },
    acts: ['GFQ11', 'GFQ12', 'GFQ13', 'GFQ14', 'GFQ15', 'GFQ16', 'GFQ17', 'GFQ26', 'GFQ27'],
    threshold: 400,
    source: 'ORL, section 7, rem. 8–11 et 26',
  },
  {
    type: 'impedancemetre',
    label: 'Impédancemètre / tympanomètre',
    classes: { I: { full: 'GFM41', reduced: 'GFM42', range: '> 3 000 €' } },
    acts: ['GFQ18'],
    threshold: 100,
    source: 'ORL, section 7, rem. 14–15 et 28',
  },
  {
    type: 'endoscope',
    label: 'Endoscope / fibroscope',
    classes: {
      I: { full: 'GDD11', reduced: 'GDD12', range: '5 000 – 14 999,99 €' },
      II: { full: 'GDD21', reduced: 'GDD22', range: '≥ 15 000 €' },
    },
    acts: ['GDE15', 'GDE16', 'GFE11'],
    threshold: 400,
    source: 'ORL, section 7, rem. 5–7 et 25',
  },
  {
    type: 'echographe',
    label: 'Échographe',
    classes: {
      I: { full: 'GCJ11', reduced: 'GCJ12', range: '20 000 – 59 999,99 €' },
      II: { full: 'GCJ21', reduced: 'GCJ22', range: '60 000 – 89 999,99 €' },
      III: { full: 'GCJ31', reduced: 'GCJ32', range: '≥ 90 000 €' },
    },
    acts: ['GCM11', 'GCM12', 'GCM13', 'GCM14'],
    threshold: 200,
    source: 'ORL, section 7, rem. 1–4 et 24',
  },
  {
    type: 'rhinomanometre',
    label: 'Rhinomanomètre',
    classes: { I: { full: 'GFM31', reduced: 'GFM32', range: '> 3 000 €' } },
    acts: ['GFQ31', 'GFQ32', 'GBQ11', 'GBQ12'],
    threshold: 100,
    source: 'ORL, section 7, rem. 12–13 et 27',
  },
  {
    type: 'pea',
    label: 'Potentiels évoqués auditifs',
    classes: {
      I: { full: 'GFM51', reduced: 'GFM52', range: '10 000 – 19 999,99 €' },
      II: { full: 'GFM61', reduced: 'GFM62', range: '≥ 20 000 €' },
    },
    acts: ['GFQ23', 'GFQ24', 'GFQ25'],
    threshold: 100,
    source: 'ORL, section 7, rem. 16–18 et 29',
  },
  {
    type: 'vng',
    label: 'Vidéonystagmographe',
    classes: {
      I: { full: 'GFM71', reduced: 'GFM72', range: '5 000 – 14 999,99 €' },
      II: { full: 'GFM81', reduced: 'GFM82', range: '≥ 15 000 €' },
    },
    acts: ['GFQ21', 'GFQ22', 'GFQ28', 'GFQ29'],
    threshold: 100,
    source: 'ORL, section 7, rem. 19–21 et 30',
  },
];

export const DEVICE_BY_TYPE: Record<DeviceType, DeviceDef> = Object.fromEntries(
  DEVICES.map((d) => [d.type, d]),
) as Record<DeviceType, DeviceDef>;
