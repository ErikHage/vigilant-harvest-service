import { ResultSetHeader } from 'mysql2';

import { QueryPayload } from '../../database/types';
import { Plot, PlotRow } from './types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';

async function insertPlot(plot: Plot): Promise<Plot> {
  await db.execQuery({ sql: queries.plots.insert, params: rowMapper.plots.insert.toParams(plot), });

  return await getPlotById(plot.plotId);
}

/** An existing plot, by its id. An id nothing holds is a 404, and writes nothing. */
async function updatePlot(plot: Plot): Promise<Plot> {
  const result = await db.execQuery<ResultSetHeader>({ sql: queries.plots.update, params: rowMapper.plots.update.toParams(plot), });

  // mysql2 counts the rows matched, so a save that changes nothing still finds its plot
  if (result.affectedRows === 0) {
    throw new RowNotFoundError('Plot not found', { plotId: plot.plotId, });
  }

  return await getPlotById(plot.plotId);
}

async function plotExists(plotId: string): Promise<boolean> {
  return await db.execCountQuery({ sql: queries.plots.countById, params: [ plotId, ], }) > 0;
}

async function friendlyNameIsTaken(friendlyName: string): Promise<boolean> {
  return await db.execCountQuery({ sql: queries.plots.countByFriendlyName, params: [ friendlyName, ], }) > 0;
}

async function getPlotById(plotId: string): Promise<Plot> {
  const query: QueryPayload = {
    sql: queries.plots.getById,
    params: [ plotId, ],
  };

  const results: PlotRow[] = await db.execQuery<PlotRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Plot not found', { plotId, })
  }

  return rowMapper.plots.fromRow(results[0]!);
}

async function getPlots(): Promise<Plot[]> {
  const query: QueryPayload = {
    sql: queries.plots.getAll,
    params: [],
  };

  const results: PlotRow[] = await db.execQuery<PlotRow[]>(query);

  return results.map(rowMapper.plots.fromRow);
}

async function countPlantingsByPlotId(plotId: string): Promise<number> {
  const query: QueryPayload = {
    sql: queries.plots.countPlantingsByPlotId,
    params: [ plotId, ],
  };

  return await db.execCountQuery(query);
}

async function deletePlotById(plotId: string): Promise<void> {
  const query: QueryPayload = {
    sql: queries.plots.deleteById,
    params: [ plotId, ],
  };

  await db.execQuery(query);
}

export default {
  insertPlot,
  updatePlot,
  plotExists,
  friendlyNameIsTaken,
  getPlotById,
  getPlots,
  countPlantingsByPlotId,
  deletePlotById,
}
