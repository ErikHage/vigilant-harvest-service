import { Actor } from '../support/actors';
import { expectBodyToContain, expectBodyToHaveKeys, expectNoHeader, expectStatus } from './assertions';
import { HttpClient } from '../support/http-client';
import { status } from '../support/status-codes';

/** Express's default; it tells a caller what the service is built with. */
const POWERED_BY_HEADER = 'X-Powered-By';

export interface ServiceInfoDriver {
  /** Asserts the service answers, and says which service it is. */
  getReturnsServiceInfo(caller: Actor): Promise<void>,
  /** Asserts the health route answers that the process is serving. */
  getHealthReturnsOk(caller: Actor): Promise<void>,
  /**
   * Asserts that no response says what the service is built with: not the
   * health route, not a route behind the token, and not a route that doesn't
   * exist, which Express answers itself.
   */
  responsesDoNotNameTheFramework(caller: Actor): Promise<void>,
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

    async getHealthReturnsOk(caller: Actor): Promise<void> {
      const what = 'checking the service\'s health';
      const response = await client.withToken(caller.token).get('/health');

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { status: 'ok', }, what);
    },

    async responsesDoNotNameTheFramework(caller: Actor): Promise<void> {
      const callerClient = client.withToken(caller.token);
      const calls = [
        { path: '/health', what: 'checking the service\'s health', },
        { path: '/harvest-types', what: 'listing harvest types', },
        { path: '/no-such-route', what: 'calling a route that doesn\'t exist', },
      ];

      for (const call of calls) {
        expectNoHeader(await callerClient.get(call.path), POWERED_BY_HEADER, call.what);
      }
    },
  };
}
