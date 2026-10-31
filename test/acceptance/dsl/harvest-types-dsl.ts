import { parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor } from './params';
import { HarvestTypesDriver } from '../drivers/harvest-types-driver';
import { World } from './world';

export interface HarvestTypesDsl {
  /** `as`, `type`, by name. Harvest types are seed data, so a spec only reads them. */
  checkListed(...args: string[]): Promise<void>,
}

export function createHarvestTypesDsl(world: World, harvestTypes: HarvestTypesDriver): HarvestTypesDsl {
  return {
    async checkListed(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), type: required(), });

      await harvestTypes.listIncludes(await world.actorFor(params.as), params.type);
    },
  };
}
