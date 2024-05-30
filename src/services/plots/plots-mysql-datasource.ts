import uuid from 'uuid';

import { QueryPayload } from '../../database/types';
import { Plot, PlotRow, PlotYear, PlotYearRequest } from './types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';

const plotYearsStore = new Map<string, PlotYear>;

async function upsertPlot(plot: Plot): Promise<Plot> {
  const query: QueryPayload = {
    sql: queries.upsertPlot,
    params: rowMapper.insert.toParams(plot),
  }

  await db.execQuery(query);
  return plot;
}

async function getPlotById(plotId: string): Promise<Plot> {
  const query = {
    sql: queries.getById,
    params: [ plotId, ],
  };

  const results = await db.execQuery<PlotRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Plot not found', { plotId, })
  }

  return rowMapper.fromRow(results[0]!);
}

async function getPlots(): Promise<Plot[]> {
  const query = {
    sql: queries.getAll,
    params: [],
  };

  const results = await db.execQuery<PlotRow[]>(query);

  return results.map(rowMapper.fromRow);
}

async function deletePlotById(plotId: string): Promise<void> {
  const query = {
    sql: queries.deleteById,
    params: [ plotId, ],
  };

  await db.execQuery(query);
}

function upsertPlotYear(plotYearRequest: PlotYearRequest): PlotYear {
  const plotYear: PlotYear = {
    plotYearId: plotYearRequest.plotYearId || uuid.v4(),
    plotId: plotYearRequest.plotId,
    numRows: plotYearRequest.numRows,
    numColumns: plotYearRequest.numColumns,
    year: plotYearRequest.year,
  };

  plotYearsStore.set(plotYear.plotYearId, plotYear);
  return plotYear;
}

function getPlotYearById(plotYearId: string): PlotYear {
  if (plotYearsStore.has(plotYearId)) {
    return plotYearsStore.get(plotYearId)!;
  }
  throw new Error(`Plot year not found with id: ${plotYearId}`);
}

function getPlotYears(): PlotYear[] {
  return Array.from(plotYearsStore.values())
}

function deletePlotYearById(plotYearId: string) {
  plotYearsStore.delete(plotYearId);
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
