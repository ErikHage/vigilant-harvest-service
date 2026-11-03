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

  it.each([
    'no date',
    'an unparseable date',
    'a date out of range',
    'no year',
    'a year that is not a number',
    'text that is not a string',
    'text that is too long',
    'an id that is too long',
  ])('rejects an entry with %s', async problem => {
    await journal.checkInvalidEntryIsRejected('as: gardener', `problem: ${problem}`);
  });

  it('accepts an entry as the app sends it', async () => {
    await journal.checkEntryAsTheAppSendsItIsAccepted('as: gardener');
  });

  it('rejects listing a year that is not a number', async () => {
    await journal.checkYearMustBeANumber('as: gardener');
  });
});
