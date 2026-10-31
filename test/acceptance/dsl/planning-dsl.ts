import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { PlanningDriver } from '../drivers/planning-driver';
import { World } from './world';

export interface PlanningDsl {
  /** `as`, `planting`. Asserts it is due to be started, in its year's plan. */
  checkToStart(...args: string[]): Promise<void>,
  /** `as`, `planting`. Asserts it is due to be planted, in its year's plan. */
  checkToPlant(...args: string[]): Promise<void>,
  /** `as`. */
  checkUnknownYearIsNotFound(...args: string[]): Promise<void>,
  /** `as`. */
  checkYearMustBeANumber(...args: string[]): Promise<void>,
}

export function createPlanningDsl(world: World, planning: PlanningDriver): PlanningDsl {
  return {
    async checkToStart(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await planning.toStartIncludes(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },

    async checkToPlant(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), planting: alias(), });

      await planning.toPlantIncludes(await world.actorFor(params.as), world.plantingNamed(params.planting));
    },

    async checkUnknownYearIsNotFound(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await planning.getIsNotFoundFor(await world.actorFor(params.as));
    },

    async checkYearMustBeANumber(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await planning.getForNonNumericYearFailsWithServerError(await world.actorFor(params.as));
    },
  };
}
