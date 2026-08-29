import { HarvestType, HarvestTypeRow } from './types';

import queries from './queries';
import db from '../../database'
import rowMapper from './row-mapper';

async function getHarvestTypes(): Promise<HarvestType[]> {
  const query = {
    sql: queries.getAll,
    params: [],
  };

  const results = await db.execQuery<HarvestTypeRow[]>(query);

  return results.map(rowMapper.fromRow);
}

export default {
  getHarvestTypes,
}
