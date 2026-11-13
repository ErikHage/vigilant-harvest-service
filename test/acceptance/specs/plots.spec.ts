import { afterEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('plots', () => {
  const { plots, plants, plantings, cleanup, } = createAcceptanceDsl();

  afterEach(cleanup);

  it('creates a plot, and lists it', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');

    await plots.checkPlot('as: gardener', 'plot: north-bed');
    await plots.checkListed('as: gardener', 'plot: north-bed');
  });

  it('updates a plot', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');

    await plots.updatePlot('as: gardener', 'plot: north-bed', 'lengthInInches: 120');
    await plots.checkPlot('as: gardener', 'plot: north-bed');
  });

  it('deletes a plot', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');

    await plots.deletePlot('as: gardener', 'plot: north-bed');
  });

  it.each([
    'no name',
    'a name that is too long',
    'no length',
    'a length that is not a whole number',
    'a negative width',
    'no plot type',
    'an isActive that is not true or false',
  ])('rejects a plot with %s', async problem => {
    await plots.checkInvalidPlotIsRejected('as: gardener', `problem: ${problem}`);
  });

  it('accepts a plot as the app sends it', async () => {
    await plots.checkPlotAsTheAppSendsItIsAccepted('as: gardener');
  });

  it('finds no plot that was never created', async () => {
    await plots.checkUnknownPlotIsNotFound('as: gardener');
  });

  it('reports isActive the same way on a write and a read', async () => {
    await plots.checkIsActiveIsConsistent('as: gardener');
  });

  it('deactivates a plot', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');

    await plots.checkPlotCanBeDeactivated('as: gardener', 'plot: north-bed');
  });

  // The app's edit sends back the isActive it read, which was 1 or 0 before reads answered a boolean
  it('accepts isActive as 1 or 0', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');

    await plots.checkIsActiveAsANumberIsAccepted('as: gardener', 'plot: north-bed');
  });

  it('rejects a second plot with the same name, and changes nothing', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');

    await plots.checkTakenNameIsRejected('as: gardener', 'plot: north-bed');
  });

  it('rejects renaming a plot to a name that is taken', async () => {
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plots.createPlot('as: gardener', 'plot: south-bed');

    await plots.checkRenameToTakenNameIsRejected('as: gardener', 'plot: south-bed', 'taken: north-bed');
  });

  it('rejects saving a plot under an id that does not exist', async () => {
    await plots.checkSaveUnderUnknownIdIsRejected('as: gardener');
  });

  it('rejects deleting a plot that a planting is in', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plots.createPlot('as: gardener', 'plot: north-bed');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plantings.plant('as: gardener', 'planting: row-one', 'plot: north-bed', 'numberTransplanted: 4');

    await plots.checkDeleteIsRejectedWhileInUse('as: gardener', 'plot: north-bed');
  });

  // Teardown goes newest first, which meets this plot before the planting in it. The plot is rejected, and
  // must go on a later pass, or the residue check fails the run.
  it('cleans up a plot created after the planting put in it', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await plots.createPlot('as: gardener', 'plot: north-bed');

    await plantings.plant('as: gardener', 'planting: row-one', 'plot: north-bed', 'numberTransplanted: 4');
  });
});
