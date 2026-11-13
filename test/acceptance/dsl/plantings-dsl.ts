import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aPlanting, fixtureName } from '../support/fixtures';
import {
  CLEARABLE_PLANTING_FIELDS,
  NEW_PLANTING_PROBLEMS,
  PLANTING_ACTION_PROBLEMS,
  PLANTING_UPDATE_PROBLEMS,
  PlantingsDriver
} from '../drivers/plantings-driver';
import { World } from './world';

export interface PlantingsDsl {
  /**
   * `as`, `planting`, the alias, `plant`, optional `year`, made for the spec when omitted, optional
   * `leadTimeWeeks`, and optional `targetPlantingDate`.
   */
  createPlanting(...args: string[]): Promise<void>,
  /** `as`, `planting`, `status`. */
  checkStatus(...args: string[]): Promise<void>,
  /** `as`, `planting`, `entries`. */
  checkHistory(...args: string[]): Promise<void>,
  /** `as`, `planting`, `numberSown`. */
  checkNumberSown(...args: string[]): Promise<void>,
  /** `as`, `planting`, `year`. Asserts the year is among the planting's years. */
  checkInYear(...args: string[]): Promise<void>,
  /** `as`, `planting`. Asserts it is listed among the plantings of its year. */
  checkListedInYear(...args: string[]): Promise<void>,
  /** `as`. */
  checkYearMustBeANumber(...args: string[]): Promise<void>,
  /** `as`. Reads, acts on and updates a planting that does not exist. */
  checkUnknownPlantingIsNotFound(...args: string[]): Promise<void>,
  /** `as`, `planting`, `numberSown`, and optional `sowDate`, 2026-03-01 when omitted. */
  start(...args: string[]): Promise<void>,
  /** `as`, `planting`, `plot`, `numberTransplanted`, and optional `transplantDate`, 2026-05-20 when omitted. */
  plant(...args: string[]): Promise<void>,
  /**
   * `as`, `planting`, and optional `targetPlantingDate`, `sowDate` and `transplantDate`: each comes back
   * as given, and its audit times and its history's are in UTC.
   */
  checkDates(...args: string[]): Promise<void>,
  /** `as`, `planting`. */
  retire(...args: string[]): Promise<void>,
  /** `as`, `planting`, `comment`. */
  comment(...args: string[]): Promise<void>,
  /** `as`, `planting`, `into`, the alias of the new planting, `count`. */
  split(...args: string[]): Promise<void>,
  /** `as`, `planting`, the original, `into`, an alias for what the service split off, `remaining`, how many. */
  nameTheRemainder(...args: string[]): Promise<void>,
  /** `as`, `planting`, `action`. */
  checkActionIsRejected(...args: string[]): Promise<void>,
  /** `as`, `planting`, `count`. */
  checkSplitOverflowIsRejected(...args: string[]): Promise<void>,
  /** `as`, `planting`, `numberTransplanted`. Asserts PLANT into a missing plot is rejected, and writes nothing. */
  checkPlantInUnknownPlotIsRejected(...args: string[]): Promise<void>,
  /** `as`, `planting`, `seedSource`. */
  update(...args: string[]): Promise<void>,
  /**
   * `as`, `planting`, a CREATED one, `field`, one of the driver's CLEARABLE_PLANTING_FIELDS, and
   * `sentAs: null | an empty string`. Asserts sending the field empty clears it.
   */
  checkFieldCanBeCleared(...args: string[]): Promise<void>,
  /** `as`, `planting`, a CREATED one. Asserts a lead time of 0 is written. */
  checkLeadTimeCanBeSetToZero(...args: string[]): Promise<void>,
  /** `as`, `planting`. Asserts a field its status doesn't allow is rejected. */
  checkUpdateOfFieldIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plant`. */
  checkCreateForUnknownPlantIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plant`. */
  checkCreateInUnknownYearIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plant`, `problem`, one of the driver's NEW_PLANTING_PROBLEMS. */
  checkInvalidPlantingIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plant`. Creates a planting shaped the way vigilant-harvest-app sends one. */
  checkPlantingAsTheAppSendsItIsAccepted(...args: string[]): Promise<void>,
  /** `as`, `planting`, a CREATED one, `problem`, one of the driver's PLANTING_UPDATE_PROBLEMS. */
  checkInvalidUpdateIsRejected(...args: string[]): Promise<void>,
  /** `as`, `planting`, a CREATED one. Updates it the way vigilant-harvest-app's edit form does. */
  checkUpdateAsTheAppSendsItIsAccepted(...args: string[]): Promise<void>,
  /** `as`, `planting`, a CREATED one, `problem`, one of the driver's PLANTING_ACTION_PROBLEMS. */
  checkInvalidActionIsRejected(...args: string[]): Promise<void>,
  /** `as`, `planting`, a CREATED one. Starts it the way vigilant-harvest-app's dialog does. */
  checkStartAsTheAppSendsItIsAccepted(...args: string[]): Promise<void>,
  /** `as`, `planting`. Asserts it is gone. */
  deleteWithAction(...args: string[]): Promise<void>,
  /** `as`, `planting`. */
  checkDeleteActionIsRejectedWhileItHasHarvests(...args: string[]): Promise<void>,
  /** `as`, `planting`. */
  checkDeleteIsRejectedWhileItHasHarvests(...args: string[]): Promise<void>,
  /** `as`, `planting`. Asserts it is gone. */
  deletePlanting(...args: string[]): Promise<void>,
}

export function createPlantingsDsl(world: World, plantings: PlantingsDriver): PlantingsDsl {
  async function newPlanting(as: string, plantAlias: string, yearAlias?: string) {
    const caller = await world.actorFor(as);
    const { plantingYear, } = await world.yearFor(caller, yearAlias);

    return { caller, input: aPlanting(world.plantNamed(plantAlias).plantId, plantingYear), };
  }

  return {
    async createPlanting(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        planting: alias(),
        plant: alias(),
        year: optional(),
        leadTimeWeeks: optional().asInteger(),
        targetPlantingDate: optional(),
      });
      const { caller, input, } = await newPlanting(params.as, params.plant, params.year);

      world.namePlanting(params.planting, await plantings.createPlanting(caller, {
        ...input,
        name: fixtureName(params.planting),
        ...(params.leadTimeWeeks === undefined ? {} : { leadTimeWeeks: params.leadTimeWeeks, }),
        ...(params.targetPlantingDate === undefined ? {} : { targetPlantingDate: params.targetPlantingDate, }),
      }));
    },

    async checkStatus(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), status: required(), });

      await plantings.getReportsStatus(await world.actorFor(params.as), world.plantingNamed(params.planting), params.status);
    },

    async checkHistory(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), entries: required().asInteger(), });

      await plantings.getReportsHistoryCount(await world.actorFor(params.as), world.plantingNamed(params.planting), params.entries);
    },

    async checkNumberSown(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), numberSown: required().asInteger(), });

      await plantings.getReportsNumberSown(await world.actorFor(params.as), world.plantingNamed(params.planting), params.numberSown);
    },

    async checkInYear(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), year: alias(), });

      await plantings.getReportsYear(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        world.yearNamed(params.year).plantingYear
      );
    },

    async checkListedInYear(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.listForYearIncludes(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },

    async checkYearMustBeANumber(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await plantings.listForNonNumericYearIsRejectedAsBadRequest(await world.actorFor(params.as));
    },

    async checkUnknownPlantingIsNotFound(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await plantings.getIsNotFoundFor(await world.actorFor(params.as));
    },

    async start(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        planting: alias(),
        numberSown: required().asInteger(),
        sowDate: optional(),
      });

      await plantings.start(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        params.numberSown,
        params.sowDate
      );
    },

    async plant(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        planting: alias(),
        plot: alias(),
        numberTransplanted: required().asInteger(),
        transplantDate: optional(),
      });

      await plantings.plantInPlot(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        world.plotNamed(params.plot),
        params.numberTransplanted,
        params.transplantDate
      );
    },

    async checkDates(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        planting: alias(),
        targetPlantingDate: optional(),
        sowDate: optional(),
        transplantDate: optional(),
      });
      const { targetPlantingDate, sowDate, transplantDate, } = params;

      await plantings.getReturnsDates(await world.actorFor(params.as), world.plantingNamed(params.planting), {
        ...(targetPlantingDate === undefined ? {} : { targetPlantingDate, }),
        ...(sowDate === undefined ? {} : { sowDate, }),
        ...(transplantDate === undefined ? {} : { transplantDate, }),
      });
    },

    async checkPlantInUnknownPlotIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        planting: alias(),
        numberTransplanted: required().asInteger(),
      });

      await plantings.plantInUnknownPlotIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        params.numberTransplanted
      );
    },

    async retire(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.retire(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },

    async comment(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), comment: required(), });

      await plantings.comment(await world.actorFor(params.as), world.plantingNamed(params.planting), params.comment);
    },

    async split(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), into: alias(), count: required().asInteger(), });

      world.namePlanting(params.into, await plantings.split(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        fixtureName(params.into),
        params.count
      ));
    },

    async nameTheRemainder(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), into: alias(), remaining: required().asInteger(), });
      const planting = world.plantingNamed(params.planting);

      world.namePlanting(params.into, await plantings.plantingNamedInYear(
        await world.actorFor(params.as),
        `${planting.name}(${params.remaining} Remaining)`,
        planting.plantingYear
      ));
    },

    async checkActionIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), action: required(), });

      await plantings.actionOutOfOrderIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        params.action
      );
    },

    async checkSplitOverflowIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), count: required().asInteger(), });

      await plantings.splitOverflowIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        params.count
      );
    },

    async update(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), seedSource: required(), });

      await plantings.updateChangesSeedSource(await world.actorFor(params.as), world.plantingNamed(params.planting), params.seedSource);
    },

    async checkFieldCanBeCleared(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        planting: alias(),
        field: required().allowedValues(...CLEARABLE_PLANTING_FIELDS),
        sentAs: required().allowedValues('null', 'an empty string'),
      });

      await plantings.updateToEmptyValueClearsField(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        params.field,
        params.sentAs === 'null' ? null : ''
      );
    },

    async checkLeadTimeCanBeSetToZero(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.updateToZeroChangesLeadTime(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },

    async checkUpdateOfFieldIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.updateOfFieldNotAllowedIsRejectedAsBadRequest(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },

    async checkCreateForUnknownPlantIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });
      const { caller, input, } = await newPlanting(params.as, params.plant);

      await plantings.createForUnknownPlantIsRejectedAsBadRequest(caller, input);
    },

    async checkCreateInUnknownYearIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });
      const { caller, input, } = await newPlanting(params.as, params.plant);

      await plantings.createInUnknownYearIsRejectedAsBadRequest(caller, input);
    },

    async checkInvalidPlantingIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), problem: required().allowedValues(...NEW_PLANTING_PROBLEMS), });
      const { caller, input, } = await newPlanting(params.as, params.plant);

      await plantings.createOfInvalidPlantingIsRejectedAsBadRequest(caller, input, params.problem);
    },

    async checkPlantingAsTheAppSendsItIsAccepted(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });
      const { caller, input, } = await newPlanting(params.as, params.plant);

      await plantings.createAsTheAppSendsItSucceeds(caller, input);
    },

    async checkInvalidUpdateIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        planting: alias(),
        problem: required().allowedValues(...PLANTING_UPDATE_PROBLEMS),
      });

      await plantings.updateOfInvalidFieldIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        params.problem
      );
    },

    async checkUpdateAsTheAppSendsItIsAccepted(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.updateAsTheAppSendsItSucceeds(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },

    async checkInvalidActionIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        planting: alias(),
        problem: required().allowedValues(...PLANTING_ACTION_PROBLEMS),
      });

      await plantings.actionOfInvalidBodyIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting),
        params.problem
      );
    },

    async checkStartAsTheAppSendsItIsAccepted(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.startAsTheAppSendsItSucceeds(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },

    async deleteWithAction(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.deleteActionRemovesPlanting(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },

    async checkDeleteActionIsRejectedWhileItHasHarvests(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.deleteActionOfPlantingWithHarvestsIsRejectedAsConflict(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting)
      );
    },

    async checkDeleteIsRejectedWhileItHasHarvests(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.deleteOfPlantingWithHarvestsIsRejectedAsConflict(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting)
      );
    },

    async deletePlanting(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await plantings.deleteRemovesPlanting(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },
  };
}
