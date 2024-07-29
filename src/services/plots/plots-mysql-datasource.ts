import { QueryPayload } from '../../database/types';
import { Plot, PlotRow } from './types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';

async function upsertPlot(plot: Plot): Promise<Plot> {
  const query: QueryPayload = {
    sql: queries.plots.upsert,
    params: rowMapper.plots.insert.toParams(plot),
  }

  await db.execQuery(query);
  return plot;
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

async function deletePlotById(plotId: string): Promise<void> {
  const query: QueryPayload = {
    sql: queries.plots.deleteById,
    params: [ plotId, ],
  };

  await db.execQuery(query);
}

export default {
  upsertPlot,
  getPlotById,
  getPlots,
  deletePlotById,
}
