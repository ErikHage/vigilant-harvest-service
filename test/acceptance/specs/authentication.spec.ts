import { describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('authentication', () => {
  const { auth, } = createAcceptanceDsl();

  it('accepts a token feral signed', async () => {
    await auth.checkToken('as: gardener', 'expect: accepted');
  });

  it('rejects a call with no token', async () => {
    await auth.checkToken('as: anonymous', 'expect: is rejected');
  });

  it('rejects a well-formed token feral did not sign', async () => {
    await auth.checkToken('as: forged', 'expect: is rejected');
  });

  it('rejects a token that is not a jwt', async () => {
    await auth.checkToken('as: malformed', 'expect: is rejected');
  });

  // The service checks tokens against feral's public keys without asking feral,
  // so it can't know a session has ended: a token is good until it expires
  it('accepts a token whose session has ended, until it expires', async () => {
    await auth.checkToken('as: logged-out', 'expect: accepted');
  });
});
