import { afterEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('journal', () => {
  const { journal, cleanup, } = createAcceptanceDsl();

  afterEach(cleanup);

  it('lists a new entry under its year', async () => {
    await journal.createEntry('as: gardener', 'entry: first-frost');

    await journal.checkListed('as: gardener', 'entry: first-frost');
  });

  it('updates an entry', async () => {
    await journal.createEntry('as: gardener', 'entry: first-frost');

    await journal.updateEntry('as: gardener', 'entry: first-frost', 'text: Frost came early');

    await journal.checkListed('as: gardener', 'entry: first-frost');
  });

  it('deletes an entry', async () => {
    await journal.createEntry('as: gardener', 'entry: first-frost');

    await journal.deleteEntry('as: gardener', 'entry: first-frost');
  });

  it('rejects an entry in a year that does not exist', async () => {
    await journal.checkEntryInUnknownYearIsRejected('as: gardener');
  });

  // DocumentsCurrentBehavior: replies 500. Should be 400.
  it('rejects an entry with no date', async () => {
    await journal.checkEntryWithoutDateIsRejected('as: gardener');
  });

  it('rejects listing a year that is not a number', async () => {
    await journal.checkYearMustBeANumber('as: gardener');
  });
});
