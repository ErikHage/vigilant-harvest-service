import { Plant, PlantRequest } from './types';

import inMemoryDatasource from '../plants/plants-in-memory-datasource';

async function upsertPlant(plantRequest: PlantRequest): Promise<Plant> {
  try {
    return await inMemoryDatasource.upsertPlant(plantRequest);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlantById(plantId: string): Promise<Plant> {
  try {
    return await inMemoryDatasource.getPlantById(plantId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlants(): Promise<Plant[]> {
  try {
    return await inMemoryDatasource.getPlants();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function deletePlantById(plantId: string): Promise<void> {
  try {
    return await inMemoryDatasource.deletePlantById(plantId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

export default {
  upsertPlant,
  getPlantById,
  getPlants,
  deletePlantById,
}
