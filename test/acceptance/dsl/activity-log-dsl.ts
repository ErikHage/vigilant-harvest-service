import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { ACTIVITY_LOG_ENTRY_PROBLEMS, ActivityLogDriver } from '../drivers/activity-log-driver';
import { anActivityLogEntry } from '../support/fixtures';
import { World } from './world';

const NO_SUCH_YEAR = 8999;

export interface ActivityLogDsl {
  /** `as`, `entry`, the alias, optional `year`, made for the spec when omitted, and optional `date`. */
  createEntry(...args: string[]): Promise<void>,
  /** `as`, `entry`, `comments`. */
  updateEntry(...args: string[]): Promise<void>,
  /** `as`, `entry`. */
  checkListed(...args: string[]): Promise<void>,
  /** `as`, `entry`, `entryDate`: it comes back as `entryDate`, with its audit times in UTC. */
  checkDates(...args: string[]): Promise<void>,
  /** `as`, `entry`. Asserts it is gone from its year. */
  deleteEntry(...args: string[]): Promise<void>,
  /** `as`, `problem`, one of the driver's ACTIVITY_LOG_ENTRY_PROBLEMS. Writes it in a year made for the spec. */
  checkInvalidEntryIsRejected(...args: string[]): Promise<void>,
  /** `as`. Writes an entry shaped the way vigilant-harvest-app sends one, in a year made for the spec. */
  checkEntryAsTheAppSendsItIsAccepted(...args: string[]): Promise<void>,
  /** `as`. */
  checkEntryInUnknownYearIsRejected(...args: string[]): Promise<void>,
  /** `as`. */
  checkYearMustBeANumber(...args: string[]): Promise<void>,
}

export function createActivityLogDsl(world: World, activityLog: ActivityLogDriver): ActivityLogDsl {
  return {
    async createEntry(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), year: optional(), date: optional(), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, params.year);
      const input = anActivityLogEntry(plantingYear, params.date === undefined ? {} : { entryDate: params.date, });

      world.nameActivityLogEntry(params.entry, await activityLog.createEntry(caller, input));
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

    async checkDates(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), entryDate: required(), });

      await activityLog.listReturnsDates(await world.actorFor(params.as), world.activityLogEntryNamed(params.entry), params.entryDate);
    },

    async checkInvalidEntryIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), problem: required().allowedValues(...ACTIVITY_LOG_ENTRY_PROBLEMS), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, undefined);

      await activityLog.createOfInvalidEntryIsRejectedAsBadRequest(caller, anActivityLogEntry(plantingYear), params.problem);
    },

    async checkEntryAsTheAppSendsItIsAccepted(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, undefined);

      await activityLog.createOfEntryAsTheAppSendsItSucceeds(caller, plantingYear);
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
