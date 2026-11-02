import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { actor } from './params';
import { ServiceInfoDriver } from '../drivers/service-info-driver';
import { World } from './world';

export interface ServiceInfoDsl {
  /** `as`. Asserts the service answers, and says which service it is. */
  checkServiceInfo(...args: string[]): Promise<void>,
  /** `as`. Asserts the health route answers that the process is serving. */
  checkHealth(...args: string[]): Promise<void>,
  /** `as`. Asserts that no response says what the service is built with. */
  checkFrameworkIsNotNamed(...args: string[]): Promise<void>,
  /** `as`. Asserts that a body that isn't valid JSON is rejected, in the service's error shape. */
  checkMalformedBodyIsRejected(...args: string[]): Promise<void>,
}

export function createServiceInfoDsl(world: World, serviceInfo: ServiceInfoDriver): ServiceInfoDsl {
  return {
    async checkServiceInfo(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await serviceInfo.getReturnsServiceInfo(await world.actorFor(params.as));
    },

    async checkHealth(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await serviceInfo.getHealthReturnsOk(await world.actorFor(params.as));
    },

    async checkFrameworkIsNotNamed(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await serviceInfo.responsesDoNotNameTheFramework(await world.actorFor(params.as));
    },

    async checkMalformedBodyIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await serviceInfo.malformedBodyIsRejectedAsBadRequest(await world.actorFor(params.as));
    },
  };
}
