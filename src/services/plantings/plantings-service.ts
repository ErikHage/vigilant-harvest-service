import { v4 as uuidV4 } from 'uuid';

import { Planting, PlantingRequest } from './types';

import datasource from './plantings-mysql-datasource';

async function upsertPlanting(plantingRequest: PlantingRequest): Promise<Planting> {
  try {
    const planting: Planting = {
      plantingId: plantingRequest.plantingId || uuidV4(),
      plotId: plantingRequest.plotId,
      plantId: plantingRequest.plantId,
      numPlants: plantingRequest.numPlants,
      plantingYear: plantingRequest.plantingYear,
      name: plantingRequest.name,
      notes: plantingRequest.notes,
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

async function getPlantingsByYear(plantingYear: number): Promise<Planting[]> {
  try {
    return await datasource.getPlantingsByYear(plantingYear);
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
  getPlantingsByYear,
  getPlantings,
  deletePlantingById,
}
