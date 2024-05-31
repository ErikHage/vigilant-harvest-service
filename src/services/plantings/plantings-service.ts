import { Planting, PlantingRequest } from './types';

import datasource from './plantings-mysql-datasource';
import uuid from 'uuid';

async function upsertPlanting(plantingRequest: PlantingRequest): Promise<Planting> {
  try {
    const planting: Planting = {
      plantingId: plantingRequest.plantingId || uuid.v4(),
      plantId: plantingRequest.plantId,
      numPlants: plantingRequest.numPlants,
      coordinates: plantingRequest.coordinates,
    };

    return await datasource.upsertPlanting(planting);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlantingById(plantingId: string): Promise<Planting> {
  try {
    return await datasource.getPlantingById(plantingId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlantings(): Promise<Planting[]> {
  try {
    return await datasource.getPlantings();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function deletePlantingById(plantingId: string): Promise<void> {
  try {
    await datasource.deletePlantingById(plantingId);
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
