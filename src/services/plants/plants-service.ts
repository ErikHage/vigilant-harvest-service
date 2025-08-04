import { v4 as uuidV4 } from 'uuid';

import { Plant, PlantRequest } from './types';

import datasource from '../plants/plants-mysql-datasource';
import { ensureError, FeralError } from '../../errors';

async function upsertPlant(plantRequest: PlantRequest): Promise<Plant> {
  try {
    const plant: Plant = {
      plantId: plantRequest.plantId || uuidV4(),
      category: plantRequest.category,
      friendlyName: plantRequest.friendlyName,
      lifespanType: plantRequest.lifespanType,
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
    throw new FeralError('Error upserting plant', ensureError(err))
      .withDebugParams(plantRequest);
  }
}

async function getPlantById(plantId: string): Promise<Plant> {
  try {
    return await datasource.getPlantById(plantId);
  } catch (err) {
    throw new FeralError('Error fetching plant by id', ensureError(err))
      .withDebugParams({ plantId, });
  }
}

async function getPlants(): Promise<Plant[]> {
  try {
    return await datasource.getPlants();
  } catch (err) {
    throw new FeralError('Error getting all plants', ensureError(err));
  }
}

async function deletePlantById(plantId: string): Promise<void> {
  try {
    await datasource.deletePlantById(plantId);
  } catch (err) {
    throw new FeralError('Error deleting plant by id', ensureError(err))
      .withDebugParams({ plantId, });
  }
}

export default {
  upsertPlant,
  getPlantById,
  getPlants,
  deletePlantById,
}
