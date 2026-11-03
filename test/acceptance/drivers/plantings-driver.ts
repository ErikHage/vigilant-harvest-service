import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectBodyToHaveKeys,
  expectCount,
  expectListEntries,
  expectRejection,
  expectStatus,
  expectThat
} from './assertions';
import { NewPlanting, tooLong, withoutField } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedPlanting, CreatedPlot, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

/** Ways a new planting can be wrong. Each is a test of its own. */
export const NEW_PLANTING_PROBLEMS = [
  'no name',
  'a blank name',
  'a name that is too long',
  'no plant',
  'no year',
  'a year that is not a number',
  'a lead time that is not a whole number',
  'a negative lead time',
  'an unparseable target date',
  'a seed source that is too long',
] as const;

export type NewPlantingProblem = (typeof NEW_PLANTING_PROBLEMS)[number];

/** For each problem: a good planting made bad, and the reason the service gives. */
const invalidPlantings: Record<NewPlantingProblem, { body: (good: NewPlanting) => object, reason: string }> = {
  'no name': { body: good => withoutField(good, 'name'), reason: 'name is required', },
  'a blank name': { body: good => ({ ...good, name: '   ', }), reason: 'name is required', },
  'a name that is too long': {
    body: good => ({ ...good, name: tooLong(255), }),
    reason: 'name must be at most 255 characters',
  },
  'no plant': { body: good => withoutField(good, 'plantId'), reason: 'plantId is required', },
  'no year': { body: good => withoutField(good, 'plantingYear'), reason: 'plantingYear is required', },
  'a year that is not a number': {
    body: good => ({ ...good, plantingYear: 'abc', }),
    reason: 'plantingYear must be an integer',
  },
  'a lead time that is not a whole number': {
    body: good => ({ ...good, leadTimeWeeks: 2.5, }),
    reason: 'leadTimeWeeks must be an integer',
  },
  'a negative lead time': {
    body: good => ({ ...good, leadTimeWeeks: -1, }),
    reason: 'leadTimeWeeks must be at least 0',
  },
  'an unparseable target date': {
    body: good => ({ ...good, targetPlantingDate: 'not-a-date', }),
    reason: 'targetPlantingDate must be a date',
  },
  'a seed source that is too long': {
    body: good => ({ ...good, seedSource: tooLong(255), }),
    reason: 'seedSource must be at most 255 characters',
  },
};

/** Ways an update can be wrong, sent to a CREATED planting. Each is a test of its own. */
export const PLANTING_UPDATE_PROBLEMS = [
  'a name that is not a string',
  'a lead time that is not a number',
  'an unparseable target date',
  'a target date out of range',
] as const;

export type PlantingUpdateProblem = (typeof PLANTING_UPDATE_PROBLEMS)[number];

const invalidUpdates: Record<PlantingUpdateProblem, { body: object, reason: string }> = {
  'a name that is not a string': { body: { name: 42, }, reason: 'name must be a string', },
  'a lead time that is not a number': { body: { leadTimeWeeks: 'abc', }, reason: 'leadTimeWeeks must be an integer', },
  'an unparseable target date': {
    body: { targetPlantingDate: 'not-a-date', },
    reason: 'targetPlantingDate must be a date',
  },
  // the planting dates are DATE columns, which hold the years 1000 to 9999
  'a target date out of range': {
    body: { targetPlantingDate: '0999-05-01', },
    reason: 'targetPlantingDate must be between 1000 and 9999',
  },
};

/** Ways an action can be wrong, sent to a CREATED planting. Each is a test of its own. */
export const PLANTING_ACTION_PROBLEMS = [
  'no action type',
  'an unknown action type',
  'a start with no sow date',
  'a start with an unparseable sow date',
  'a start with a count that is not a number',
  'a start with a negative count',
  'a plant with no transplant date',
  'a plant with a plot id that is too long',
  'a split with no list',
  'a split with a nameless entry',
  'a split with a count that is not a number',
  'a comment that is not a string',
] as const;

export type PlantingActionProblem = (typeof PLANTING_ACTION_PROBLEMS)[number];

const invalidActions: Record<PlantingActionProblem, { body: object, reason: string }> = {
  'no action type': { body: { comment: 'no type', }, reason: 'actionType is required', },
  'an unknown action type': {
    body: { actionType: 'WATER', },
    reason: 'actionType must be one of COMMENT, START, PLANT, SPLIT, DELETE, RETIRE',
  },
  'a start with no sow date': { body: { actionType: 'START', numberSown: 4, }, reason: 'sowDate is required', },
  'a start with an unparseable sow date': {
    body: { actionType: 'START', sowDate: 'not-a-date', numberSown: 4, },
    reason: 'sowDate must be a date',
  },
  'a start with a count that is not a number': {
    body: { actionType: 'START', sowDate: '2026-03-01', numberSown: 'many', },
    reason: 'numberSown must be an integer',
  },
  'a start with a negative count': {
    body: { actionType: 'START', sowDate: '2026-03-01', numberSown: -1, },
    reason: 'numberSown must be at least 0',
  },
  'a plant with no transplant date': {
    body: { actionType: 'PLANT', numberTransplanted: 2, },
    reason: 'transplantDate is required',
  },
  'a plant with a plot id that is too long': {
    body: { actionType: 'PLANT', transplantDate: '2026-05-20', plotId: tooLong(36), },
    reason: 'plotId must be at most 36 characters',
  },
  'a split with no list': { body: { actionType: 'SPLIT', }, reason: 'splits is required', },
  'a split with a nameless entry': {
    body: { actionType: 'SPLIT', splits: [ { count: 1, }, ], },
    reason: 'splits[0].name is required',
  },
  'a split with a count that is not a number': {
    body: { actionType: 'SPLIT', splits: [ { name: 'acc-split', count: 'some', }, ], },
    reason: 'splits[0].count must be an integer',
  },
  'a comment that is not a string': { body: { actionType: 'COMMENT', comment: 42, }, reason: 'comment must be a string', },
};

export interface PlantingsDriver {
  createPlanting(caller: Actor, input: NewPlanting): Promise<CreatedPlanting>,
  getReportsStatus(caller: Actor, planting: CreatedPlanting, plantingStatus: string): Promise<void>,
  getReportsHistoryCount(caller: Actor, planting: CreatedPlanting, entries: number): Promise<void>,
  getReportsNumberSown(caller: Actor, planting: CreatedPlanting, numberSown: number): Promise<void>,
  getReportsYear(caller: Actor, planting: CreatedPlanting, plantingYear: number): Promise<void>,
  getIsNotFoundFor(caller: Actor): Promise<void>,
  listForYearIncludes(caller: Actor, planting: CreatedPlanting): Promise<void>,
  listForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void>,
  /** Finds a planting the service made itself, by name, among the ones in that year. */
  plantingNamedInYear(caller: Actor, name: string, plantingYear: number): Promise<CreatedPlanting>,
  start(caller: Actor, planting: CreatedPlanting, numberSown: number): Promise<void>,
  plantInPlot(caller: Actor, planting: CreatedPlanting, plot: CreatedPlot, numberTransplanted: number): Promise<void>,
  retire(caller: Actor, planting: CreatedPlanting): Promise<void>,
  comment(caller: Actor, planting: CreatedPlanting, comment: string): Promise<void>,
  split(caller: Actor, planting: CreatedPlanting, name: string, count: number): Promise<CreatedPlanting>,
  actionOutOfOrderIsRejectedAsBadRequest(caller: Actor, planting: CreatedPlanting, actionType: string): Promise<void>,
  splitOverflowIsRejectedAsBadRequest(caller: Actor, planting: CreatedPlanting, count: number): Promise<void>,
  /**
   * PLANT into a plot that doesn't exist: rejected, and nothing written. No
   * remainder split off, and the planting's status and count unchanged.
   */
  plantInUnknownPlotIsRejectedAsBadRequest(caller: Actor, planting: CreatedPlanting, numberTransplanted: number): Promise<void>,
  updateChangesSeedSource(caller: Actor, planting: CreatedPlanting, seedSource: string): Promise<void>,
  updateToEmptyValueKeepsTheOldOne(caller: Actor, planting: CreatedPlanting, seedSource: string): Promise<void>,
  updateOfFieldNotAllowedIsRejectedAsBadRequest(caller: Actor, planting: CreatedPlanting): Promise<void>,
  createForUnknownPlantIsRejectedAsBadRequest(caller: Actor, input: NewPlanting): Promise<void>,
  createInUnknownYearIsRejectedAsBadRequest(caller: Actor, input: NewPlanting): Promise<void>,
  createOfInvalidPlantingIsRejectedAsBadRequest(caller: Actor, good: NewPlanting, problem: NewPlantingProblem): Promise<void>,
  createAsTheAppSendsItSucceeds(caller: Actor, input: NewPlanting): Promise<void>,
  updateOfInvalidFieldIsRejectedAsBadRequest(
    caller: Actor,
    planting: CreatedPlanting,
    problem: PlantingUpdateProblem
  ): Promise<void>,
  updateAsTheAppSendsItSucceeds(caller: Actor, planting: CreatedPlanting): Promise<void>,
  actionOfInvalidBodyIsRejectedAsBadRequest(
    caller: Actor,
    planting: CreatedPlanting,
    problem: PlantingActionProblem
  ): Promise<void>,
  startAsTheAppSendsItSucceeds(caller: Actor, planting: CreatedPlanting): Promise<void>,
  deleteActionRemovesPlanting(caller: Actor, planting: CreatedPlanting): Promise<void>,
  deleteActionOfPlantingWithHarvestsIsRejectedAsConflict(caller: Actor, planting: CreatedPlanting): Promise<void>,
  deleteOfPlantingWithHarvestsIsRejectedAsConflict(caller: Actor, planting: CreatedPlanting): Promise<void>,
  deleteRemovesPlanting(caller: Actor, planting: CreatedPlanting): Promise<void>,
}

const NO_SUCH_YEAR = 8999;

export function createPlantingsDriver(client: HttpClient, registry: ResourceRegistry): PlantingsDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);
  const registered = new Set<string>();

  function register(plantingId: string, name: string): void {
    if (!registered.has(plantingId)) {
      registered.add(plantingId);
      registry.register({ kind: 'planting', path: `/plantings/${plantingId}`, label: name, });
    }
  }

  /** Files a planting for teardown if a create made one, before anything asserts on it. */
  function registerIfCreated(response: ApiResponse, name: string): void {
    if (response.status === status.CREATED) {
      register((response.body as { plantingId: string }).plantingId, name);
    }
  }

  async function get(caller: Actor, planting: CreatedPlanting, what: string): Promise<ApiResponse> {
    const response = await as(caller).get(`/plantings/${planting.plantingId}`);

    expectStatus(response, status.OK, what);

    return response;
  }

  async function listForYear(caller: Actor, plantingYear: number, what: string): Promise<Record<string, unknown>[]> {
    const response = await as(caller).get(`/plantings?plantingYear=${plantingYear}`);

    expectStatus(response, status.OK, what);

    return expectListEntries(response, what);
  }

  /**
   * SPLIT makes new plantings, and so does a PLANT of fewer than were sown, and
   * neither says what it made. So after either, whatever is new in the year is
   * registered, or it would outlive the spec.
   */
  async function registerWhatTheServiceMade(caller: Actor, plantingYear: number): Promise<void> {
    const plantings = await listForYear(caller, plantingYear, `reading the plantings of ${plantingYear}`);

    plantings.forEach(entry => register(entry.plantingId as string, entry.name as string));
  }

  async function act(caller: Actor, planting: CreatedPlanting, body: object, what: string): Promise<ApiResponse> {
    const response = await as(caller).post(`/plantings/${planting.plantingId}`, body);

    expectStatus(response, status.OK, what);

    return response;
  }

  return {
    async createPlanting(caller: Actor, input: NewPlanting): Promise<CreatedPlanting> {
      const what = `creating planting "${input.name}"`;
      const response = await as(caller).post('/plantings', input);

      expectStatus(response, status.CREATED, what);
      expectBodyToHaveKeys(response, [ 'plantingId', ], what);

      const { plantingId, } = response.body as { plantingId: string };

      register(plantingId, input.name);
      expectBodyToContain(response, { name: input.name, currentStatus: 'CREATED', plantingYears: [ input.plantingYear, ], }, what);

      return { plantingId, name: input.name, plantingYear: input.plantingYear, };
    },

    async getReportsStatus(caller: Actor, planting: CreatedPlanting, plantingStatus: string): Promise<void> {
      const what = `reading the status of planting "${planting.name}"`;

      expectBodyToContain(await get(caller, planting, what), { currentStatus: plantingStatus, }, what);
    },

    async getReportsHistoryCount(caller: Actor, planting: CreatedPlanting, entries: number): Promise<void> {
      const what = `reading the history of planting "${planting.name}"`;
      const response = await get(caller, planting, what);
      const { statusHistory, } = response.body as { statusHistory: unknown[] };

      expectCount(statusHistory.length, entries, response, what);
    },

    async getReportsNumberSown(caller: Actor, planting: CreatedPlanting, numberSown: number): Promise<void> {
      const what = `reading the number sown of planting "${planting.name}"`;

      expectBodyToContain(await get(caller, planting, what), { numberSown, }, what);
    },

    async getReportsYear(caller: Actor, planting: CreatedPlanting, plantingYear: number): Promise<void> {
      const what = `reading the years of planting "${planting.name}"`;
      const response = await get(caller, planting, what);
      const { plantingYears, } = response.body as { plantingYears: number[] };

      expectThat(plantingYears.includes(plantingYear), `${plantingYear} among its years`, response, what);
    },

    async getIsNotFoundFor(caller: Actor): Promise<void> {
      expectStatus(await as(caller).get('/plantings/no-such-planting'), status.NOT_FOUND, 'reading a planting that does not exist');
      expectStatus(
        await as(caller).post('/plantings/no-such-planting', { actionType: 'COMMENT', comment: 'nothing to see', }),
        status.NOT_FOUND,
        'acting on a planting that does not exist'
      );
      expectStatus(
        await as(caller).put('/plantings/no-such-planting', { name: 'nothing', }),
        status.NOT_FOUND,
        'updating a planting that does not exist'
      );
    },

    async listForYearIncludes(caller: Actor, planting: CreatedPlanting): Promise<void> {
      const what = `finding planting "${planting.name}" among the plantings of its year`;
      const response = await as(caller).get(`/plantings?plantingYear=${planting.plantingYear}`);

      expectStatus(response, status.OK, what);
      expectThat(
        expectListEntries(response, what).some(entry => entry.plantingId === planting.plantingId),
        'the planting listed',
        response,
        what
      );
    },

    async listForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void> {
      expectRejection(
        await as(caller).get('/plantings?plantingYear=not-a-year'),
        status.BAD_REQUEST,
        'plantingYear must be an integer',
        'listing the plantings of a year that is not a number'
      );
    },

    async plantingNamedInYear(caller: Actor, name: string, plantingYear: number): Promise<CreatedPlanting> {
      const what = `finding planting "${name}" in ${plantingYear}`;
      const response = await as(caller).get(`/plantings?plantingYear=${plantingYear}`);

      expectStatus(response, status.OK, what);

      const entry = expectListEntries(response, what).find(each => each.name === name);

      expectThat(entry !== undefined, 'the planting listed', response, what);

      return { plantingId: entry!.plantingId as string, name, plantingYear, };
    },

    async start(caller: Actor, planting: CreatedPlanting, numberSown: number): Promise<void> {
      await act(
        caller,
        planting,
        { actionType: 'START', sowDate: '2026-03-01', numberSown, },
        `starting planting "${planting.name}"`
      );
    },

    async plantInPlot(caller: Actor, planting: CreatedPlanting, plot: CreatedPlot, numberTransplanted: number): Promise<void> {
      await act(
        caller,
        planting,
        { actionType: 'PLANT', plotId: plot.plotId, transplantDate: '2026-05-20', numberTransplanted, },
        `planting "${planting.name}" in plot "${plot.friendlyName}"`
      );
      await registerWhatTheServiceMade(caller, planting.plantingYear);
    },

    async plantInUnknownPlotIsRejectedAsBadRequest(
      caller: Actor,
      planting: CreatedPlanting,
      numberTransplanted: number
    ): Promise<void> {
      const what = `planting "${planting.name}" in a plot that does not exist`;
      const before = (await get(caller, planting, `${what}: reading it first`)).body as Record<string, unknown>;
      const plantingsBefore = await listForYear(caller, planting.plantingYear, `${what}: listing its year first`);

      const response = await as(caller).post(`/plantings/${planting.plantingId}`, {
        actionType: 'PLANT',
        plotId: '00000000-0000-0000-0000-000000000000',
        transplantDate: '2026-05-20',
        numberTransplanted,
      });

      // a remainder split that wrongly survived must still be cleaned up
      await registerWhatTheServiceMade(caller, planting.plantingYear);
      const plantingsAfter = await listForYear(caller, planting.plantingYear, `${what}: listing its year again`);

      expectThat(
        plantingsAfter.length === plantingsBefore.length,
        `still ${plantingsBefore.length} planting(s) in ${planting.plantingYear}, with no remainder split off, ` +
          `but found ${plantingsAfter.map(entry => entry.name).join(', ')}`,
        response,
        what
      );
      expectBodyToContain(
        await get(caller, planting, `${what}: re-reading it`),
        { currentStatus: before.currentStatus, numberSown: before.numberSown, },
        what
      );
      expectRejection(response, status.BAD_REQUEST, 'Unknown plot', what);
    },

    async retire(caller: Actor, planting: CreatedPlanting): Promise<void> {
      await act(caller, planting, { actionType: 'RETIRE', }, `retiring planting "${planting.name}"`);
    },

    async comment(caller: Actor, planting: CreatedPlanting, comment: string): Promise<void> {
      await act(caller, planting, { actionType: 'COMMENT', comment, }, `commenting on planting "${planting.name}"`);
    },

    async split(caller: Actor, planting: CreatedPlanting, name: string, count: number): Promise<CreatedPlanting> {
      const what = `splitting ${count} out of planting "${planting.name}"`;

      await act(caller, planting, { actionType: 'SPLIT', splits: [ { name, count, }, ], }, what);
      await registerWhatTheServiceMade(caller, planting.plantingYear);

      const entries = await listForYear(caller, planting.plantingYear, what);
      const child = entries.find(entry => entry.name === name);

      return { plantingId: child?.plantingId as string, name, plantingYear: planting.plantingYear, };
    },

    async actionOutOfOrderIsRejectedAsBadRequest(caller: Actor, planting: CreatedPlanting, actionType: string): Promise<void> {
      const what = `performing ${actionType} on planting "${planting.name}" out of order`;
      const response = await as(caller).post(`/plantings/${planting.plantingId}`, { actionType, });

      expectRejection(response, status.BAD_REQUEST, 'Lifecycle transition', what);
    },

    async splitOverflowIsRejectedAsBadRequest(caller: Actor, planting: CreatedPlanting, count: number): Promise<void> {
      const what = `splitting ${count} out of planting "${planting.name}", more than it holds`;
      const response = await as(caller).post(`/plantings/${planting.plantingId}`, {
        actionType: 'SPLIT',
        splits: [ { name: `${planting.name}-overflow`, count, }, ],
      });

      expectRejection(response, status.BAD_REQUEST, 'meets or exceeds', what);
    },

    async updateChangesSeedSource(caller: Actor, planting: CreatedPlanting, seedSource: string): Promise<void> {
      const what = `updating planting "${planting.name}"`;

      expectStatus(await as(caller).put(`/plantings/${planting.plantingId}`, { seedSource, }), status.OK, what);
      expectBodyToContain(await get(caller, planting, `${what}: re-reading it`), { seedSource, }, what);
    },

    async updateToEmptyValueKeepsTheOldOne(caller: Actor, planting: CreatedPlanting, seedSource: string): Promise<void> {
      const what = `clearing the seed source of planting "${planting.name}"`;

      expectStatus(await as(caller).put(`/plantings/${planting.plantingId}`, { seedSource: '', }), status.OK, what);
      expectBodyToContain(await get(caller, planting, `${what}: re-reading it`), { seedSource, }, what);
    },

    async updateOfFieldNotAllowedIsRejectedAsBadRequest(caller: Actor, planting: CreatedPlanting): Promise<void> {
      const what = `setting the number sown of planting "${planting.name}" before it has started`;
      const response = await as(caller).put(`/plantings/${planting.plantingId}`, { numberSown: 3, });

      expectRejection(response, status.BAD_REQUEST, 'not allowed to be updated', what);
    },

    async createForUnknownPlantIsRejectedAsBadRequest(caller: Actor, input: NewPlanting): Promise<void> {
      const what = `creating planting "${input.name}" of a plant that does not exist`;
      const response = await as(caller).post('/plantings', { ...input, plantId: 'no-such-plant', });

      expectRejection(response, status.BAD_REQUEST, 'referenced row does not exist', what);

      const plantings = await listForYear(caller, input.plantingYear, `${what}: re-reading the year`);

      expectThat(!plantings.some(entry => entry.name === input.name), 'no planting written', response, what);
    },

    async createInUnknownYearIsRejectedAsBadRequest(caller: Actor, input: NewPlanting): Promise<void> {
      const what = `creating planting "${input.name}" in a year that does not exist`;
      const response = await as(caller).post('/plantings', { ...input, plantingYear: NO_SUCH_YEAR, });

      expectRejection(response, status.BAD_REQUEST, 'referenced row does not exist', what);

      const plantings = await listForYear(caller, NO_SUCH_YEAR, `${what}: re-reading the year`);

      expectCount(plantings.length, 0, response, what);
    },

    async createOfInvalidPlantingIsRejectedAsBadRequest(
      caller: Actor,
      good: NewPlanting,
      problem: NewPlantingProblem
    ): Promise<void> {
      const { body, reason, } = invalidPlantings[problem];
      const response = await as(caller).post('/plantings', body(good));

      registerIfCreated(response, good.name);
      expectRejection(response, status.BAD_REQUEST, reason, `creating a planting with ${problem}`);
    },

    async createAsTheAppSendsItSucceeds(caller: Actor, input: NewPlanting): Promise<void> {
      const what = `creating planting "${input.name}" as the app sends it`;
      // The app's year can be a string. Its lead time box, cleared, sends '' (v-model.number), and
      // the fields never touched are null.
      const response = await as(caller).post('/plantings', {
        name: input.name,
        plantId: input.plantId,
        plantingYear: String(input.plantingYear),
        leadTimeWeeks: '',
        seedSource: null,
        lotNumber: null,
      });

      registerIfCreated(response, input.name);
      expectStatus(response, status.CREATED, what);
      expectBodyToContain(response, { plantingYears: [ input.plantingYear, ], }, what);
    },

    async updateOfInvalidFieldIsRejectedAsBadRequest(
      caller: Actor,
      planting: CreatedPlanting,
      problem: PlantingUpdateProblem
    ): Promise<void> {
      const { body, reason, } = invalidUpdates[problem];

      expectRejection(
        await as(caller).put(`/plantings/${planting.plantingId}`, body),
        status.BAD_REQUEST,
        reason,
        `updating planting "${planting.name}" with ${problem}`
      );
    },

    async updateAsTheAppSendsItSucceeds(caller: Actor, planting: CreatedPlanting): Promise<void> {
      const what = `updating planting "${planting.name}" as the app sends it`;
      // A CREATED planting's edit form: a date from the picker, as JSON, and a cleared lead time box.
      const response = await as(caller).put(`/plantings/${planting.plantingId}`, {
        name: planting.name,
        seedSource: 'Saved by the app',
        targetPlantingDate: '2026-05-15T04:00:00.000Z',
        leadTimeWeeks: '',
      });

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { seedSource: 'Saved by the app', }, what);
    },

    async actionOfInvalidBodyIsRejectedAsBadRequest(
      caller: Actor,
      planting: CreatedPlanting,
      problem: PlantingActionProblem
    ): Promise<void> {
      const { body, reason, } = invalidActions[problem];
      const response = await as(caller).post(`/plantings/${planting.plantingId}`, body);

      // a split that wrongly succeeded made plantings of its own
      await registerWhatTheServiceMade(caller, planting.plantingYear);
      expectRejection(response, status.BAD_REQUEST, reason, `acting on planting "${planting.name}" with ${problem}`);
    },

    async startAsTheAppSendsItSucceeds(caller: Actor, planting: CreatedPlanting): Promise<void> {
      // The start dialog's date is toISOString(), its count box cleared sends '', and an untouched
      // comment is null.
      const response = await act(
        caller,
        planting,
        { actionType: 'START', sowDate: '2026-03-01T17:00:00.000Z', numberSown: '', comment: null, },
        `starting planting "${planting.name}" as the app sends it`
      );

      expectBodyToContain(response, { currentStatus: 'STARTED', }, `starting planting "${planting.name}"`);
    },

    async deleteActionRemovesPlanting(caller: Actor, planting: CreatedPlanting): Promise<void> {
      const what = `deleting planting "${planting.name}" with the DELETE action`;

      await act(caller, planting, { actionType: 'DELETE', }, what);
      expectStatus(await as(caller).get(`/plantings/${planting.plantingId}`), status.NOT_FOUND, `${what}: re-reading it`);
    },

    async deleteActionOfPlantingWithHarvestsIsRejectedAsConflict(caller: Actor, planting: CreatedPlanting): Promise<void> {
      const what = `deleting planting "${planting.name}" with the DELETE action while it has harvests`;
      const response = await as(caller).post(`/plantings/${planting.plantingId}`, { actionType: 'DELETE', });

      expectRejection(response, status.CONFLICT, 'Planting has harvests', what);
      await get(caller, planting, `${what}: re-reading it`);
    },

    async deleteOfPlantingWithHarvestsIsRejectedAsConflict(caller: Actor, planting: CreatedPlanting): Promise<void> {
      const what = `deleting planting "${planting.name}" while it has harvests`;

      expectRejection(await as(caller).del(`/plantings/${planting.plantingId}`), status.CONFLICT, 'Planting has harvests', what);
      await get(caller, planting, `${what}: re-reading it`);
    },

    async deleteRemovesPlanting(caller: Actor, planting: CreatedPlanting): Promise<void> {
      const what = `deleting planting "${planting.name}"`;

      expectStatus(await as(caller).del(`/plantings/${planting.plantingId}`), status.OK, what);
      expectStatus(await as(caller).get(`/plantings/${planting.plantingId}`), status.NOT_FOUND, `${what}: re-reading it`);
    },
  };
}
