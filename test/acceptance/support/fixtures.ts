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

/**
 * Real dates, whatever the test year: the service never ties harvest, journal
 * or log dates to the planting year. Each is the user's local wall-clock
 * value: a harvest is a day, and an entry is a day and a time.
 */
const HARVEST_DATE = '2026-07-01';
const ENTRY_DATE = '2026-06-01T09:30:00';

/** The user's own today, which the app sends with every planning request. */
export const PLANNING_TODAY = '2026-04-01';

export interface NewCategory {
  categoryName: string,
}

export interface NewSubcategory {
  subcategoryName: string,
}

export interface NewPlant {
  subcategoryId: number,
  friendlyName: string,
  lifespanType?: string,
  tags?: string[],
  description?: string,
  taxonomy?: Record<string, unknown>,
  sowing?: Record<string, unknown>,
  planting?: Record<string, unknown>,
  growing?: Record<string, unknown>,
  harvesting?: Record<string, unknown>,
}

export interface NewPlot {
  friendlyName: string,
  lengthInInches: number,
  widthInInches: number,
  plotType: string,
}

export interface NewPlantingYear {
  plantingYear: number,
  previousPlantingYear: number,
  lastFrostDate: string,
  targetPlantingDate: string,
}

export interface NewPlanting {
  plantId: string,
  plantingYear: number,
  name: string,
  seedSource?: string,
  leadTimeWeeks?: number,
  targetPlantingDate?: string,
}

export interface NewHarvest {
  plantingId: string,
  quantity: number,
  harvestDate: string,
  harvestTypeId?: number,
}

export interface NewJournalEntry {
  plantingYear: number,
  entry: string,
  entryDate: string,
}

export interface NewActivityLogEntry {
  plantingYear: number,
  entryDate: string,
  activityType: string,
  subType: string,
  comments: string,
}

export interface NewSchedule {
  name: string,
  description: string,
}

export interface NewScheduleItem {
  activityType: string,
  subType: string,
  recurrenceRule: string,
  startDate: string,
  startDateYearOffset: number,
  endDate: string,
  endDateYearOffset: number,
  notes: string,
}

export function uniqueSuffix(): string {
  return randomBytes(3).toString('hex');
}

/** `acc-herbs-3f9a1c` for the alias `herbs`. */
export function fixtureName(alias: string): string {
  return `${FIXTURE_PREFIX}-${alias}-${uniqueSuffix()}`;
}

export function aCategory(overrides: Partial<NewCategory> = {}): NewCategory {
  return { categoryName: fixtureName('category'), ...overrides, };
}

export function aSubcategory(overrides: Partial<NewSubcategory> = {}): NewSubcategory {
  return { subcategoryName: fixtureName('subcategory'), ...overrides, };
}

export function aPlant(subcategoryId: number, overrides: Partial<NewPlant> = {}): NewPlant {
  return { subcategoryId, friendlyName: fixtureName('plant'), ...overrides, };
}

/** Every field a plant has, so that a read can show each one survived. */
export function everyPlantDetail(): Partial<NewPlant> {
  return {
    lifespanType: 'Perennial',
    tags: [ 'climbing', 'heirloom', ],
    description: 'Written by the acceptance suite',
    taxonomy: { family: 'Solanaceae', genus: 'Solanum', species: 'lycopersicum', },
    sowing: {
      // free text, as the app's boxes take it
      indoor: '6 weeks before last frost',
      direct: 'After last frost',
      germinationDaysRange: '5-10',
      germinationTempRange: '70-80',
      sowingNotes: 'Keep warm',
    },
    planting: { depthInInches: 0.25, plantSpacingInches: 12, rowSpacingInches: 24, instructions: 'Bury deep', },
    growing: {
      requiredSun: 'full',
      daysToMaturity: 70,
      isClimbing: true,
      climbingHeightFeet: 6,
      plantSize: 'large',
      growingNotes: 'Stake early',
    },
    harvesting: { fruitSize: 'large', shelfStability: 'low', harvestInstructions: 'Pick when red', },
  };
}

export function aPlot(overrides: Partial<NewPlot> = {}): NewPlot {
  return { friendlyName: fixtureName('plot'), lengthInInches: 96, widthInInches: 48, plotType: 'raised bed', ...overrides, };
}

export function aPlantingYear(plantingYear: number, overrides: Partial<NewPlantingYear> = {}): NewPlantingYear {
  return {
    plantingYear,
    // A year with nothing in it, so that nothing carries forward by accident.
    previousPlantingYear: plantingYear - 1,
    lastFrostDate: `${plantingYear}-05-01`,
    targetPlantingDate: `${plantingYear}-05-15`,
    ...overrides,
  };
}

export function aPlanting(plantId: string, plantingYear: number, overrides: Partial<NewPlanting> = {}): NewPlanting {
  return { plantId, plantingYear, name: fixtureName('planting'), ...overrides, };
}

export function aHarvest(plantingId: string, overrides: Partial<NewHarvest> = {}): NewHarvest {
  return { plantingId, quantity: 1, harvestDate: HARVEST_DATE, ...overrides, };
}

export function aJournalEntry(plantingYear: number, overrides: Partial<NewJournalEntry> = {}): NewJournalEntry {
  return { plantingYear, entry: `Written by the acceptance suite ${uniqueSuffix()}`, entryDate: ENTRY_DATE, ...overrides, };
}

export function anActivityLogEntry(
  plantingYear: number,
  overrides: Partial<NewActivityLogEntry> = {}
): NewActivityLogEntry {
  return {
    plantingYear,
    entryDate: ENTRY_DATE,
    activityType: 'WATER',
    subType: 'hose',
    comments: `Written by the acceptance suite ${uniqueSuffix()}`,
    ...overrides,
  };
}

export function aSchedule(overrides: Partial<NewSchedule> = {}): NewSchedule {
  return { name: fixtureName('schedule'), description: 'Written by the acceptance suite', ...overrides, };
}

export function aScheduleItem(overrides: Partial<NewScheduleItem> = {}): NewScheduleItem {
  return {
    activityType: 'WATER',
    subType: 'hose',
    recurrenceRule: 'FREQ=WEEKLY',
    startDate: '05-01',
    startDateYearOffset: 0,
    endDate: '09-01',
    endDateYearOffset: 0,
    notes: 'Written by the acceptance suite',
    ...overrides,
  };
}

/** A copy of a payload without one of its fields, to send a body that is missing it. */
export function withoutField<T extends object>(payload: T, field: keyof T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([ key, ]) => key !== field));
}

/** A string one character longer than a column of `length` holds. */
export function tooLong(length: number): string {
  return 'x'.repeat(length + 1);
}
