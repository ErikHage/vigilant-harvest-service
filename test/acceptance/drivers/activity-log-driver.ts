import { Actor } from '../support/actors';
import { expectBodyToContain, expectListEntries, expectRejection, expectStatus, expectThat } from './assertions';
import { NewActivityLogEntry } from '../support/fixtures';
import { HttpClient } from '../support/http-client';
import { CreatedActivityLogEntry, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

export interface ActivityLogDriver {
  createEntry(caller: Actor, input: NewActivityLogEntry): Promise<CreatedActivityLogEntry>,
  updateChangesComments(caller: Actor, entry: CreatedActivityLogEntry, comments: string): Promise<CreatedActivityLogEntry>,
  listIncludes(caller: Actor, entry: CreatedActivityLogEntry): Promise<void>,
  listForNonNumericYearFailsWithServerError(caller: Actor): Promise<void>,
  createWithoutDateFailsWithServerError(caller: Actor, plantingYear: number): Promise<void>,
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

    async listForNonNumericYearFailsWithServerError(caller: Actor): Promise<void> {
      expectStatus(await as(caller).get('/activity-log/not-a-year'), status.INTERNAL_SERVER_ERROR, 'listing a year that is not a number');
    },

    async createWithoutDateFailsWithServerError(caller: Actor, plantingYear: number): Promise<void> {
      const response = await as(caller).put('/activity-log', { plantingYear, activityType: 'WATER', comments: 'No date', });

      expectStatus(response, status.INTERNAL_SERVER_ERROR, 'logging an activity with no date');
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
