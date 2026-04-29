import { v4 as uuidV4 } from 'uuid';

import {
  Plant,
  PlantCategory,
  PlantCategoryRequest,
  PlantRequest, PlantSubcategory,
  PlantSubcategoryRequest,
  PlantUpsertInstruction
} from './types';

import datasource from '../plants/plants-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import { ValidationError } from '../../errors/common';

async function upsertPlant(plantRequest: PlantRequest): Promise<Plant> {
  const existingPlant: Plant | undefined = await datasource.getPlantByFriendlyName(plantRequest.friendlyName);

  if (existingPlant) {
    throw new ValidationError('Friendly name already in use').withDebugParams({ friendlyName: plantRequest.friendlyName, });
  }

  try {
    const plant: PlantUpsertInstruction = {
      plantId: plantRequest.plantId || uuidV4(),
      subcategoryId: plantRequest.subcategoryId,
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

async function insertCategory(categoryRequest: PlantCategoryRequest): Promise<PlantCategory> {
  try {
    return await datasource.insertCategory(categoryRequest);
  } catch (err) {
    throw new FeralError('Error inserting plant category', ensureError(err));
  }
}

async function insertSubcategory(subcategoryRequest: PlantSubcategoryRequest): Promise<PlantSubcategory> {
  try {
    return await datasource.insertSubcategory(subcategoryRequest);
  } catch (err) {
    throw new FeralError('Error inserting plant subcategory', ensureError(err));
  }
}

async function getCategories(): Promise<PlantCategory[]> {
  try {
    return await datasource.getCategories();
  } catch (err) {
    throw new FeralError('Error getting all plant categories', ensureError(err));
  }
}

export default {
  upsertPlant,
  getPlantById,
  getPlants,
  deletePlantById,

  insertCategory,
  insertSubcategory,
  getCategories,
}
