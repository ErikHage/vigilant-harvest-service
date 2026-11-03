import { Actor } from '../support/actors';
import { expectBodyToContain, expectListEntries, expectRejection, expectStatus, expectThat } from './assertions';
import { NewPlantingYear } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedPlantingYear, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

export interface PlantingYearDetails {
  createdPlantings: number,
  startedPlantings: number,
  plantedPlantings: number,
  retiredPlantings: number,
}

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
}

export function createPlantingYearsDriver(client: HttpClient, registry: ResourceRegistry): PlantingYearsDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function list(caller: Actor, what: string): Promise<{ response: ApiResponse, years: Record<string, unknown>[] }> {
    const response = await as(caller).get('/planting-years');

    expectStatus(response, status.OK, what);

    return { response, years: expectListEntries(response, what), };
  }

  return {
    async listYears(caller: Actor): Promise<number[]> {
      const { years, } = await list(caller, 'listing the planting years');

      return years.map(entry => entry.plantingYear as number);
    },

    async createYear(caller: Actor, input: NewPlantingYear): Promise<CreatedPlantingYear> {
      const { plantingYear, } = input;
      const what = `creating planting year ${plantingYear}`;

      expectStatus(await as(caller).put('/planting-years', input), status.CREATED, what);
      registry.register({ kind: 'planting year', path: `/planting-years/${plantingYear}`, label: String(plantingYear), });

      return { plantingYear, };
    },

    async getReturnsYear(caller: Actor, year: CreatedPlantingYear): Promise<void> {
      const what = `reading planting year ${year.plantingYear}`;
      const response = await as(caller).get(`/planting-years/${year.plantingYear}`);

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { plantingYear: year.plantingYear, }, what);
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
