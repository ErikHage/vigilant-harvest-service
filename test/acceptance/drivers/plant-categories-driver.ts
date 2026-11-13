import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectBodyToHaveKeys,
  expectCount,
  expectListEntries,
  expectRejection,
  expectStatus,
  expectThat
} from './assertions';
import { ApiResponse, HttpClient } from '../support/http-client';
import { NewCategory, NewSubcategory, tooLong } from '../support/fixtures';
import { CreatedCategory, CreatedSubcategory, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

type Entry = Record<string, unknown>;

/** Ways a new category can be wrong. Each is a test of its own. */
export const CATEGORY_PROBLEMS = [ 'no name', 'a blank name', 'a name that is too long', ] as const;

export type CategoryProblem = (typeof CATEGORY_PROBLEMS)[number];

const invalidCategories: Record<CategoryProblem, { body: object, reason: string }> = {
  'no name': { body: {}, reason: 'categoryName is required', },
  'a blank name': { body: { categoryName: '  ', }, reason: 'categoryName is required', },
  'a name that is too long': { body: { categoryName: tooLong(255), }, reason: 'categoryName must be at most 255 characters', },
};

/** Ways a new subcategory can be wrong, in a real category unless the path is the problem. */
export const SUBCATEGORY_PROBLEMS = [ 'no name', 'a name that is too long', 'a category id that is not a number', ] as const;

export type SubcategoryProblem = (typeof SUBCATEGORY_PROBLEMS)[number];

const invalidSubcategories: Record<SubcategoryProblem, { categoryId: (real: number) => unknown, body: object, reason: string }> = {
  'no name': { categoryId: real => real, body: {}, reason: 'subcategoryName is required', },
  'a name that is too long': {
    categoryId: real => real,
    body: { subcategoryName: tooLong(255), },
    reason: 'subcategoryName must be at most 255 characters',
  },
  'a category id that is not a number': {
    categoryId: () => 'herbs',
    body: { subcategoryName: 'acc-subcategory', },
    reason: 'categoryId must be an integer',
  },
};

export interface PlantCategoriesDriver {
  createCategory(caller: Actor, input: NewCategory): Promise<CreatedCategory>,
  createSubcategory(caller: Actor, category: CreatedCategory, input: NewSubcategory): Promise<CreatedSubcategory>,
  listIncludesEmptyCategory(caller: Actor, category: CreatedCategory): Promise<void>,
  listIncludesSubcategory(caller: Actor, subcategory: CreatedSubcategory): Promise<void>,
  /** Asserts the second create is rejected, and that one category still holds the name. */
  createOfTakenCategoryNameIsRejectedAsConflict(caller: Actor, category: CreatedCategory): Promise<void>,
  createOfTakenSubcategoryNameIsRejectedAsConflict(caller: Actor, subcategory: CreatedSubcategory): Promise<void>,
  createOfInvalidCategoryIsRejectedAsBadRequest(caller: Actor, problem: CategoryProblem): Promise<void>,
  createOfInvalidSubcategoryIsRejectedAsBadRequest(
    caller: Actor,
    category: CreatedCategory,
    problem: SubcategoryProblem
  ): Promise<void>,
  /** A category id, and a subcategory id under a real category, that aren't numbers. */
  deletesOfNonNumericIdsAreRejectedAsBadRequest(caller: Actor, category: CreatedCategory): Promise<void>,
  deleteRemovesCategory(caller: Actor, category: CreatedCategory): Promise<void>,
  deleteRemovesSubcategory(caller: Actor, subcategory: CreatedSubcategory): Promise<void>,
  /** Asserts the delete is rejected, and that the category is still there. */
  deleteOfCategoryInUseIsRejectedAsConflict(caller: Actor, category: CreatedCategory): Promise<void>,
  /** Asserts the delete is rejected, and that the subcategory is still there. */
  deleteOfSubcategoryInUseIsRejectedAsConflict(caller: Actor, subcategory: CreatedSubcategory): Promise<void>,
}

export function createPlantCategoriesDriver(client: HttpClient, registry: ResourceRegistry): PlantCategoriesDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function list(caller: Actor, what: string): Promise<{ response: ApiResponse, categories: Entry[] }> {
    const response = await as(caller).get('/plant-categories');

    expectStatus(response, status.OK, what);

    return { response, categories: expectListEntries(response, what), };
  }

  const isCategory = (category: CreatedCategory) =>
    (entry: Entry): boolean => entry.categoryId === category.categoryId;

  const subcategoriesOf = (entry: Entry | undefined): Entry[] => (entry?.subcategories ?? []) as Entry[];

  const subcategoryPath = (subcategory: CreatedSubcategory): string =>
    `/plant-categories/${subcategory.categoryId}/plant-subcategories/${subcategory.subcategoryId}`;

  return {
    async createCategory(caller: Actor, input: NewCategory): Promise<CreatedCategory> {
      const { categoryName, } = input;
      const what = `creating category "${categoryName}"`;
      const response = await as(caller).post('/plant-categories', input);

      expectStatus(response, status.CREATED, what);
      expectBodyToHaveKeys(response, [ 'categoryId', ], what);

      const { categoryId, } = response.body as { categoryId: number };

      registry.register({ kind: 'category', path: `/plant-categories/${categoryId}`, label: categoryName, });
      expectBodyToContain(response, { categoryName, subcategories: [], }, what);

      return { categoryId, categoryName, };
    },

    async createSubcategory(
      caller: Actor,
      category: CreatedCategory,
      input: NewSubcategory
    ): Promise<CreatedSubcategory> {
      const { subcategoryName, } = input;
      const what = `creating subcategory "${subcategoryName}" in "${category.categoryName}"`;
      const response = await as(caller)
        .post(`/plant-categories/${category.categoryId}/plant-subcategories`, input);

      expectStatus(response, status.CREATED, what);
      expectBodyToHaveKeys(response, [ 'subcategoryId', ], what);

      const { subcategoryId, } = response.body as { subcategoryId: number };
      const subcategory = { categoryId: category.categoryId, subcategoryId, subcategoryName, };

      registry.register({ kind: 'subcategory', path: subcategoryPath(subcategory), label: subcategoryName, });
      expectBodyToContain(response, { categoryId: category.categoryId, subcategoryName, }, what);

      return subcategory;
    },

    async listIncludesEmptyCategory(caller: Actor, category: CreatedCategory): Promise<void> {
      const what = `finding "${category.categoryName}" in the category list`;
      const { response, categories, } = await list(caller, what);
      const entry = categories.find(isCategory(category));

      expectThat(entry?.categoryName === category.categoryName, 'the category, by id and name', response, what);
      expectCount(subcategoriesOf(entry).length, 0, response, `${what}, with no subcategories`);
    },

    async listIncludesSubcategory(caller: Actor, subcategory: CreatedSubcategory): Promise<void> {
      const what = `finding "${subcategory.subcategoryName}" under its category`;
      const { response, categories, } = await list(caller, what);
      const entry = categories.find(each => each.categoryId === subcategory.categoryId);

      expectThat(
        subcategoriesOf(entry).some(each => each.subcategoryId === subcategory.subcategoryId
          && each.subcategoryName === subcategory.subcategoryName),
        'the subcategory, by id and name',
        response,
        what
      );
    },

    async createOfTakenCategoryNameIsRejectedAsConflict(caller: Actor, category: CreatedCategory): Promise<void> {
      const what = `creating a second category named "${category.categoryName}"`;
      const response = await as(caller).post('/plant-categories', { categoryName: category.categoryName, });

      expectRejection(response, status.CONFLICT, 'duplicate entry', what);

      const after = await list(caller, `${what}: re-reading the list`);
      const holders = after.categories.filter(each => each.categoryName === category.categoryName);

      expectCount(holders.length, 1, after.response, `${what}: categories holding the name`);
    },

    async createOfTakenSubcategoryNameIsRejectedAsConflict(caller: Actor, subcategory: CreatedSubcategory): Promise<void> {
      const what = `creating a second subcategory named "${subcategory.subcategoryName}" in the same category`;
      const response = await as(caller).post(
        `/plant-categories/${subcategory.categoryId}/plant-subcategories`,
        { subcategoryName: subcategory.subcategoryName, }
      );

      expectRejection(response, status.CONFLICT, 'duplicate entry', what);

      const after = await list(caller, `${what}: re-reading the list`);
      const entry = after.categories.find(each => each.categoryId === subcategory.categoryId);
      const holders = subcategoriesOf(entry).filter(each => each.subcategoryName === subcategory.subcategoryName);

      expectCount(holders.length, 1, after.response, `${what}: subcategories holding the name`);
    },

    async createOfInvalidCategoryIsRejectedAsBadRequest(caller: Actor, problem: CategoryProblem): Promise<void> {
      const { body, reason, } = invalidCategories[problem];
      const response = await as(caller).post('/plant-categories', body);

      if (response.status === status.CREATED) {
        const { categoryId, } = response.body as { categoryId: number };
        registry.register({ kind: 'category', path: `/plant-categories/${categoryId}`, label: `a category with ${problem}`, });
      }
      expectRejection(response, status.BAD_REQUEST, reason, `creating a category with ${problem}`);
    },

    async createOfInvalidSubcategoryIsRejectedAsBadRequest(
      caller: Actor,
      category: CreatedCategory,
      problem: SubcategoryProblem
    ): Promise<void> {
      const { categoryId, body, reason, } = invalidSubcategories[problem];
      const path = `/plant-categories/${String(categoryId(category.categoryId))}/plant-subcategories`;
      const response = await as(caller).post(path, body);

      if (response.status === status.CREATED) {
        const { subcategoryId, } = response.body as { subcategoryId: number };
        registry.register({ kind: 'subcategory', path: `${path}/${subcategoryId}`, label: `a subcategory with ${problem}`, });
      }
      expectRejection(response, status.BAD_REQUEST, reason, `creating a subcategory with ${problem}`);
    },

    async deletesOfNonNumericIdsAreRejectedAsBadRequest(caller: Actor, category: CreatedCategory): Promise<void> {
      expectRejection(
        await as(caller).del('/plant-categories/herbs'),
        status.BAD_REQUEST,
        'categoryId must be an integer',
        'deleting a category id that is not a number'
      );
      expectRejection(
        await as(caller).del(`/plant-categories/${category.categoryId}/plant-subcategories/basil`),
        status.BAD_REQUEST,
        'subcategoryId must be an integer',
        'deleting a subcategory id that is not a number'
      );
    },

    async deleteRemovesCategory(caller: Actor, category: CreatedCategory): Promise<void> {
      const what = `deleting category "${category.categoryName}"`;

      expectStatus(await as(caller).del(`/plant-categories/${category.categoryId}`), status.NO_CONTENT, what);

      const after = await list(caller, `${what}: re-reading the list`);

      expectThat(!after.categories.some(isCategory(category)), 'no such category listed', after.response, what);
    },

    async deleteRemovesSubcategory(caller: Actor, subcategory: CreatedSubcategory): Promise<void> {
      const what = `deleting subcategory "${subcategory.subcategoryName}"`;

      expectStatus(await as(caller).del(subcategoryPath(subcategory)), status.NO_CONTENT, what);

      const after = await list(caller, `${what}: re-reading the list`);
      const entry = after.categories.find(each => each.categoryId === subcategory.categoryId);

      expectThat(
        !subcategoriesOf(entry).some(each => each.subcategoryId === subcategory.subcategoryId),
        'no such subcategory listed',
        after.response,
        what
      );
    },

    async deleteOfSubcategoryInUseIsRejectedAsConflict(caller: Actor, subcategory: CreatedSubcategory): Promise<void> {
      const what = `deleting subcategory "${subcategory.subcategoryName}" while a plant uses it`;
      const response = await as(caller).del(subcategoryPath(subcategory));

      expectRejection(response, status.CONFLICT, 'Plant subcategory has plants', what);

      const after = await list(caller, `${what}: re-reading the list`);
      const entry = after.categories.find(each => each.categoryId === subcategory.categoryId);

      expectThat(
        subcategoriesOf(entry).some(each => each.subcategoryId === subcategory.subcategoryId),
        'the subcategory still listed',
        after.response,
        what
      );
    },

    async deleteOfCategoryInUseIsRejectedAsConflict(caller: Actor, category: CreatedCategory): Promise<void> {
      const what = `deleting category "${category.categoryName}" while it has subcategories`;
      const response = await as(caller).del(`/plant-categories/${category.categoryId}`);

      expectRejection(response, status.CONFLICT, 'Plant category has subcategories', what);

      const after = await list(caller, `${what}: re-reading the list`);

      expectThat(after.categories.some(isCategory(category)), 'the category still listed', after.response, what);
    },
  };
}
