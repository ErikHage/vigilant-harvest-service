import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aHarvest } from '../support/fixtures';
import { HARVEST_SAVE_PROBLEMS, HarvestsDriver } from '../drivers/harvests-driver';
import { World } from './world';

export interface HarvestsDsl {
  /** `as`, `harvest`, the alias, `planting`, `quantity`, optional `type`, by name, and optional `date`. */
  recordHarvest(...args: string[]): Promise<void>,
  /**
   * `as`, `harvest`, the alias, `planting`, `quantities`, separated by commas, and
   * `sent: in one save | in saves at once`. Records a harvest of each quantity, all on one day and of
   * the plant's default type, and names the harvest the first was written to.
   */
  recordHarvests(...args: string[]): Promise<void>,
  /** `as`, `harvest`, `planting`, `quantity`, and optional `type`, by name. Saves it again under its own id. */
  saveAgain(...args: string[]): Promise<void>,
  /**
   * `as`, `harvest`, `planting`, `quantity`, `type`, optional `date`, the day it was sent with,
   * and optional `year`, a year alias. Asserts it is filed under that year, or, with none, the
   * year the planting was created in.
   */
  checkHarvest(...args: string[]): Promise<void>,
  /**
   * `as`, `harvests`, aliases separated by commas, `planting`, `quantities` and `types`, by name, one
   * for each harvest. Saves them all again under their own ids, in one save.
   */
  saveAgainTogether(...args: string[]): Promise<void>,
  /** `as`, `planting`, for its year, `harvests`. Counts its harvests, whatever their days and types. */
  checkHarvestCount(...args: string[]): Promise<void>,
  /** `as`, `planting`, `quantity`, `type`. */
  checkInSummary(...args: string[]): Promise<void>,
  /** `as`, `statsType: Plant | Planting`, `planting`, for its year, `harvests`. */
  checkStats(...args: string[]): Promise<void>,
  /** `as`, `statsType: Plant | Planting`, `planting`, for its year, `total`. */
  checkStatsTotal(...args: string[]): Promise<void>,
  /** `as`, `statsType: Plant | Planting`, `planting`, for its year, `first`, `last`, and `days`, counted inclusively. */
  checkStatsDays(...args: string[]): Promise<void>,
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
        quantity: required().asNumber(),
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

    async recordHarvests(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        harvest: alias(),
        planting: alias(),
        quantities: required().asNumber().multiple({ separator: ',', }),
        sent: required().allowedValues('in one save', 'in saves at once'),
      });
      const caller = await world.actorFor(params.as);
      const plantingId = world.plantingNamed(params.planting).plantingId;
      const inputs = params.quantities.map(quantity => aHarvest(plantingId, { quantity, }));

      world.nameHarvest(
        params.harvest,
        params.sent === 'in one save'
          ? await harvests.recordHarvestsInOneSave(caller, inputs)
          : await harvests.recordHarvestsInSavesAtOnce(caller, inputs)
      );
    },

    async saveAgain(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        harvest: alias(),
        planting: alias(),
        quantity: required().asNumber(),
        type: optional(),
      });
      const caller = await world.actorFor(params.as);

      await harvests.resaveChangesQuantity(
        caller,
        world.harvestNamed(params.harvest),
        aHarvest(world.plantingNamed(params.planting).plantingId, {
          quantity: params.quantity,
          ...(params.type === undefined ? {} : { harvestTypeId: await harvestTypes.idOfTypeNamed(caller, params.type), }),
        })
      );
    },

    async saveAgainTogether(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        harvests: alias().multiple({ separator: ',', }),
        planting: alias(),
        quantities: required().asNumber().multiple({ separator: ',', }),
        types: required().multiple({ separator: ',', }),
      });
      const caller = await world.actorFor(params.as);
      const plantingId = world.plantingNamed(params.planting).plantingId;
      const inputs = await Promise.all(params.quantities.map(async (quantity, index) => aHarvest(plantingId, {
        quantity,
        harvestTypeId: await harvestTypes.idOfTypeNamed(caller, params.types[index]!),
      })));

      await harvests.resaveInOneSave(caller, params.harvests.map(name => world.harvestNamed(name)), inputs);
    },

    async checkHarvestCount(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), harvests: required().asInteger(), });
      const planting = world.plantingNamed(params.planting);

      await harvests.searchCountsHarvestsOfPlanting(
        await world.actorFor(params.as),
        planting.plantingId,
        planting.plantingYear,
        params.harvests
      );
    },

    async checkHarvest(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        harvest: alias(),
        planting: alias(),
        quantity: required().asNumber(),
        type: required(),
        date: optional(),
        year: optional(),
      });

      await harvests.searchIncludes(
        await world.actorFor(params.as),
        world.harvestNamed(params.harvest),
        params.year === undefined ? world.plantingNamed(params.planting).plantingYear : world.yearNamed(params.year).plantingYear,
        {
          quantity: params.quantity,
          harvestType: params.type,
          ...(params.date === undefined ? {} : { harvestDate: params.date, }),
        }
      );
    },

    async checkInSummary(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), quantity: required().asNumber(), type: required(), });
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

    async checkStatsTotal(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        statsType: required().allowedValues('Plant', 'Planting'),
        planting: alias(),
        total: required().asNumber(),
      });

      await harvests.statsReportTotal(
        await world.actorFor(params.as),
        params.statsType,
        world.plantingNamed(params.planting).plantingYear,
        params.total
      );
    },

    async checkStatsDays(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        statsType: required().allowedValues('Plant', 'Planting'),
        planting: alias(),
        first: required(),
        last: required(),
        days: required().asInteger(),
      });

      await harvests.statsReportDays(
        await world.actorFor(params.as),
        params.statsType,
        world.plantingNamed(params.planting).plantingYear,
        { firstHarvestDate: params.first, lastHarvestDate: params.last, numberOfDays: params.days, }
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
