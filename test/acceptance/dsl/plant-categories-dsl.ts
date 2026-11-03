import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aCategory, aSubcategory, fixtureName } from '../support/fixtures';
import { CATEGORY_PROBLEMS, PlantCategoriesDriver, SUBCATEGORY_PROBLEMS } from '../drivers/plant-categories-driver';
import { World } from './world';

/** Plant categories, and the subcategories inside them. */
export interface PlantCategoriesDsl {
  /** `as`, `category`, the alias. The real name is generated. */
  createCategory(...args: string[]): Promise<void>,
  /**
   * `as`, `category`, `subcategory`, the alias. The real name is generated,
   * unless `sameNameAs` gives the alias of a subcategory to share it with.
   */
  createSubcategory(...args: string[]): Promise<void>,
  /** `as`, `category`. Asserts it is listed, with no subcategories. */
  checkCategoryListedEmpty(...args: string[]): Promise<void>,
  /** `as`, `subcategory`. Asserts it is listed under its category. */
  checkSubcategoryListed(...args: string[]): Promise<void>,
  /** `as`, `category`. Asserts a second category with its name is rejected. */
  checkDuplicateCategoryIsRejected(...args: string[]): Promise<void>,
  /** `as`, `subcategory`. Asserts a second one with its name, in its category, is rejected. */
  checkDuplicateSubcategoryIsRejected(...args: string[]): Promise<void>,
  /** `as`, `problem`, one of the driver's CATEGORY_PROBLEMS. */
  checkInvalidCategoryIsRejected(...args: string[]): Promise<void>,
  /** `as`, `category`, `problem`, one of the driver's SUBCATEGORY_PROBLEMS. */
  checkInvalidSubcategoryIsRejected(...args: string[]): Promise<void>,
  /** `as`, `category`. Deletes by ids that aren't numbers, under it for a subcategory. */
  checkDeleteIdsMustBeNumbers(...args: string[]): Promise<void>,
  /** `as`, `category`. Asserts it is gone from the list. */
  deleteCategory(...args: string[]): Promise<void>,
  /** `as`, `subcategory`. Asserts it is gone from the list. */
  deleteSubcategory(...args: string[]): Promise<void>,
  /** `as`, `category`. Asserts the delete is rejected while it has subcategories. */
  checkDeleteOfCategoryIsRejectedWhileInUse(...args: string[]): Promise<void>,
  /** `as`, `subcategory`. Asserts the delete is rejected while a plant uses it. */
  checkDeleteOfSubcategoryIsRejectedWhileInUse(...args: string[]): Promise<void>,
}

export function createPlantCategoriesDsl(world: World, plantCategories: PlantCategoriesDriver): PlantCategoriesDsl {
  return {
    async createCategory(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), category: alias(), });
      const caller = await world.actorFor(params.as);

      world.nameCategory(
        params.category,
        await plantCategories.createCategory(caller, aCategory({ categoryName: fixtureName(params.category), }))
      );
    },

    async createSubcategory(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        category: alias(),
        subcategory: alias(),
        sameNameAs: optional(),
      });
      const caller = await world.actorFor(params.as);
      const category = world.categoryNamed(params.category);
      const subcategoryName = params.sameNameAs === undefined
        ? fixtureName(params.subcategory)
        : world.subcategoryNamed(params.sameNameAs).subcategoryName;

      world.nameSubcategory(
        params.subcategory,
        await plantCategories.createSubcategory(caller, category, aSubcategory({ subcategoryName, }))
      );
    },

    async checkCategoryListedEmpty(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), category: alias(), });

      await plantCategories.listIncludesEmptyCategory(
        await world.actorFor(params.as),
        world.categoryNamed(params.category)
      );
    },

    async checkSubcategoryListed(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), subcategory: alias(), });

      await plantCategories.listIncludesSubcategory(
        await world.actorFor(params.as),
        world.subcategoryNamed(params.subcategory)
      );
    },

    async checkDuplicateCategoryIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), category: alias(), });

      await plantCategories.createOfTakenCategoryNameIsRejectedAsConflict(
        await world.actorFor(params.as),
        world.categoryNamed(params.category)
      );
    },

    async checkDuplicateSubcategoryIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), subcategory: alias(), });

      await plantCategories.createOfTakenSubcategoryNameIsRejectedAsConflict(
        await world.actorFor(params.as),
        world.subcategoryNamed(params.subcategory)
      );
    },

    async checkInvalidCategoryIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), problem: required().allowedValues(...CATEGORY_PROBLEMS), });

      await plantCategories.createOfInvalidCategoryIsRejectedAsBadRequest(await world.actorFor(params.as), params.problem);
    },

    async checkInvalidSubcategoryIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        category: alias(),
        problem: required().allowedValues(...SUBCATEGORY_PROBLEMS),
      });

      await plantCategories.createOfInvalidSubcategoryIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.categoryNamed(params.category),
        params.problem
      );
    },

    async checkDeleteIdsMustBeNumbers(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), category: alias(), });

      await plantCategories.deletesOfNonNumericIdsAreRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.categoryNamed(params.category)
      );
    },

    async deleteCategory(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), category: alias(), });

      await plantCategories.deleteRemovesCategory(
        await world.actorFor(params.as),
        world.categoryNamed(params.category)
      );
    },

    async deleteSubcategory(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), subcategory: alias(), });

      await plantCategories.deleteRemovesSubcategory(
        await world.actorFor(params.as),
        world.subcategoryNamed(params.subcategory)
      );
    },

    async checkDeleteOfSubcategoryIsRejectedWhileInUse(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), subcategory: alias(), });

      await plantCategories.deleteOfSubcategoryInUseIsRejectedAsConflict(
        await world.actorFor(params.as),
        world.subcategoryNamed(params.subcategory)
      );
    },

    async checkDeleteOfCategoryIsRejectedWhileInUse(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), category: alias(), });

      await plantCategories.deleteOfCategoryInUseIsRejectedAsConflict(
        await world.actorFor(params.as),
        world.categoryNamed(params.category)
      );
    },
  };
}
