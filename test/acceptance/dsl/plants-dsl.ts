import { optional, parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aPlant, everyPlantDetail, fixtureName } from '../support/fixtures';
import { PlantsDriver } from '../drivers/plants-driver';
import { World } from './world';

const NO_SUCH_SUBCATEGORY = 999999;

export interface PlantsDsl {
  /**
   * `as`, `plant`, the alias. Optional `subcategory`, which is made for the
   * spec when omitted; `details: every field`; `defaultHarvestType`, by name.
   */
  createPlant(...args: string[]): Promise<void>,
  /** `as`, `plant`. Asserts every detail it was created with came back. */
  checkPlant(...args: string[]): Promise<void>,
  /** `as`, `plant`. */
  checkListed(...args: string[]): Promise<void>,
  /** `as`, `plant`, `harvestType`, by name. */
  checkDefaultHarvestType(...args: string[]): Promise<void>,
  /** `as`, `plant`, optional `description`, optional `defaultHarvestType`, by name. */
  updatePlant(...args: string[]): Promise<void>,
  /** `as`, `plant`, `schedule`. */
  assignSchedule(...args: string[]): Promise<void>,
  /** `as`, `plant`, `schedule`. */
  unassignSchedule(...args: string[]): Promise<void>,
  /** `as`, `plant`, `schedule`. */
  checkHasSchedule(...args: string[]): Promise<void>,
  /** `as`, `plant`. */
  checkHasNoSchedules(...args: string[]): Promise<void>,
  /** `as`, `plant`, `schedule`. */
  checkSecondAssignmentIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plant`. */
  checkAssignmentWithoutListsIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plant`. */
  checkSowingValuesKeepTheirTypes(...args: string[]): Promise<void>,
  /** `as`. */
  checkUnknownPlantIsNotFound(...args: string[]): Promise<void>,
  /** `as`, `plant`. Asserts a second plant under its name is rejected. */
  checkTakenNameIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plant`, `taken`, another plant. */
  checkRenameToTakenNameIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plant`. Saves under its name with an id nothing holds. */
  checkUnknownIdWithTakenNameIsRejected(...args: string[]): Promise<void>,
  /** `as`. */
  checkUnknownSubcategoryIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plant`. Asserts the delete is rejected while it has plantings. */
  checkDeleteIsRejectedWhileInUse(...args: string[]): Promise<void>,
  /** `as`, `plant`. Asserts it is gone. */
  deletePlant(...args: string[]): Promise<void>,
}

export function createPlantsDsl(world: World, plants: PlantsDriver): PlantsDsl {
  const { harvestTypes, } = world.drivers;

  return {
    async createPlant(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        plant: alias(),
        subcategory: optional(),
        details: optional().allowedValues('every field'),
        defaultHarvestType: optional(),
      });
      const caller = await world.actorFor(params.as);
      const subcategory = await world.subcategoryFor(caller, params.subcategory);

      const details = params.details === undefined ? {} : everyPlantDetail();
      const harvesting = params.defaultHarvestType === undefined
        ? details.harvesting
        : {
          ...details.harvesting,
          defaultHarvestTypeId: await harvestTypes.idOfTypeNamed(caller, params.defaultHarvestType),
        };

      const input = aPlant(subcategory.subcategoryId, {
        friendlyName: fixtureName(params.plant),
        ...details,
        ...(harvesting === undefined ? {} : { harvesting, }),
      });

      world.namePlant(params.plant, await plants.createPlant(caller, input));
    },

    async checkPlant(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });

      await plants.getReturnsPlant(await world.actorFor(params.as), world.plantNamed(params.plant));
    },

    async checkListed(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });

      await plants.listIncludes(await world.actorFor(params.as), world.plantNamed(params.plant));
    },

    async checkDefaultHarvestType(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), harvestType: alias(), });

      await plants.getReportsDefaultHarvestType(
        await world.actorFor(params.as),
        world.plantNamed(params.plant),
        params.harvestType
      );
    },

    async updatePlant(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, {
        as: actor(),
        plant: alias(),
        description: optional(),
        defaultHarvestType: optional(),
      });
      const caller = await world.actorFor(params.as);
      const plant = world.plantNamed(params.plant);

      const changes = {
        ...(params.description === undefined ? {} : { description: params.description, }),
        ...(params.defaultHarvestType === undefined ? {} : {
          harvesting: {
            ...plant.input.harvesting,
            defaultHarvestTypeId: await harvestTypes.idOfTypeNamed(caller, params.defaultHarvestType),
          },
        }),
      };

      world.namePlant(params.plant, await plants.updateChanges(caller, plant, changes));
    },

    async assignSchedule(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), schedule: alias(), });

      await plants.assignSchedule(
        await world.actorFor(params.as),
        world.plantNamed(params.plant),
        world.scheduleNamed(params.schedule)
      );
    },

    async unassignSchedule(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), schedule: alias(), });

      await plants.unassignSchedule(
        await world.actorFor(params.as),
        world.plantNamed(params.plant),
        world.scheduleNamed(params.schedule)
      );
    },

    async checkHasSchedule(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), schedule: alias(), });

      await plants.getShowsSchedule(
        await world.actorFor(params.as),
        world.plantNamed(params.plant),
        world.scheduleNamed(params.schedule)
      );
    },

    async checkHasNoSchedules(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });

      await plants.getShowsNoSchedules(await world.actorFor(params.as), world.plantNamed(params.plant));
    },

    async checkSecondAssignmentIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), schedule: alias(), });

      await plants.secondAssignmentIsRejectedAsConflict(
        await world.actorFor(params.as),
        world.plantNamed(params.plant),
        world.scheduleNamed(params.schedule)
      );
    },

    async checkAssignmentWithoutListsIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });

      await plants.assignmentWithoutListsFailsWithServerError(await world.actorFor(params.as), world.plantNamed(params.plant));
    },

    async checkSowingValuesKeepTheirTypes(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });

      await plants.getReturnsSowingValuesAsStrings(await world.actorFor(params.as), world.plantNamed(params.plant));
    },

    async checkUnknownPlantIsNotFound(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await plants.getIsNotFoundFor(await world.actorFor(params.as));
    },

    async checkTakenNameIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });

      await plants.createOfTakenNameIsRejectedAsBadRequest(await world.actorFor(params.as), world.plantNamed(params.plant));
    },

    async checkRenameToTakenNameIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), taken: alias(), });

      await plants.renameToTakenNameIsRejectedAsConflict(
        await world.actorFor(params.as),
        world.plantNamed(params.plant),
        world.plantNamed(params.taken)
      );
    },

    async checkUnknownIdWithTakenNameIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });

      await plants.createWithUnknownIdAndTakenNameFailsWithNotFoundAndOverwrites(
        await world.actorFor(params.as),
        world.plantNamed(params.plant)
      );
    },

    async checkUnknownSubcategoryIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await plants.createWithUnknownSubcategoryIsRejectedAsBadRequest(
        await world.actorFor(params.as),
        aPlant(NO_SUCH_SUBCATEGORY)
      );
    },

    async checkDeleteIsRejectedWhileInUse(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });

      await plants.deleteOfPlantInUseIsRejectedAsConflict(await world.actorFor(params.as), world.plantNamed(params.plant));
    },

    async deletePlant(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plant: alias(), });

      await plants.deleteRemovesPlant(await world.actorFor(params.as), world.plantNamed(params.plant));
    },
  };
}
