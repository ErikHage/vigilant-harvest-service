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

  // DocumentsCurrentBehavior: PATCH overwrites every field, so an omitted description is blanked. Should keep what wasn't sent.
  it('keeps what a partial update does not mention', async () => {
    await activitySchedules.createSchedule('as: gardener', 'schedule: watering');

    await activitySchedules.checkPartialUpdateKeepsTheRest('as: gardener', 'schedule: watering');
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

  // DocumentsCurrentBehavior: replies 200 and updates it, because the path's schedule is ignored. Should be 404.
  it('rejects updating an item through a schedule that does not hold it', async () => {
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
