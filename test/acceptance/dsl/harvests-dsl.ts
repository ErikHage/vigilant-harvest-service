import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aHarvest } from '../support/fixtures';
import { HARVEST_SAVE_PROBLEMS, HarvestsDriver } from '../drivers/harvests-driver';
import { World } from './world';

export interface HarvestsDsl {
  /** `as`, `harvest`, the alias, `planting`, `quantity`, optional `type`, by name, and optional `date`. */
  recordHarvest(...args: string[]): Promise<void>,
  /** `as`, `harvest`, `planting`, `quantity`. Saves it again under its own id. */
  saveAgain(...args: string[]): Promise<void>,
  /** `as`, `harvest`, `planting`, `quantity`, `type`. Asserts it is filed under the planting's year. */
  checkHarvest(...args: string[]): Promise<void>,
  /** `as`, `planting`, `quantity`, `type`. */
  checkInSummary(...args: string[]): Promise<void>,
  /** `as`, `statsType: Plant | Planting`, `planting`, for its year, `harvests`. */
  checkStats(...args: string[]): Promise<void>,
  /** `as`, `planting`, for its year. */
  checkPlantStatsSayTheyAreForPlants(...args: string[]): Promise<void>,
  /** `as`. */
  checkSearchNeedsAYear(...args: string[]): Promise<void>,
  /** `as`. Search, summary and stats each reject a year that isn't a number. */
  checkYearMustBeANumber(...args: string[]): Promise<void>,
  /** `as`. */
  checkUnknownPlantingIsRejected(...args: string[]): Promise<void>,
  /** `as`, `planting`, `problem`, one of the driver's HARVEST_SAVE_PROBLEMS. */
  checkInvalidSaveIsRejected(...args: string[]): Promise<void>,
  /** `as`, `planting`. Saves a harvest shaped the way vigilant-harvest-app sends one. */
  checkSaveAsTheAppSendsItIsAccepted(...args: string[]): Promise<void>,
  /** `as`, `harvest`, `planting`. Asserts it is gone from the planting's year. */
  deleteHarvest(...args: string[]): Promise<void>,
}

export function createHarvestsDsl(world: World, harvests: HarvestsDriver): HarvestsDsl {
  const { harvestTypes, } = world.drivers;

  return {
    async recordHarvest(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        harvest: alias(),
        planting: alias(),
        quantity: required().asInteger(),
        type: optional(),
        date: optional(),
      });
      const caller = await world.actorFor(params.as);
      const input = aHarvest(world.plantingNamed(params.planting).plantingId, {
        quantity: params.quantity,
        ...(params.date === undefined ? {} : { harvestDate: params.date, }),
        ...(params.type === undefined ? {} : { harvestTypeId: await harvestTypes.idOfTypeNamed(caller, params.type), }),
      });

      world.nameHarvest(params.harvest, await harvests.recordHarvest(caller, input));
    },

    async saveAgain(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), harvest: alias(), planting: alias(), quantity: required().asInteger(), });

      await harvests.resaveChangesQuantity(
        await world.actorFor(params.as),
        world.harvestNamed(params.harvest),
        aHarvest(world.plantingNamed(params.planting).plantingId, { quantity: params.quantity, })
      );
    },

    async checkHarvest(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        harvest: alias(),
        planting: alias(),
        quantity: required().asInteger(),
        type: required(),
      });

      await harvests.searchIncludes(
        await world.actorFor(params.as),
        world.harvestNamed(params.harvest),
        world.plantingNamed(params.planting).plantingYear,
        { quantity: params.quantity, harvestType: params.type, }
      );
    },

    async checkInSummary(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), quantity: required().asInteger(), type: required(), });
      const planting = world.plantingNamed(params.planting);

      await harvests.summaryIncludes(await world.actorFor(params.as), planting.plantingId, planting.plantingYear, {
        quantity: params.quantity,
        harvestType: params.type,
      });
    },

    async checkStats(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        statsType: required().allowedValues('Plant', 'Planting'),
        planting: alias(),
        harvests: required().asInteger(),
      });

      await harvests.statsCountHarvests(
        await world.actorFor(params.as),
        params.statsType,
        world.plantingNamed(params.planting).plantingYear,
        params.harvests
      );
    },

    async checkPlantStatsSayTheyAreForPlants(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await harvests.plantStatsCallThemselvesPlantingStats(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting).plantingYear
      );
    },

    async checkSearchNeedsAYear(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await harvests.searchWithoutYearIsRejectedAsBadRequest(await world.actorFor(params.as));
    },

    async checkYearMustBeANumber(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await harvests.queriesOfNonNumericYearAreRejectedAsBadRequest(await world.actorFor(params.as));
    },

    async checkUnknownPlantingIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await harvests.recordForUnknownPlantingIsRejectedAsBadRequest(await world.actorFor(params.as), aHarvest('no-such-planting'));
    },

    async checkInvalidSaveIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        planting: alias(),
        problem: required().allowedValues(...HARVEST_SAVE_PROBLEMS),
      });

      await harvests.saveOfInvalidHarvestsIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        aHarvest(world.plantingNamed(params.planting).plantingId),
        params.problem
      );
    },

    async checkSaveAsTheAppSendsItIsAccepted(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await harvests.saveAsTheAppSendsItSucceeds(
        await world.actorFor(params.as),
        world.plantingNamed(params.planting).plantingId
      );
    },

    async deleteHarvest(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), harvest: alias(), planting: alias(), });

      await harvests.deleteRemovesHarvest(
        await world.actorFor(params.as),
        world.harvestNamed(params.harvest),
        world.plantingNamed(params.planting).plantingYear
      );
    },
  };
}
