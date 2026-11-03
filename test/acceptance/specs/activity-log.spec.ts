import { afterEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('activity log', () => {
  const { activityLog, cleanup, } = createAcceptanceDsl();

  afterEach(cleanup);

  it('lists a new entry under its year', async () => {
    await activityLog.createEntry('as: gardener', 'entry: watered');

    await activityLog.checkListed('as: gardener', 'entry: watered');
  });

  it('updates an entry', async () => {
    await activityLog.createEntry('as: gardener', 'entry: watered');

    await activityLog.updateEntry('as: gardener', 'entry: watered', 'comments: Weeded as well');

    await activityLog.checkListed('as: gardener', 'entry: watered');
  });

  it('deletes an entry', async () => {
    await activityLog.createEntry('as: gardener', 'entry: watered');

    await activityLog.deleteEntry('as: gardener', 'entry: watered');
  });

  it('rejects an entry in a year that does not exist', async () => {
    await activityLog.checkEntryInUnknownYearIsRejected('as: gardener');
  });

  // DocumentsCurrentBehavior: replies 500. Should be 400.
  it('rejects an entry with no date', async () => {
    await activityLog.checkEntryWithoutDateIsRejected('as: gardener');
  });

  it('rejects listing a year that is not a number', async () => {
    await activityLog.checkYearMustBeANumber('as: gardener');
  });
});
