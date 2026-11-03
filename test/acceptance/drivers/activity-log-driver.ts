import { Actor } from '../support/actors';
import { expectBodyToContain, expectListEntries, expectRejection, expectStatus, expectThat } from './assertions';
import { NewActivityLogEntry, tooLong, withoutField } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedActivityLogEntry, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

/** Ways an activity log entry can be wrong. Each is a test of its own. */
export const ACTIVITY_LOG_ENTRY_PROBLEMS = [
  'no date',
  'an unparseable date',
  'a date out of range',
  'no year',
  'a year that is not a number',
  'no activity type',
  'an activity type that is too long',
  'a subtype that is too long',
  'comments that are not a string',
  'comments that are too long',
  'an id that is too long',
] as const;

export type ActivityLogEntryProblem = (typeof ACTIVITY_LOG_ENTRY_PROBLEMS)[number];

/** For each problem: a good entry made bad, and the reason the service gives. */
const invalidEntries: Record<ActivityLogEntryProblem, { body: (good: NewActivityLogEntry) => object, reason: string }> = {
  'no date': { body: good => withoutField(good, 'entryDate'), reason: 'entryDate is required', },
  'an unparseable date': { body: good => ({ ...good, entryDate: 'not-a-date', }), reason: 'entryDate must be a date', },
  // entryDate is a TIMESTAMP column, which holds 1970 to 2038
  'a date out of range': {
    body: good => ({ ...good, entryDate: '1960-06-01', }),
    reason: 'entryDate must be between 1971 and 2037',
  },
  'no year': { body: good => withoutField(good, 'plantingYear'), reason: 'plantingYear is required', },
  'a year that is not a number': {
    body: good => ({ ...good, plantingYear: 'abc', }),
    reason: 'plantingYear must be an integer',
  },
  'no activity type': { body: good => withoutField(good, 'activityType'), reason: 'activityType is required', },
  'an activity type that is too long': {
    body: good => ({ ...good, activityType: tooLong(255), }),
    reason: 'activityType must be at most 255 characters',
  },
  'a subtype that is too long': {
    body: good => ({ ...good, subType: tooLong(255), }),
    reason: 'subType must be at most 255 characters',
  },
  'comments that are not a string': { body: good => ({ ...good, comments: 42, }), reason: 'comments must be a string', },
  // comments is a TEXT column, which holds 65,535 bytes
  'comments that are too long': {
    body: good => ({ ...good, comments: tooLong(65535), }),
    reason: 'comments must be at most 65535 bytes',
  },
  'an id that is too long': {
    body: good => ({ ...good, entryId: tooLong(36), }),
    reason: 'entryId must be at most 36 characters',
  },
};

export interface ActivityLogDriver {
  createEntry(caller: Actor, input: NewActivityLogEntry): Promise<CreatedActivityLogEntry>,
  updateChangesComments(caller: Actor, entry: CreatedActivityLogEntry, comments: string): Promise<CreatedActivityLogEntry>,
  listIncludes(caller: Actor, entry: CreatedActivityLogEntry): Promise<void>,
  listForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void>,
  createOfInvalidEntryIsRejectedAsBadRequest(
    caller: Actor,
    good: NewActivityLogEntry,
    problem: ActivityLogEntryProblem
  ): Promise<void>,
  createOfEntryAsTheAppSendsItSucceeds(caller: Actor, plantingYear: number): Promise<void>,
  createInUnknownYearIsRejectedAsBadRequest(caller: Actor, input: NewActivityLogEntry): Promise<void>,
  deleteRemovesEntry(caller: Actor, entry: CreatedActivityLogEntry): Promise<void>,
}

export function createActivityLogDriver(client: HttpClient, registry: ResourceRegistry): ActivityLogDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function list(caller: Actor, plantingYear: number, what: string) {
    const response = await as(caller).get(`/activity-log/${plantingYear}`);

    expectStatus(response, status.OK, what);

    return { response, entries: expectListEntries(response, what), };
  }

  /** Files an entry for teardown if a write made one, before anything asserts on it. */
  function registerIfCreated(response: ApiResponse, label: string): void {
    if (response.status === status.CREATED) {
      const { entryId, } = response.body as { entryId: string };
      registry.register({ kind: 'activity log entry', path: `/activity-log/entries/${entryId}`, label, });
    }
  }

  return {
    async createEntry(caller: Actor, input: NewActivityLogEntry): Promise<CreatedActivityLogEntry> {
      const what = `logging an activity in ${input.plantingYear}`;
      const response = await as(caller).put('/activity-log', input);

      expectStatus(response, status.CREATED, what);

      const { entryId, } = response.body as { entryId: string };

      registry.register({ kind: 'activity log entry', path: `/activity-log/entries/${entryId}`, label: input.comments, });

      return { entryId, plantingYear: input.plantingYear, comments: input.comments, };
    },

    async updateChangesComments(
      caller: Actor,
      entry: CreatedActivityLogEntry,
      comments: string
    ): Promise<CreatedActivityLogEntry> {
      const what = `updating activity log entry ${entry.entryId}`;
      const response = await as(caller).put('/activity-log', {
        entryId: entry.entryId,
        plantingYear: entry.plantingYear,
        entryDate: '2026-06-02',
        activityType: 'WEED',
        comments,
      });

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { comments, }, what);

      return { ...entry, comments, };
    },

    async listIncludes(caller: Actor, entry: CreatedActivityLogEntry): Promise<void> {
      const what = `finding activity log entry ${entry.entryId} in its year`;
      const { response, entries, } = await list(caller, entry.plantingYear, what);

      expectThat(
        entries.some(each => each.entryId === entry.entryId && each.comments === entry.comments),
        'the entry, with its comments',
        response,
        what
      );
    },

    async listForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void> {
      expectRejection(
        await as(caller).get('/activity-log/not-a-year'),
        status.BAD_REQUEST,
        'plantingYear must be an integer',
        'listing a year that is not a number'
      );
    },

    async createOfInvalidEntryIsRejectedAsBadRequest(
      caller: Actor,
      good: NewActivityLogEntry,
      problem: ActivityLogEntryProblem
    ): Promise<void> {
      const { body, reason, } = invalidEntries[problem];
      const response = await as(caller).put('/activity-log', body(good));

      registerIfCreated(response, `an entry with ${problem}`);
      expectRejection(response, status.BAD_REQUEST, reason, `logging an activity with ${problem}`);
    },

    async createOfEntryAsTheAppSendsItSucceeds(caller: Actor, plantingYear: number): Promise<void> {
      const what = 'logging an activity as the app sends it';
      // The app's year can be a string, its date is toISOString(), a subtype left unpicked is null,
      // and its comments can be empty.
      const response = await as(caller).put('/activity-log', {
        plantingYear: String(plantingYear),
        entryDate: '2026-06-01T17:00:00.000Z',
        activityType: 'WATER',
        subType: null,
        comments: '',
      });

      registerIfCreated(response, 'an entry as the app sends it');
      expectStatus(response, status.CREATED, what);
      expectBodyToContain(response, { plantingYear, subType: null, comments: '', }, what);
    },

    async createInUnknownYearIsRejectedAsBadRequest(caller: Actor, input: NewActivityLogEntry): Promise<void> {
      const what = 'logging an activity in a year that does not exist';

      expectRejection(await as(caller).put('/activity-log', input), status.BAD_REQUEST, 'referenced row does not exist', what);
    },

    async deleteRemovesEntry(caller: Actor, entry: CreatedActivityLogEntry): Promise<void> {
      const what = `deleting activity log entry ${entry.entryId}`;

      expectStatus(await as(caller).del(`/activity-log/entries/${entry.entryId}`), status.OK, what);

      const { response, entries, } = await list(caller, entry.plantingYear, `${what}: re-reading the year`);

      expectThat(!entries.some(each => each.entryId === entry.entryId), 'no such entry', response, what);
    },
  };
}
