import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { ActivityLogDriver } from '../drivers/activity-log-driver';
import { anActivityLogEntry } from '../support/fixtures';
import { World } from './world';

const NO_SUCH_YEAR = 8999;

export interface ActivityLogDsl {
  /** `as`, `entry`, the alias, optional `year`, made for the spec when omitted. */
  createEntry(...args: string[]): Promise<void>,
  /** `as`, `entry`, `comments`. */
  updateEntry(...args: string[]): Promise<void>,
  /** `as`, `entry`. */
  checkListed(...args: string[]): Promise<void>,
  /** `as`, `entry`. Asserts it is gone from its year. */
  deleteEntry(...args: string[]): Promise<void>,
  /** `as`, optional `year`. */
  checkEntryWithoutDateIsRejected(...args: string[]): Promise<void>,
  /** `as`. */
  checkEntryInUnknownYearIsRejected(...args: string[]): Promise<void>,
  /** `as`. */
  checkYearMustBeANumber(...args: string[]): Promise<void>,
}

export function createActivityLogDsl(world: World, activityLog: ActivityLogDriver): ActivityLogDsl {
  return {
    async createEntry(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), year: optional(), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, params.year);

      world.nameActivityLogEntry(params.entry, await activityLog.createEntry(caller, anActivityLogEntry(plantingYear)));
    },

    async updateEntry(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), comments: required(), });
      const caller = await world.actorFor(params.as);

      world.nameActivityLogEntry(
        params.entry,
        await activityLog.updateChangesComments(caller, world.activityLogEntryNamed(params.entry), params.comments)
      );
    },

    async checkListed(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), });

      await activityLog.listIncludes(await world.actorFor(params.as), world.activityLogEntryNamed(params.entry));
    },

    async deleteEntry(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), });

      await activityLog.deleteRemovesEntry(await world.actorFor(params.as), world.activityLogEntryNamed(params.entry));
    },

    async checkEntryWithoutDateIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), year: optional(), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, params.year);

      await activityLog.createWithoutDateFailsWithServerError(caller, plantingYear);
    },

    async checkEntryInUnknownYearIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await activityLog.createInUnknownYearIsRejectedAsBadRequest(await world.actorFor(params.as), anActivityLogEntry(NO_SUCH_YEAR));
    },

    async checkYearMustBeANumber(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await activityLog.listForNonNumericYearIsRejectedAsBadRequest(await world.actorFor(params.as));
    },
  };
}
