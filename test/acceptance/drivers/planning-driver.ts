import { Actor } from '../support/actors';
import { expectRejection, expectStatus, expectThat } from './assertions';
import { ApiResponse, HttpClient } from '../support/http-client';
import { PLANNING_TODAY } from '../support/fixtures';
import { CreatedPlanting } from '../support/resources';
import { status } from '../support/status-codes';

interface PlanningBody {
  currentDay: number,
  toStart: { plantings: { plantingId: string }[] },
  toPlant: { plantings: { plantingId: string }[] },
}

/** Ways the today a plan is made for can be wrong. Each is a test of its own. */
export const PLANNING_TODAY_PROBLEMS = [
  'no today',
  'a today in UTC',
  'a today with a time',
  'a today that does not exist',
] as const;

export type PlanningTodayProblem = (typeof PLANNING_TODAY_PROBLEMS)[number];

// today is the user's own day, so an instant is refused rather than guessed at
const invalidTodays: Record<PlanningTodayProblem, { query: string, reason: string }> = {
  'no today': { query: '', reason: 'today is required', },
  'a today in UTC': { query: '?today=2026-04-01T04%3A00%3A00.000Z', reason: 'today must be a local time, with no Z or offset', },
  'a today with a time': { query: '?today=2026-04-01T09%3A00%3A00', reason: 'today must be a date, as YYYY-MM-DD', },
  'a today that does not exist': { query: '?today=2026-04-31', reason: 'today must be a date, as YYYY-MM-DD', },
};

/** The plan of a year, for the user's today. */
function planPath(plantingYear: number | string, today: string = PLANNING_TODAY): string {
  return `/planning/${plantingYear}?today=${encodeURIComponent(today)}`;
}

export interface PlanningDriver {
  toStartIncludes(caller: Actor, planting: CreatedPlanting): Promise<void>,
  toPlantIncludes(caller: Actor, planting: CreatedPlanting): Promise<void>,
  getIsNotFoundFor(caller: Actor): Promise<void>,
  getForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void>,
  currentDayIs(caller: Actor, plantingYear: number, today: string, day: number): Promise<void>,
  getWithInvalidTodayIsRejectedAsBadRequest(caller: Actor, plantingYear: number, problem: PlanningTodayProblem): Promise<void>,
}

export function createPlanningDriver(client: HttpClient): PlanningDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  async function plan(caller: Actor, planting: CreatedPlanting, what: string): Promise<ApiResponse> {
    const response = await as(caller).get(planPath(planting.plantingYear));

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
      expectStatus(await as(caller).get(planPath(8999)), status.NOT_FOUND, 'planning a year that does not exist');
    },

    async getForNonNumericYearIsRejectedAsBadRequest(caller: Actor): Promise<void> {
      expectRejection(
        await as(caller).get(planPath('not-a-year')),
        status.BAD_REQUEST,
        'plantingYear must be an integer',
        'planning a year that is not a number'
      );
    },

    async currentDayIs(caller: Actor, plantingYear: number, today: string, day: number): Promise<void> {
      const what = `planning ${plantingYear} on ${today}`;
      const response = await as(caller).get(planPath(plantingYear, today));

      expectStatus(response, status.OK, what);
      expectThat((response.body as PlanningBody).currentDay === day, `currentDay ${day}`, response, what);
    },

    async getWithInvalidTodayIsRejectedAsBadRequest(
      caller: Actor,
      plantingYear: number,
      problem: PlanningTodayProblem
    ): Promise<void> {
      const { query, reason, } = invalidTodays[problem];

      expectRejection(
        await as(caller).get(`/planning/${plantingYear}${query}`),
        status.BAD_REQUEST,
        reason,
        `planning ${plantingYear} with ${problem}`
      );
    },
  };
}
