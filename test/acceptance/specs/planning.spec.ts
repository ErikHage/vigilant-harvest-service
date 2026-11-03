import { afterEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('planning', () => {
  const { plants, plantings, planning, cleanup, } = createAcceptanceDsl();

  afterEach(cleanup);

  it('plans to start a planting with a lead time', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plantings.createPlanting('as: gardener', 'planting: indoors', 'plant: tomato', 'leadTimeWeeks: 6');

    await planning.checkToStart('as: gardener', 'planting: indoors');
  });

  it('plans to plant a planting with no lead time', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plantings.createPlanting('as: gardener', 'planting: direct', 'plant: tomato');

    await planning.checkToPlant('as: gardener', 'planting: direct');
  });

  it('plans to plant a planting that has started', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plantings.createPlanting('as: gardener', 'planting: indoors', 'plant: tomato', 'leadTimeWeeks: 6');
    await plantings.start('as: gardener', 'planting: indoors', 'numberSown: 4');

    await planning.checkToPlant('as: gardener', 'planting: indoors');
  });

  it('finds no plan for a year that was never created', async () => {
    await planning.checkUnknownYearIsNotFound('as: gardener');
  });

  it('rejects a year that is not a number', async () => {
    await planning.checkYearMustBeANumber('as: gardener');
  });
});
