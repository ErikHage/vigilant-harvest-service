import { NewPlantingYear, PlantingYear, PlantingYearRequest, PlantingYearUsage } from './types';

import datasource from './planting-years-mysql-datasource';
import plantingsDatasource from '../plantings/plantings-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import { ConflictError } from '../../errors/common';

async function insertPlantingYear(plantingYearRequest: PlantingYearRequest): Promise<PlantingYear> {
  try {
    const { previousPlantingYear, } = plantingYearRequest;
    const carryForwardPlantingIds: string[] = previousPlantingYear === undefined
      ? []
      : await plantingsDatasource.getPlantingIdsToCarryForward(previousPlantingYear);

    const plantingYear: NewPlantingYear = {
      plantingYear: plantingYearRequest.plantingYear,
      lastFrostDate: plantingYearRequest.lastFrostDate,
      targetPlantingDate: plantingYearRequest.targetPlantingDate,
    };

    return await datasource.insertPlantingYear(plantingYear, carryForwardPlantingIds);
  } catch (err) {
    throw new FeralError('Error inserting planting year', ensureError(err))
      .withDebugParams(plantingYearRequest);
  }
}

async function getPlantingYears(): Promise<PlantingYear[]> {
  let results: PlantingYear[];

  try {
    results = await datasource.getPlantingYears();
  } catch (err) {
    throw new FeralError('Error getting all planting years', ensureError(err));
  }

  try {
    const countsByYear = await plantingsDatasource.getPlantingsBreakdown();
    results = results.map(year => ({
      ...year,
      details: {
        createdPlantings: countsByYear.get(year.plantingYear)?.numberCreated ?? 0,
        startedPlantings: countsByYear.get(year.plantingYear)?.numberStarted ?? 0,
        plantedPlantings: countsByYear.get(year.plantingYear)?.numberPlanted ?? 0,
        retiredPlantings: countsByYear.get(year.plantingYear)?.numberRetired ?? 0,
      },
    }));
  } catch (err) {
    throw new FeralError('Error hydrating planting year details', ensureError(err));
  }

  return results;
}

async function getPlantingYear(year: number): Promise<PlantingYear> {
  try {
    return await datasource.getPlantingYear(year);
  } catch (err) {
    throw new FeralError('Error getting planting year ' + year, ensureError(err));
  }
}

async function deletePlantingYear(year: number): Promise<void> {
  const usage: PlantingYearUsage = await datasource.getPlantingYearUsage(year);

  if (Object.values(usage).some(count => count > 0)) {
    throw new ConflictError(`Planting year ${year} is in use`).withDebugParams({ year, usage, });
  }

  try {
    await datasource.deletePlantingYear(year);
  } catch (err) {
    throw new FeralError('Error deleting planting year ' + year, ensureError(err));
  }
}

export default {
  insertPlantingYear,
  getPlantingYears,
  getPlantingYear,
  deletePlantingYear,
}
