import { optional, parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { actor, alias } from './params';
import { aPlot, fixtureName } from '../support/fixtures';
import { PLOT_PROBLEMS, PlotsDriver } from '../drivers/plots-driver';
import { World } from './world';

export interface PlotsDsl {
  /** `as`, `plot`, the alias, optional `lengthInInches`. */
  createPlot(...args: string[]): Promise<void>,
  /** `as`, `plot`. Asserts a read matches what it was last saved with. */
  checkPlot(...args: string[]): Promise<void>,
  /** `as`, `plot`. */
  checkListed(...args: string[]): Promise<void>,
  /** `as`, `plot`, `lengthInInches`. */
  updatePlot(...args: string[]): Promise<void>,
  /** `as`. */
  checkUnknownPlotIsNotFound(...args: string[]): Promise<void>,
  /** `as`. Compares what a write answers with what a read then reports. */
  checkIsActiveIsConsistent(...args: string[]): Promise<void>,
  /** `as`, `plot`. */
  checkPlotCanBeDeactivated(...args: string[]): Promise<void>,
  /** `as`, `plot`. Asserts a second plot under its name is rejected. */
  checkTakenNameIsRejected(...args: string[]): Promise<void>,
  /** `as`, `plot`. Asserts the delete is rejected while a planting is in it. */
  checkDeleteIsRejectedWhileInUse(...args: string[]): Promise<void>,
  /** `as`, `plot`. Asserts it is gone. */
  deletePlot(...args: string[]): Promise<void>,
  /** `as`, `problem`, one of the driver's PLOT_PROBLEMS. */
  checkInvalidPlotIsRejected(...args: string[]): Promise<void>,
  /** `as`. Saves a new plot the way vigilant-harvest-app's dialog does. */
  checkPlotAsTheAppSendsItIsAccepted(...args: string[]): Promise<void>,
}

export function createPlotsDsl(world: World, plots: PlotsDriver): PlotsDsl {
  return {
    async createPlot(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plot: alias(), lengthInInches: optional().asInteger(), });
      const caller = await world.actorFor(params.as);
      const input = aPlot({
        friendlyName: fixtureName(params.plot),
        ...(params.lengthInInches === undefined ? {} : { lengthInInches: params.lengthInInches, }),
      });

      world.namePlot(params.plot, await plots.createPlot(caller, input));
    },

    async checkPlot(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plot: alias(), });

      await plots.getReturnsPlot(await world.actorFor(params.as), world.plotNamed(params.plot));
    },

    async checkListed(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plot: alias(), });

      await plots.listIncludes(await world.actorFor(params.as), world.plotNamed(params.plot));
    },

    async updatePlot(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plot: alias(), lengthInInches: alias().asInteger(), });
      const caller = await world.actorFor(params.as);

      world.namePlot(
        params.plot,
        await plots.updateChangesLength(caller, world.plotNamed(params.plot), params.lengthInInches)
      );
    },

    async checkUnknownPlotIsNotFound(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await plots.getIsNotFoundFor(await world.actorFor(params.as));
    },

    async checkIsActiveIsConsistent(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await plots.writeAnswersIsActiveAsABooleanAndReadAsANumber(await world.actorFor(params.as), aPlot());
    },

    async checkPlotCanBeDeactivated(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plot: alias(), });

      await plots.updateIgnoresIsActive(await world.actorFor(params.as), world.plotNamed(params.plot));
    },

    async checkTakenNameIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plot: alias(), });

      await plots.createOfTakenNameOverwritesTheOtherPlot(await world.actorFor(params.as), world.plotNamed(params.plot));
    },

    async checkDeleteIsRejectedWhileInUse(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plot: alias(), });

      await plots.deleteOfPlotInUseIsRejectedAsConflict(await world.actorFor(params.as), world.plotNamed(params.plot));
    },

    async checkInvalidPlotIsRejected(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), problem: required().allowedValues(...PLOT_PROBLEMS), });

      await plots.saveOfInvalidPlotIsRejectedAsBadRequest(await world.actorFor(params.as), aPlot(), params.problem);
    },

    async checkPlotAsTheAppSendsItIsAccepted(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), });

      await plots.saveAsTheAppSendsItSucceeds(await world.actorFor(params.as), aPlot());
    },

    async deletePlot(...args: string[]): Promise<void> {
      const params = parseDslArgs(args, { as: actor(), plot: alias(), });

      await plots.deleteRemovesPlot(await world.actorFor(params.as), world.plotNamed(params.plot));
    },
  };
}
