import { describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';
import { expectStepRejected } from '../dsl/dsl-misuse';

/**
 * The DSL's own error messages. A step called wrongly must say so, before it
 * reaches the service, or a typo would read as a service failure.
 */
describe('dsl misuse', () => {
  const { auth, plantCategories, } = createAcceptanceDsl();

  it('reports a misspelled parameter, and the required one it left out', async () => {
    await expectStepRejected(
      () => plantCategories.createCategory('as: gardener', 'categry: herbs'),
      'categry',
      'category'
    );
  });

  it('reports a parameter the step does not take', async () => {
    await expectStepRejected(
      () => plantCategories.createCategory('as: gardener', 'category: herbs', 'color: green'),
      'color'
    );
  });

  it('reports a caller left out', async () => {
    await expectStepRejected(
      () => plantCategories.createCategory('category: herbs'),
      'as'
    );
  });

  it('reports an outcome the step cannot check', async () => {
    await expectStepRejected(
      () => auth.checkToken('as: gardener', 'expect: maybe'),
      'maybe'
    );
  });
});
