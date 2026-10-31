import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectListEntries,
  expectRejection,
  expectStatus,
  expectThat
} from './assertions';
import { NewHarvest } from '../support/fixtures';
import { HttpClient } from '../support/http-client';
import { CreatedHarvest, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

export type StatsType = 'Plant' | 'Planting';

export interface HarvestDetails {
  quantity: number,
  harvestType: string,
}

export interface HarvestsDriver {
  recordHarvest(caller: Actor, input: NewHarvest): Promise<CreatedHarvest>,
  resaveChangesQuantity(caller: Actor, harvest: CreatedHarvest, input: NewHarvest): Promise<void>,
  searchIncludes(caller: Actor, harvest: CreatedHarvest, year: number, details: HarvestDetails): Promise<void>,
  searchExcludes(caller: Actor, harvest: CreatedHarvest, year: number): Promise<void>,
  searchWithoutYearFailsWithServerError(caller: Actor): Promise<void>,
  summaryIncludes(caller: Actor, plantingId: string, year: number, details: HarvestDetails): Promise<void>,
  statsCountHarvests(caller: Actor, statsType: StatsType, year: number, harvests: number): Promise<void>,
  plantStatsCallThemselvesPlantingStats(caller: Actor, year: number): Promise<void>,
  recordForUnknownPlantingIsRejectedAsBadRequest(caller: Actor, input: NewHarvest): Promise<void>,
  recordWithoutHarvestsFailsWithServerError(caller: Actor): Promise<void>,
  deleteRemovesHarvest(caller: Actor, harvest: CreatedHarvest, year: number): Promise<void>,
}

export function createHarvestsDriver(client: HttpClient, registry: ResourceRegistry): HarvestsDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function search(caller: Actor, year: number, what: string) {
    const response = await as(caller).get(`/harvests/search?year=${year}`);

    expectStatus(response, status.OK, what);

    return { response, harvests: expectListEntries(response, what), };
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

    async searchWithoutYearFailsWithServerError(caller: Actor): Promise<void> {
      expectStatus(await as(caller).get('/harvests/search'), status.INTERNAL_SERVER_ERROR, 'searching harvests with no year');
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

    async recordWithoutHarvestsFailsWithServerError(caller: Actor): Promise<void> {
      expectStatus(await as(caller).put('/harvests', {}), status.INTERNAL_SERVER_ERROR, 'recording with no harvest list');
    },

    async deleteRemovesHarvest(caller: Actor, harvest: CreatedHarvest, year: number): Promise<void> {
      const what = `deleting harvest ${harvest.harvestId}`;

      expectStatus(await as(caller).del(`/harvests/${harvest.harvestId}`), status.OK, what);

      const { response, harvests, } = await search(caller, year, `${what}: re-reading ${year}`);

      expectThat(!harvests.some(each => each.harvestId === harvest.harvestId), 'no such harvest', response, what);
    },
  };
}
