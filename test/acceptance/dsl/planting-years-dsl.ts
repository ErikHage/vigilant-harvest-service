import { optional, parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aPlantingYear } from '../support/fixtures';
import { PlantingYearsDriver } from '../drivers/planting-years-driver';
import { World } from './world';

export interface PlantingYearsDsl {
  /** `as`, `year`, the alias; the real year is chosen from the test range. Optional `previous`, a year to carry from. */
  createYear(...args: string[]): Promise<void>,
  /** `as`, `year`. */
  checkYear(...args: string[]): Promise<void>,
  /** `as`, `year`. */
  checkListed(...args: string[]): Promise<void>,
  /** `as`. */
  checkUnknownYearIsNotFound(...args: string[]): Promise<void>,
  /** `as`, `year`, and `created`, `started`, `planted`, `retired`, each 0 when omitted. */
  checkDetails(...args: string[]): Promise<void>,
  /** `as`, `year`. */
  checkDuplicateIsRejected(...args: string[]): Promise<void>,
  /** `as`, `year`. */
  checkDeleteIsRejectedWhileInUse(...args: string[]): Promise<void>,
  /** `as`, `year`. Asserts it is gone. */
  deleteYear(...args: string[]): Promise<void>,
}

export function createPlantingYearsDsl(world: World, plantingYears: PlantingYearsDriver): PlantingYearsDsl {
  return {
    async createYear(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), year: alias(), previous: optional(), });
      const caller = await world.actorFor(params.as);
      const previous = params.previous === undefined ? {} : {
        previousPlantingYear: world.yearNamed(params.previous).plantingYear,
      };
      const input = aPlantingYear(await world.unusedYear(caller), previous);

      world.nameYear(params.year, await plantingYears.createYear(caller, input));
    },

    async checkYear(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), year: alias(), });

      await plantingYears.getReturnsYear(await world.actorFor(params.as), world.yearNamed(params.year));
    },

    async checkListed(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), year: alias(), });

      await plantingYears.listIncludes(await world.actorFor(params.as), world.yearNamed(params.year));
    },

    async checkUnknownYearIsNotFound(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await plantingYears.getIsNotFoundFor(await world.actorFor(params.as));
    },

    async checkDetails(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        year: alias(),
        created: optional().asInteger().withDefault(0),
        started: optional().asInteger().withDefault(0),
        planted: optional().asInteger().withDefault(0),
        retired: optional().asInteger().withDefault(0),
      });

      await plantingYears.listReportsDetails(await world.actorFor(params.as), world.yearNamed(params.year), {
        createdPlantings: params.created,
        startedPlantings: params.started,
        plantedPlantings: params.planted,
        retiredPlantings: params.retired,
      });
    },

    async checkDuplicateIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), year: alias(), });

      await plantingYears.createOfTakenYearIsRejectedAsConflict(await world.actorFor(params.as), world.yearNamed(params.year));
    },

    async checkDeleteIsRejectedWhileInUse(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), year: alias(), });

      await plantingYears.deleteOfYearInUseIsRejectedAsConflict(await world.actorFor(params.as), world.yearNamed(params.year));
    },

    async deleteYear(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), year: alias(), });

      await plantingYears.deleteRemovesYear(await world.actorFor(params.as), world.yearNamed(params.year));
    },
  };
}
