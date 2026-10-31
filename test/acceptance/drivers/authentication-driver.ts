import { Actor } from '../support/actors';
import { expectNonEmptyString, expectStatus } from './assertions';
import { HttpClient } from '../support/http-client';
import { status } from '../support/status-codes';

export interface Credentials {
  username: string,
  password: string,
  applicationId: string,
}

export interface AuthenticationDriver {
  loginReturnsToken(caller: Actor, credentials: Credentials): Promise<string>,
  tokenIsAccepted(caller: Actor): Promise<void>,
  tokenIsRejectedAsUnauthorized(caller: Actor): Promise<void>,
}

/**
 * The service only verifies tokens: it hands none out and checks no roles, so
 * a call either carries a token feral signed or it does not. Logging in is
 * feral's, which is the one thing `authClient` reaches.
 *
 * `/harvest-types` stands in for every route behind the token. Which route
 * doesn't matter, because the check runs before routing.
 */
export function createAuthenticationDriver(client: HttpClient, authClient: HttpClient): AuthenticationDriver {
  const protectedCall = (caller: Actor) => client.withToken(caller.token).get('/harvest-types');

  return {
    async loginReturnsToken(caller: Actor, credentials: Credentials): Promise<string> {
      const what = `logging in as "${credentials.username}"`;
      const response = await authClient.withToken(caller.token).post('/login', credentials);

      expectStatus(response, status.OK, what);

      const body = response.body as { token?: unknown };

      return expectNonEmptyString(body.token, response, `${what} and receiving a token`);
    },

    async tokenIsAccepted(caller: Actor): Promise<void> {
      expectStatus(await protectedCall(caller), status.OK, `calling as ${String(caller.username)}`);
    },

    async tokenIsRejectedAsUnauthorized(caller: Actor): Promise<void> {
      expectStatus(
        await protectedCall(caller),
        status.UNAUTHORIZED,
        `calling as ${caller.username ?? 'nobody'}, which should not be let in`
      );
    },
  };
}
