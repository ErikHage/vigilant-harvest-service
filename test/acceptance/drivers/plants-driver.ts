import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectBodyToHaveKeys,
  expectListEntries,
  expectRejection,
  expectStatus,
  expectThat
} from './assertions';
import { NewPlant } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedPlant, CreatedSchedule, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

export interface PlantsDriver {
  createPlant(caller: Actor, input: NewPlant): Promise<CreatedPlant>,
  getReturnsPlant(caller: Actor, plant: CreatedPlant): Promise<void>,
  getReturnsSowingValuesAsStrings(caller: Actor, plant: CreatedPlant): Promise<void>,
  getReportsDefaultHarvestType(caller: Actor, plant: CreatedPlant, harvestType: string): Promise<void>,
  getShowsSchedule(caller: Actor, plant: CreatedPlant, schedule: CreatedSchedule): Promise<void>,
  getShowsNoSchedules(caller: Actor, plant: CreatedPlant): Promise<void>,
  getIsNotFoundFor(caller: Actor): Promise<void>,
  listIncludes(caller: Actor, plant: CreatedPlant): Promise<void>,
  updateChanges(caller: Actor, plant: CreatedPlant, changes: Partial<NewPlant>): Promise<CreatedPlant>,
  assignSchedule(caller: Actor, plant: CreatedPlant, schedule: CreatedSchedule): Promise<void>,
  unassignSchedule(caller: Actor, plant: CreatedPlant, schedule: CreatedSchedule): Promise<void>,
  secondAssignmentIsRejectedAsConflict(caller: Actor, plant: CreatedPlant, schedule: CreatedSchedule): Promise<void>,
  assignmentWithoutListsFailsWithServerError(caller: Actor, plant: CreatedPlant): Promise<void>,
  createOfTakenNameIsRejectedAsBadRequest(caller: Actor, plant: CreatedPlant): Promise<void>,
  renameToTakenNameIsRejectedAsConflict(caller: Actor, plant: CreatedPlant, taken: CreatedPlant): Promise<void>,
  createWithUnknownIdAndTakenNameFailsWithNotFoundAndOverwrites(caller: Actor, plant: CreatedPlant): Promise<void>,
  createWithUnknownSubcategoryIsRejectedAsBadRequest(caller: Actor, input: NewPlant): Promise<void>,
  deleteOfPlantInUseIsRejectedAsConflict(caller: Actor, plant: CreatedPlant): Promise<void>,
  deleteRemovesPlant(caller: Actor, plant: CreatedPlant): Promise<void>,
}

export function createPlantsDriver(client: HttpClient, registry: ResourceRegistry): PlantsDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function get(caller: Actor, plant: CreatedPlant, what: string): Promise<ApiResponse> {
    const response = await as(caller).get(`/plants/${plant.plantId}`);

    expectStatus(response, status.OK, what);

    return response;
  }

  const scheduleIdsIn = (response: ApiResponse): unknown[] =>
    (response.body as { activitySchedules: { activityScheduleId: unknown }[] })
      .activitySchedules.map(schedule => schedule.activityScheduleId);

  return {
    async createPlant(caller: Actor, input: NewPlant): Promise<CreatedPlant> {
      const what = `creating plant "${input.friendlyName}"`;
      const response = await as(caller).put('/plants', input);

      expectStatus(response, status.CREATED, what);
      expectBodyToHaveKeys(response, [ 'plantId', ], what);

      const { plantId, } = response.body as { plantId: string };

      registry.register({ kind: 'plant', path: `/plants/${plantId}`, label: input.friendlyName, });
      expectBodyToContain(response, { friendlyName: input.friendlyName, subcategoryId: input.subcategoryId, }, what);

      return { plantId, friendlyName: input.friendlyName, input, };
    },

    async getReturnsPlant(caller: Actor, plant: CreatedPlant): Promise<void> {
      const what = `reading plant "${plant.friendlyName}"`;
      const response = await get(caller, plant, what);
      const { input, } = plant;
      const body = response.body as Record<string, Record<string, unknown>>;

      expectBodyToContain(response, {
        friendlyName: input.friendlyName,
        subcategoryId: input.subcategoryId,
        lifespanType: input.lifespanType,
        tags: input.tags,
        description: input.description,
        taxonomy: input.taxonomy,
        growing: input.growing,
      }, what);

      const { depthInInches, ...planting } = input.planting ?? {};
      const { indoor, direct, ...sowing } = input.sowing ?? {};

      // Compared apart from the three values that come back as strings, which
      // getReturnsSowingValuesAsStrings pins.
      expectThat(depthInInches !== undefined && indoor !== undefined && direct !== undefined, 'a plant with every detail', response, what);

      for (const [ group, expected, ] of [ [ 'planting', planting, ], [ 'sowing', sowing, ], [ 'harvesting', input.harvesting ?? {}, ], ] as const) {
        for (const [ key, value, ] of Object.entries(expected)) {
          expectThat(body[group]?.[key] === value, `${group}.${key} = ${JSON.stringify(value)}`, response, what);
        }
      }
    },

    async getReturnsSowingValuesAsStrings(caller: Actor, plant: CreatedPlant): Promise<void> {
      const what = `reading the sowing details of plant "${plant.friendlyName}"`;
      const response = await get(caller, plant, what);
      const body = response.body as { sowing: Record<string, unknown>, planting: Record<string, unknown> };

      expectThat(body.sowing.indoor === '1' && body.sowing.direct === '0', 'sowing flags of "1" and "0"', response, what);
      expectThat(body.planting.depthInInches === '0.25', 'a depth of "0.25"', response, what);
    },

    async getReportsDefaultHarvestType(caller: Actor, plant: CreatedPlant, harvestType: string): Promise<void> {
      const what = `reading the default harvest type of plant "${plant.friendlyName}"`;
      const response = await get(caller, plant, what);
      const { harvesting, } = response.body as { harvesting: { defaultHarvestType: unknown } };

      expectThat(harvesting.defaultHarvestType === harvestType, `a default of ${harvestType}`, response, what);
    },

    async getShowsSchedule(caller: Actor, plant: CreatedPlant, schedule: CreatedSchedule): Promise<void> {
      const what = `finding schedule "${schedule.name}" on plant "${plant.friendlyName}"`;
      const response = await get(caller, plant, what);

      expectThat(scheduleIdsIn(response).includes(schedule.activityScheduleId), 'the schedule assigned', response, what);
    },

    async getShowsNoSchedules(caller: Actor, plant: CreatedPlant): Promise<void> {
      const what = `reading the schedules of plant "${plant.friendlyName}"`;
      const response = await get(caller, plant, what);

      expectThat(scheduleIdsIn(response).length === 0, 'no schedules', response, what);
    },

    async getIsNotFoundFor(caller: Actor): Promise<void> {
      expectStatus(await as(caller).get('/plants/no-such-plant'), status.NOT_FOUND, 'reading a plant that does not exist');
    },

    async listIncludes(caller: Actor, plant: CreatedPlant): Promise<void> {
      const what = `finding plant "${plant.friendlyName}" in the list`;
      const response = await as(caller).get('/plants');

      expectStatus(response, status.OK, what);
      expectThat(
        expectListEntries(response, what).some(entry => entry.plantId === plant.plantId),
        'the plant listed',
        response,
        what
      );
    },

    async updateChanges(caller: Actor, plant: CreatedPlant, changes: Partial<NewPlant>): Promise<CreatedPlant> {
      const what = `updating plant "${plant.friendlyName}"`;
      const input = { ...plant.input, ...changes, };
      const response = await as(caller).put('/plants', { ...input, plantId: plant.plantId, });

      expectStatus(response, status.OK, what);

      const updated = { ...plant, friendlyName: input.friendlyName, input, };
      const reread = await get(caller, updated, `${what}: re-reading it`);

      if (changes.description !== undefined) {
        expectBodyToContain(response, { description: changes.description, }, what);
        expectBodyToContain(reread, { description: changes.description, }, `${what}: re-reading it`);
      }

      return updated;
    },

    async assignSchedule(caller: Actor, plant: CreatedPlant, schedule: CreatedSchedule): Promise<void> {
      const what = `assigning schedule "${schedule.name}" to plant "${plant.friendlyName}"`;
      const response = await as(caller).put(
        `/plants/${plant.plantId}/activity-schedules`,
        { assign: [ schedule.activityScheduleId, ], unassign: [], }
      );

      expectStatus(response, status.OK, what);
    },

    async unassignSchedule(caller: Actor, plant: CreatedPlant, schedule: CreatedSchedule): Promise<void> {
      const what = `unassigning schedule "${schedule.name}" from plant "${plant.friendlyName}"`;
      const response = await as(caller).put(
        `/plants/${plant.plantId}/activity-schedules`,
        { assign: [], unassign: [ schedule.activityScheduleId, ], }
      );

      expectStatus(response, status.OK, what);
    },

    async secondAssignmentIsRejectedAsConflict(caller: Actor, plant: CreatedPlant, schedule: CreatedSchedule): Promise<void> {
      const what = `assigning schedule "${schedule.name}" to a plant that already has it`;
      const response = await as(caller).put(
        `/plants/${plant.plantId}/activity-schedules`,
        { assign: [ schedule.activityScheduleId, ], unassign: [], }
      );

      expectRejection(response, status.CONFLICT, 'duplicate entry', what);
    },

    async assignmentWithoutListsFailsWithServerError(caller: Actor, plant: CreatedPlant): Promise<void> {
      const response = await as(caller).put(`/plants/${plant.plantId}/activity-schedules`, {});

      expectStatus(response, status.INTERNAL_SERVER_ERROR, 'assigning schedules with no lists');
    },

    async createOfTakenNameIsRejectedAsBadRequest(caller: Actor, plant: CreatedPlant): Promise<void> {
      const what = `creating a second plant named "${plant.friendlyName}"`;
      const response = await as(caller).put('/plants', plant.input);

      expectRejection(response, status.BAD_REQUEST, 'Friendly name already in use', what);
    },

    async renameToTakenNameIsRejectedAsConflict(caller: Actor, plant: CreatedPlant, taken: CreatedPlant): Promise<void> {
      const what = `renaming plant "${plant.friendlyName}" to "${taken.friendlyName}"`;
      const response = await as(caller).put('/plants', { ...plant.input, plantId: plant.plantId, friendlyName: taken.friendlyName, });

      expectRejection(response, status.CONFLICT, 'duplicate entry', what);
    },

    async createWithUnknownIdAndTakenNameFailsWithNotFoundAndOverwrites(caller: Actor, plant: CreatedPlant): Promise<void> {
      const what = `saving an unknown plant id under the name "${plant.friendlyName}"`;
      const description = 'Overwritten through another plant id';
      const response = await as(caller).put('/plants', { ...plant.input, plantId: 'no-such-plant', description, });

      expectStatus(response, status.NOT_FOUND, what);
      expectBodyToContain(await get(caller, plant, `${what}: re-reading the other plant`), { description, }, what);
    },

    async createWithUnknownSubcategoryIsRejectedAsBadRequest(caller: Actor, input: NewPlant): Promise<void> {
      const what = `creating plant "${input.friendlyName}" in a subcategory that does not exist`;
      const response = await as(caller).put('/plants', input);

      expectRejection(response, status.BAD_REQUEST, 'referenced row does not exist', what);

      const after = await as(caller).get('/plants');

      expectThat(
        !expectListEntries(after, what).some(entry => entry.friendlyName === input.friendlyName),
        'no plant written',
        after,
        what
      );
    },

    async deleteOfPlantInUseIsRejectedAsConflict(caller: Actor, plant: CreatedPlant): Promise<void> {
      const what = `deleting plant "${plant.friendlyName}" while it has plantings`;
      const response = await as(caller).del(`/plants/${plant.plantId}`);

      expectRejection(response, status.CONFLICT, 'Plant has plantings', what);
      await get(caller, plant, `${what}: re-reading it`);
    },

    async deleteRemovesPlant(caller: Actor, plant: CreatedPlant): Promise<void> {
      const what = `deleting plant "${plant.friendlyName}"`;

      expectStatus(await as(caller).del(`/plants/${plant.plantId}`), status.OK, what);
      expectStatus(await as(caller).get(`/plants/${plant.plantId}`), status.NOT_FOUND, `${what}: re-reading it`);
    },
  };
}
