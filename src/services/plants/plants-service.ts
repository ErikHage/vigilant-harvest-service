import { v4 as uuidV4 } from 'uuid';

import {
  Plant,
  PlantCategory,
  PlantCategoryRequest,
  PlantRequest, PlantScheduleAssignmentRequest, PlantSubcategory,
  PlantSubcategoryRequest,
  PlantUpsertInstruction
} from './types';

import datasource from '../plants/plants-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import { ConflictError, ValidationError } from '../../errors/common';

async function upsertPlant(plantRequest: PlantRequest): Promise<Plant> {
  const existingPlant: Plant | undefined = await datasource.getPlantByFriendlyName(plantRequest.friendlyName);

  if (!plantRequest.plantId && existingPlant) {
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

async function updateScheduleAssignment(scheduleAssignmentRequest: PlantScheduleAssignmentRequest): Promise<Plant> {
  try {
    return await datasource.updateScheduleAssignment(scheduleAssignmentRequest);
  } catch (err) {
    throw new FeralError('Error updating plant schedule assignment', ensureError(err))
      .withDebugParams({ scheduleAssignmentRequest, });
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
  const plantingCount: number = await datasource.countPlantingsByPlantId(plantId);

  if (plantingCount > 0) {
    throw new ConflictError('Plant has plantings').withDebugParams({ plantId, plantingCount, });
  }

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

async function deleteCategoryById(categoryId: number): Promise<void> {
  const subcategoryCount: number = await datasource.countSubcategoriesByCategoryId(categoryId);

  if (subcategoryCount > 0) {
    throw new ConflictError('Plant category has subcategories')
      .withDebugParams({ categoryId, subcategoryCount, });
  }

  try {
    await datasource.deleteCategoryById(categoryId);
  } catch (err) {
    throw new FeralError('Error deleting plant category', ensureError(err))
      .withDebugParams({ categoryId, });
  }
}

async function deleteSubcategoryById(categoryId: number, subcategoryId: number): Promise<void> {
  const plantCount: number = await datasource.countPlantsBySubcategoryId(subcategoryId);

  if (plantCount > 0) {
    throw new ConflictError('Plant subcategory has plants')
      .withDebugParams({ categoryId, subcategoryId, plantCount, });
  }

  try {
    await datasource.deleteSubcategoryById(categoryId, subcategoryId);
  } catch (err) {
    throw new FeralError('Error deleting plant subcategory', ensureError(err))
      .withDebugParams({ categoryId, subcategoryId, });
  }
}

export default {
  upsertPlant,
  updateScheduleAssignment,
  getPlantById,
  getPlants,
  deletePlantById,

  insertCategory,
  insertSubcategory,
  getCategories,
  deleteCategoryById,
  deleteSubcategoryById,
}
