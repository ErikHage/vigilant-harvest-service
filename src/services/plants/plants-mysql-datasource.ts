import { Plant, PlantRow } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';


async function upsertPlant(plant: Plant): Promise<Plant> {
  const query: QueryPayload = {
    sql: queries.upsertPlant,
    params: rowMapper.insert.toParams(plant),
  }

  console.log(query);

  const newVar = await db.execQuery(query);
  console.log(newVar);

  return plant;
}

async function getPlantById(plantId: string): Promise<Plant> {
  const query = {
    sql: queries.getById,
    params: [ plantId, ],
  };

  const results = await db.execQuery<PlantRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Plant not found', { plantId, })
  }

  return rowMapper.fromRow(results[0]!);
}

async function getPlants(): Promise<Plant[]> {
  const query = {
    sql: queries.getAll,
    params: [],
  };

  const results = await db.execQuery<PlantRow[]>(query);

  return results.map(rowMapper.fromRow);
}

async function deletePlantById(plantId: string): Promise<void> {
  const query = {
    sql: queries.deleteById,
    params: [ plantId, ],
  };

  await db.execQuery(query);
}

export default {
  upsertPlant,
  getPlantById,
  getPlants,
  deletePlantById,
}
