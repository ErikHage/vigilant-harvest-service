import { v4 as uuidV4 } from 'uuid';

import { Plant, PlantRequest } from './types';

import datasource from '../plants/plants-mysql-datasource';

async function upsertPlant(plantRequest: PlantRequest): Promise<Plant> {
  try {
    const plant: Plant = {
      plantId: plantRequest.plantId || uuidV4(),
      category: plantRequest.category,
      friendlyName: plantRequest.friendlyName,
      seedSource: plantRequest.seedSource,
      tags: plantRequest.tags,
      description: plantRequest.description,
      taxonomy: plantRequest.taxonomy,
      sowing: plantRequest.sowing,
      planting: plantRequest.planting,
      growing: plantRequest.growing,
      harvesting: plantRequest.harvesting,
    };

    return await datasource.upsertPlant(plant);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlantById(plantId: string): Promise<Plant> {
  try {
    return await datasource.getPlantById(plantId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlants(): Promise<Plant[]> {
  try {
    return await datasource.getPlants();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function deletePlantById(plantId: string): Promise<void> {
  try {
    await datasource.deletePlantById(plantId);
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
