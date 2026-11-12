import { afterEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('planting years', () => {
  const { plantingYears, plants, plots, plantings, harvests, journal, activityLog, cleanup, } = createAcceptanceDsl();

  afterEach(cleanup);

  it('creates a year, and lists it', async () => {
    await plantingYears.createYear('as: gardener', 'year: this-season');

    await plantingYears.checkYear('as: gardener', 'year: this-season');
    await plantingYears.checkListed('as: gardener', 'year: this-season');
  });

  it.each([
    'no year',
    'a year that is not a number',
    'a previous year that is not a number',
    'no last frost date',
    'an unparseable target date',
    'a last frost date in UTC',
    'a target date with an offset',
    'a last frost date with a time',
    'a target date that does not exist',
    'a last frost date out of range',
  ])('rejects a year with %s', async problem => {
    await plantingYears.checkInvalidYearIsRejected('as: gardener', `problem: ${problem}`);
  });

  it('accepts a year as the app sends it', async () => {
    await plantingYears.checkYearAsTheAppSendsItIsAccepted('as: gardener');
  });

  it('finds no year that was never created', async () => {
    await plantingYears.checkUnknownYearIsNotFound('as: gardener');
  });

  it('rejects reading a year that is not a number', async () => {
    await plantingYears.checkYearMustBeANumber('as: gardener');
  });

  it('carries the planted plantings of the previous year into a new one', async () => {
    await plantingYears.createYear('as: gardener', 'year: last-season');
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato', 'year: last-season');
    await plantings.plant('as: gardener', 'planting: row-one', 'plot: north-bed', 'numberTransplanted: 4');

    await plantingYears.createYear('as: gardener', 'year: this-season', 'previous: last-season');

    await plantings.checkInYear('as: gardener', 'planting: row-one', 'year: this-season');
  });

  // A new harvest is filed under its planting's current year, which carrying
  // forward left behind, so it went to the year before
  it('files a harvest of a carried planting under the new year', async () => {
    await plantingYears.createYear('as: gardener', 'year: last-season');
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato', 'year: last-season');
    await plantings.plant('as: gardener', 'planting: row-one', 'plot: north-bed', 'numberTransplanted: 4');
    await plantingYears.createYear('as: gardener', 'year: this-season', 'previous: last-season');

    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');

    await harvests.checkHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2', 'type: unspecified',
      'year: this-season');
  });

  // The counts go by a planting's current year, which carrying forward left
  // behind
  it('counts a carried planting in the new year, not the one before', async () => {
    await plantingYears.createYear('as: gardener', 'year: last-season');
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato', 'year: last-season');
    await plantings.plant('as: gardener', 'planting: row-one', 'plot: north-bed', 'numberTransplanted: 4');

    await plantingYears.createYear('as: gardener', 'year: this-season', 'previous: last-season');

    await plantingYears.checkDetails('as: gardener', 'year: this-season', 'planted: 1');
    await plantingYears.checkDetails('as: gardener', 'year: last-season');
  });

  it('counts each status of the plantings in a year', async () => {
    await plantingYears.createYear('as: gardener', 'year: this-season');
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plantings.createPlanting('as: gardener', 'planting: waiting', 'plant: tomato', 'year: this-season');
    await plantings.createPlanting('as: gardener', 'planting: indoors', 'plant: tomato', 'year: this-season');
    await plantings.createPlanting('as: gardener', 'planting: outdoors', 'plant: tomato', 'year: this-season');
    await plantings.start('as: gardener', 'planting: indoors', 'numberSown: 4');
    await plantings.plant('as: gardener', 'planting: outdoors', 'plot: north-bed', 'numberTransplanted: 4');

    await plantingYears.checkDetails('as: gardener', 'year: this-season', 'created: 1', 'started: 1', 'planted: 1');
  });

  it('rejects a second year with the same number', async () => {
    await plantingYears.createYear('as: gardener', 'year: this-season');

    await plantingYears.checkDuplicateIsRejected('as: gardener', 'year: this-season');
  });

  it('rejects deleting a year that holds a planting', async () => {
    await plantingYears.createYear('as: gardener', 'year: this-season');
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato', 'year: this-season');

    await plantingYears.checkDeleteIsRejectedWhileInUse('as: gardener', 'year: this-season');
  });

  it('rejects deleting a year with harvests, once its plantings could go', async () => {
    await plantingYears.createYear('as: gardener', 'year: this-season');
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato', 'year: this-season');
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');

    await plantingYears.checkDeleteIsRejectedWhileInUse('as: gardener', 'year: this-season');
  });

  it('rejects deleting a year with a journal entry', async () => {
    await plantingYears.createYear('as: gardener', 'year: this-season');
    await journal.createEntry('as: gardener', 'entry: first-frost', 'year: this-season');

    await plantingYears.checkDeleteIsRejectedWhileInUse('as: gardener', 'year: this-season');
  });

  it('rejects deleting a year with an activity log entry', async () => {
    await plantingYears.createYear('as: gardener', 'year: this-season');
    await activityLog.createEntry('as: gardener', 'entry: watered', 'year: this-season');

    await plantingYears.checkDeleteIsRejectedWhileInUse('as: gardener', 'year: this-season');
  });

  it('deletes an empty year', async () => {
    await plantingYears.createYear('as: gardener', 'year: this-season');

    await plantingYears.deleteYear('as: gardener', 'year: this-season');
  });
});
