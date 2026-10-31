import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aJournalEntry } from '../support/fixtures';
import { JournalDriver } from '../drivers/journal-driver';
import { World } from './world';

const NO_SUCH_YEAR = 8999;

export interface JournalDsl {
  /** `as`, `entry`, the alias, optional `year`, made for the spec when omitted. */
  createEntry(...args: string[]): Promise<void>,
  /** `as`, `entry`, `text`. */
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

export function createJournalDsl(world: World, journal: JournalDriver): JournalDsl {
  return {
    async createEntry(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), year: optional(), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, params.year);

      world.nameJournalEntry(params.entry, await journal.createEntry(caller, aJournalEntry(plantingYear)));
    },

    async updateEntry(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), text: required(), });
      const caller = await world.actorFor(params.as);

      world.nameJournalEntry(
        params.entry,
        await journal.updateChangesEntry(caller, world.journalEntryNamed(params.entry), params.text)
      );
    },

    async checkListed(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), });

      await journal.listIncludes(await world.actorFor(params.as), world.journalEntryNamed(params.entry));
    },

    async deleteEntry(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), });

      await journal.deleteRemovesEntry(await world.actorFor(params.as), world.journalEntryNamed(params.entry));
    },

    async checkEntryWithoutDateIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), year: optional(), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, params.year);

      await journal.createWithoutDateFailsWithServerError(caller, plantingYear);
    },

    async checkEntryInUnknownYearIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await journal.createInUnknownYearIsRejectedAsBadRequest(await world.actorFor(params.as), aJournalEntry(NO_SUCH_YEAR));
    },

    async checkYearMustBeANumber(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await journal.listForNonNumericYearFailsWithServerError(await world.actorFor(params.as));
    },
  };
}
