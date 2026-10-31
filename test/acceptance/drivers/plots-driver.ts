import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectBodyToHaveKeys,
  expectListEntries,
  expectRejection,
  expectStatus,
  expectThat
} from './assertions';
import { NewPlot } from '../support/fixtures';
import { HttpClient } from '../support/http-client';
import { CreatedPlot, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

export interface PlotsDriver {
  createPlot(caller: Actor, input: NewPlot): Promise<CreatedPlot>,
  getReturnsPlot(caller: Actor, plot: CreatedPlot): Promise<void>,
  getIsNotFoundFor(caller: Actor): Promise<void>,
  listIncludes(caller: Actor, plot: CreatedPlot): Promise<void>,
  updateChangesLength(caller: Actor, plot: CreatedPlot, lengthInInches: number): Promise<CreatedPlot>,
  writeAnswersIsActiveAsABooleanAndReadAsANumber(caller: Actor, input: NewPlot): Promise<void>,
  updateIgnoresIsActive(caller: Actor, plot: CreatedPlot): Promise<void>,
  createOfTakenNameOverwritesTheOtherPlot(caller: Actor, plot: CreatedPlot): Promise<void>,
  deleteOfPlotInUseIsRejectedAsConflict(caller: Actor, plot: CreatedPlot): Promise<void>,
  deleteRemovesPlot(caller: Actor, plot: CreatedPlot): Promise<void>,
}

export function createPlotsDriver(client: HttpClient, registry: ResourceRegistry): PlotsDriver {
  const as = (caller: Actor): HttpClient => client.withToken(caller.token);

  const sizeOf = (plot: CreatedPlot): Record<string, unknown> => ({
    friendlyName: plot.friendlyName,
    lengthInInches: plot.lengthInInches,
    widthInInches: plot.widthInInches,
    plotType: plot.plotType,
  });

  async function createPlot(caller: Actor, input: NewPlot): Promise<CreatedPlot> {
    const what = `creating plot "${input.friendlyName}"`;
    const response = await as(caller).put('/plots', input);

    expectStatus(response, status.CREATED, what);
    expectBodyToHaveKeys(response, [ 'plotId', ], what);

    const { plotId, } = response.body as { plotId: string };

    registry.register({ kind: 'plot', path: `/plots/${plotId}`, label: input.friendlyName, });

    return { plotId, ...input, };
  }

  return {
    createPlot,

    async getReturnsPlot(caller: Actor, plot: CreatedPlot): Promise<void> {
      const what = `reading plot "${plot.friendlyName}"`;
      const response = await as(caller).get(`/plots/${plot.plotId}`);

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, sizeOf(plot), what);
    },

    async getIsNotFoundFor(caller: Actor): Promise<void> {
      expectStatus(await as(caller).get('/plots/no-such-plot'), status.NOT_FOUND, 'reading a plot that does not exist');
    },

    async listIncludes(caller: Actor, plot: CreatedPlot): Promise<void> {
      const what = `finding plot "${plot.friendlyName}" in the list`;
      const response = await as(caller).get('/plots');

      expectStatus(response, status.OK, what);
      expectThat(expectListEntries(response, what).some(entry => entry.plotId === plot.plotId), 'the plot listed', response, what);
    },

    async updateChangesLength(caller: Actor, plot: CreatedPlot, lengthInInches: number): Promise<CreatedPlot> {
      const what = `updating plot "${plot.friendlyName}"`;
      const updated = { ...plot, lengthInInches, };
      const response = await as(caller).put('/plots', updated);

      expectStatus(response, status.OK, what);

      return updated;
    },

    async writeAnswersIsActiveAsABooleanAndReadAsANumber(caller: Actor, input: NewPlot): Promise<void> {
      const what = `comparing the write and read of plot "${input.friendlyName}"`;
      const response = await as(caller).put('/plots', input);

      expectStatus(response, status.CREATED, what);

      const { plotId, } = response.body as { plotId: string };

      registry.register({ kind: 'plot', path: `/plots/${plotId}`, label: input.friendlyName, });
      expectBodyToContain(response, { isActive: true, }, what);
      expectBodyToContain(await as(caller).get(`/plots/${plotId}`), { isActive: 1, }, what);
    },

    async updateIgnoresIsActive(caller: Actor, plot: CreatedPlot): Promise<void> {
      const what = `deactivating plot "${plot.friendlyName}"`;
      const response = await as(caller).put('/plots', { ...plot, isActive: false, });

      expectStatus(response, status.OK, what);
      expectBodyToContain(await as(caller).get(`/plots/${plot.plotId}`), { isActive: 1, }, what);
    },

    async createOfTakenNameOverwritesTheOtherPlot(caller: Actor, plot: CreatedPlot): Promise<void> {
      const what = `creating a second plot named "${plot.friendlyName}"`;
      const response = await as(caller).put('/plots', { ...plot, plotId: undefined, lengthInInches: 1, });

      expectStatus(response, status.CREATED, what);

      const { plotId, } = response.body as { plotId: string };

      expectStatus(await as(caller).get(`/plots/${plotId}`), status.NOT_FOUND, `${what}: reading the id it answered with`);
      expectBodyToContain(await as(caller).get(`/plots/${plot.plotId}`), { lengthInInches: 1, }, `${what}: reading the other plot`);
    },

    async deleteOfPlotInUseIsRejectedAsConflict(caller: Actor, plot: CreatedPlot): Promise<void> {
      const what = `deleting plot "${plot.friendlyName}" while a planting is in it`;

      expectRejection(await as(caller).del(`/plots/${plot.plotId}`), status.CONFLICT, 'Plot has plantings', what);
      expectStatus(await as(caller).get(`/plots/${plot.plotId}`), status.OK, `${what}: re-reading it`);
    },

    async deleteRemovesPlot(caller: Actor, plot: CreatedPlot): Promise<void> {
      const what = `deleting plot "${plot.friendlyName}"`;

      expectStatus(await as(caller).del(`/plots/${plot.plotId}`), status.OK, what);
      expectStatus(await as(caller).get(`/plots/${plot.plotId}`), status.NOT_FOUND, `${what}: re-reading it`);
    },
  };
}
