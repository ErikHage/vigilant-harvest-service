import { afterEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('plants', () => {
  const { plants, plantings, activitySchedules, cleanup, } = createAcceptanceDsl();

  afterEach(cleanup);

  it('keeps every detail of a new plant, and lists it', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato', 'details: every field');

    await plants.checkPlant('as: gardener', 'plant: tomato');
    await plants.checkListed('as: gardener', 'plant: tomato');
  });

  // DocumentsCurrentBehavior: indoor and direct come back as "1" and "0", and depth as "0.25". Should keep the booleans and the number sent.
  it('keeps the types of sowing values', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato', 'details: every field');

    await plants.checkSowingValuesKeepTheirTypes('as: gardener', 'plant: tomato');
  });

  it('defaults a plant with no harvest type to unspecified', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');

    await plants.checkDefaultHarvestType('as: gardener', 'plant: tomato', 'harvestType: unspecified');
  });

  it('keeps a default harvest type it was given', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato', 'defaultHarvestType: pounds');

    await plants.checkDefaultHarvestType('as: gardener', 'plant: tomato', 'harvestType: pounds');
  });

  it('updates a plant by id', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');

    await plants.updatePlant('as: gardener', 'plant: tomato', 'description: Better in the sun');
  });

  it('assigns a schedule to a plant, and unassigns it', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await plants.assignSchedule('as: gardener', 'plant: tomato', 'schedule: watering');
    await plants.checkHasSchedule('as: gardener', 'plant: tomato', 'schedule: watering');

    await plants.unassignSchedule('as: gardener', 'plant: tomato', 'schedule: watering');
    await plants.checkHasNoSchedules('as: gardener', 'plant: tomato');
  });

  it('rejects assigning the same schedule twice', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');
    await plants.assignSchedule('as: gardener', 'plant: tomato', 'schedule: watering');

    await plants.checkSecondAssignmentIsRejected('as: gardener', 'plant: tomato', 'schedule: watering');
  });

  // DocumentsCurrentBehavior: replies 500. Should be 400.
  it('rejects a schedule assignment with no lists', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');

    await plants.checkAssignmentWithoutListsIsRejected('as: gardener', 'plant: tomato');
  });

  it('finds no plant that was never created', async () => {
    await plants.checkUnknownPlantIsNotFound('as: gardener');
  });

  it('rejects a second plant with the same name', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');

    await plants.checkTakenNameIsRejected('as: gardener', 'plant: tomato');
  });

  it('rejects renaming a plant to a name that is taken', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plants.createPlant('as: gardener', 'plant: pepper');

    await plants.checkRenameToTakenNameIsRejected('as: gardener', 'plant: pepper', 'taken: tomato');
  });

  // DocumentsCurrentBehavior: replies 404, having overwritten the plant holding the name. Should be rejected, and change nothing.
  it('rejects an unknown plant id saved under a name that is taken', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');

    await plants.checkUnknownIdWithTakenNameIsRejected('as: gardener', 'plant: tomato');
  });

  it('rejects a plant in a subcategory that does not exist, and writes nothing', async () => {
    await plants.checkUnknownSubcategoryIsRejected('as: gardener');
  });

  it('rejects deleting a plant that has plantings', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');

    await plants.checkDeleteIsRejectedWhileInUse('as: gardener', 'plant: tomato');
  });

  it('deletes a plant once its plantings are gone, along with its schedule links', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato');
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');
    await plants.assignSchedule('as: gardener', 'plant: tomato', 'schedule: watering');

    await plantings.deletePlanting('as: gardener', 'planting: row-one');
    await plants.deletePlant('as: gardener', 'plant: tomato');
  });
});
