import { afterEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('activity schedules', () => {
  const { activitySchedules, plants, cleanup, } = createAcceptanceDsl();

  afterEach(cleanup);

  it('creates a schedule with no items, and lists it', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await activitySchedules.checkSchedule('as: gardener', 'schedule: watering');
    await activitySchedules.checkHasNoItems('as: gardener', 'schedule: watering');
    await activitySchedules.checkListed('as: gardener', 'schedule: watering');
  });

  it('updates a schedule', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await activitySchedules.updateSchedule('as: gardener', 'schedule: watering', 'description: Twice a week');

    await activitySchedules.checkSchedule('as: gardener', 'schedule: watering');
  });

  it('keeps what a partial update does not mention', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await activitySchedules.checkPartialUpdateKeepsTheRest('as: gardener', 'schedule: watering');
  });

  it('clears a description sent as null', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await activitySchedules.checkDescriptionCanBeCleared('as: gardener', 'schedule: watering');
  });

  it('keeps what a partial item update does not mention', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');
    await activitySchedules.addItem('as: gardener', 'item: weekly', 'schedule: watering');

    await activitySchedules.checkPartialItemUpdateKeepsTheRest('as: gardener', 'item: weekly');
  });

  it.each([
    'no name',
    'a blank name',
    'a name that is too long',
    'a description that is not a string',
  ])('rejects a schedule with %s', async problem => {
    await activitySchedules.checkInvalidScheduleIsRejected('as: gardener', `problem: ${problem}`);
  });

  it.each([ 'a blank name', 'a name that is not a string', ])('rejects a schedule update with %s', async problem => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await activitySchedules.checkInvalidScheduleUpdateIsRejected('as: gardener', 'schedule: watering', `problem: ${problem}`);
  });

  it.each([
    'no activity type',
    'a start date that is not a month and day',
    'a start date that does not exist',
    'a year offset out of range',
    'a year offset that is not a number',
    'a recurrence rule that is too long',
  ])('rejects an item with %s', async problem => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await activitySchedules.checkInvalidItemIsRejected('as: gardener', 'schedule: watering', `problem: ${problem}`);
  });

  it.each([ 'a blank activity type', 'an end date that is not a month and day', ])('rejects an item update with %s', async problem => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');
    await activitySchedules.addItem('as: gardener', 'item: weekly', 'schedule: watering');

    await activitySchedules.checkInvalidItemUpdateIsRejected('as: gardener', 'item: weekly', `problem: ${problem}`);
  });

  it('finds no schedule that was never created', async () => {
    await activitySchedules.checkUnknownScheduleIsNotFound('as: gardener');
  });

  it('adds an item to a schedule', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await activitySchedules.addItem('as: gardener', 'item: mornings', 'schedule: watering', 'activityType: WATER');

    await activitySchedules.checkItem('as: gardener', 'item: mornings', 'activityType: WATER');
  });

  it('updates an item', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');
    await activitySchedules.addItem('as: gardener', 'item: mornings', 'schedule: watering');

    await activitySchedules.updateItem('as: gardener', 'item: mornings', 'activityType: WEED');

    await activitySchedules.checkItem('as: gardener', 'item: mornings', 'activityType: WEED');
  });

  it('rejects updating an item through a schedule that does not hold it, and changes nothing', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');
    await activitySchedules.createSchedule('as: gardener', 'schedule: weeding');
    await activitySchedules.addItem('as: gardener', 'item: mornings', 'schedule: watering');

    await activitySchedules.checkItemUpdateThroughAnotherScheduleIsRejected(
      'as: gardener',
      'item: mornings',
      'schedule: weeding',
      'activityType: PRUNE'
    );
  });

  it('rejects updating an item that does not exist', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await activitySchedules.checkUnknownItemUpdateIsRejected('as: gardener', 'schedule: watering');
  });

  it('deletes an item', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');
    await activitySchedules.addItem('as: gardener', 'item: mornings', 'schedule: watering');

    await activitySchedules.deleteItem('as: gardener', 'item: mornings');

    await activitySchedules.checkHasNoItems('as: gardener', 'schedule: watering');
  });

  it('deletes a schedule with its items, and unassigns it from plants', async () => {
    await plants.createPlant('as: gardener', 'plant: tomato');
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');
    await activitySchedules.addItem('as: gardener', 'item: mornings', 'schedule: watering');
    await plants.assignSchedule('as: gardener', 'plant: tomato', 'schedule: watering');

    await activitySchedules.deleteSchedule('as: gardener', 'schedule: watering');

    await plants.checkHasNoSchedules('as: gardener', 'plant: tomato');
  });
});
