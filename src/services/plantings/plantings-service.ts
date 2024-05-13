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

async function getPlantingById(plantingId: string): Promise<Planting> {
  try {
    return await inMemoryDatasource.getPlantingById(plantingId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlantings(): Promise<Planting[]> {
  try {
    return await inMemoryDatasource.getPlantings();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function deletePlantingById(plantingId: string): Promise<void> {
  try {
    await inMemoryDatasource.deletePlantingById(plantingId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

export default {
  upsertPlanting,
  getPlantingById,
  getPlantings,
  deletePlantingById,
}
