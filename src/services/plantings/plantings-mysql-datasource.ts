import { Planting, PlantingRow, PlotPlantingRow } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';

async function upsertPlanting(planting: Planting): Promise<Planting> {
  const queriesToExecute: QueryPayload[] = [
    {
      sql: queries.plantings.upsert,
      params: rowMapper.plantings.upsert.toParams(planting),
    },
  ];

  queriesToExecute.push({
    sql: queries.plotPlantings.deleteByPlantingId,
    params: [ planting.plantingId, ],
  });

  for (let i = 0; i < planting.coordinates.length; i++) {
    queriesToExecute.push({
      sql: queries.plotPlantings.insert,
      params: rowMapper.plotPlantings.insert.toParams(planting.coordinates[i]!),
    });
  }

  await db.execTransactionQuery(queriesToExecute);
  return planting;
}

async function getPlantingById(plantingId: string): Promise<Planting> {
  const query: QueryPayload = {
    sql: queries.plantings.getById,
    params: [ plantingId, ],
  };

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Planting not found', { plantingId, })
  }

  const planting: Planting = rowMapper.plantings.fromRow(results[0]!);

  const coordinates: PlotPlantingRow[] = await db.execQuery<PlotPlantingRow[]>({
    sql: queries.plotPlantings.getByPlantingId,
    params: [ planting.plantingId, ],
  });

  planting.coordinates = coordinates.map(rowMapper.plotPlantings.fromRow);

  return planting;
}

async function getPlantings(): Promise<Planting[]> {
  const query: QueryPayload = {
    sql: queries.plantings.getAll,
    params: [],
  };

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);

  return results.map(rowMapper.plantings.fromRow);
}

async function deletePlantingById(plantingId: string): Promise<void> {
  const queriesToExecute: QueryPayload[] = [
    {
      sql: queries.plantings.deleteById,
      params: [ plantingId, ],
    },
    {
      sql: queries.plotPlantings.deleteByPlantingId,
      params: [ plantingId, ],
    },
  ];

  await db.execTransactionQuery(queriesToExecute);
}

export default {
  upsertPlanting,
  getPlantingById,
  getPlantings,
  deletePlantingById,
}
