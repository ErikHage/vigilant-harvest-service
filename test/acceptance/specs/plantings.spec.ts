import { afterEach, beforeEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('plantings', () => {
  const { plants, plots, plantings, harvests, cleanup, } = createAcceptanceDsl();

  beforeEach(() => plants.createPlant('as: gardener', 'plant: tomato'));
  afterEach(cleanup);

  it('creates a planting with one history entry, in its year', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.checkStatus('as: gardener', 'planting: row-one', 'status: CREATED');
    await plantings.checkHistory('as: gardener', 'planting: row-one', 'entries: 1');
    await plantings.checkListedInYear('as: gardener', 'planting: row-one');
  });

  it('moves through its lifecycle, recording each step', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.start('as: gardener', 'planting: row-one', 'numberSown: 4');
    await plantings.checkStatus('as: gardener', 'planting: row-one', 'status: STARTED');
    await plantings.checkHistory('as: gardener', 'planting: row-one', 'entries: 2');

    await plantings.plant('as: gardener', 'planting: row-one', 'plot: north-bed', 'numberTransplanted: 4');
    await plantings.checkStatus('as: gardener', 'planting: row-one', 'status: PLANTED');
    await plantings.checkHistory('as: gardener', 'planting: row-one', 'entries: 3');

    await plantings.retire('as: gardener', 'planting: row-one');
    await plantings.checkStatus('as: gardener', 'planting: row-one', 'status: RETIRED');
    await plantings.checkHistory('as: gardener', 'planting: row-one', 'entries: 4');
  });

  it('records a comment without changing the status', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.comment('as: gardener', 'planting: row-one', 'comment: Looking healthy');

    await plantings.checkStatus('as: gardener', 'planting: row-one', 'status: CREATED');
    await plantings.checkHistory('as: gardener', 'planting: row-one', 'entries: 2');
  });

  it('splits part of a planting into a new one', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plantings.start('as: gardener', 'planting: row-one', 'numberSown: 10');

    await plantings.split('as: gardener', 'planting: row-one', 'into: row-two', 'count: 3');

    await plantings.checkNumberSown('as: gardener', 'planting: row-one', 'numberSown: 7');
    await plantings.checkNumberSown('as: gardener', 'planting: row-two', 'numberSown: 3');
    await plantings.checkStatus('as: gardener', 'planting: row-two', 'status: STARTED');
  });

  it('keeps what is left of a planting that is only partly planted out', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plantings.start('as: gardener', 'planting: row-one', 'numberSown: 10');

    await plantings.plant('as: gardener', 'planting: row-one', 'plot: north-bed', 'numberTransplanted: 4');

    await plantings.checkStatus('as: gardener', 'planting: row-one', 'status: PLANTED');
    await plantings.nameTheRemainder('as: gardener', 'planting: row-one', 'into: leftovers', 'remaining: 6');
    await plantings.checkStatus('as: gardener', 'planting: leftovers', 'status: STARTED');
    await plantings.checkNumberSown('as: gardener', 'planting: leftovers', 'numberSown: 6');
  });

  it('rejects planting out into a plot that does not exist, and writes nothing', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plantings.start('as: gardener', 'planting: row-one', 'numberSown: 10');

    await plantings.checkPlantInUnknownPlotIsRejected('as: gardener', 'planting: row-one', 'numberTransplanted: 4');
  });

  it('rejects splitting out as many as a planting holds', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plantings.start('as: gardener', 'planting: row-one', 'numberSown: 10');

    await plantings.checkSplitOverflowIsRejected('as: gardener', 'planting: row-one', 'count: 10');
  });

  it('rejects an action out of lifecycle order', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.checkActionIsRejected('as: gardener', 'planting: row-one', 'action: RETIRE');
  });

  it('updates a field the status allows', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.update('as: gardener', 'planting: row-one', 'seedSource: Saved from last year');
  });

  // DocumentsCurrentBehavior: an empty value is skipped, and the old one stays. Should clear the field.
  it('clears a field', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plantings.update('as: gardener', 'planting: row-one', 'seedSource: Saved from last year');

    await plantings.checkFieldCanBeCleared('as: gardener', 'planting: row-one', 'seedSource: Saved from last year');
  });

  it('rejects updating a field the status does not allow', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.checkUpdateOfFieldIsRejected('as: gardener', 'planting: row-one');
  });

  it('rejects a planting of a plant that does not exist, and writes nothing', async () => {
    await plantings.checkCreateForUnknownPlantIsRejected('as: gardener', 'plant: tomato');
  });

  it('rejects a planting in a year that does not exist, and writes nothing', async () => {
    await plantings.checkCreateInUnknownYearIsRejected('as: gardener', 'plant: tomato');
  });

  it.each([
    'no name',
    'a blank name',
    'a name that is too long',
    'no plant',
    'no year',
    'a year that is not a number',
    'a lead time that is not a whole number',
    'a negative lead time',
    'an unparseable target date',
    'a target date in UTC',
    'a target date with an offset',
    'a target date with a time',
    'a target date that does not exist',
    'a seed source that is too long',
  ])('rejects a planting with %s', async problem => {
    await plantings.checkInvalidPlantingIsRejected('as: gardener', 'plant: tomato', `problem: ${problem}`);
  });

  it('accepts a planting as the app sends it', async () => {
    await plantings.checkPlantingAsTheAppSendsItIsAccepted('as: gardener', 'plant: tomato');
  });

  it.each([
    'a name that is not a string',
    'a lead time that is not a number',
    'an unparseable target date',
    'a target date in UTC',
    'a sow date with an offset',
    'a transplant date with a time',
    'a sow date that does not exist',
    'a target date out of range',
  ])('rejects an update with %s', async problem => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.checkInvalidUpdateIsRejected('as: gardener', 'planting: row-one', `problem: ${problem}`);
  });

  it('accepts an update as the app sends it', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.checkUpdateAsTheAppSendsItIsAccepted('as: gardener', 'planting: row-one');
  });

  it.each([
    'no action type',
    'an unknown action type',
    'a start with no sow date',
    'a start with an unparseable sow date',
    'a start with a sow date in UTC',
    'a start with a sow date that does not exist',
    'a start with a count that is not a number',
    'a start with a negative count',
    'a plant with no transplant date',
    'a plant with a transplant date with an offset',
    'a plant with a transplant date with a time',
    'a plant with a plot id that is too long',
    'a split with no list',
    'a split with a nameless entry',
    'a split with a count that is not a number',
    'a comment that is not a string',
  ])('rejects an action with %s', async problem => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.checkInvalidActionIsRejected('as: gardener', 'planting: row-one', `problem: ${problem}`);
  });

  it('accepts a start as the app sends it', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.checkStartAsTheAppSendsItIsAccepted('as: gardener', 'planting: row-one');
  });

  it('finds no planting that was never created', async () => {
    await plantings.checkUnknownPlantingIsNotFound('as: gardener');
  });

  it('rejects listing a year that is not a number', async () => {
    await plantings.checkYearMustBeANumber('as: gardener');
  });

  it('deletes a CREATED planting with the DELETE action', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plantings.deleteWithAction('as: gardener', 'planting: row-one');
  });

  it('rejects the DELETE action once a planting has started', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plantings.start('as: gardener', 'planting: row-one', 'numberSown: 4');

    await plantings.checkActionIsRejected('as: gardener', 'planting: row-one', 'action: DELETE');
  });

  it('rejects the DELETE action while a planting has harvests', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');

    await plantings.checkDeleteActionIsRejectedWhileItHasHarvests('as: gardener', 'planting: row-one');
  });

  it('rejects deleting a planting that has harvests', async () => {
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await harvests.recordHarvest('as: gardener', 'harvest: first', 'planting: row-one', 'quantity: 2');

    await plantings.checkDeleteIsRejectedWhileItHasHarvests('as: gardener', 'planting: row-one');
  });

  it('deletes a planting of any status once it has no harvests', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plantings.plant('as: gardener', 'planting: row-one', 'plot: north-bed', 'numberTransplanted: 4');
    await plantings.retire('as: gardener', 'planting: row-one');

    await plantings.deletePlanting('as: gardener', 'planting: row-one');
  });
});
