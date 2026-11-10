import { Actor } from '../support/actors';
import { expectBodyToContain, expectListEntries, expectRejection, expectStatus, expectThat } from './assertions';
import { NewPlantingYear, withoutField } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedPlantingYear, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

export interface PlantingYearDetails {
  createdPlantings: number,
  startedPlantings: number,
  plantedPlantings: number,
  retiredPlantings: number,
}

/** Ways a new planting year can be wrong. Each is a test of its own. */
export const NEW_YEAR_PROBLEMS = [
  'no year',
  'a year that is not a number',
  'a previous year that is not a number',
  'no last frost date',
  'an unparseable target date',
  'a last frost date in UTC',
  'a target date with an offset',
  'a last frost date with a time',
  'a target date that does not exist',
  'a last frost date out of range',
] as const;

export type NewYearProblem = (typeof NEW_YEAR_PROBLEMS)[number];

const invalidYears: Record<NewYearProblem, { body: (good: NewPlantingYear) => object, reason: string }> = {
  'no year': { body: good => withoutField(good, 'plantingYear'), reason: 'plantingYear is required', },
  'a year that is not a number': {
    body: good => ({ ...good, plantingYear: 'next', }),
    reason: 'plantingYear must be an integer',
  },
  'a previous year that is not a number': {
    body: good => ({ ...good, previousPlantingYear: 'last', }),
    reason: 'previousPlantingYear must be an integer',
  },
  'no last frost date': { body: good => withoutField(good, 'lastFrostDate'), reason: 'lastFrostDate is required', },
  'an unparseable target date': {
    body: good => ({ ...good, targetPlantingDate: 'mid-May', }),
    reason: 'targetPlantingDate must be a date',
  },
  // the year's dates are the user's own days, so an instant is refused rather than guessed at
  'a last frost date in UTC': {
    body: good => ({ ...good, lastFrostDate: `${good.plantingYear}-05-01T04:00:00.000Z`, }),
    reason: 'lastFrostDate must be a local time, with no Z or offset',
  },
  'a target date with an offset': {
    body: good => ({ ...good, targetPlantingDate: `${good.plantingYear}-05-15T00:00:00-04:00`, }),
    reason: 'targetPlantingDate must be a local time, with no Z or offset',
  },
  'a last frost date with a time': {
    body: good => ({ ...good, lastFrostDate: `${good.plantingYear}-05-01T00:00:00`, }),
    reason: 'lastFrostDate must be a date, as YYYY-MM-DD',
  },
  'a target date that does not exist': {
    body: good => ({ ...good, targetPlantingDate: `${good.plantingYear}-04-31`, }),
    reason: 'targetPlantingDate must be a date, as YYYY-MM-DD',
  },
  // the year's dates are DATE columns, which hold the years 1000 to 9999
  'a last frost date out of range': {
    body: good => ({ ...good, lastFrostDate: '0999-05-01', }),
    reason: 'lastFrostDate must be between 1000 and 9999',
  },
};

export interface PlantingYearsDriver {
  listYears(caller: Actor): Promise<number[]>,
  createYear(caller: Actor, input: NewPlantingYear): Promise<CreatedPlantingYear>,
  getReturnsYear(caller: Actor, year: CreatedPlantingYear): Promise<void>,
  getIsNotFoundFor(caller: Actor): Promise<void>,
  getForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void>,
  listIncludes(caller: Actor, year: CreatedPlantingYear): Promise<void>,
  listReportsDetails(caller: Actor, year: CreatedPlantingYear, details: PlantingYearDetails): Promise<void>,
  createOfTakenYearIsRejectedAsConflict(caller: Actor, year: CreatedPlantingYear): Promise<void>,
  deleteOfYearInUseIsRejectedAsConflict(caller: Actor, year: CreatedPlantingYear): Promise<void>,
  deleteRemovesYear(caller: Actor, year: CreatedPlantingYear): Promise<void>,
  createOfInvalidYearIsRejectedAsBadRequest(caller: Actor, good: NewPlantingYear, problem: NewYearProblem): Promise<void>,
  createAsTheAppSendsItSucceeds(caller: Actor, good: NewPlantingYear): Promise<void>,
}

export function createPlantingYearsDriver(client: HttpClient, registry: ResourceRegistry): PlantingYearsDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function list(caller: Actor, what: string): Promise<{ response: ApiResponse, years: Record<string, unknown>[] }> {
    const response = await as(caller).get('/planting-years');

    expectStatus(response, status.OK, what);

    return { response, years: expectListEntries(response, what), };
  }

  /** Files a year for teardown if a create made one, before anything asserts on it. */
  function registerIfCreated(response: ApiResponse, plantingYear: number): void {
    if (response.status === status.CREATED) {
      registry.register({ kind: 'planting year', path: `/planting-years/${plantingYear}`, label: String(plantingYear), });
    }
  }

  return {
    async createOfInvalidYearIsRejectedAsBadRequest(
      caller: Actor,
      good: NewPlantingYear,
      problem: NewYearProblem
    ): Promise<void> {
      const { body, reason, } = invalidYears[problem];
      const response = await as(caller).put('/planting-years', body(good));

      registerIfCreated(response, good.plantingYear);
      expectRejection(response, status.BAD_REQUEST, reason, `creating a planting year with ${problem}`);
    },

    async createAsTheAppSendsItSucceeds(caller: Actor, good: NewPlantingYear): Promise<void> {
      const what = `creating planting year ${good.plantingYear} as the app sends it`;
      // The app's dates are the days picked, and its previous-year box sends '' when cleared.
      const response = await as(caller).put('/planting-years', {
        plantingYear: good.plantingYear,
        previousPlantingYear: '',
        lastFrostDate: `${good.plantingYear}-05-01`,
        targetPlantingDate: `${good.plantingYear}-05-15`,
      });

      registerIfCreated(response, good.plantingYear);
      expectStatus(response, status.CREATED, what);
    },

    async listYears(caller: Actor): Promise<number[]> {
      const { years, } = await list(caller, 'listing the planting years');

      return years.map(entry => entry.plantingYear as number);
    },

    async createYear(caller: Actor, input: NewPlantingYear): Promise<CreatedPlantingYear> {
      const { plantingYear, } = input;
      const what = `creating planting year ${plantingYear}`;

      expectStatus(await as(caller).put('/planting-years', input), status.CREATED, what);
      registry.register({ kind: 'planting year', path: `/planting-years/${plantingYear}`, label: String(plantingYear), });

      return { plantingYear, lastFrostDate: input.lastFrostDate, targetPlantingDate: input.targetPlantingDate, };
    },

    async getReturnsYear(caller: Actor, year: CreatedPlantingYear): Promise<void> {
      const what = `reading planting year ${year.plantingYear}`;
      const response = await as(caller).get(`/planting-years/${year.plantingYear}`);

      expectStatus(response, status.OK, what);
      // its dates come back as they were sent, with no time zone
      expectBodyToContain(response, {
        plantingYear: year.plantingYear,
        lastFrostDate: year.lastFrostDate,
        targetPlantingDate: year.targetPlantingDate,
      }, what);
    },

    async getIsNotFoundFor(caller: Actor): Promise<void> {
      expectStatus(await as(caller).get('/planting-years/8999'), status.NOT_FOUND, 'reading a planting year that does not exist');
    },

    async getForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void> {
      expectRejection(
        await as(caller).get('/planting-years/not-a-year'),
        status.BAD_REQUEST,
        'plantingYear must be an integer',
        'reading a planting year that is not a number'
      );
    },

    async listIncludes(caller: Actor, year: CreatedPlantingYear): Promise<void> {
      const what = `finding planting year ${year.plantingYear} in the list`;
      const { response, years, } = await list(caller, what);

      expectThat(years.some(entry => entry.plantingYear === year.plantingYear), 'the year listed', response, what);
    },

    async listReportsDetails(caller: Actor, year: CreatedPlantingYear, details: PlantingYearDetails): Promise<void> {
      const what = `reading the details of planting year ${year.plantingYear}`;
      const { response, years, } = await list(caller, what);
      const entry = years.find(each => each.plantingYear === year.plantingYear);

      expectThat(
        JSON.stringify(entry?.details) === JSON.stringify(details),
        `details of ${JSON.stringify(details)}`,
        response,
        what
      );
    },

    async createOfTakenYearIsRejectedAsConflict(caller: Actor, year: CreatedPlantingYear): Promise<void> {
      const what = `creating planting year ${year.plantingYear} a second time`;
      const response = await as(caller).put('/planting-years', {
        plantingYear: year.plantingYear,
        previousPlantingYear: year.plantingYear - 1,
        lastFrostDate: `${year.plantingYear}-05-01`,
        targetPlantingDate: `${year.plantingYear}-05-15`,
      });

      expectRejection(response, status.CONFLICT, 'duplicate entry', what);
    },

    async deleteOfYearInUseIsRejectedAsConflict(caller: Actor, year: CreatedPlantingYear): Promise<void> {
      const what = `deleting planting year ${year.plantingYear} while it is in use`;

      expectRejection(await as(caller).del(`/planting-years/${year.plantingYear}`), status.CONFLICT, 'is in use', what);
      expectStatus(await as(caller).get(`/planting-years/${year.plantingYear}`), status.OK, `${what}: re-reading it`);
    },

    async deleteRemovesYear(caller: Actor, year: CreatedPlantingYear): Promise<void> {
      const what = `deleting planting year ${year.plantingYear}`;

      expectStatus(await as(caller).del(`/planting-years/${year.plantingYear}`), status.OK, what);
      expectStatus(await as(caller).get(`/planting-years/${year.plantingYear}`), status.NOT_FOUND, `${what}: re-reading it`);
    },
  };
}
