import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectBodyToHaveKeys,
  expectListEntries,
  expectRejection,
  expectStatus,
  expectThat
} from './assertions';
import { NewSchedule, NewScheduleItem, tooLong, withoutField } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedSchedule, CreatedScheduleItem, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

/** Ways a new schedule can be wrong. Each is a test of its own. */
export const NEW_SCHEDULE_PROBLEMS = [
  'no name',
  'a blank name',
  'a name that is too long',
  'a description that is not a string',
] as const;

export type NewScheduleProblem = (typeof NEW_SCHEDULE_PROBLEMS)[number];

const invalidSchedules: Record<NewScheduleProblem, { body: (good: NewSchedule) => object, reason: string }> = {
  'no name': { body: good => withoutField(good, 'name'), reason: 'name is required', },
  'a blank name': { body: good => ({ ...good, name: '  ', }), reason: 'name is required', },
  'a name that is too long': { body: good => ({ ...good, name: tooLong(255), }), reason: 'name must be at most 255 characters', },
  'a description that is not a string': {
    body: good => ({ ...good, description: 42, }),
    reason: 'description must be a string',
  },
};

/** Ways a schedule update can be wrong. PATCH writes every field today, so the name is required. */
export const SCHEDULE_UPDATE_PROBLEMS = [ 'a blank name', 'a name that is not a string', ] as const;

export type ScheduleUpdateProblem = (typeof SCHEDULE_UPDATE_PROBLEMS)[number];

const invalidScheduleUpdates: Record<ScheduleUpdateProblem, { body: object, reason: string }> = {
  // a PATCH may leave the name out, and it's kept; sent, it can't be blank
  'a blank name': { body: { name: '', }, reason: 'name is required', },
  'a name that is not a string': { body: { name: 42, }, reason: 'name must be a string', },
};

/** Ways a new schedule item can be wrong. Each is a test of its own. */
export const NEW_ITEM_PROBLEMS = [
  'no activity type',
  'a start date that is not a month and day',
  'a start date that does not exist',
  'a year offset out of range',
  'a year offset that is not a number',
  'a recurrence rule that is too long',
] as const;

export type NewItemProblem = (typeof NEW_ITEM_PROBLEMS)[number];

const invalidItems: Record<NewItemProblem, { body: (good: NewScheduleItem) => object, reason: string }> = {
  'no activity type': { body: good => withoutField(good, 'activityType'), reason: 'activityType is required', },
  'a start date that is not a month and day': {
    body: good => ({ ...good, startDate: '2026-05-01', }),
    reason: 'startDate must be a month and day, as MM-DD',
  },
  'a start date that does not exist': {
    body: good => ({ ...good, startDate: '13-01', }),
    reason: 'startDate must be a month and day, as MM-DD',
  },
  // the app's offsets are -1, 0 and 1: the previous, current and next year
  'a year offset out of range': {
    body: good => ({ ...good, startDateYearOffset: 2, }),
    reason: 'startDateYearOffset must be at most 1',
  },
  'a year offset that is not a number': {
    body: good => ({ ...good, endDateYearOffset: 'next', }),
    reason: 'endDateYearOffset must be an integer',
  },
  'a recurrence rule that is too long': {
    body: good => ({ ...good, recurrenceRule: tooLong(255), }),
    reason: 'recurrenceRule must be at most 255 characters',
  },
};

/** Ways an item update can be wrong. PATCH writes every field today, so the type is required. */
export const ITEM_UPDATE_PROBLEMS = [ 'a blank activity type', 'an end date that is not a month and day', ] as const;

export type ItemUpdateProblem = (typeof ITEM_UPDATE_PROBLEMS)[number];

const invalidItemUpdates: Record<ItemUpdateProblem, { body: object, reason: string }> = {
  // a PATCH may leave the type out, and it's kept; sent, it can't be blank
  'a blank activity type': { body: { activityType: ' ', }, reason: 'activityType is required', },
  'an end date that is not a month and day': {
    body: { activityType: 'WATER', endDate: 'September', },
    reason: 'endDate must be a month and day, as MM-DD',
  },
};

export interface ActivitySchedulesDriver {
  createSchedule(caller: Actor, input: NewSchedule): Promise<CreatedSchedule>,
  getReturnsSchedule(caller: Actor, schedule: CreatedSchedule): Promise<void>,
  getIsNotFoundFor(caller: Actor): Promise<void>,
  listIncludes(caller: Actor, schedule: CreatedSchedule): Promise<void>,
  updateChanges(caller: Actor, schedule: CreatedSchedule, changes: NewSchedule): Promise<CreatedSchedule>,
  /** A PATCH of the name alone: the description is kept. */
  updateOfNameKeepsDescription(caller: Actor, schedule: CreatedSchedule, name: string): Promise<void>,
  /** A PATCH sending the description as null: it's cleared. */
  updateClearsDescription(caller: Actor, schedule: CreatedSchedule): Promise<void>,
  /** A PATCH of an item's notes alone: every other field is kept. */
  updateOfItemNotesKeepsTheRest(caller: Actor, item: CreatedScheduleItem): Promise<void>,
  addItem(caller: Actor, schedule: CreatedSchedule, input: NewScheduleItem): Promise<CreatedScheduleItem>,
  getShowsItem(caller: Actor, item: CreatedScheduleItem, activityType: string): Promise<void>,
  getShowsNoItems(caller: Actor, schedule: CreatedSchedule): Promise<void>,
  updateItemChangesType(caller: Actor, item: CreatedScheduleItem, activityType: string): Promise<void>,
  /** Rejected, and the item is unchanged. */
  updateItemThroughAnotherScheduleIsRejectedAsNotFound(
    caller: Actor,
    item: CreatedScheduleItem,
    other: CreatedSchedule,
    activityType: string
  ): Promise<void>,
  updateOfUnknownItemIsRejectedAsNotFound(caller: Actor, schedule: CreatedSchedule): Promise<void>,
  deleteRemovesItem(caller: Actor, item: CreatedScheduleItem): Promise<void>,
  deleteRemovesSchedule(caller: Actor, schedule: CreatedSchedule): Promise<void>,
  createOfInvalidScheduleIsRejectedAsBadRequest(caller: Actor, good: NewSchedule, problem: NewScheduleProblem): Promise<void>,
  updateOfInvalidScheduleIsRejectedAsBadRequest(caller: Actor, schedule: CreatedSchedule, problem: ScheduleUpdateProblem): Promise<void>,
  addOfInvalidItemIsRejectedAsBadRequest(
    caller: Actor,
    schedule: CreatedSchedule,
    good: NewScheduleItem,
    problem: NewItemProblem
  ): Promise<void>,
  updateOfInvalidItemIsRejectedAsBadRequest(caller: Actor, item: CreatedScheduleItem, problem: ItemUpdateProblem): Promise<void>,
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

    async updateOfNameKeepsDescription(caller: Actor, schedule: CreatedSchedule, name: string): Promise<void> {
      const what = `updating only the name of schedule "${schedule.name}"`;
      const response = await as(caller).patch(schedulePath(schedule.activityScheduleId), { name, });

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { name, description: schedule.description, }, what);
      expectBodyToContain(
        await get(caller, schedule.activityScheduleId, `${what}: re-reading it`),
        { name, description: schedule.description, },
        what
      );
    },

    async updateClearsDescription(caller: Actor, schedule: CreatedSchedule): Promise<void> {
      const what = `clearing the description of schedule "${schedule.name}"`;
      const response = await as(caller).patch(schedulePath(schedule.activityScheduleId), { description: null, });

      expectStatus(response, status.OK, what);
      expectBodyToContain(
        await get(caller, schedule.activityScheduleId, `${what}: re-reading it`),
        { name: schedule.name, description: null, },
        what
      );
    },

    async updateOfItemNotesKeepsTheRest(caller: Actor, item: CreatedScheduleItem): Promise<void> {
      const what = `updating only the notes of item ${item.entryId}`;
      const itemOf = (response: ApiResponse): Record<string, unknown> | undefined =>
        itemsIn(response).find(each => each.entryId === item.entryId);
      const before = itemOf(await get(caller, item.activityScheduleId, `${what}: reading it first`));
      const notes = 'Changed by a partial update';

      expectStatus(await as(caller).patch(itemPath(item), { notes, }), status.OK, what);

      const response = await get(caller, item.activityScheduleId, `${what}: re-reading it`);
      const after = itemOf(response);

      expectThat(
        before !== undefined && after !== undefined && after.notes === notes
          && Object.keys(before).every(key => key === 'notes' || after[key] === before[key]),
        `the item as it was, but with notes "${notes}": ${JSON.stringify(before)}`,
        response,
        what
      );
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

    async updateItemThroughAnotherScheduleIsRejectedAsNotFound(
      caller: Actor,
      item: CreatedScheduleItem,
      other: CreatedSchedule,
      activityType: string
    ): Promise<void> {
      const what = `updating item ${item.entryId} through schedule "${other.name}", which does not hold it`;
      const path = `${schedulePath(other.activityScheduleId)}/schedule-items/${item.entryId}`;

      expectStatus(await as(caller).patch(path, { activityType, }), status.NOT_FOUND, what);

      const response = await get(caller, item.activityScheduleId, `${what}: re-reading its own schedule`);

      expectThat(
        itemsIn(response).some(each => each.entryId === item.entryId && each.activityType !== activityType),
        `the item, not ${activityType}`,
        response,
        what
      );
    },

    async updateOfUnknownItemIsRejectedAsNotFound(caller: Actor, schedule: CreatedSchedule): Promise<void> {
      const what = `updating an item that does not exist on schedule "${schedule.name}"`;
      const path = `${schedulePath(schedule.activityScheduleId)}/schedule-items/no-such-item`;

      expectStatus(await as(caller).patch(path, { activityType: 'WATER', }), status.NOT_FOUND, what);
    },

    async deleteRemovesItem(caller: Actor, item: CreatedScheduleItem): Promise<void> {
      const what = `deleting item ${item.entryId}`;

      expectStatus(await as(caller).del(itemPath(item)), status.NO_CONTENT, what);

      const response = await get(caller, item.activityScheduleId, `${what}: re-reading its schedule`);

      expectThat(!itemsIn(response).some(each => each.entryId === item.entryId), 'no such item', response, what);
    },

    async createOfInvalidScheduleIsRejectedAsBadRequest(
      caller: Actor,
      good: NewSchedule,
      problem: NewScheduleProblem
    ): Promise<void> {
      const { body, reason, } = invalidSchedules[problem];
      const response = await as(caller).post('/activity-schedules', body(good));

      if (response.status === status.CREATED) {
        const { activityScheduleId, } = response.body as { activityScheduleId: string };
        registry.register({ kind: 'activity schedule', path: schedulePath(activityScheduleId), label: good.name, });
      }
      expectRejection(response, status.BAD_REQUEST, reason, `creating a schedule with ${problem}`);
    },

    async updateOfInvalidScheduleIsRejectedAsBadRequest(
      caller: Actor,
      schedule: CreatedSchedule,
      problem: ScheduleUpdateProblem
    ): Promise<void> {
      const { body, reason, } = invalidScheduleUpdates[problem];

      expectRejection(
        await as(caller).patch(schedulePath(schedule.activityScheduleId), body),
        status.BAD_REQUEST,
        reason,
        `updating schedule "${schedule.name}" with ${problem}`
      );
    },

    async addOfInvalidItemIsRejectedAsBadRequest(
      caller: Actor,
      schedule: CreatedSchedule,
      good: NewScheduleItem,
      problem: NewItemProblem
    ): Promise<void> {
      const { body, reason, } = invalidItems[problem];

      // an item wrongly added goes with its schedule, which the spec made and tears down
      expectRejection(
        await as(caller).post(`${schedulePath(schedule.activityScheduleId)}/schedule-items`, body(good)),
        status.BAD_REQUEST,
        reason,
        `adding an item with ${problem} to schedule "${schedule.name}"`
      );
    },

    async updateOfInvalidItemIsRejectedAsBadRequest(
      caller: Actor,
      item: CreatedScheduleItem,
      problem: ItemUpdateProblem
    ): Promise<void> {
      const { body, reason, } = invalidItemUpdates[problem];

      expectRejection(
        await as(caller).patch(itemPath(item), body),
        status.BAD_REQUEST,
        reason,
        `updating item ${item.entryId} with ${problem}`
      );
    },

    async deleteRemovesSchedule(caller: Actor, schedule: CreatedSchedule): Promise<void> {
      const what = `deleting schedule "${schedule.name}"`;

      expectStatus(await as(caller).del(schedulePath(schedule.activityScheduleId)), status.NO_CONTENT, what);
      expectStatus(await as(caller).get(schedulePath(schedule.activityScheduleId)), status.NOT_FOUND, `${what}: re-reading it`);
    },
  };
}
