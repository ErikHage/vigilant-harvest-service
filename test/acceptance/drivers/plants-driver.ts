import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectBodyToHaveKeys,
  expectListEntries,
  expectRejection,
  expectStatus,
  expectThat
} from './assertions';
import { NewPlant, tooLong, withoutField } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedPlant, CreatedSchedule, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

/** Ways a plant can be wrong. Each is a test of its own. */
export const PLANT_PROBLEMS = [
  'no subcategory',
  'a subcategory that is not a number',
  'no name',
  'a name that is too long',
  'an unknown lifespan',
  'tags that are not a list',
  'a tag that is not a string',
  'a section that is not an object',
  'a depth that is not a number',
  'a depth too large to store',
  'days to maturity that are not a whole number',
  'climbing that is not true or false',
  'instructions that are too long',
  'a harvest type that is not a number',
] as const;

export type PlantProblem = (typeof PLANT_PROBLEMS)[number];

/** For each problem: a good plant made bad, and the reason the service gives. */
const invalidPlants: Record<PlantProblem, { body: (good: NewPlant) => object, reason: string }> = {
  'no subcategory': { body: good => withoutField(good, 'subcategoryId'), reason: 'subcategoryId is required', },
  'a subcategory that is not a number': {
    body: good => ({ ...good, subcategoryId: 'herbs', }),
    reason: 'subcategoryId must be an integer',
  },
  'no name': { body: good => withoutField(good, 'friendlyName'), reason: 'friendlyName is required', },
  'a name that is too long': {
    body: good => ({ ...good, friendlyName: tooLong(255), }),
    reason: 'friendlyName must be at most 255 characters',
  },
  'an unknown lifespan': {
    body: good => ({ ...good, lifespanType: 'Forever', }),
    reason: 'lifespanType must be one of annual, perennial, biennial, unknown',
  },
  'tags that are not a list': { body: good => ({ ...good, tags: 'heirloom', }), reason: 'tags must be a list', },
  'a tag that is not a string': { body: good => ({ ...good, tags: [ 3, ], }), reason: 'tags[0] must be a string', },
  'a section that is not an object': {
    body: good => ({ ...good, taxonomy: 'Solanaceae', }),
    reason: 'taxonomy must be an object',
  },
  'a depth that is not a number': {
    body: good => ({ ...good, planting: { depthInInches: 'deep', }, }),
    reason: 'planting.depthInInches must be a number',
  },
  // the depth is a DECIMAL(5,2)
  'a depth too large to store': {
    body: good => ({ ...good, planting: { depthInInches: 1000, }, }),
    reason: 'planting.depthInInches must be at most 999.99',
  },
  'days to maturity that are not a whole number': {
    body: good => ({ ...good, growing: { daysToMaturity: 60.5, }, }),
    reason: 'growing.daysToMaturity must be an integer',
  },
  'climbing that is not true or false': {
    body: good => ({ ...good, growing: { isClimbing: 'yes', }, }),
    reason: 'growing.isClimbing must be true or false',
  },
  // the instructions are a VARCHAR(2000)
  'instructions that are too long': {
    body: good => ({ ...good, planting: { instructions: tooLong(2000), }, }),
    reason: 'planting.instructions must be at most 2000 characters',
  },
  'a harvest type that is not a number': {
    body: good => ({ ...good, harvesting: { defaultHarvestTypeId: 'pounds', }, }),
    reason: 'harvesting.defaultHarvestTypeId must be an integer',
  },
};

/** Ways a schedule assignment can be wrong. Each is a test of its own. */
export const ASSIGNMENT_PROBLEMS = [
  'no lists',
  'no unassign list',
  'an assign that is not a list',
  'an id that is not a string',
] as const;

export type AssignmentProblem = (typeof ASSIGNMENT_PROBLEMS)[number];

const invalidAssignments: Record<AssignmentProblem, { body: object, reason: string }> = {
  'no lists': { body: {}, reason: 'assign is required', },
  'no unassign list': { body: { assign: [], }, reason: 'unassign is required', },
  'an assign that is not a list': { body: { assign: 'watering', unassign: [], }, reason: 'assign must be a list', },
  'an id that is not a string': { body: { assign: [ 42, ], unassign: [], }, reason: 'assign[0] must be a string', },
};

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
  createOfInvalidPlantIsRejectedAsBadRequest(caller: Actor, good: NewPlant, problem: PlantProblem): Promise<void>,
  createAsTheAddDialogSendsItSucceeds(caller: Actor, good: NewPlant): Promise<void>,
  saveAsTheEditPageSendsItSucceeds(caller: Actor, plant: CreatedPlant): Promise<void>,
  assignmentOfInvalidListsIsRejectedAsBadRequest(caller: Actor, plant: CreatedPlant, problem: AssignmentProblem): Promise<void>,
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

  /** Files a plant for teardown if a write made one, before anything asserts on it. */
  function registerIfCreated(response: ApiResponse, label: string): void {
    if (response.status === status.CREATED) {
      registry.register({ kind: 'plant', path: `/plants/${(response.body as { plantId: string }).plantId}`, label, });
    }
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

    async createOfInvalidPlantIsRejectedAsBadRequest(caller: Actor, good: NewPlant, problem: PlantProblem): Promise<void> {
      const { body, reason, } = invalidPlants[problem];
      const response = await as(caller).put('/plants', body(good));

      registerIfCreated(response, good.friendlyName);
      expectRejection(response, status.BAD_REQUEST, reason, `creating a plant with ${problem}`);
    },

    async createAsTheAddDialogSendsItSucceeds(caller: Actor, good: NewPlant): Promise<void> {
      const what = `creating plant "${good.friendlyName}" as the app's add dialog sends it`;
      // The add dialog sends no lifespan until one is picked, and an empty description.
      const response = await as(caller).put('/plants', {
        subcategoryId: good.subcategoryId,
        friendlyName: good.friendlyName,
        lifespanType: null,
        description: '',
        harvesting: { defaultHarvestTypeId: 1, },
      });

      registerIfCreated(response, good.friendlyName);
      expectStatus(response, status.CREATED, what);
      expectBodyToContain(response, { lifespanType: 'Annual', }, what);
    },

    async saveAsTheEditPageSendsItSucceeds(caller: Actor, plant: CreatedPlant): Promise<void> {
      const what = `saving plant "${plant.friendlyName}" as the app's edit page sends it`;
      // The edit page sends every section. Its sowing boxes are free text, a cleared number box sends ''
      // (v-model.number), untouched fields are null, and it sends a seedSource plants don't have.
      const response = await as(caller).put('/plants', {
        plantId: plant.plantId,
        subcategoryId: plant.input.subcategoryId,
        friendlyName: plant.friendlyName,
        lifespanType: 'Perennial',
        seedSource: null,
        tags: [ 'heirloom', ],
        description: 'Saved by the app',
        taxonomy: { family: null, genus: null, species: null, },
        sowing: {
          indoor: '6 weeks before last frost',
          direct: 'after last frost',
          germinationDaysRange: '5-10',
          germinationTempRange: null,
          sowingNotes: null,
        },
        planting: { depthInInches: '', plantSpacingInches: 18, rowSpacingInches: '', instructions: null, },
        growing: {
          requiredSun: 'Full Sun (>= 6 hours)',
          daysToMaturity: 70,
          isClimbing: false,
          climbingHeightFeet: undefined,
          plantSize: null,
          growingNotes: null,
        },
        harvesting: { defaultHarvestTypeId: 1, fruitSize: null, shelfStability: null, harvestInstructions: null, },
      });

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { description: 'Saved by the app', }, what);
    },

    async assignmentOfInvalidListsIsRejectedAsBadRequest(
      caller: Actor,
      plant: CreatedPlant,
      problem: AssignmentProblem
    ): Promise<void> {
      const { body, reason, } = invalidAssignments[problem];

      expectRejection(
        await as(caller).put(`/plants/${plant.plantId}/activity-schedules`, body),
        status.BAD_REQUEST,
        reason,
        `assigning schedules to plant "${plant.friendlyName}" with ${problem}`
      );
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
