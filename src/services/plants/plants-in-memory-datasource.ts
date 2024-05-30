import uuid from 'uuid';

import { Plant, PlantRequest } from './types';

const plantStore = new Map<string, Plant>;

function upsertPlant(plantRequest: PlantRequest): Plant {
  const plant: Plant = {
    plantId: plantRequest.plantId || uuid.v4(),
    family: plantRequest.family,
    genus: plantRequest.genus,
    species: plantRequest.species,
    friendlyName: plantRequest.friendlyName,
  };

  plantStore.set(plant.plantId, plant);
  return plant;
}

function getPlantById(plantId: string): Plant {
  if (plantStore.has(plantId)) {
    return plantStore.get(plantId)!;
  }
  throw new Error(`Plant not found with id: ${plantId}`);
}

function getPlants(): Plant[] {
  return Array.from(plantStore.values())
}

function deletePlantById(plantId: string) {
  plantStore.delete(plantId);
}

export default {
  upsertPlant,
  getPlantById,
  getPlants,
  deletePlantById,
}
