import { Actor } from '../support/actors';
import { expectBodyToContain, expectListEntries, expectRejection, expectStatus, expectThat } from './assertions';
import { NewJournalEntry, tooLong, withoutField } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedJournalEntry, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

/** Ways a journal entry can be wrong. Each is a test of its own. */
export const JOURNAL_ENTRY_PROBLEMS = [
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
  'text that is not a string',
  'text that is too long',
  'an id that is too long',
] as const;

export type JournalEntryProblem = (typeof JOURNAL_ENTRY_PROBLEMS)[number];

const NOT_LOCAL = 'entryDate must be a local time, with no Z or offset';
const NOT_DATE_TIME = 'entryDate must be a date and time, as YYYY-MM-DDTHH:mm:ss';

/** For each problem: a good entry made bad, and the reason the service gives. */
const invalidEntries: Record<JournalEntryProblem, { body: (good: NewJournalEntry) => object, reason: string }> = {
  'no date': { body: good => withoutField(good, 'entryDate'), reason: 'entryDate is required', },
  'an unparseable date': { body: good => ({ ...good, entryDate: 'not-a-date', }), reason: 'entryDate must be a date', },
  // an entry is written at the user's own wall-clock time, so an instant is refused rather than guessed at
  'a date in UTC': { body: good => ({ ...good, entryDate: '2026-06-01T13:30:00.000Z', }), reason: NOT_LOCAL, },
  'a date with an offset': { body: good => ({ ...good, entryDate: '2026-06-01T09:30:00-04:00', }), reason: NOT_LOCAL, },
  'a date with no time': { body: good => ({ ...good, entryDate: '2026-06-01', }), reason: NOT_DATE_TIME, },
  'fractional seconds': { body: good => ({ ...good, entryDate: '2026-06-01T09:30:00.000', }), reason: NOT_DATE_TIME, },
  'an hour that does not exist': { body: good => ({ ...good, entryDate: '2026-06-01T24:00:00', }), reason: NOT_DATE_TIME, },
  'a second that does not exist': { body: good => ({ ...good, entryDate: '2026-06-01T09:30:60', }), reason: NOT_DATE_TIME, },
  'a day that does not exist': { body: good => ({ ...good, entryDate: '2026-02-30T09:30:00', }), reason: NOT_DATE_TIME, },
  // entryDate is a TIMESTAMP column, which holds 1970 to 2038
  'a date out of range': {
    body: good => ({ ...good, entryDate: '1960-06-01T09:30:00', }),
    reason: 'entryDate must be between 1971 and 2037',
  },
  'no year': { body: good => withoutField(good, 'plantingYear'), reason: 'plantingYear is required', },
  'a year that is not a number': {
    body: good => ({ ...good, plantingYear: 'abc', }),
    reason: 'plantingYear must be an integer',
  },
  'text that is not a string': { body: good => ({ ...good, entry: 42, }), reason: 'entry must be a string', },
  // entry is a TEXT column, which holds 65,535 bytes
  'text that is too long': {
    body: good => ({ ...good, entry: tooLong(65535), }),
    reason: 'entry must be at most 65535 bytes',
  },
  'an id that is too long': {
    body: good => ({ ...good, entryId: tooLong(36), }),
    reason: 'entryId must be at most 36 characters',
  },
};

export interface JournalDriver {
  createEntry(caller: Actor, input: NewJournalEntry): Promise<CreatedJournalEntry>,
  updateChangesEntry(caller: Actor, entry: CreatedJournalEntry, text: string): Promise<CreatedJournalEntry>,
  listIncludes(caller: Actor, entry: CreatedJournalEntry): Promise<void>,
  listForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void>,
  createOfInvalidEntryIsRejectedAsBadRequest(caller: Actor, good: NewJournalEntry, problem: JournalEntryProblem): Promise<void>,
  createOfEntryAsTheAppSendsItSucceeds(caller: Actor, plantingYear: number): Promise<void>,
  createInUnknownYearIsRejectedAsBadRequest(caller: Actor, input: NewJournalEntry): Promise<void>,
  deleteRemovesEntry(caller: Actor, entry: CreatedJournalEntry): Promise<void>,
}

export function createJournalDriver(client: HttpClient, registry: ResourceRegistry): JournalDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function list(caller: Actor, plantingYear: number, what: string) {
    const response = await as(caller).get(`/journal/${plantingYear}`);

    expectStatus(response, status.OK, what);

    return { response, entries: expectListEntries(response, what), };
  }

  /** Files an entry for teardown if a write made one, before anything asserts on it. */
  function registerIfCreated(response: ApiResponse, label: string): void {
    if (response.status === status.CREATED) {
      const { entryId, } = response.body as { entryId: string };
      registry.register({ kind: 'journal entry', path: `/journal/entries/${entryId}`, label, });
    }
  }

  return {
    async createEntry(caller: Actor, input: NewJournalEntry): Promise<CreatedJournalEntry> {
      const what = `writing a journal entry in ${input.plantingYear}`;
      const response = await as(caller).put('/journal', input);

      expectStatus(response, status.CREATED, what);

      const { entryId, } = response.body as { entryId: string };

      registry.register({ kind: 'journal entry', path: `/journal/entries/${entryId}`, label: input.entry, });

      return { entryId, plantingYear: input.plantingYear, entry: input.entry, };
    },

    async updateChangesEntry(caller: Actor, entry: CreatedJournalEntry, text: string): Promise<CreatedJournalEntry> {
      const what = `updating journal entry ${entry.entryId}`;
      const response = await as(caller).put('/journal', {
        entryId: entry.entryId,
        plantingYear: entry.plantingYear,
        entry: text,
        entryDate: '2026-06-02T18:45:00',
      });

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { entry: text, }, what);

      return { ...entry, entry: text, };
    },

    async listIncludes(caller: Actor, entry: CreatedJournalEntry): Promise<void> {
      const what = `finding journal entry ${entry.entryId} in its year`;
      const { response, entries, } = await list(caller, entry.plantingYear, what);

      expectThat(
        entries.some(each => each.entryId === entry.entryId && each.entry === entry.entry),
        'the entry, with its text',
        response,
        what
      );
    },

    async listForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void> {
      expectRejection(
        await as(caller).get('/journal/not-a-year'),
        status.BAD_REQUEST,
        'plantingYear must be an integer',
        'listing a year that is not a number'
      );
    },

    async createOfInvalidEntryIsRejectedAsBadRequest(
      caller: Actor,
      good: NewJournalEntry,
      problem: JournalEntryProblem
    ): Promise<void> {
      const { body, reason, } = invalidEntries[problem];
      const response = await as(caller).put('/journal', body(good));

      registerIfCreated(response, `an entry with ${problem}`);
      expectRejection(response, status.BAD_REQUEST, reason, `writing a journal entry with ${problem}`);
    },

    async createOfEntryAsTheAppSendsItSucceeds(caller: Actor, plantingYear: number): Promise<void> {
      const what = 'writing a journal entry as the app sends it';
      // The app's year can be a string, its date is the local wall-clock time to the second, and its
      // text can be empty.
      const response = await as(caller).put('/journal', {
        plantingYear: String(plantingYear),
        entryDate: '2026-06-01T13:00:00',
        entry: '',
      });

      registerIfCreated(response, 'an entry as the app sends it');
      expectStatus(response, status.CREATED, what);
      expectBodyToContain(response, { plantingYear, entry: '', }, what);
    },

    async createInUnknownYearIsRejectedAsBadRequest(caller: Actor, input: NewJournalEntry): Promise<void> {
      const what = 'writing a journal entry in a year that does not exist';

      expectRejection(await as(caller).put('/journal', input), status.BAD_REQUEST, 'referenced row does not exist', what);
    },

    async deleteRemovesEntry(caller: Actor, entry: CreatedJournalEntry): Promise<void> {
      const what = `deleting journal entry ${entry.entryId}`;

      expectStatus(await as(caller).del(`/journal/entries/${entry.entryId}`), status.OK, what);

      const { response, entries, } = await list(caller, entry.plantingYear, `${what}: re-reading the year`);

      expectThat(!entries.some(each => each.entryId === entry.entryId), 'no such entry', response, what);
    },
  };
}
