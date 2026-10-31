import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aHarvest } from '../support/fixtures';
import { HarvestsDriver } from '../drivers/harvests-driver';
import { World } from './world';

export interface HarvestsDsl {
  /** `as`, `harvest`, the alias, `planting`, `quantity`, optional `type`, by name, optional `date`. */
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
  /** `as`. */
  checkUnknownPlantingIsRejected(...args: string[]): Promise<void>,
  /** `as`. */
  checkMissingListIsRejected(...args: string[]): Promise<void>,
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
        ...(params.date === undefined ? {} : { harvestDate: `${params.date}T12:00:00`, }),
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

      await harvests.searchWithoutYearFailsWithServerError(await world.actorFor(params.as));
    },

    async checkUnknownPlantingIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await harvests.recordForUnknownPlantingIsRejectedAsBadRequest(await world.actorFor(params.as), aHarvest('no-such-planting'));
    },

    async checkMissingListIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await harvests.recordWithoutHarvestsFailsWithServerError(await world.actorFor(params.as));
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
