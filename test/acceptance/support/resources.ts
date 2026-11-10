import { NewPlant } from './fixtures';

/**
 * Shared shapes for resources the suite creates, plus the registry the test
 * context uses to tear them down again.
 *
 * These live in their own module so the resource drivers and the test context
 * can both refer to them without importing each other.
 */

export interface CreatedCategory {
  categoryId: number,
  categoryName: string,
}

export interface CreatedSubcategory {
  categoryId: number,
  subcategoryId: number,
  subcategoryName: string,
}

export interface CreatedPlant {
  plantId: string,
  friendlyName: string,
  /** What it was created from, so a read can be compared with it. */
  input: NewPlant,
}

export interface CreatedPlot {
  plotId: string,
  friendlyName: string,
  lengthInInches: number,
  widthInInches: number,
  plotType: string,
}

export interface CreatedPlantingYear {
  plantingYear: number,
  /** As it was sent, so a read can be compared with it. */
  lastFrostDate: string,
  targetPlantingDate: string,
}

export interface CreatedPlanting {
  plantingId: string,
  name: string,
  plantingYear: number,
}

export interface CreatedHarvest {
  harvestId: string,
  plantingId: string,
}

export interface CreatedJournalEntry {
  entryId: string,
  plantingYear: number,
  entry: string,
}

export interface CreatedActivityLogEntry {
  entryId: string,
  plantingYear: number,
  comments: string,
}

export interface CreatedSchedule {
  activityScheduleId: string,
  name: string,
  description: string,
}

export interface CreatedScheduleItem {
  activityScheduleId: string,
  entryId: string,
}

/** The resources a spec creates that teardown deletes. */
export type TrackedResourceKind =
  'category' | 'subcategory' | 'plant' | 'plot' | 'planting year' | 'planting' | 'harvest' |
  'journal entry' | 'activity log entry' | 'activity schedule';

export interface TrackedResource {
  kind: TrackedResourceKind,
  /**
   * Where to send the DELETE. Written by the driver that made the resource,
   * because deletes here aren't uniform: a subcategory's sits under its
   * category, and a journal entry's isn't where it was created.
   */
  path: string,
  label: string,
}

export interface ResourceRegistry {
  register(resource: TrackedResource): void,
}
