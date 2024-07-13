import { v4 as uuidV4 } from 'uuid';

import { Planting, PlantingRequest } from './types';

const plantingsStore = new Map<string, Planting>;

function upsertPlanting(plantingRequest: PlantingRequest): Planting {
  const planting: Planting = {
    plantingId: plantingRequest.plantingId || uuidV4(),
    plantId: plantingRequest.plantId,
    numPlants: plantingRequest.numPlants,
    coordinates: plantingRequest.coordinates,
  };

  plantingsStore.set(planting.plantingId, planting);
  return planting;
}

function getPlantingById(plantingId: string): Planting {
  if (plantingsStore.has(plantingId)) {
    return plantingsStore.get(plantingId)!;
  }
  throw new Error(`Planting not found with id: ${plantingId}`);
}

function getPlantings(): Planting[] {
  return Array.from(plantingsStore.values())
}

function deletePlantingById(plantingId: string) {
  plantingsStore.delete(plantingId);
}

export default {
  upsertPlanting,
  getPlantingById,
  getPlantings,
  deletePlantingById,
}
