import { describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('service info', () => {
  const { serviceInfo, } = createAcceptanceDsl();

  it('says which service it is, without a token', async () => {
    await serviceInfo.checkServiceInfo('as: anonymous');
  });
});
