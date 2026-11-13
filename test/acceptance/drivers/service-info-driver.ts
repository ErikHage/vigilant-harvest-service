import { Actor } from '../support/actors';
import { expectBodyToContain, expectBodyToHaveKeys, expectNoHeader, expectStatus, expectThat } from './assertions';
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
  /**
   * Asserts that a body that isn't valid JSON is rejected as a bad request, in
   * the service's own error shape, with no stack trace. Bodies are parsed before
   * the token is checked, so this holds with or without one.
   */
  malformedBodyIsRejectedAsBadRequest(caller: Actor): Promise<void>,
  /**
   * Asserts that each call to a route that doesn't exist, or with a method the
   * route doesn't take, is rejected as not found, in the service's error shape.
   */
  unknownRouteIsRejectedAsNotFound(caller: Actor): Promise<void>,
  /**
   * Asserts that the same calls, without a good token, are rejected as
   * unauthorized: the token is checked before the route is looked for.
   */
  unknownRouteIsRejectedAsUnauthorized(caller: Actor): Promise<void>,
}

/** Calls the service has no route for: an unknown path, a deeper one, and a method a route doesn't take. */
const UNKNOWN_ROUTE_CALLS = [
  { send: (client: HttpClient) => client.get('/no-such-route'), what: 'reading a route that doesn\'t exist', },
  { send: (client: HttpClient) => client.get('/plots/no-such-plot/no-such-child'), what: 'reading below a plot', },
  { send: (client: HttpClient) => client.patch('/plots', {}), what: 'patching the plots collection, which takes no PATCH', },
];

export function createServiceInfoDriver(client: HttpClient): ServiceInfoDriver {
  async function unknownRouteIsRejectedAs(caller: Actor, expected: number): Promise<void> {
    const callerClient = client.withToken(caller.token);

    for (const call of UNKNOWN_ROUTE_CALLS) {
      const response = await call.send(callerClient);

      expectStatus(response, expected, call.what);
      expectBodyToHaveKeys(response, [ 'errors', ], call.what);
    }
  }

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

    async malformedBodyIsRejectedAsBadRequest(caller: Actor): Promise<void> {
      const what = 'saving a journal entry whose body is not valid JSON';
      const response = await client.withToken(caller.token).putRaw('/journal', '{"entry": ');

      expectStatus(response, status.BAD_REQUEST, what);
      expectBodyToHaveKeys(response, [ 'errors', ], what);
      expectThat(
        !/node_modules|\bat [^\n]*\(/.test(response.rawBody),
        'no stack trace in the body',
        response,
        what
      );
    },

    async unknownRouteIsRejectedAsNotFound(caller: Actor): Promise<void> {
      await unknownRouteIsRejectedAs(caller, status.NOT_FOUND);
    },

    async unknownRouteIsRejectedAsUnauthorized(caller: Actor): Promise<void> {
      await unknownRouteIsRejectedAs(caller, status.UNAUTHORIZED);
    },
  };
}
