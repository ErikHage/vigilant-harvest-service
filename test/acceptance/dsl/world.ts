import { Actor } from '../support/actors';
import { Drivers } from '../drivers/drivers';
import {
  aCategory,
  aPlantingYear,
  aSubcategory,
  TEST_YEAR_MAX,
  TEST_YEAR_MIN
} from '../support/fixtures';
import {
  CreatedActivityLogEntry,
  CreatedCategory,
  CreatedHarvest,
  CreatedJournalEntry,
  CreatedPlant,
  CreatedPlanting,
  CreatedPlantingYear,
  CreatedPlot,
  CreatedSchedule,
  CreatedScheduleItem,
  CreatedSubcategory
} from '../support/resources';
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
export const LOGGED_OUT = 'logged-out';

export const RESERVED_ACTORS: readonly string[] = [ GARDENER, ANONYMOUS, FORGED, MALFORMED, LOGGED_OUT, ];

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
   * The named subcategory, or when a spec names none, one made for it. A plant
   * can't exist without a subcategory, but most specs aren't about that.
   */
  subcategoryFor(caller: Actor, alias: string | undefined): Promise<CreatedSubcategory>,

  namePlant(alias: string, plant: CreatedPlant): void,
  plantNamed(alias: string): CreatedPlant,

  namePlot(alias: string, plot: CreatedPlot): void,
  plotNamed(alias: string): CreatedPlot,

  nameYear(alias: string, year: CreatedPlantingYear): void,
  yearNamed(alias: string): CreatedPlantingYear,
  /** A year in the test range that nothing holds, not even leftovers. */
  unusedYear(caller: Actor): Promise<number>,
  /** The named year, or when a spec names none, one made for it. */
  yearFor(caller: Actor, alias: string | undefined): Promise<CreatedPlantingYear>,

  namePlanting(alias: string, planting: CreatedPlanting): void,
  plantingNamed(alias: string): CreatedPlanting,

  nameHarvest(alias: string, harvest: CreatedHarvest): void,
  harvestNamed(alias: string): CreatedHarvest,

  nameJournalEntry(alias: string, entry: CreatedJournalEntry): void,
  journalEntryNamed(alias: string): CreatedJournalEntry,

  nameActivityLogEntry(alias: string, entry: CreatedActivityLogEntry): void,
  activityLogEntryNamed(alias: string): CreatedActivityLogEntry,

  nameSchedule(alias: string, schedule: CreatedSchedule): void,
  scheduleNamed(alias: string): CreatedSchedule,

  nameScheduleItem(alias: string, item: CreatedScheduleItem): void,
  scheduleItemNamed(alias: string): CreatedScheduleItem,

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
  const plantsByAlias = new Map<string, CreatedPlant>();
  const plotsByAlias = new Map<string, CreatedPlot>();
  const yearsByAlias = new Map<string, CreatedPlantingYear>();
  const plantingsByAlias = new Map<string, CreatedPlanting>();
  const harvestsByAlias = new Map<string, CreatedHarvest>();
  const journalEntriesByAlias = new Map<string, CreatedJournalEntry>();
  const activityLogEntriesByAlias = new Map<string, CreatedActivityLogEntry>();
  const schedulesByAlias = new Map<string, CreatedSchedule>();
  const scheduleItemsByAlias = new Map<string, CreatedScheduleItem>();

  let defaultSubcategory: CreatedSubcategory | undefined;
  let defaultYear: CreatedPlantingYear | undefined;

  function lookup<TValue>(known: Map<string, TValue>, alias: string, what: string, create: string): TValue {
    const value = known.get(alias);

    if (value === undefined) {
      throw new Error(`no ${what} called "${alias}" in this spec -- ${create}`);
    }

    return value;
  }

  async function unusedYear(caller: Actor): Promise<number> {
    const taken = await testContext.drivers.plantingYears.listYears(caller);
    const free: number[] = [];

    for (let year = TEST_YEAR_MIN; year <= TEST_YEAR_MAX; year++) {
      if (!taken.includes(year)) {
        free.push(year);
      }
    }

    return free[Math.floor(Math.random() * free.length)]!;
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
        case LOGGED_OUT:
          return testContext.loggedOut();
        default:
          throw new Error(`no caller called "${as}" -- use one of: ${RESERVED_ACTORS.join(', ')}`);
      }
    },

    nameCategory: (alias, category) => {
      categoriesByAlias.set(alias, category);
    },
    categoryNamed: alias => lookup(
      categoriesByAlias, alias, 'category', `create one first with createCategory('category: ${alias}', ...)`
    ),

    nameSubcategory: (alias, subcategory) => {
      subcategoriesByAlias.set(alias, subcategory);
    },
    subcategoryNamed: alias => lookup(
      subcategoriesByAlias, alias, 'subcategory', `create one first with createSubcategory('subcategory: ${alias}', ...)`
    ),

    async subcategoryFor(caller: Actor, alias: string | undefined): Promise<CreatedSubcategory> {
      if (alias !== undefined) {
        return lookup(
          subcategoriesByAlias, alias, 'subcategory', `create one first with createSubcategory('subcategory: ${alias}', ...)`
        );
      }

      if (defaultSubcategory === undefined) {
        const { plantCategories, } = testContext.drivers;
        const category = await plantCategories.createCategory(caller, aCategory());

        defaultSubcategory = await plantCategories.createSubcategory(caller, category, aSubcategory());
      }

      return defaultSubcategory;
    },

    namePlant: (alias, plant) => {
      plantsByAlias.set(alias, plant);
    },
    plantNamed: alias => lookup(plantsByAlias, alias, 'plant', `create one first with createPlant('plant: ${alias}', ...)`),

    namePlot: (alias, plot) => {
      plotsByAlias.set(alias, plot);
    },
    plotNamed: alias => lookup(plotsByAlias, alias, 'plot', `create one first with createPlot('plot: ${alias}', ...)`),

    nameYear: (alias, year) => {
      yearsByAlias.set(alias, year);
    },
    yearNamed: alias => lookup(yearsByAlias, alias, 'planting year', `create one first with createYear('year: ${alias}', ...)`),

    unusedYear,

    async yearFor(caller: Actor, alias: string | undefined): Promise<CreatedPlantingYear> {
      if (alias !== undefined) {
        return lookup(yearsByAlias, alias, 'planting year', `create one first with createYear('year: ${alias}', ...)`);
      }

      defaultYear ??= await testContext.drivers.plantingYears.createYear(
        caller,
        aPlantingYear(await unusedYear(caller))
      );

      return defaultYear;
    },

    namePlanting: (alias, planting) => {
      plantingsByAlias.set(alias, planting);
    },
    plantingNamed: alias => lookup(
      plantingsByAlias, alias, 'planting', `create one first with createPlanting('planting: ${alias}', ...)`
    ),

    nameHarvest: (alias, harvest) => {
      harvestsByAlias.set(alias, harvest);
    },
    harvestNamed: alias => lookup(harvestsByAlias, alias, 'harvest', `record one first with recordHarvest('harvest: ${alias}', ...)`),

    nameJournalEntry: (alias, entry) => {
      journalEntriesByAlias.set(alias, entry);
    },
    journalEntryNamed: alias => lookup(
      journalEntriesByAlias, alias, 'journal entry', `create one first with createEntry('entry: ${alias}', ...)`
    ),

    nameActivityLogEntry: (alias, entry) => {
      activityLogEntriesByAlias.set(alias, entry);
    },
    activityLogEntryNamed: alias => lookup(
      activityLogEntriesByAlias, alias, 'activity log entry', `create one first with createEntry('entry: ${alias}', ...)`
    ),

    nameSchedule: (alias, schedule) => {
      schedulesByAlias.set(alias, schedule);
    },
    scheduleNamed: alias => lookup(
      schedulesByAlias, alias, 'schedule', `create one first with createSchedule('schedule: ${alias}', ...)`
    ),

    nameScheduleItem: (alias, item) => {
      scheduleItemsByAlias.set(alias, item);
    },
    scheduleItemNamed: alias => lookup(
      scheduleItemsByAlias, alias, 'schedule item', `create one first with addItem('item: ${alias}', ...)`
    ),

    async cleanup(): Promise<void> {
      categoriesByAlias.clear();
      subcategoriesByAlias.clear();
      plantsByAlias.clear();
      plotsByAlias.clear();
      yearsByAlias.clear();
      plantingsByAlias.clear();
      harvestsByAlias.clear();
      journalEntriesByAlias.clear();
      activityLogEntriesByAlias.clear();
      schedulesByAlias.clear();
      scheduleItemsByAlias.clear();
      defaultSubcategory = undefined;
      defaultYear = undefined;

      await testContext.cleanup();
    },
  };
}
