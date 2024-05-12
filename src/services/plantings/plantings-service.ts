import { Planting, PlantingRequest } from './types';

import inMemoryDatasource from './plantings-in-memory-datasource';

async function upsertPlanting(plantingRequest: PlantingRequest): Promise<Planting> {
  try {
    return await inMemoryDatasource.upsertPlanting(plantingRequest);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

export default {
  upsertPlanting,
}
