import uuid from 'uuid';

import { Plant, PlantRequest } from './types';

import datasource from '../plants/plants-mysql-datasource';

async function upsertPlant(plantRequest: PlantRequest): Promise<Plant> {
  try {
    const plant: Plant = {
      plantId: plantRequest.plantId || uuid.v4(),
      family: plantRequest.family,
      genus: plantRequest.genus,
      species: plantRequest.species,
      friendlyName: plantRequest.friendlyName,
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
