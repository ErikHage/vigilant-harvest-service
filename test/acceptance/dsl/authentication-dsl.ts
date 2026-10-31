import { parseDslArgs } from '@feral-auth/ts-simple-dsl';

import { actor, outcome } from './params';
import { AuthenticationDriver } from '../drivers/authentication-driver';
import { World } from './world';

/**
 * What a token is worth, in prose.
 *
 * A spec never handles a token. It names a caller, and `world.actorFor` knows
 * which token that caller holds.
 */
export interface AuthenticationDsl {
  /** `as`, `expect: accepted | is rejected`. */
  checkToken(...args: string[]): Promise<void>,
}

export function createAuthenticationDsl(world: World, authentication: AuthenticationDriver): AuthenticationDsl {
  return {
    async checkToken(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), expect: outcome('accepted', 'is rejected'), });
      const caller = await world.actorFor(params.as);

      if (params.expect === 'accepted') {
        await authentication.tokenIsAccepted(caller);
        return;
      }

      await authentication.tokenIsRejectedAsUnauthorized(caller);
    },
  };
}
