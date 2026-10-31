import { randomBytes } from 'crypto';

/**
 * Payload builders for test data.
 *
 * Every generated name carries a random suffix. The database is never reset
 * and holds real data, and most names are UNIQUE KEYs, so a fixed name would
 * collide with residue from an earlier run.
 *
 * The `acc-` prefix makes leftover rows easy to spot, and is how the residue
 * check tells the suite's records from everything else.
 */

export const FIXTURE_PREFIX = 'acc';

/**
 * Planting years are integers, and real years must never be touched, so test
 * years live in a range of their own. It is the years' equivalent of the name
 * prefix.
 */
export const TEST_YEAR_MIN = 9000;
export const TEST_YEAR_MAX = 9999;

export interface NewCategory {
  categoryName: string,
}

export interface NewSubcategory {
  subcategoryName: string,
}

export function uniqueSuffix(): string {
  return randomBytes(3).toString('hex');
}

/** `acc-herbs-3f9a1c` for the alias `herbs`. */
export function fixtureName(alias: string): string {
  return `${FIXTURE_PREFIX}-${alias}-${uniqueSuffix()}`;
}

export function aCategory(overrides: Partial<NewCategory> = {}): NewCategory {
  return {
    categoryName: fixtureName('category'),
    ...overrides,
  };
}

export function aSubcategory(overrides: Partial<NewSubcategory> = {}): NewSubcategory {
  return {
    subcategoryName: fixtureName('subcategory'),
    ...overrides,
  };
}
