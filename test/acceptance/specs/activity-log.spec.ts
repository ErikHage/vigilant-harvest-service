import { afterEach, describe, it } from 'vitest';

import { createAcceptanceDsl } from '../dsl/acceptance-dsl';

describe('activity log', () => {
  const { activityLog, cleanup, } = createAcceptanceDsl();

  afterEach(cleanup);

  it('lists a new entry under its year', async () => {
    await activityLog.createEntry('as: gardener', 'entry: watered');

    await activityLog.checkListed('as: gardener', 'entry: watered');
  });

  it('accepts an entry time with no seconds', async () => {
    await activityLog.createEntry('as: gardener', 'entry: dawn', 'date: 2026-06-01T06:15');

    await activityLog.checkListed('as: gardener', 'entry: dawn');
  });

  it('accepts a date after 2038', async () => {
    await activityLog.createEntry('as: gardener', 'entry: far-off', 'date: 2040-06-01T09:30:00');

    await activityLog.checkListed('as: gardener', 'entry: far-off');
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

  it.each([
    'no date',
    'an unparseable date',
    'a date in UTC',
    'a date with an offset',
    'a date with no time',
    'fractional seconds',
    'an hour that does not exist',
    'a second that does not exist',
    'a day that does not exist',
    'a date out of range',
    'no year',
    'a year that is not a number',
    'no activity type',
    'an activity type that is too long',
    'a subtype that is too long',
    'comments that are not a string',
    'comments that are too long',
    'an id that is too long',
  ])('rejects an entry with %s', async problem => {
    await activityLog.checkInvalidEntryIsRejected('as: gardener', `problem: ${problem}`);
  });

  it('accepts an entry as the app sends it', async () => {
    await activityLog.checkEntryAsTheAppSendsItIsAccepted('as: gardener');
  });

  it('rejects listing a year that is not a number', async () => {
    await activityLog.checkYearMustBeANumber('as: gardener');
  });
});
