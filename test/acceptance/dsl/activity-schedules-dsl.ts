import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import {
  ActivitySchedulesDriver,
  ITEM_UPDATE_PROBLEMS,
  NEW_ITEM_PROBLEMS,
  NEW_SCHEDULE_PROBLEMS,
  SCHEDULE_UPDATE_PROBLEMS
} from '../drivers/activity-schedules-driver';
import { aSchedule, aScheduleItem, fixtureName } from '../support/fixtures';
import { World } from './world';

export interface ActivitySchedulesDsl {
  /** `as`, `schedule`, the alias. */
  createSchedule(...args: string[]): Promise<void>,
  /** `as`, `schedule`. Asserts a read matches what it was last saved with. */
  checkSchedule(...args: string[]): Promise<void>,
  /** `as`, `schedule`. */
  checkListed(...args: string[]): Promise<void>,
  /** `as`. */
  checkUnknownScheduleIsNotFound(...args: string[]): Promise<void>,
  /** `as`, `schedule`, `description`. Gives it a new name and the description. */
  updateSchedule(...args: string[]): Promise<void>,
  /** `as`, `schedule`. Sends only a new name. */
  checkPartialUpdateKeepsTheRest(...args: string[]): Promise<void>,
  /** `as`, `item`, the alias, `schedule`, optional `activityType`. */
  addItem(...args: string[]): Promise<void>,
  /** `as`, `item`, `activityType`. */
  updateItem(...args: string[]): Promise<void>,
  /** `as`, `item`, `activityType`. */
  checkItem(...args: string[]): Promise<void>,
  /** `as`, `schedule`. */
  checkHasNoItems(...args: string[]): Promise<void>,
  /** `as`, `item`, `schedule`, one that doesn't hold it, `activityType`. */
  checkItemUpdateThroughAnotherScheduleIsRejected(...args: string[]): Promise<void>,
  /** `as`, `item`. Asserts it is gone from its schedule. */
  deleteItem(...args: string[]): Promise<void>,
  /** `as`, `schedule`. Asserts it is gone. */
  deleteSchedule(...args: string[]): Promise<void>,
  /** `as`, `problem`, one of the driver's NEW_SCHEDULE_PROBLEMS. */
  checkInvalidScheduleIsRejected(...args: string[]): Promise<void>,
  /** `as`, `schedule`, `problem`, one of the driver's SCHEDULE_UPDATE_PROBLEMS. */
  checkInvalidScheduleUpdateIsRejected(...args: string[]): Promise<void>,
  /** `as`, `schedule`, `problem`, one of the driver's NEW_ITEM_PROBLEMS. */
  checkInvalidItemIsRejected(...args: string[]): Promise<void>,
  /** `as`, `item`, `problem`, one of the driver's ITEM_UPDATE_PROBLEMS. */
  checkInvalidItemUpdateIsRejected(...args: string[]): Promise<void>,
}

export function createActivitySchedulesDsl(world: World, schedules: ActivitySchedulesDriver): ActivitySchedulesDsl {
  return {
    async createSchedule(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), schedule: alias(), });
      const caller = await world.actorFor(params.as);

      world.nameSchedule(
        params.schedule,
        await schedules.createSchedule(caller, aSchedule({ name: fixtureName(params.schedule), }))
      );
    },

    async checkSchedule(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), schedule: alias(), });

      await schedules.getReturnsSchedule(await world.actorFor(params.as), world.scheduleNamed(params.schedule));
    },

    async checkListed(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), schedule: alias(), });

      await schedules.listIncludes(await world.actorFor(params.as), world.scheduleNamed(params.schedule));
    },

    async checkUnknownScheduleIsNotFound(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await schedules.getIsNotFoundFor(await world.actorFor(params.as));
    },

    async updateSchedule(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), schedule: alias(), description: required(), });
      const caller = await world.actorFor(params.as);

      world.nameSchedule(params.schedule, await schedules.updateChanges(
        caller,
        world.scheduleNamed(params.schedule),
        aSchedule({ name: fixtureName(params.schedule), description: params.description, })
      ));
    },

    async checkPartialUpdateKeepsTheRest(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), schedule: alias(), });

      await schedules.updateOfNameBlanksDescription(
        await world.actorFor(params.as),
        world.scheduleNamed(params.schedule),
        fixtureName(params.schedule)
      );
    },

    async addItem(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), item: alias(), schedule: alias(), activityType: optional(), });
      const caller = await world.actorFor(params.as);
      const input = aScheduleItem(params.activityType === undefined ? {} : { activityType: params.activityType, });

      world.nameScheduleItem(params.item, await schedules.addItem(caller, world.scheduleNamed(params.schedule), input));
    },

    async updateItem(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), item: alias(), activityType: required(), });

      await schedules.updateItemChangesType(await world.actorFor(params.as), world.scheduleItemNamed(params.item), params.activityType);
    },

    async checkItem(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), item: alias(), activityType: required(), });

      await schedules.getShowsItem(await world.actorFor(params.as), world.scheduleItemNamed(params.item), params.activityType);
    },

    async checkHasNoItems(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), schedule: alias(), });

      await schedules.getShowsNoItems(await world.actorFor(params.as), world.scheduleNamed(params.schedule));
    },

    async checkItemUpdateThroughAnotherScheduleIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), item: alias(), schedule: alias(), activityType: required(), });

      await schedules.updateItemThroughAnotherScheduleStillUpdates(
        await world.actorFor(params.as),
        world.scheduleItemNamed(params.item),
        world.scheduleNamed(params.schedule),
        params.activityType
      );
    },

    async deleteItem(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), item: alias(), });

      await schedules.deleteRemovesItem(await world.actorFor(params.as), world.scheduleItemNamed(params.item));
    },

    async checkInvalidScheduleIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), problem: required().allowedValues(...NEW_SCHEDULE_PROBLEMS), });

      await schedules.createOfInvalidScheduleIsRejectedAsBadRequest(await world.actorFor(params.as), aSchedule(), params.problem);
    },

    async checkInvalidScheduleUpdateIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        schedule: alias(),
        problem: required().allowedValues(...SCHEDULE_UPDATE_PROBLEMS),
      });

      await schedules.updateOfInvalidScheduleIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.scheduleNamed(params.schedule),
        params.problem
      );
    },

    async checkInvalidItemIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        schedule: alias(),
        problem: required().allowedValues(...NEW_ITEM_PROBLEMS),
      });

      await schedules.addOfInvalidItemIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.scheduleNamed(params.schedule),
        aScheduleItem(),
        params.problem
      );
    },

    async checkInvalidItemUpdateIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), item: alias(), problem: required().allowedValues(...ITEM_UPDATE_PROBLEMS), });

      await schedules.updateOfInvalidItemIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.scheduleItemNamed(params.item),
        params.problem
      );
    },

    async deleteSchedule(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), schedule: alias(), });

      await schedules.deleteRemovesSchedule(await world.actorFor(params.as), world.scheduleNamed(params.schedule));
    },
  };
}
