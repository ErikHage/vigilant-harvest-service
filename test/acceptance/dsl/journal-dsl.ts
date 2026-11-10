import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aJournalEntry } from '../support/fixtures';
import { JOURNAL_ENTRY_PROBLEMS, JournalDriver } from '../drivers/journal-driver';
import { World } from './world';

const NO_SUCH_YEAR = 8999;

export interface JournalDsl {
  /** `as`, `entry`, the alias, optional `year`, made for the spec when omitted, and optional `date`. */
  createEntry(...args: string[]): Promise<void>,
  /** `as`, `entry`, `text`. */
  updateEntry(...args: string[]): Promise<void>,
  /** `as`, `entry`. */
  checkListed(...args: string[]): Promise<void>,
  /** `as`, `entry`. Asserts it is gone from its year. */
  deleteEntry(...args: string[]): Promise<void>,
  /** `as`, `problem`, one of the driver's JOURNAL_ENTRY_PROBLEMS. Writes it in a year made for the spec. */
  checkInvalidEntryIsRejected(...args: string[]): Promise<void>,
  /** `as`. Writes an entry shaped the way vigilant-harvest-app sends one, in a year made for the spec. */
  checkEntryAsTheAppSendsItIsAccepted(...args: string[]): Promise<void>,
  /** `as`. */
  checkEntryInUnknownYearIsRejected(...args: string[]): Promise<void>,
  /** `as`. */
  checkYearMustBeANumber(...args: string[]): Promise<void>,
}

export function createJournalDsl(world: World, journal: JournalDriver): JournalDsl {
  return {
    async createEntry(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), entry: alias(), year: optional(), date: optional(), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, params.year);
      const input = aJournalEntry(plantingYear, params.date === undefined ? {} : { entryDate: params.date, });

      world.nameJournalEntry(params.entry, await journal.createEntry(caller, input));
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

    async checkInvalidEntryIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), problem: required().allowedValues(...JOURNAL_ENTRY_PROBLEMS), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, undefined);

      await journal.createOfInvalidEntryIsRejectedAsBadRequest(caller, aJournalEntry(plantingYear), params.problem);
    },

    async checkEntryAsTheAppSendsItIsAccepted(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });
      const caller = await world.actorFor(params.as);
      const { plantingYear, } = await world.yearFor(caller, undefined);

      await journal.createOfEntryAsTheAppSendsItSucceeds(caller, plantingYear);
    },

    async checkEntryInUnknownYearIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await journal.createInUnknownYearIsRejectedAsBadRequest(await world.actorFor(params.as), aJournalEntry(NO_SUCH_YEAR));
    },

    async checkYearMustBeANumber(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await journal.listForNonNumericYearIsRejectedAsBadRequest(await world.actorFor(params.as));
    },
  };
}
