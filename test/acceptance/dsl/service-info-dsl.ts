import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { actor } from './params';
import { ServiceInfoDriver } from '../drivers/service-info-driver';
import { World } from './world';

export interface ServiceInfoDsl {
  /** `as`. Asserts the service answers, and says which service it is. */
  checkServiceInfo(...args: string[]): Promise<void>,
}

export function createServiceInfoDsl(world: World, serviceInfo: ServiceInfoDriver): ServiceInfoDsl {
  return {
    async checkServiceInfo(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await serviceInfo.getReturnsServiceInfo(await world.actorFor(params.as));
    },
  };
}
