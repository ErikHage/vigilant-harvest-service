import { QueryPayload } from '../../database/types';
import { Plot, PlotRow, PlotYear, PlotYearRow } from './types';

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

async function upsertPlotYear(plotYear: PlotYear): Promise<PlotYear> {
  const query: QueryPayload = {
    sql: queries.plotYears.upsert,
    params: rowMapper.plotYears.insert.toParams(plotYear),
  };

  await db.execQuery(query);
  return plotYear;
}

async function getPlotYearById(plotYearId: string): Promise<PlotYear> {
  const query: QueryPayload = {
    sql: queries.plotYears.getById,
    params: [ plotYearId, ],
  };

  const results: PlotYearRow[] = await db.execQuery<PlotYearRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Plot Year not found', { plotYearId, })
  }

  return rowMapper.plotYears.fromRow(results[0]!);
}

async function getPlotYears(): Promise<PlotYear[]> {
  const query: QueryPayload = {
    sql: queries.plotYears.getAll,
    params: [],
  };

  const results: PlotYearRow[] = await db.execQuery<PlotYearRow[]>(query);

  return results.map(rowMapper.plotYears.fromRow);
}

async function deletePlotYearById(plotYearId: string): Promise<void> {
  const query: QueryPayload = {
    sql: queries.plotYears.deleteById,
    params: [ plotYearId, ],
  };

  await db.execQuery(query);
}

export default {
  upsertPlot,
  getPlotById,
  getPlots,
  deletePlotById,
  upsertPlotYear,
  getPlotYearById,
  getPlotYears,
  deletePlotYearById,
}
