import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectCount,
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
  /** Checked when given: the day exactly as it was sent. */
  harvestDate?: string,
}

/** A year's stats, as the days its harvests fall on. */
export interface StatsDays {
  firstHarvestDate: string,
  lastHarvestDate: string,
  numberOfDays: number,
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
  'a date in UTC',
  'a date with an offset',
  'a date with a time',
  'a day that does not exist',
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
  // quantity is a DECIMAL(8,2) column
  'a quantity too large to store': {
    body: good => ({ harvests: [ { ...good, quantity: 1000000, }, ], }),
    reason: 'harvests[0].quantity must be at most 999999.99',
  },
  'no date': {
    body: good => ({ harvests: [ withoutField(good, 'harvestDate'), ], }),
    reason: 'harvests[0].harvestDate is required',
  },
  'an unparseable date': {
    body: good => ({ harvests: [ { ...good, harvestDate: 'not-a-date', }, ], }),
    reason: 'harvests[0].harvestDate must be a date',
  },
  // a harvest date is the user's own day, so an instant is refused rather than guessed at
  'a date in UTC': {
    body: good => ({ harvests: [ { ...good, harvestDate: '2026-07-01T04:00:00.000Z', }, ], }),
    reason: 'harvests[0].harvestDate must be a local time, with no Z or offset',
  },
  'a date with an offset': {
    body: good => ({ harvests: [ { ...good, harvestDate: '2026-07-01T00:00:00-04:00', }, ], }),
    reason: 'harvests[0].harvestDate must be a local time, with no Z or offset',
  },
  'a date with a time': {
    body: good => ({ harvests: [ { ...good, harvestDate: '2026-07-01T12:00:00', }, ], }),
    reason: 'harvests[0].harvestDate must be a date, as YYYY-MM-DD',
  },
  'a day that does not exist': {
    body: good => ({ harvests: [ { ...good, harvestDate: '2026-02-30', }, ], }),
    reason: 'harvests[0].harvestDate must be a date, as YYYY-MM-DD',
  },
  // the harvest date is a DATE column, which holds the years 1000 to 9999
  'a date out of range': {
    body: good => ({ harvests: [ { ...good, harvestDate: '0999-07-01', }, ], }),
    reason: 'harvests[0].harvestDate must be between 1000 and 9999',
  },
  'a harvest type that is not a number': {
    body: good => ({ harvests: [ { ...good, harvestTypeId: 'abc', }, ], }),
    reason: 'harvests[0].harvestTypeId must be an integer',
  },
};

/** How a list of ids goes in a search's query: in one value, or with a key for each. */
export const ID_LIST_FORMS = [ 'separated by commas', 'as repeated keys', ] as const;

export type IdListForm = (typeof ID_LIST_FORMS)[number];

/** A year's search, narrowed by any of the rest. */
export interface SearchFilters {
  year: number,
  plantIds?: string[],
  plantingIds?: string[],
  from?: string,
  to?: string,
  idsSent?: IdListForm,
}

function searchPath(filters: SearchFilters): string {
  const pairs: [string, string][] = [ [ 'year', String(filters.year), ], ];
  const addIds = (key: string, ids: string[] | undefined): void => {
    if (ids === undefined) {
      return;
    }
    if (filters.idsSent === 'as repeated keys') {
      ids.forEach(id => pairs.push([ key, id, ]));
    } else {
      pairs.push([ key, ids.join(','), ]);
    }
  };

  addIds('plantId', filters.plantIds);
  addIds('plantingId', filters.plantingIds);
  if (filters.from !== undefined) {
    pairs.push([ 'from', filters.from, ]);
  }
  if (filters.to !== undefined) {
    pairs.push([ 'to', filters.to, ]);
  }

  return `/harvests/search?${new URLSearchParams(pairs).toString()}`;
}

function describeSearch(filters: SearchFilters): string {
  return [
    `searching ${filters.year}`,
    filters.plantIds && `for plants ${filters.plantIds.join(', ')}`,
    filters.plantingIds && `for plantings ${filters.plantingIds.join(', ')}`,
    filters.from && `from ${filters.from}`,
    filters.to && `to ${filters.to}`,
    filters.idsSent,
  ].filter(Boolean).join(' ');
}

/** Ways a search can be wrong. Each is a test of its own. */
export const HARVEST_SEARCH_PROBLEMS = [
  'a blank plant',
  'a blank planting in a list',
  'a plant id that is too long',
  'an unparseable from',
  'a from with a time',
  'a to with an offset',
  'a to out of range',
  'a from after its to',
  'both plants and plantings',
] as const;

export type HarvestSearchProblem = (typeof HARVEST_SEARCH_PROBLEMS)[number];

/** For each problem: the query after the year, and the reason the service gives. */
const invalidSearches: Record<HarvestSearchProblem, { query: string, reason: string }> = {
  'a blank plant': { query: 'plantId=', reason: 'plantId[0] is required', },
  // a stray comma could otherwise quietly widen the search
  'a blank planting in a list': { query: 'plantingId=a,,b', reason: 'plantingId[1] is required', },
  // ids are VARCHAR(36)
  'a plant id that is too long': {
    query: `plantId=${tooLong(36)}`,
    reason: 'plantId[0] must be at most 36 characters',
  },
  'an unparseable from': { query: 'from=not-a-date', reason: 'from must be a date, as YYYY-MM-DD', },
  'a from with a time': { query: 'from=2026-07-01T12:00:00', reason: 'from must be a date, as YYYY-MM-DD', },
  'a to with an offset': {
    query: `to=${encodeURIComponent('2026-07-01T00:00:00-04:00')}`,
    reason: 'to must be a local time, with no Z or offset',
  },
  'a to out of range': { query: 'to=0999-07-01', reason: 'to must be between 1000 and 9999', },
  'a from after its to': { query: 'from=2026-07-02&to=2026-07-01', reason: 'from must be on or before to', },
  'both plants and plantings': {
    query: 'plantId=a&plantingId=b',
    reason: 'plantId and plantingId can\'t be used together',
  },
};

export interface HarvestsDriver {
  recordHarvest(caller: Actor, input: NewHarvest): Promise<CreatedHarvest>,
  /** Sends every harvest in one save. Answers with the harvest the first was written to. */
  recordHarvestsInOneSave(caller: Actor, inputs: NewHarvest[]): Promise<CreatedHarvest>,
  /** Sends each harvest in a save of its own, all at once. Answers with the harvest the first was written to. */
  recordHarvestsInSavesAtOnce(caller: Actor, inputs: NewHarvest[]): Promise<CreatedHarvest>,
  resaveChangesQuantity(caller: Actor, harvest: CreatedHarvest, input: NewHarvest): Promise<void>,
  /** A new harvest answers 201; the same again, added to it, and an edit of it, answer 200. */
  saveAnswersCreatedOnlyForANewHarvest(caller: Actor, input: NewHarvest): Promise<void>,
  /** Saves each harvest again under its own id, all in one save: the nth harvest with the nth input. */
  resaveInOneSave(caller: Actor, harvests: CreatedHarvest[], inputs: NewHarvest[]): Promise<void>,
  searchIncludes(caller: Actor, harvest: CreatedHarvest, year: number, details: HarvestDetails): Promise<void>,
  searchExcludes(caller: Actor, harvest: CreatedHarvest, year: number): Promise<void>,
  searchWithoutYearIsRejectedAsBadRequest(caller: Actor): Promise<void>,
  /**
   * Narrowed to plants or plantings the spec made, so nothing else can match: asserts the search
   * answers exactly these harvests.
   */
  searchFindsOnly(caller: Actor, filters: SearchFilters, harvests: CreatedHarvest[]): Promise<void>,
  /**
   * Narrowed by day alone, so other harvests of the year may match: asserts every harvest answered
   * is within the days, and that it finds the one and leaves out the other.
   */
  searchKeepsToTheDays(caller: Actor, filters: SearchFilters, found: CreatedHarvest[], missed: CreatedHarvest[]): Promise<void>,
  searchWithInvalidFiltersIsRejectedAsBadRequest(caller: Actor, year: number, problem: HarvestSearchProblem): Promise<void>,
  /** Asserts how many harvests the planting has under the year, whatever their days and types. */
  searchCountsHarvestsOfPlanting(caller: Actor, plantingId: string, year: number, harvests: number): Promise<void>,
  /** Search, summary and stats each reject a year that isn't a number, naming the parameter. */
  queriesOfNonNumericYearAreRejectedAsBadRequest(caller: Actor): Promise<void>,
  summaryIncludes(caller: Actor, plantingId: string, year: number, details: HarvestDetails): Promise<void>,
  statsCountHarvests(caller: Actor, statsType: StatsType, year: number, harvests: number): Promise<void>,
  /** The year is the spec's own, so it holds one item: asserts that item's total quantity. */
  statsReportTotal(caller: Actor, statsType: StatsType, year: number, totalQuantity: number): Promise<void>,
  statsReportDays(caller: Actor, statsType: StatsType, year: number, days: StatsDays): Promise<void>,
  plantStatsCallThemselvesPlantStats(caller: Actor, year: number): Promise<void>,
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

  /**
   * Files whatever a save answered with for teardown, before anything asserts on it. A save adding to
   * a harvest answers 200 with that harvest, and deleting the same id twice does no harm.
   */
  function registerIfCreated(response: ApiResponse): void {
    if ((response.status === status.CREATED || response.status === status.OK) && Array.isArray(response.body)) {
      for (const { harvestId, } of response.body as { harvestId: string }[]) {
        registry.register({ kind: 'harvest', path: `/harvests/${harvestId}`, label: harvestId, });
      }
    }
  }

  return {
    async recordHarvest(caller: Actor, input: NewHarvest): Promise<CreatedHarvest> {
      const what = `recording ${input.quantity} from planting ${input.plantingId}`;
      const response = await as(caller).put('/harvests', { harvests: [ input, ], });

      // 201 for a new harvest, 200 when it was added to one on its day and type: the specs that fold
      // harvests record them with this too, and saveAnswersCreatedOnlyForANewHarvest checks which
      expectThat(
        response.status === status.CREATED || response.status === status.OK,
        'status 201, or 200 when added to another harvest',
        response,
        what
      );

      const [ written, ] = expectListEntries(response, what);
      const harvestId = written?.harvestId as string;

      // A harvest merged into another answers with that one's id, and deleting
      // the same id twice does no harm.
      registry.register({ kind: 'harvest', path: `/harvests/${harvestId}`, label: harvestId, });

      return { harvestId, plantingId: input.plantingId, };
    },

    async recordHarvestsInOneSave(caller: Actor, inputs: NewHarvest[]): Promise<CreatedHarvest> {
      const what = `recording ${inputs.map(input => input.quantity).join(' and ')} from planting ${inputs[0]!.plantingId} in one save`;
      const response = await as(caller).put('/harvests', { harvests: inputs, });

      registerIfCreated(response);
      expectStatus(response, status.CREATED, what);

      const [ written, ] = expectListEntries(response, what);

      return { harvestId: written?.harvestId as string, plantingId: inputs[0]!.plantingId, };
    },

    async recordHarvestsInSavesAtOnce(caller: Actor, inputs: NewHarvest[]): Promise<CreatedHarvest> {
      const what = `recording ${inputs.map(input => input.quantity).join(' and ')} from planting ${inputs[0]!.plantingId} in saves at once`;
      const responses = await Promise.all(inputs.map(input => as(caller).put('/harvests', { harvests: [ input, ], })));

      responses.forEach(registerIfCreated);
      // one of them made the harvest, and each of the others added to it
      expectThat(
        responses.filter(response => response.status === status.CREATED).length === 1
          && responses.filter(response => response.status === status.OK).length === responses.length - 1,
        `one save answered 201, and the other ${responses.length - 1} answered 200`,
        responses[0]!,
        `${what}: ${responses.map(response => response.status).join(', ')}`
      );

      const [ written, ] = expectListEntries(responses[0]!, what);

      return { harvestId: written?.harvestId as string, plantingId: inputs[0]!.plantingId, };
    },

    async searchCountsHarvestsOfPlanting(caller: Actor, plantingId: string, year: number, count: number): Promise<void> {
      const what = `counting the harvests of planting ${plantingId} under ${year}`;
      const { response, harvests, } = await search(caller, year, what);

      expectCount(harvests.filter(each => each.plantingId === plantingId).length, count, response, what);
    },

    async resaveInOneSave(caller: Actor, harvests: CreatedHarvest[], inputs: NewHarvest[]): Promise<void> {
      const what = `saving harvests ${harvests.map(harvest => harvest.harvestId).join(' and ')} again in one save`;
      const response = await as(caller).put('/harvests', {
        harvests: inputs.map((input, index) => ({ ...input, harvestId: harvests[index]!.harvestId, })),
      });

      registerIfCreated(response);
      expectStatus(response, status.OK, what);
    },

    async resaveChangesQuantity(caller: Actor, harvest: CreatedHarvest, input: NewHarvest): Promise<void> {
      const what = `saving harvest ${harvest.harvestId} again`;
      const response = await as(caller).put('/harvests', { harvests: [ { ...input, harvestId: harvest.harvestId, }, ], });

      expectStatus(response, status.OK, what);
    },

    async saveAnswersCreatedOnlyForANewHarvest(caller: Actor, input: NewHarvest): Promise<void> {
      const what = `saving ${input.quantity} from planting ${input.plantingId}`;
      const created = await as(caller).put('/harvests', { harvests: [ input, ], });

      registerIfCreated(created);
      expectStatus(created, status.CREATED, `${what}: a new harvest`);

      const [ written, ] = expectListEntries(created, what);
      const added = await as(caller).put('/harvests', { harvests: [ input, ], });

      registerIfCreated(added);
      expectStatus(added, status.OK, `${what}: again, on the same day and type`);

      const edited = await as(caller).put('/harvests', { harvests: [ { ...input, harvestId: written?.harvestId, quantity: 7, }, ], });

      expectStatus(edited, status.OK, `${what}: an edit of it`);
    },

    async searchIncludes(caller: Actor, harvest: CreatedHarvest, year: number, details: HarvestDetails): Promise<void> {
      const what = `finding harvest ${harvest.harvestId} under ${year}`;
      const { response, harvests, } = await search(caller, year, what);
      const entry = harvests.find(each => each.harvestId === harvest.harvestId);

      const onDay = details.harvestDate === undefined ? '' : ` on ${details.harvestDate}`;

      expectThat(
        entry?.quantity === details.quantity && entry.harvestType === details.harvestType
          && (details.harvestDate === undefined || entry.harvestDate === details.harvestDate),
        `the harvest, ${details.quantity} of ${details.harvestType}${onDay}`,
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

    async searchFindsOnly(caller: Actor, filters: SearchFilters, expected: CreatedHarvest[]): Promise<void> {
      const what = describeSearch(filters);
      const response = await as(caller).get(searchPath(filters));

      expectStatus(response, status.OK, what);

      const answered = expectListEntries(response, what).map(each => each.harvestId as string).sort();
      const wanted = expected.map(harvest => harvest.harvestId).sort();

      expectThat(
        answered.length === wanted.length && answered.every((id, index) => id === wanted[index]),
        wanted.length === 0 ? 'no harvests' : `exactly harvests ${wanted.join(', ')}`,
        response,
        what
      );
    },

    async searchKeepsToTheDays(
      caller: Actor,
      filters: SearchFilters,
      found: CreatedHarvest[],
      missed: CreatedHarvest[]
    ): Promise<void> {
      const what = describeSearch(filters);
      const response = await as(caller).get(searchPath(filters));

      expectStatus(response, status.OK, what);

      const harvests = expectListEntries(response, what);
      const ids = new Set(harvests.map(each => each.harvestId as string));
      // YYYY-MM-DD strings sort as the days do
      const withinTheDays = (day: string): boolean =>
        (filters.from === undefined || day >= filters.from) && (filters.to === undefined || day <= filters.to);

      expectThat(
        harvests.every(each => withinTheDays(each.harvestDate as string)),
        `only harvests from ${filters.from ?? 'any day'} to ${filters.to ?? 'any day'}`,
        response,
        what
      );
      expectThat(
        found.every(harvest => ids.has(harvest.harvestId)) && !missed.some(harvest => ids.has(harvest.harvestId)),
        `harvests ${found.map(harvest => harvest.harvestId).join(', ')}, `
          + `and not ${missed.map(harvest => harvest.harvestId).join(', ') || 'any other'}`,
        response,
        what
      );
    },

    async searchWithInvalidFiltersIsRejectedAsBadRequest(
      caller: Actor,
      year: number,
      problem: HarvestSearchProblem
    ): Promise<void> {
      const { query, reason, } = invalidSearches[problem];
      const response = await as(caller).get(`/harvests/search?year=${year}&${query}`);

      expectRejection(response, status.BAD_REQUEST, reason, `searching harvests with ${problem}`);
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

    async statsReportTotal(caller: Actor, statsType: StatsType, year: number, totalQuantity: number): Promise<void> {
      const what = `reading the total in the ${statsType} stats of ${year}`;
      const response = await as(caller).get(`/harvests/stats?type=${statsType}&year=${year}`);

      expectStatus(response, status.OK, what);

      const { stats, } = response.body as { stats: { totalQuantity: unknown }[] };

      expectCount(stats.length, 1, response, what);
      expectThat(stats[0]!.totalQuantity === totalQuantity, `a total of ${totalQuantity}`, response, what);
    },

    async statsReportDays(caller: Actor, statsType: StatsType, year: number, days: StatsDays): Promise<void> {
      const what = `reading the days in the ${statsType} stats of ${year}`;
      const response = await as(caller).get(`/harvests/stats?type=${statsType}&year=${year}`);

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { ...days, }, what);

      // the year is the spec's own, so every item is one of its harvests
      const { stats, } = response.body as { stats: { firstHarvest: unknown, lastHarvest: unknown }[] };
      expectThat(
        stats.length > 0 && stats.every(item =>
          item.firstHarvest === days.firstHarvestDate && item.lastHarvest === days.lastHarvestDate),
        `every item from ${days.firstHarvestDate} to ${days.lastHarvestDate}`,
        response,
        what
      );
    },

    async plantStatsCallThemselvesPlantStats(caller: Actor, year: number): Promise<void> {
      const what = `reading the Plant stats of ${year}`;
      const response = await as(caller).get(`/harvests/stats?type=Plant&year=${year}`);

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { statsType: 'Plant', }, what);
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
      // quantity is whatever was typed, fractions included, and its date is the user's own day.
      const response = await as(caller).put('/harvests', {
        harvests: [ {
          plantingYear: '2026',
          plantingId,
          quantity: 1.5,
          harvestDate: '2026-07-01',
        }, ],
      });

      registerIfCreated(response);
      expectStatus(response, status.CREATED, what);
    },

    async deleteRemovesHarvest(caller: Actor, harvest: CreatedHarvest, year: number): Promise<void> {
      const what = `deleting harvest ${harvest.harvestId}`;

      expectStatus(await as(caller).del(`/harvests/${harvest.harvestId}`), status.NO_CONTENT, what);

      const { response, harvests, } = await search(caller, year, `${what}: re-reading ${year}`);

      expectThat(!harvests.some(each => each.harvestId === harvest.harvestId), 'no such harvest', response, what);
    },
  };
}
