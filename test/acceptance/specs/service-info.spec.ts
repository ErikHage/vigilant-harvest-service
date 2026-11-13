import { describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('service info', () => {
  const { serviceInfo, } = createAcceptanceDsl();

  it('says which service it is, without a token', async () => {
    await serviceInfo.checkServiceInfo('as: anonymous');
  });

  it('reports that it is healthy, without a token', async () => {
    await serviceInfo.checkHealth('as: anonymous');
  });

  it('does not say what it is built with', async () => {
    await serviceInfo.checkFrameworkIsNotNamed('as: gardener');
  });

  it('rejects a body that is not JSON', async () => {
    await serviceInfo.checkMalformedBodyIsRejected('as: gardener');
  });

  it('rejects a body that is not JSON, before asking for a token', async () => {
    await serviceInfo.checkMalformedBodyIsRejected('as: anonymous');
  });

  it('answers a route that does not exist as not found, in the service\'s error shape', async () => {
    await serviceInfo.checkUnknownRouteIsRejected('as: gardener', 'expect: not found');
  });

  // The token is checked first, so a caller without one can't learn which
  // routes exist
  it('asks for a token before saying a route does not exist', async () => {
    await serviceInfo.checkUnknownRouteIsRejected('as: anonymous', 'expect: unauthorized');
  });
});
