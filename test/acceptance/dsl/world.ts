import { Actor } from '../support/actors';
import { Drivers } from '../drivers/drivers';
import { CreatedCategory, CreatedSubcategory } from '../support/resources';
import { TestContext, createTestContext } from '../support/test-context';

/**
 * What a spec has named so far, and who it can act as.
 *
 * The DSL modules are stateless; everything a step needs to remember lives
 * here, because a name given in one module is used in another.
 *
 * One world per spec file, alongside the test context it wraps.
 */

/** The `as:` values. Users live in feral, so the suite creates none of its own. */
export const GARDENER = 'gardener';
export const ANONYMOUS = 'anonymous';
export const FORGED = 'forged';
export const MALFORMED = 'malformed';

export const RESERVED_ACTORS: readonly string[] = [ GARDENER, ANONYMOUS, FORGED, MALFORMED, ];

export interface World {
  /**
   * The drivers, so a DSL module can be handed the one it drives. Built once
   * per spec; each of their methods takes the caller as its first argument.
   */
  drivers: Drivers,

  /** Resolves the `as:` parameter to an actor. */
  actorFor(as: string): Promise<Actor>,

  nameCategory(alias: string, category: CreatedCategory): void,
  categoryNamed(alias: string): CreatedCategory,

  nameSubcategory(alias: string, subcategory: CreatedSubcategory): void,
  subcategoryNamed(alias: string): CreatedSubcategory,

  /**
   * Tears down what the spec created and forgets every name. The two must
   * happen together, or a later test resolves a name to a resource that has
   * just been deleted.
   */
  cleanup(): Promise<void>,
}

export function createWorld(testContext: TestContext = createTestContext()): World {
  const categoriesByAlias = new Map<string, CreatedCategory>();
  const subcategoriesByAlias = new Map<string, CreatedSubcategory>();

  function lookup<TValue>(known: Map<string, TValue>, alias: string, what: string, create: string): TValue {
    const value = known.get(alias);

    if (value === undefined) {
      throw new Error(`no ${what} called "${alias}" in this spec -- ${create}`);
    }

    return value;
  }

  return {
    drivers: testContext.drivers,

    async actorFor(as: string): Promise<Actor> {
      switch (as) {
        case GARDENER:
          return testContext.gardener();
        case ANONYMOUS:
          return testContext.anonymous();
        case FORGED:
          return testContext.forged();
        case MALFORMED:
          return testContext.malformed();
        default:
          throw new Error(`no caller called "${as}" -- use one of: ${RESERVED_ACTORS.join(', ')}`);
      }
    },

    nameCategory(alias: string, category: CreatedCategory): void {
      categoriesByAlias.set(alias, category);
    },

    categoryNamed(alias: string): CreatedCategory {
      return lookup(categoriesByAlias, alias, 'category', `create one first with createCategory('category: ${alias}', ...)`);
    },

    nameSubcategory(alias: string, subcategory: CreatedSubcategory): void {
      subcategoriesByAlias.set(alias, subcategory);
    },

    subcategoryNamed(alias: string): CreatedSubcategory {
      return lookup(
        subcategoriesByAlias, alias, 'subcategory',
        `create one first with createSubcategory('subcategory: ${alias}', ...)`
      );
    },

    async cleanup(): Promise<void> {
      categoriesByAlias.clear();
      subcategoriesByAlias.clear();

      await testContext.cleanup();
    },
  };
}
