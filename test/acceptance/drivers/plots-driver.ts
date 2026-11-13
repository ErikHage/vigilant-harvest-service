import { Actor } from '../support/actors';
import {
  expectBodyToContain,
  expectBodyToHaveKeys,
  expectListEntries,
  expectRejection,
  expectStatus,
  expectThat
} from './assertions';
import { NewPlot, tooLong, withoutField } from '../support/fixtures';
import { ApiResponse, HttpClient } from '../support/http-client';
import { CreatedPlot, ResourceRegistry } from '../support/resources';
import { status } from '../support/status-codes';

/** Ways a plot can be wrong. Each is a test of its own. */
export const PLOT_PROBLEMS = [
  'no name',
  'a name that is too long',
  'no length',
  'a length that is not a whole number',
  'a negative width',
  'no plot type',
  'an isActive that is not true or false',
] as const;

export type PlotProblem = (typeof PLOT_PROBLEMS)[number];

const invalidPlots: Record<PlotProblem, { body: (good: NewPlot) => object, reason: string }> = {
  'no name': { body: good => withoutField(good, 'friendlyName'), reason: 'friendlyName is required', },
  'a name that is too long': {
    body: good => ({ ...good, friendlyName: tooLong(255), }),
    reason: 'friendlyName must be at most 255 characters',
  },
  'no length': { body: good => withoutField(good, 'lengthInInches'), reason: 'lengthInInches is required', },
  'a length that is not a whole number': {
    body: good => ({ ...good, lengthInInches: 12.5, }),
    reason: 'lengthInInches must be an integer',
  },
  'a negative width': { body: good => ({ ...good, widthInInches: -1, }), reason: 'widthInInches must be at least 0', },
  'no plot type': { body: good => withoutField(good, 'plotType'), reason: 'plotType is required', },
  'an isActive that is not true or false': {
    body: good => ({ ...good, isActive: 'yes', }),
    reason: 'isActive must be true or false',
  },
};

export interface PlotsDriver {
  createPlot(caller: Actor, input: NewPlot): Promise<CreatedPlot>,
  getReturnsPlot(caller: Actor, plot: CreatedPlot): Promise<void>,
  getIsNotFoundFor(caller: Actor): Promise<void>,
  listIncludes(caller: Actor, plot: CreatedPlot): Promise<void>,
  updateChangesLength(caller: Actor, plot: CreatedPlot, lengthInInches: number): Promise<CreatedPlot>,
  /** A new plot, sent without isActive: the write and a read both answer it as true. */
  writeAndReadAnswerIsActiveAsABoolean(caller: Actor, input: NewPlot): Promise<void>,
  updateDeactivatesPlot(caller: Actor, plot: CreatedPlot): Promise<void>,
  /** isActive sent as 0, then 1, as the app sends back the number it once read. */
  updateWithIsActiveAsANumberSucceeds(caller: Actor, plot: CreatedPlot): Promise<void>,
  /** Rejected, and the plot holding the name is unchanged. */
  createOfTakenNameIsRejectedAsBadRequest(caller: Actor, plot: CreatedPlot): Promise<void>,
  /** Rejected, and both plots keep their names. */
  renameToTakenNameIsRejectedAsConflict(caller: Actor, plot: CreatedPlot, taken: CreatedPlot): Promise<void>,
  /** Rejected, and nothing is written under the id. */
  saveUnderUnknownIdIsRejectedAsNotFound(caller: Actor, input: NewPlot): Promise<void>,
  deleteOfPlotInUseIsRejectedAsConflict(caller: Actor, plot: CreatedPlot): Promise<void>,
  deleteRemovesPlot(caller: Actor, plot: CreatedPlot): Promise<void>,
  saveOfInvalidPlotIsRejectedAsBadRequest(caller: Actor, good: NewPlot, problem: PlotProblem): Promise<void>,
  saveAsTheAppSendsItSucceeds(caller: Actor, good: NewPlot): Promise<void>,
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

  /**
   * Files a plot for teardown if a save made one, before anything asserts on it. Any success counts:
   * a new plot sent with plotId '' used to answer 200, not 201.
   */
  function registerIfCreated(response: ApiResponse, label: string): void {
    if (response.status === status.CREATED || response.status === status.OK) {
      registry.register({ kind: 'plot', path: `/plots/${(response.body as { plotId: string }).plotId}`, label, });
    }
  }

  return {
    createPlot,

    async saveOfInvalidPlotIsRejectedAsBadRequest(caller: Actor, good: NewPlot, problem: PlotProblem): Promise<void> {
      const { body, reason, } = invalidPlots[problem];
      const response = await as(caller).put('/plots', body(good));

      registerIfCreated(response, good.friendlyName);
      expectRejection(response, status.BAD_REQUEST, reason, `saving a plot with ${problem}`);
    },

    async saveAsTheAppSendsItSucceeds(caller: Actor, good: NewPlot): Promise<void> {
      const what = `saving plot "${good.friendlyName}" as the app sends it`;
      // The app's plot dialog starts a new plot with plotId '', and no isActive: plots don't retire (B24).
      const response = await as(caller).put('/plots', { ...good, plotId: '', });

      registerIfCreated(response, good.friendlyName);
      expectStatus(response, status.CREATED, what);
      expectBodyToContain(response, { isActive: true, }, what);
    },

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

    async writeAndReadAnswerIsActiveAsABoolean(caller: Actor, input: NewPlot): Promise<void> {
      const what = `comparing the write and read of plot "${input.friendlyName}"`;
      const response = await as(caller).put('/plots', input);

      registerIfCreated(response, input.friendlyName);
      expectStatus(response, status.CREATED, what);

      const { plotId, } = response.body as { plotId: string };

      expectBodyToContain(response, { isActive: true, }, what);
      expectBodyToContain(await as(caller).get(`/plots/${plotId}`), { isActive: true, }, `${what}: reading it`);
    },

    async updateDeactivatesPlot(caller: Actor, plot: CreatedPlot): Promise<void> {
      const what = `deactivating plot "${plot.friendlyName}"`;
      const response = await as(caller).put('/plots', { ...plot, isActive: false, });

      expectStatus(response, status.OK, what);
      expectBodyToContain(response, { isActive: false, }, what);
      expectBodyToContain(await as(caller).get(`/plots/${plot.plotId}`), { isActive: false, }, `${what}: reading it`);
    },

    async updateWithIsActiveAsANumberSucceeds(caller: Actor, plot: CreatedPlot): Promise<void> {
      for (const [ sent, read, ] of [ [ 0, false, ], [ 1, true, ], ] as const) {
        const what = `saving plot "${plot.friendlyName}" with isActive ${sent}`;

        expectStatus(await as(caller).put('/plots', { ...plot, isActive: sent, }), status.OK, what);
        expectBodyToContain(await as(caller).get(`/plots/${plot.plotId}`), { isActive: read, }, `${what}: reading it`);
      }
    },

    async createOfTakenNameIsRejectedAsBadRequest(caller: Actor, plot: CreatedPlot): Promise<void> {
      const what = `creating a second plot named "${plot.friendlyName}"`;
      const response = await as(caller).put('/plots', { ...plot, plotId: undefined, lengthInInches: 1, });

      registerIfCreated(response, plot.friendlyName);
      expectRejection(response, status.BAD_REQUEST, 'Friendly name already in use', what);
      expectBodyToContain(await as(caller).get(`/plots/${plot.plotId}`), sizeOf(plot), `${what}: reading the other plot`);
    },

    async renameToTakenNameIsRejectedAsConflict(caller: Actor, plot: CreatedPlot, taken: CreatedPlot): Promise<void> {
      const what = `renaming plot "${plot.friendlyName}" to "${taken.friendlyName}"`;
      const response = await as(caller).put('/plots', { ...plot, friendlyName: taken.friendlyName, });

      expectRejection(response, status.CONFLICT, 'duplicate entry', what);
      expectBodyToContain(await as(caller).get(`/plots/${plot.plotId}`), sizeOf(plot), `${what}: reading it`);
      expectBodyToContain(await as(caller).get(`/plots/${taken.plotId}`), sizeOf(taken), `${what}: reading the other plot`);
    },

    async saveUnderUnknownIdIsRejectedAsNotFound(caller: Actor, input: NewPlot): Promise<void> {
      const what = `saving plot "${input.friendlyName}" under an id that does not exist`;
      const response = await as(caller).put('/plots', { ...input, plotId: 'no-such-plot', });

      if (response.status === status.OK || response.status === status.CREATED) {
        registry.register({ kind: 'plot', path: '/plots/no-such-plot', label: input.friendlyName, });
      }
      expectStatus(response, status.NOT_FOUND, what);
      expectStatus(await as(caller).get('/plots/no-such-plot'), status.NOT_FOUND, `${what}: reading the id`);
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
