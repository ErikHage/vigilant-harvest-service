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

  it('returns its audit times in UTC', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');

    await plants.checkAuditTimesInUtc('as: gardener', 'plant: tomato');
  });

  it('keeps its sowing times as text, and its depth as a number', async () => {
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

  it.each([
    'no lists',
    'no unassign list',
    'an assign that is not a list',
    'an id that is not a string',
  ])('rejects a schedule assignment with %s', async problem => {
    await plants.createPlant('as: gardener', 'plant: tomato');

    await plants.checkInvalidAssignmentIsRejected('as: gardener', 'plant: tomato', `problem: ${problem}`);
  });

  it.each([
    'no subcategory',
    'a subcategory that is not a number',
    'no name',
    'a name that is too long',
    'an unknown lifespan',
    'tags that are not a list',
    'a tag that is not a string',
    'a section that is not an object',
    'a depth that is not a number',
    'a depth too large to store',
    'days to maturity that are not a whole number',
    'climbing that is not true or false',
    'instructions that are too long',
    'a harvest type that is not a number',
    'a sowing time that is not text',
  ])('rejects a plant with %s', async problem => {
    await plants.checkInvalidPlantIsRejected('as: gardener', `problem: ${problem}`);
  });

  it('accepts a plant as the add dialog sends it', async () => {
    await plants.checkPlantAsTheAddDialogSendsItIsAccepted('as: gardener');
  });

  it('accepts a save as the edit page sends it', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');

    await plants.checkSaveAsTheEditPageSendsItIsAccepted('as: gardener', 'plant: tomato');
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

  it('rejects an unknown plant id saved under a name that is taken, and changes nothing', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');

    await plants.checkUnknownIdWithTakenNameIsRejected('as: gardener', 'plant: tomato');
  });

  it('rejects saving a plant under an id that does not exist', async () => {
    await plants.checkSaveUnderUnknownIdIsRejected('as: gardener');
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
