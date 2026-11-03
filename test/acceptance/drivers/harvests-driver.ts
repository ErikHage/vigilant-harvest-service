import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectListEntries,
  expectRejection,
  expectStatus,
  expectThat
} from './assertions';
import { NewHarvest, tooLong, withoutField } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedHarvest, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

export type StatsType = 'Plant' | 'Planting';

export interface HarvestDetails {
  quantity: number,
  harvestType: string,
}

/** Ways a save can be wrong. Each is a test of its own. */
export const HARVEST_SAVE_PROBLEMS = [
  'no harvest list',
  'a list that is not a list',
  'an entry that is not an object',
  'an id that is too long',
  'no planting',
  'no quantity',
  'a quantity that is not a number',
  'a quantity of zero',
  'a negative quantity',
  'a quantity too large to store',
  'no date',
  'an unparseable date',
  'a date out of range',
  'a harvest type that is not a number',
] as const;

export type HarvestSaveProblem = (typeof HARVEST_SAVE_PROBLEMS)[number];

/** For each problem: the body of a save, made from a good harvest, and the reason the service gives. */
const invalidSaves: Record<HarvestSaveProblem, { body: (good: NewHarvest) => object, reason: string }> = {
  'no harvest list': { body: () => ({}), reason: 'harvests is required', },
  'a list that is not a list': { body: good => ({ harvests: good, }), reason: 'harvests must be a list', },
  'an entry that is not an object': { body: () => ({ harvests: [ 42, ], }), reason: 'harvests[0] must be an object', },
  'an id that is too long': {
    body: good => ({ harvests: [ { ...good, harvestId: tooLong(36), }, ], }),
    reason: 'harvests[0].harvestId must be at most 36 characters',
  },
  'no planting': {
    body: good => ({ harvests: [ withoutField(good, 'plantingId'), ], }),
    reason: 'harvests[0].plantingId is required',
  },
  'no quantity': {
    body: good => ({ harvests: [ withoutField(good, 'quantity'), ], }),
    reason: 'harvests[0].quantity is required',
  },
  'a quantity that is not a number': {
    body: good => ({ harvests: [ { ...good, quantity: 'lots', }, ], }),
    reason: 'harvests[0].quantity must be a number',
  },
  'a quantity of zero': {
    body: good => ({ harvests: [ { ...good, quantity: 0, }, ], }),
    reason: 'harvests[0].quantity must be greater than 0',
  },
  'a negative quantity': {
    body: good => ({ harvests: [ { ...good, quantity: -2, }, ], }),
    reason: 'harvests[0].quantity must be greater than 0',
  },
  // quantity is an INT column
  'a quantity too large to store': {
    body: good => ({ harvests: [ { ...good, quantity: 3000000000, }, ], }),
    reason: 'harvests[0].quantity must be at most 2147483647',
  },
  'no date': {
    body: good => ({ harvests: [ withoutField(good, 'harvestDate'), ], }),
    reason: 'harvests[0].harvestDate is required',
  },
  'an unparseable date': {
    body: good => ({ harvests: [ { ...good, harvestDate: 'not-a-date', }, ], }),
    reason: 'harvests[0].harvestDate must be a date',
  },
  // the harvest date is stored in a TIMESTAMP column, which holds 1970 to 2038
  'a date out of range': {
    body: good => ({ harvests: [ { ...good, harvestDate: '1960-07-01', }, ], }),
    reason: 'harvests[0].harvestDate must be between 1971 and 2037',
  },
  'a harvest type that is not a number': {
    body: good => ({ harvests: [ { ...good, harvestTypeId: 'abc', }, ], }),
    reason: 'harvests[0].harvestTypeId must be an integer',
  },
};

export interface HarvestsDriver {
  recordHarvest(caller: Actor, input: NewHarvest): Promise<CreatedHarvest>,
  resaveChangesQuantity(caller: Actor, harvest: CreatedHarvest, input: NewHarvest): Promise<void>,
  searchIncludes(caller: Actor, harvest: CreatedHarvest, year: number, details: HarvestDetails): Promise<void>,
  searchExcludes(caller: Actor, harvest: CreatedHarvest, year: number): Promise<void>,
  searchWithoutYearIsRejectedAsBadRequest(caller: Actor): Promise<void>,
  /** Search, summary and stats each reject a year that isn't a number, naming the parameter. */
  queriesOfNonNumericYearAreRejectedAsBadRequest(caller: Actor): Promise<void>,
  summaryIncludes(caller: Actor, plantingId: string, year: number, details: HarvestDetails): Promise<void>,
  statsCountHarvests(caller: Actor, statsType: StatsType, year: number, harvests: number): Promise<void>,
  plantStatsCallThemselvesPlantingStats(caller: Actor, year: number): Promise<void>,
  recordForUnknownPlantingIsRejectedAsBadRequest(caller: Actor, input: NewHarvest): Promise<void>,
  saveOfInvalidHarvestsIsRejectedAsBadRequest(caller: Actor, good: NewHarvest, problem: HarvestSaveProblem): Promise<void>,
  saveAsTheAppSendsItSucceeds(caller: Actor, plantingId: string): Promise<void>,
  deleteRemovesHarvest(caller: Actor, harvest: CreatedHarvest, year: number): Promise<void>,
}

export function createHarvestsDriver(client: HttpClient, registry: ResourceRegistry): HarvestsDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function search(caller: Actor, year: number, what: string) {
    const response = await as(caller).get(`/harvests/search?year=${year}`);

    expectStatus(response, status.OK, what);

    return { response, harvests: expectListEntries(response, what), };
  }

  /** Files whatever a save wrote for teardown, before anything asserts on it. */
  function registerIfCreated(response: ApiResponse): void {
    if (response.status === status.CREATED && Array.isArray(response.body)) {
      for (const { harvestId, } of response.body as { harvestId: string }[]) {
        registry.register({ kind: 'harvest', path: `/harvests/${harvestId}`, label: harvestId, });
      }
    }
  }

  return {
    async recordHarvest(caller: Actor, input: NewHarvest): Promise<CreatedHarvest> {
      const what = `recording ${input.quantity} from planting ${input.plantingId}`;
      const response = await as(caller).put('/harvests', { harvests: [ input, ], });

      expectStatus(response, status.CREATED, what);

      const [ written, ] = expectListEntries(response, what);
      const harvestId = written?.harvestId as string;

      // A harvest merged into another answers with that one's id, and deleting
      // the same id twice does no harm.
      registry.register({ kind: 'harvest', path: `/harvests/${harvestId}`, label: harvestId, });

      return { harvestId, plantingId: input.plantingId, };
    },

    async resaveChangesQuantity(caller: Actor, harvest: CreatedHarvest, input: NewHarvest): Promise<void> {
      const what = `saving harvest ${harvest.harvestId} again`;
      const response = await as(caller).put('/harvests', { harvests: [ { ...input, harvestId: harvest.harvestId, }, ], });

      expectStatus(response, status.CREATED, what);
    },

    async searchIncludes(caller: Actor, harvest: CreatedHarvest, year: number, details: HarvestDetails): Promise<void> {
      const what = `finding harvest ${harvest.harvestId} under ${year}`;
      const { response, harvests, } = await search(caller, year, what);
      const entry = harvests.find(each => each.harvestId === harvest.harvestId);

      expectThat(
        entry?.quantity === details.quantity && entry.harvestType === details.harvestType,
        `the harvest, ${details.quantity} of ${details.harvestType}`,
        response,
        what
      );
    },

    async searchExcludes(caller: Actor, harvest: CreatedHarvest, year: number): Promise<void> {
      const what = `looking for harvest ${harvest.harvestId} under ${year}`;
      const { response, harvests, } = await search(caller, year, what);

      expectThat(!harvests.some(each => each.harvestId === harvest.harvestId), 'no such harvest', response, what);
    },

    async searchWithoutYearIsRejectedAsBadRequest(caller: Actor): Promise<void> {
      expectRejection(await as(caller).get('/harvests/search'), status.BAD_REQUEST, 'year is required', 'searching harvests with no year');
    },

    async queriesOfNonNumericYearAreRejectedAsBadRequest(caller: Actor): Promise<void> {
      const calls = [
        { path: '/harvests/search?year=not-a-year', field: 'year', what: 'searching harvests of a year that is not a number', },
        { path: '/harvests/summary?plantingYear=not-a-year', field: 'plantingYear', what: 'summing up a year that is not a number', },
        { path: '/harvests/stats?year=not-a-year&type=Plant', field: 'year', what: 'counting stats of a year that is not a number', },
      ];

      for (const call of calls) {
        expectRejection(await as(caller).get(call.path), status.BAD_REQUEST, `${call.field} must be an integer`, call.what);
      }
    },

    async summaryIncludes(caller: Actor, plantingId: string, year: number, details: HarvestDetails): Promise<void> {
      const what = `finding planting ${plantingId} in the harvest summary of ${year}`;
      const response = await as(caller).get(`/harvests/summary?plantingYear=${year}`);

      expectStatus(response, status.OK, what);
      expectThat(
        expectListEntries(response, what).some(each => each.plantingId === plantingId
          && each.quantity === details.quantity && each.harvestType === details.harvestType),
        `${details.quantity} of ${details.harvestType}`,
        response,
        what
      );
    },

    async statsCountHarvests(caller: Actor, statsType: StatsType, year: number, harvests: number): Promise<void> {
      const what = `reading the ${statsType} stats of ${year}`;
      const response = await as(caller).get(`/harvests/stats?type=${statsType}&year=${year}`);

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { numberOfHarvests: harvests, }, what);
    },

    async plantStatsCallThemselvesPlantingStats(caller: Actor, year: number): Promise<void> {
      const what = `reading the Plant stats of ${year}`;
      const response = await as(caller).get(`/harvests/stats?type=Plant&year=${year}`);

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { statsType: 'Planting', }, what);
    },

    async recordForUnknownPlantingIsRejectedAsBadRequest(caller: Actor, input: NewHarvest): Promise<void> {
      const what = 'recording a harvest for a planting that does not exist';
      const response = await as(caller).put('/harvests', { harvests: [ input, ], });

      expectRejection(response, status.BAD_REQUEST, `Unknown planting id(s): ${input.plantingId}`, what);
    },

    async saveOfInvalidHarvestsIsRejectedAsBadRequest(
      caller: Actor,
      good: NewHarvest,
      problem: HarvestSaveProblem
    ): Promise<void> {
      const { body, reason, } = invalidSaves[problem];
      const response = await as(caller).put('/harvests', body(good));

      registerIfCreated(response);
      expectRejection(response, status.BAD_REQUEST, reason, `saving harvests with ${problem}`);
    },

    async saveAsTheAppSendsItSucceeds(caller: Actor, plantingId: string): Promise<void> {
      const what = 'saving a harvest as the app sends it';
      // The app adds the store's plantingYear, possibly a string, which the service ignores. Its
      // quantity is whatever was typed, fractions included, and its date is a Date sent as JSON.
      const response = await as(caller).put('/harvests', {
        harvests: [ {
          plantingYear: '2026',
          plantingId,
          quantity: 1.5,
          harvestDate: '2026-07-01T04:00:00.000Z',
        }, ],
      });

      registerIfCreated(response);
      expectStatus(response, status.CREATED, what);
    },

    async deleteRemovesHarvest(caller: Actor, harvest: CreatedHarvest, year: number): Promise<void> {
      const what = `deleting harvest ${harvest.harvestId}`;

      expectStatus(await as(caller).del(`/harvests/${harvest.harvestId}`), status.OK, what);

      const { response, harvests, } = await search(caller, year, `${what}: re-reading ${year}`);

      expectThat(!harvests.some(each => each.harvestId === harvest.harvestId), 'no such harvest', response, what);
    },
  };
}
