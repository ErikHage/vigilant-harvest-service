import { PlantingYear, PlantingYearRow } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import plantingQueries from '../plantings/queries';
import db, { RowNotFoundError } from '../../database';
import rowMapper from './row-mapper';

async function insertPlantingYear(plantingYear: PlantingYear, carryForwardPlantingIds: string[]): Promise<PlantingYear> {
  const plantingPlantingYearQueries: QueryPayload[] = [];

  for (const plantingId of carryForwardPlantingIds) {
    plantingPlantingYearQueries.push({
      sql: plantingQueries.yearMapping.insert,
      params: [ plantingId, plantingYear.plantingYear, ],
    });
  }

  const queriesToRun: QueryPayload[] = [
    {
      sql: queries.plantingYears.insert,
      params: rowMapper.plantingYears.insert.toParams(plantingYear),
    },
    ...plantingPlantingYearQueries,
  ];

  await db.execTransactionQuery(queriesToRun);

  return plantingYear;
}

async function getPlantingYears(): Promise<PlantingYear[]> {
  const query: QueryPayload = {
    sql: queries.plantingYears.getAll,
    params: [],
  };

  const results: PlantingYearRow[] = await db.execQuery<PlantingYearRow[]>(query);

  return results.map(rowMapper.plantingYears.fromRow);
}

async function getPlantingYear(year: number): Promise<PlantingYear> {
  const query: QueryPayload = {
    sql: queries.plantingYears.getByYear,
    params: [ year, ],
  };

  const results: PlantingYearRow[] = await db.execQuery<PlantingYearRow[]>(query);

  if (results.length != 1) {
    throw new RowNotFoundError('Planting year not found', { year, });
  }

  return rowMapper.plantingYears.fromRow(results[0]!);
}

export default {
  insertPlantingYear,
  getPlantingYears,
  getPlantingYear,
}
