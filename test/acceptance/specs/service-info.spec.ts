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
});
