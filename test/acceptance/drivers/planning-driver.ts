import { Actor } from '../support/actors';
import { expectRejection, expectStatus, expectThat } from './assertions';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedPlanting } from '../support/resources';
import { status } from '../support/status-codes';

interface PlanningBody {
  toStart: { plantings: { plantingId: string }[] },
  toPlant: { plantings: { plantingId: string }[] },
}

export interface PlanningDriver {
  toStartIncludes(caller: Actor, planting: CreatedPlanting): Promise<void>,
  toPlantIncludes(caller: Actor, planting: CreatedPlanting): Promise<void>,
  getIsNotFoundFor(caller: Actor): Promise<void>,
  getForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void>,
}

export function createPlanningDriver(client: HttpClient): PlanningDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function plan(caller: Actor, planting: CreatedPlanting, what: string): Promise<ApiResponse> {
    const response = await as(caller).get(`/planning/${planting.plantingYear}`);

    expectStatus(response, status.OK, what);

    return response;
  }

  return {
    async toStartIncludes(caller: Actor, planting: CreatedPlanting): Promise<void> {
      const what = `finding "${planting.name}" among the plantings to start`;
      const response = await plan(caller, planting, what);
      const { toStart, } = response.body as PlanningBody;

      expectThat(toStart.plantings.some(each => each.plantingId === planting.plantingId), 'the planting to start', response, what);
    },

    async toPlantIncludes(caller: Actor, planting: CreatedPlanting): Promise<void> {
      const what = `finding "${planting.name}" among the plantings to plant`;
      const response = await plan(caller, planting, what);
      const { toPlant, } = response.body as PlanningBody;

      expectThat(toPlant.plantings.some(each => each.plantingId === planting.plantingId), 'the planting to plant', response, what);
    },

    async getIsNotFoundFor(caller: Actor): Promise<void> {
      expectStatus(await as(caller).get('/planning/8999'), status.NOT_FOUND, 'planning a year that does not exist');
    },

    async getForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void> {
      expectRejection(
        await as(caller).get('/planning/not-a-year'),
        status.BAD_REQUEST,
        'plantingYear must be an integer',
        'planning a year that is not a number'
      );
    },
  };
}
