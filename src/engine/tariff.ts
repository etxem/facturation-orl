/**
 * Tariff arithmetic of the nomenclature (Art. 4 of the règlement grand-ducal du 21 décembre 1998):
 * tariff = coefficient × key letter, counted in euros to one decimal; fractions of a tenth are rounded
 * up from 5 cents. Suffix coefficients multiply that rounded tariff and the final amount is rounded
 * again the same way. Everything is computed on integers to avoid floating point drift.
 */

/** Suffix multipliers in percent (Art. 4). */
export const SUFFIX_PERCENT = {
  R: 50, // Art. 9: 2nd and 3rd technical act
  B: 150, // Art. 9: bilateral operation in one session
  L: 115, // Art. 13: local anesthesia
} as const;

/** Rounds a value expressed as numerator/denominator (in cents) to 10 cents, 5 cents rounding up. */
function roundToTenCents(numerator: number, denominator: number): number {
  return Math.floor((numerator + 5 * denominator) / (10 * denominator)) * 10;
}

const toHundredths = (coef: number) => Math.round(coef * 100);
const toTenThousandths = (keyLetter: number) => Math.round(keyLetter * 10000);

/** Tariff of a coefficient, in cents. */
export function tariffCents(coef: number, keyLetter: number): number {
  // coef·100 × key·10000 = euros·10^6 = cents·10^4
  return roundToTenCents(toHundredths(coef) * toTenThousandths(keyLetter), 10_000);
}

/** Applies suffix multipliers (in percent) to a rounded tariff and rounds the final amount. */
export function applyPercents(baseCents: number, percents: number[]): number {
  if (percents.length === 0) return baseCents;
  let numerator = baseCents;
  let denominator = 1;
  for (const p of percents) {
    numerator *= p;
    denominator *= 100;
  }
  return roundToTenCents(numerator, denominator);
}

/**
 * "Frais de matériel sans suture" (Art. 15 al. 3): 8 % of the act's coefficient, amount rounded to
 * one decimal according to Art. 4.
 */
export function noSutureFeeCents(coef: number, keyLetter: number): number {
  // coef·100 × 8 × key·10000 = euros·10^8 = cents·10^6
  return roundToTenCents(toHundredths(coef) * 8 * toTenThousandths(keyLetter), 1_000_000);
}

export const eurosToCents = (euros: number) => Math.round(euros * 100);

const euroFormat = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export function formatEuros(cents: number): string {
  return euroFormat.format(cents / 100);
}
