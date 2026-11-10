import { afterEach, beforeEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('harvests', () => {
  const { plants, plots, plantings, harvests, cleanup, } = createAcceptanceDsl();

  beforeEach(async () => {
    await plants.createPlant('as: gardener', 'plant: tomato', 'defaultHarvestType: pounds');
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plantings.plant('as: gardener', 'planting: row-one', 'plot: north-bed', 'numberTransplanted: 4');
  });
  afterEach(cleanup);

  it('files a harvest under its planting year, with the default type of its plant', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');

    await harvests.checkHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2', 'type: pounds');
  });

  it('keeps a harvest type chosen for one harvest', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2', 'type: fruit');

    await harvests.checkHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2', 'type: fruit');
  });

  it('does not rewrite a harvest when the default type of its plant changes', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');

    await plants.updatePlant('as: gardener', 'plant: tomato', 'defaultHarvestType: fruit');

    await harvests.checkHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2', 'type: pounds');
  });

  it('folds two harvests of one planting, day and type into one', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: morning', 'planting: row-one', 'quantity: 2');
    await harvests.recordHarvest('as: gardener', 'harvest: evening', 'planting: row-one', 'quantity: 3');

    await harvests.checkHarvest('as: gardener', 'harvest: morning', 'planting: row-one', 'quantity: 5', 'type: pounds');
    await harvests.checkStats('as: gardener', 'statsType: Planting', 'planting: row-one', 'harvests: 1');
  });

  it('accepts a date after 2038', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: far-off', 'planting: row-one', 'quantity: 2', 'date: 2040-07-01');

    await harvests.checkHarvest('as: gardener', 'harvest: far-off', 'planting: row-one', 'quantity: 2', 'type: pounds');
  });

  it('keeps a harvest in its year when it is saved again', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');

    await harvests.saveAgain('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 9');

    await harvests.checkHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 9', 'type: pounds');
  });

  it('adds up a planting in the summary of its year, by type', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');
    await harvests.recordHarvest('as: gardener', 'harvest: second', 'planting: row-one', 'quantity: 3', 'date: 2026-07-02');
    await harvests.recordHarvest('as: gardener', 'harvest: third', 'planting: row-one', 'quantity: 1', 'type: fruit');

    await harvests.checkInSummary('as: gardener', 'planting: row-one', 'quantity: 5', 'type: pounds');
    await harvests.checkInSummary('as: gardener', 'planting: row-one', 'quantity: 1', 'type: fruit');
  });

  it('counts harvests in the stats of a year, by planting and by plant', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');
    await harvests.recordHarvest('as: gardener', 'harvest: second', 'planting: row-one', 'quantity: 3', 'date: 2026-07-02');

    await harvests.checkStats('as: gardener', 'statsType: Planting', 'planting: row-one', 'harvests: 2');
    await harvests.checkStats('as: gardener', 'statsType: Plant', 'planting: row-one', 'harvests: 2');
  });

  // DocumentsCurrentBehavior: statsType is always "Planting". Should be "Plant" when asked for by plant.
  it('says plant stats are for plants', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');

    await harvests.checkPlantStatsSayTheyAreForPlants('as: gardener', 'planting: row-one');
  });

  it('rejects a harvest for a planting that does not exist', async () => {
    await harvests.checkUnknownPlantingIsRejected('as: gardener');
  });

  it.each([
    'no harvest list',
    'a list that is not a list',
    'an entry that is not an object',
    'an id that is too long',
    'no planting',
    'no quantity',
    'a quantity that is not a number',
    'a quantity of zero',
    'a negative quantity',
    'a quantity too large to store',
    'no date',
    'an unparseable date',
    'a date in UTC',
    'a date with an offset',
    'a date with a time',
    'a day that does not exist',
    'a date out of range',
    'a harvest type that is not a number',
  ])('rejects a save with %s', async problem => {
    await harvests.checkInvalidSaveIsRejected('as: gardener', 'planting: row-one', `problem: ${problem}`);
  });

  it('accepts a save as the app sends it', async () => {
    await harvests.checkSaveAsTheAppSendsItIsAccepted('as: gardener', 'planting: row-one');
  });

  it('rejects a search with no year', async () => {
    await harvests.checkSearchNeedsAYear('as: gardener');
  });

  it('rejects a search, summary or stats for a year that is not a number', async () => {
    await harvests.checkYearMustBeANumber('as: gardener');
  });

  it('deletes a harvest', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');

    await harvests.deleteHarvest('as: gardener', 'harvest: first', 'planting: row-one');
  });
});
