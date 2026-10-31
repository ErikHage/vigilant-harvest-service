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

/** The resources a spec creates that teardown deletes. */
export type TrackedResourceKind = 'category' | 'subcategory';

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
