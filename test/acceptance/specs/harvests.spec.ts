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

  it('folds harvests of one planting, day and type sent in one save into one', async () => {
    await harvests.recordHarvests('as: gardener', 'harvest: picked', 'planting: row-one', 'quantities: 2, 3', 'sent: in one save');

    await harvests.checkHarvest('as: gardener', 'harvest: picked', 'planting: row-one', 'quantity: 5', 'type: pounds');
    await harvests.checkHarvestCount('as: gardener', 'planting: row-one', 'harvests: 1');
  });

  it('folds harvests of one planting, day and type sent in saves at once into one', async () => {
    await harvests.recordHarvests('as: gardener', 'harvest: picked', 'planting: row-one', 'quantities: 2, 3, 4', 'sent: in saves at once');

    await harvests.checkHarvest('as: gardener', 'harvest: picked', 'planting: row-one', 'quantity: 9', 'type: pounds');
    await harvests.checkHarvestCount('as: gardener', 'planting: row-one', 'harvests: 1');
  });

  it('folds a harvest retyped onto the day and type of another into it', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: weighed', 'planting: row-one', 'quantity: 2');
    await harvests.recordHarvest('as: gardener', 'harvest: counted', 'planting: row-one', 'quantity: 3', 'type: fruit');

    await harvests.saveAgain('as: gardener', 'harvest: counted', 'planting: row-one', 'quantity: 3', 'type: pounds');

    await harvests.checkHarvest('as: gardener', 'harvest: weighed', 'planting: row-one', 'quantity: 5', 'type: pounds');
    await harvests.checkHarvestCount('as: gardener', 'planting: row-one', 'harvests: 1');
  });

  it('swaps the types of two harvests of one day in one save', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: weighed', 'planting: row-one', 'quantity: 2');
    await harvests.recordHarvest('as: gardener', 'harvest: counted', 'planting: row-one', 'quantity: 3', 'type: fruit');

    await harvests.saveAgainTogether(
      'as: gardener', 'harvests: weighed, counted', 'planting: row-one', 'quantities: 2, 3', 'types: fruit, pounds'
    );

    await harvests.checkHarvest('as: gardener', 'harvest: weighed', 'planting: row-one', 'quantity: 2', 'type: fruit');
    await harvests.checkHarvest('as: gardener', 'harvest: counted', 'planting: row-one', 'quantity: 3', 'type: pounds');
    await harvests.checkHarvestCount('as: gardener', 'planting: row-one', 'harvests: 2');
  });

  it('keeps the fraction of a quantity, in the harvest, the summary and the stats', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 1.1', 'date: 2026-07-01');
    await harvests.recordHarvest('as: gardener', 'harvest: second', 'planting: row-one', 'quantity: 2.2', 'date: 2026-07-02');

    await harvests.checkHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 1.1', 'type: pounds', 'date: 2026-07-01');
    await harvests.checkInSummary('as: gardener', 'planting: row-one', 'quantity: 3.3', 'type: pounds');
    await harvests.checkStatsTotal('as: gardener', 'statsType: Planting', 'planting: row-one', 'total: 3.3');
    await harvests.checkStatsTotal('as: gardener', 'statsType: Plant', 'planting: row-one', 'total: 3.3');
  });

  // a third decimal place is rounded, as MySQL rounds it, rather than rejected: the app can send one
  it('rounds a quantity to hundredths', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 1.235');

    await harvests.checkHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 1.24', 'type: pounds');
  });

  it('answers 201 for a save that makes a harvest, and 200 for one that adds to or edits one', async () => {
    await harvests.checkSaveStatuses('as: gardener', 'planting: row-one');
  });

  it('accepts a date after 2038', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: far-off', 'planting: row-one', 'quantity: 2', 'date: 2040-07-01');

    await harvests.checkHarvest(
      'as: gardener', 'harvest: far-off', 'planting: row-one', 'quantity: 2', 'type: pounds', 'date: 2040-07-01'
    );
  });

  it('returns a harvest on the day it was sent with', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2', 'date: 2026-07-01');

    await harvests.checkHarvest(
      'as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2', 'type: pounds', 'date: 2026-07-01'
    );
  });

  it('counts the days across the autumn clock change as calendar days', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: before', 'planting: row-one', 'quantity: 1', 'date: 2026-10-31');
    await harvests.recordHarvest('as: gardener', 'harvest: after', 'planting: row-one', 'quantity: 1', 'date: 2026-11-02');

    await harvests.checkStatsDays(
      'as: gardener', 'statsType: Planting', 'planting: row-one', 'first: 2026-10-31', 'last: 2026-11-02', 'days: 3'
    );
    await harvests.checkStatsDays(
      'as: gardener', 'statsType: Plant', 'planting: row-one', 'first: 2026-10-31', 'last: 2026-11-02', 'days: 3'
    );
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

  it('records a harvest on the day and type of one that was deleted', async () => {
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');
    await harvests.deleteHarvest('as: gardener', 'harvest: first', 'planting: row-one');

    await harvests.recordHarvest('as: gardener', 'harvest: again', 'planting: row-one', 'quantity: 3');

    await harvests.checkHarvest('as: gardener', 'harvest: again', 'planting: row-one', 'quantity: 3', 'type: pounds');
    await harvests.checkHarvestCount('as: gardener', 'planting: row-one', 'harvests: 1');
  });
});
