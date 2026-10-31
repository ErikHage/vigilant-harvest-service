import { Actor } from '../support/actors';
import { expectBodyToContain, expectBodyToHaveKeys, expectListEntries, expectStatus, expectThat } from './assertions';
import { NewSchedule, NewScheduleItem } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedSchedule, CreatedScheduleItem, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

export interface ActivitySchedulesDriver {
  createSchedule(caller: Actor, input: NewSchedule): Promise<CreatedSchedule>,
  getReturnsSchedule(caller: Actor, schedule: CreatedSchedule): Promise<void>,
  getIsNotFoundFor(caller: Actor): Promise<void>,
  listIncludes(caller: Actor, schedule: CreatedSchedule): Promise<void>,
  updateChanges(caller: Actor, schedule: CreatedSchedule, changes: NewSchedule): Promise<CreatedSchedule>,
  updateOfNameBlanksDescription(caller: Actor, schedule: CreatedSchedule, name: string): Promise<void>,
  addItem(caller: Actor, schedule: CreatedSchedule, input: NewScheduleItem): Promise<CreatedScheduleItem>,
  getShowsItem(caller: Actor, item: CreatedScheduleItem, activityType: string): Promise<void>,
  getShowsNoItems(caller: Actor, schedule: CreatedSchedule): Promise<void>,
  updateItemChangesType(caller: Actor, item: CreatedScheduleItem, activityType: string): Promise<void>,
  updateItemThroughAnotherScheduleStillUpdates(
    caller: Actor,
    item: CreatedScheduleItem,
    other: CreatedSchedule,
    activityType: string
  ): Promise<void>,
  deleteRemovesItem(caller: Actor, item: CreatedScheduleItem): Promise<void>,
  deleteRemovesSchedule(caller: Actor, schedule: CreatedSchedule): Promise<void>,
}

export function createActivitySchedulesDriver(client: HttpClient, registry: ResourceRegistry): ActivitySchedulesDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  const schedulePath = (activityScheduleId: string): string => `/activity-schedules/${activityScheduleId}`;
  const itemPath = (item: CreatedScheduleItem): string =>
    `${schedulePath(item.activityScheduleId)}/schedule-items/${item.entryId}`;

  async function get(caller: Actor, activityScheduleId: string, what: string): Promise<ApiResponse> {
    const response = await as(caller).get(schedulePath(activityScheduleId));

    expectStatus(response, status.OK, what);

    return response;
  }

  const itemsIn = (response: ApiResponse): Record<string, unknown>[] =>
    (response.body as { items: Record<string, unknown>[] }).items;

  return {
    async createSchedule(caller: Actor, input: NewSchedule): Promise<CreatedSchedule> {
      const what = `creating schedule "${input.name}"`;
      const response = await as(caller).post('/activity-schedules', input);

      expectStatus(response, status.CREATED, what);
      expectBodyToHaveKeys(response, [ 'activityScheduleId', ], what);

      const { activityScheduleId, } = response.body as { activityScheduleId: string };

      registry.register({ kind: 'activity schedule', path: schedulePath(activityScheduleId), label: input.name, });
      expectBodyToContain(response, { ...input, items: [], }, what);

      return { activityScheduleId, ...input, };
    },

    async getReturnsSchedule(caller: Actor, schedule: CreatedSchedule): Promise<void> {
      const what = `reading schedule "${schedule.name}"`;
      const { name, description, } = schedule;

      expectBodyToContain(await get(caller, schedule.activityScheduleId, what), { name, description, }, what);
    },

    async getIsNotFoundFor(caller: Actor): Promise<void> {
      expectStatus(await as(caller).get(schedulePath('no-such-schedule')), status.NOT_FOUND, 'reading a schedule that does not exist');
    },

    async listIncludes(caller: Actor, schedule: CreatedSchedule): Promise<void> {
      const what = `finding schedule "${schedule.name}" in the list`;
      const response = await as(caller).get('/activity-schedules');

      expectStatus(response, status.OK, what);
      expectThat(
        expectListEntries(response, what).some(entry => entry.activityScheduleId === schedule.activityScheduleId),
        'the schedule listed',
        response,
        what
      );
    },

    async updateChanges(caller: Actor, schedule: CreatedSchedule, changes: NewSchedule): Promise<CreatedSchedule> {
      const what = `updating schedule "${schedule.name}"`;
      const response = await as(caller).patch(schedulePath(schedule.activityScheduleId), changes);

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { ...changes, }, what);

      return { ...schedule, ...changes, };
    },

    async updateOfNameBlanksDescription(caller: Actor, schedule: CreatedSchedule, name: string): Promise<void> {
      const what = `updating only the name of schedule "${schedule.name}"`;
      const response = await as(caller).patch(schedulePath(schedule.activityScheduleId), { name, });

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { name, description: null, }, what);
    },

    async addItem(caller: Actor, schedule: CreatedSchedule, input: NewScheduleItem): Promise<CreatedScheduleItem> {
      const what = `adding an item to schedule "${schedule.name}"`;
      const response = await as(caller).post(`${schedulePath(schedule.activityScheduleId)}/schedule-items`, input);

      expectStatus(response, status.CREATED, what);
      expectBodyToHaveKeys(response, [ 'entryId', ], what);

      const { entryId, } = response.body as { entryId: string };

      return { activityScheduleId: schedule.activityScheduleId, entryId, };
    },

    async getShowsItem(caller: Actor, item: CreatedScheduleItem, activityType: string): Promise<void> {
      const what = `finding item ${item.entryId} on its schedule`;
      const response = await get(caller, item.activityScheduleId, what);

      expectThat(
        itemsIn(response).some(each => each.entryId === item.entryId && each.activityType === activityType),
        `the item, as ${activityType}`,
        response,
        what
      );
    },

    async getShowsNoItems(caller: Actor, schedule: CreatedSchedule): Promise<void> {
      const what = `reading the items of schedule "${schedule.name}"`;
      const response = await get(caller, schedule.activityScheduleId, what);

      expectThat(itemsIn(response).length === 0, 'no items', response, what);
    },

    async updateItemChangesType(caller: Actor, item: CreatedScheduleItem, activityType: string): Promise<void> {
      const what = `updating item ${item.entryId}`;
      const response = await as(caller).patch(itemPath(item), { activityType, startDateYearOffset: 0, endDateYearOffset: 0, });

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { activityType, }, what);
    },

    async updateItemThroughAnotherScheduleStillUpdates(
      caller: Actor,
      item: CreatedScheduleItem,
      other: CreatedSchedule,
      activityType: string
    ): Promise<void> {
      const what = `updating item ${item.entryId} through schedule "${other.name}", which does not hold it`;
      const path = `${schedulePath(other.activityScheduleId)}/schedule-items/${item.entryId}`;
      const response = await as(caller).patch(path, { activityType, startDateYearOffset: 0, endDateYearOffset: 0, });

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { activityType, activityScheduleId: item.activityScheduleId, }, what);
    },

    async deleteRemovesItem(caller: Actor, item: CreatedScheduleItem): Promise<void> {
      const what = `deleting item ${item.entryId}`;

      expectStatus(await as(caller).del(itemPath(item)), status.NO_CONTENT, what);

      const response = await get(caller, item.activityScheduleId, `${what}: re-reading its schedule`);

      expectThat(!itemsIn(response).some(each => each.entryId === item.entryId), 'no such item', response, what);
    },

    async deleteRemovesSchedule(caller: Actor, schedule: CreatedSchedule): Promise<void> {
      const what = `deleting schedule "${schedule.name}"`;

      expectStatus(await as(caller).del(schedulePath(schedule.activityScheduleId)), status.NO_CONTENT, what);
      expectStatus(await as(caller).get(schedulePath(schedule.activityScheduleId)), status.NOT_FOUND, `${what}: re-reading it`);
    },
  };
}
