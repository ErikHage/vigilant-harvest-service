import { Actor } from '../support/actors';
import { expectBodyToContain, expectListEntries, expectRejection, expectStatus, expectThat } from './assertions';
import { NewJournalEntry } from '../support/fixtures';
import { HttpClient } from '../support/http-client';
import { CreatedJournalEntry, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

export interface JournalDriver {
  createEntry(caller: Actor, input: NewJournalEntry): Promise<CreatedJournalEntry>,
  updateChangesEntry(caller: Actor, entry: CreatedJournalEntry, text: string): Promise<CreatedJournalEntry>,
  listIncludes(caller: Actor, entry: CreatedJournalEntry): Promise<void>,
  listForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void>,
  createWithoutDateFailsWithServerError(caller: Actor, plantingYear: number): Promise<void>,
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
        entryDate: '2026-06-02',
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

    async createWithoutDateFailsWithServerError(caller: Actor, plantingYear: number): Promise<void> {
      const response = await as(caller).put('/journal', { plantingYear, entry: 'No date', });

      expectStatus(response, status.INTERNAL_SERVER_ERROR, 'writing a journal entry with no date');
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
