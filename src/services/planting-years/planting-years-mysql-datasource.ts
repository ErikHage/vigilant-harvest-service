import { PlantingYear, PlantingYearRow } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db from '../../database'
import rowMapper from './row-mapper';

async function insertPlantingYear(planting: PlantingYear): Promise<PlantingYear> {
  const query: QueryPayload = {
    sql: queries.plantingYears.insert,
    params: rowMapper.plantingYears.insert.toParams(planting),
  };

  await db.execQuery(query);
  return planting;
}

async function getPlantingYears(): Promise<PlantingYear[]> {
  const query: QueryPayload = {
    sql: queries.plantingYears.getAll,
    params: [],
  };

  const results: PlantingYearRow[] = await db.execQuery<PlantingYearRow[]>(query);

  return results.map(rowMapper.plantingYears.fromRow);
}

export default {
  insertPlantingYear,
  getPlantingYears,
}
