import {
  CategorySubcategoryRow,
  Plant,
  PlantCategory,
  PlantCategoryRequest,
  PlantRow, PlantSubcategory, PlantSubcategoryRequest,
  PlantUpsertInstruction
} from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';
import { ResultSetHeader } from 'mysql2';
import { ActivityScheduleRow } from '../schedules/types';

async function upsertPlant(plant: PlantUpsertInstruction): Promise<Plant> {
  const query: QueryPayload = {
    sql: queries.upsertPlant,
    params: rowMapper.insert.toParams(plant),
  }

  await db.execQuery(query);

  return getPlantById(plant.plantId!);
}

async function getPlantSchedules(plantId: string): Promise<ActivityScheduleRow[]> {
  const query = {
    sql: queries.getSchedulesByPlantId,
    params: [ plantId, ],
  };

  return await db.execQuery<ActivityScheduleRow[]>(query);
}

async function getPlantById(plantId: string): Promise<Plant> {
  const query = {
    sql: queries.getById,
    params: [ plantId, ],
  };

  const results = await db.execQuery<PlantRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Plant not found', { plantId, })
  }

  const scheduleResults = await getPlantSchedules(plantId);

  return rowMapper.fromRow(results[0]!, scheduleResults);
}

async function getPlantByFriendlyName(friendlyName: string): Promise<Plant | undefined> {
  const query = {
    sql: queries.getByFriendlyName,
    params: [ friendlyName, ],
  };

  const results = await db.execQuery<PlantRow[]>(query);

  if (results.length < 1) {
    return undefined;
  }

  const scheduleResults = await getPlantSchedules(results[0]!.plantId);

  return rowMapper.fromRow(results[0]!, scheduleResults);
}

async function getPlants(): Promise<Plant[]> {
  const query = {
    sql: queries.getAll,
    params: [],
  };

  const results = await db.execQuery<PlantRow[]>(query);

  return results.map(r => rowMapper.fromRow(r, []));
}

async function deletePlantById(plantId: string): Promise<void> {
  const query = {
    sql: queries.deleteById,
    params: [ plantId, ],
  };

  await db.execQuery(query);
}

async function insertCategory(category: PlantCategoryRequest): Promise<PlantCategory> {
  const { categoryName, } = category;

  const query = {
    sql: queries.categories.insertCategory,
    params: [
      categoryName,
    ],
  };

  const header = await db.execQuery<ResultSetHeader>(query);

  return {
    categoryId: header.insertId,
    categoryName: category.categoryName,
    subcategories: [],
  };
}

async function insertSubcategory(subcategory: PlantSubcategoryRequest): Promise<PlantSubcategory> {
  const query = {
    sql: queries.categories.insertSubcategory,
    params: [
      subcategory.subcategoryName,
      subcategory.categoryId,
    ],
  };

  const header = await db.execQuery<ResultSetHeader>(query);

  return {
    subcategoryId: header.insertId,
    subcategoryName: subcategory.subcategoryName,
    categoryId: subcategory.categoryId,
  };
}

async function getCategories(): Promise<PlantCategory[]> {
  const query = {
    sql: queries.categories.getAll,
    params: [],
  };

  const results = await db.execQuery<CategorySubcategoryRow[]>(query);

  return rowMapper.categories.fromCategorySubcategoryRows(results);
}

export default {
  upsertPlant,
  getPlantById,
  getPlantByFriendlyName,
  getPlants,
  deletePlantById,

  insertCategory,
  insertSubcategory,
  getCategories,
}
