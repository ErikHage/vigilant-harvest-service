import { Actor } from '../support/actors';
import { expectBodyToContain, expectBodyToHaveKeys, expectStatus } from './assertions';
import { HttpClient } from '../support/http-client';
import { status } from '../support/status-codes';

export interface ServiceInfoDriver {
  /** Asserts the service answers, and says which service it is. */
  getReturnsServiceInfo(caller: Actor): Promise<void>,
}

export function createServiceInfoDriver(client: HttpClient): ServiceInfoDriver {
  return {
    async getReturnsServiceInfo(caller: Actor): Promise<void> {
      const what = 'reading the service info';
      const response = await client.withToken(caller.token).get('/service-info');

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { name: 'vigilant-harvest-service', }, what);
      expectBodyToHaveKeys(response, [ 'version', ], what);
    },
  };
}
