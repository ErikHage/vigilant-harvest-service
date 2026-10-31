import { describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('harvest types', () => {
  const { harvestTypes, } = createAcceptanceDsl();

  it('lists the type every plant starts with', async () => {
    await harvestTypes.checkListed('as: gardener', 'type: unspecified');
  });
});
