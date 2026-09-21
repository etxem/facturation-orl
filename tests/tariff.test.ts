import { describe, expect, it } from 'vitest';
import { applyPercents, formatEuros, noSutureFeeCents, tariffCents } from '../src/engine/tariff';

const KEY = 5.2346;

describe('tariffCents (Art. 4)', () => {
  it('multiplies the coefficient by the key letter and rounds to 10 cents', () => {
    expect(tariffCents(9.24, KEY)).toBe(4840); // C17: 48.3677 → 48.40
    expect(tariffCents(42.47, KEY)).toBe(22230); // GFQ16: 222.3135 → 222.30
    expect(tariffCents(16.04, KEY)).toBe(8400); // GFQ15: 83.9630 → 84.00
    expect(tariffCents(5.38, KEY)).toBe(2820); // GDE11: 28.1621 → 28.20
  });

  it('rounds 5 cents and more up, less than 5 cents down', () => {
    expect(tariffCents(1, 10.05)).toBe(1010); // 10.05 → 10.10
    expect(tariffCents(1, 10.0499)).toBe(1000); // 10.0499 → 10.00
  });

  it('reproduces the previous key letter (01.05.2025) tariffs too', () => {
    expect(tariffCents(9.24, 5.1069)).toBe(4720); // C17 was 47.20
    expect(tariffCents(12.21, 5.1069)).toBe(6240); // GFQ12 was 62.40
  });
});

describe('applyPercents (suffixes)', () => {
  it('applies R (50 %) and rounds 5 cents up', () => {
    expect(applyPercents(6110, [50])).toBe(3060); // 30.55 → 30.60
    expect(applyPercents(5290, [50])).toBe(2650); // 26.45 → 26.50
    expect(applyPercents(2820, [50])).toBe(1410);
  });

  it('chains several suffixes and rounds only once', () => {
    expect(applyPercents(2730, [150, 50])).toBe(2050); // 20.475 → 20.50
    expect(applyPercents(4500, [115])).toBe(5180); // 51.75 → 51.80
    expect(applyPercents(1000, [150, 115, 50])).toBe(860); // 8.625 → 8.60 (2.5 cents rounds down)
  });

  it('leaves the amount unchanged without suffix', () => {
    expect(applyPercents(4840, [])).toBe(4840);
  });
});

describe('noSutureFeeCents (Art. 15 al. 3)', () => {
  it('is 8 % of the coefficient, rounded to 10 cents', () => {
    expect(noSutureFeeCents(7.59, KEY)).toBe(320); // CGA12: 3.178 → 3.20
  });
});

describe('formatEuros', () => {
  it('formats in French', () => {
    expect(formatEuros(16500).replace(/\s/g, ' ')).toBe('165,00 €');
  });
});
