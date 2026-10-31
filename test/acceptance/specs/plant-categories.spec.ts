import { afterEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('plant categories', () => {
  const { plantCategories, cleanup, } = createAcceptanceDsl();

  afterEach(cleanup);

  it('lists a new category with no subcategories', async () => {
    await plantCategories.createCategory('as: gardener', 'category: herbs');

    await plantCategories.checkCategoryListedEmpty('as: gardener', 'category: herbs');
  });

  it('lists a subcategory under its category', async () => {
    await plantCategories.createCategory('as: gardener', 'category: herbs');
    await plantCategories.createSubcategory('as: gardener', 'category: herbs', 'subcategory: basil');

    await plantCategories.checkSubcategoryListed('as: gardener', 'subcategory: basil');
  });

  it('rejects a second category with the same name', async () => {
    await plantCategories.createCategory('as: gardener', 'category: herbs');

    await plantCategories.checkDuplicateCategoryIsRejected('as: gardener', 'category: herbs');
  });

  it('rejects a second subcategory with the same name in one category', async () => {
    await plantCategories.createCategory('as: gardener', 'category: herbs');
    await plantCategories.createSubcategory('as: gardener', 'category: herbs', 'subcategory: basil');

    await plantCategories.checkDuplicateSubcategoryIsRejected('as: gardener', 'subcategory: basil');
  });

  it('allows the same subcategory name in another category', async () => {
    await plantCategories.createCategory('as: gardener', 'category: herbs');
    await plantCategories.createCategory('as: gardener', 'category: flowers');
    await plantCategories.createSubcategory('as: gardener', 'category: herbs', 'subcategory: basil');

    await plantCategories.createSubcategory(
      'as: gardener',
      'category: flowers',
      'subcategory: flowering-basil',
      'sameNameAs: basil'
    );

    await plantCategories.checkSubcategoryListed('as: gardener', 'subcategory: flowering-basil');
  });

  it('rejects deleting a category that has subcategories', async () => {
    await plantCategories.createCategory('as: gardener', 'category: herbs');
    await plantCategories.createSubcategory('as: gardener', 'category: herbs', 'subcategory: basil');

    await plantCategories.checkDeleteOfCategoryIsRejectedWhileInUse('as: gardener', 'category: herbs');
  });

  it('deletes an empty subcategory, then the empty category', async () => {
    await plantCategories.createCategory('as: gardener', 'category: herbs');
    await plantCategories.createSubcategory('as: gardener', 'category: herbs', 'subcategory: basil');

    await plantCategories.deleteSubcategory('as: gardener', 'subcategory: basil');
    await plantCategories.deleteCategory('as: gardener', 'category: herbs');
  });
});
