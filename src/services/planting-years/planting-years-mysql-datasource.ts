import { NewPlantingYear, PlantingYear, PlantingYearRow, PlantingYearUsage, PlantingYearUsageRow } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import plantingQueries from '../plantings/queries';
import db, { RowNotFoundError } from '../../database';
import rowMapper from './row-mapper';

async function insertPlantingYear(plantingYear: NewPlantingYear, carryForwardPlantingIds: string[]): Promise<PlantingYear> {
  const carryForwardQueries: QueryPayload[] = [];

  for (const plantingId of carryForwardPlantingIds) {
    carryForwardQueries.push(
      {
        sql: plantingQueries.yearMapping.insert,
        params: [ plantingId, plantingYear.plantingYear, ],
      },
      {
        sql: plantingQueries.yearMapping.setCurrentYear,
        params: [ plantingYear.plantingYear, plantingId, ],
      }
    );
  }

  const queriesToRun: QueryPayload[] = [
    {
      sql: queries.plantingYears.insert,
      params: rowMapper.plantingYears.insert.toParams(plantingYear),
    },
    ...carryForwardQueries,
  ];

  await db.execTransactionQuery(queriesToRun);

  // read back, so a new year is returned the way every other read returns one
  return await getPlantingYear(plantingYear.plantingYear);
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

async function getPlantingYearUsage(year: number): Promise<PlantingYearUsage> {
  const query: QueryPayload = {
    sql: queries.plantingYears.getUsage,
    params: [ year, year, year, year, year, ],
  };

  const results: PlantingYearUsageRow[] = await db.execQuery<PlantingYearUsageRow[]>(query);
  const row = results[0]!;

  return {
    plantings: Number(row.plantings),
    plantingMappings: Number(row.planting_mappings),
    harvests: Number(row.harvests),
    journalEntries: Number(row.journal_entries),
    activityLogEntries: Number(row.activity_log_entries),
  };
}

async function deletePlantingYear(year: number): Promise<void> {
  const query: QueryPayload = {
    sql: queries.plantingYears.deleteByYear,
    params: [ year, ],
  };

  await db.execQuery(query);
}

export default {
  insertPlantingYear,
  getPlantingYears,
  getPlantingYear,
  getPlantingYearUsage,
  deletePlantingYear,
}
