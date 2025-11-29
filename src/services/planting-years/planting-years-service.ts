import { PlantingYear, PlantingYearRequest } from './types';

import datasource from './planting-years-mysql-datasource';
import plantingsDatasource from '../plantings/plantings-mysql-datasource';
import { ensureError, FeralError } from '../../errors';

async function insertPlantingYear(plantingYearRequest: PlantingYearRequest): Promise<PlantingYear> {
  try {
    const carryForwardPlantingIds: string[] = await plantingsDatasource
      .getPlantingIdsToCarryForward(plantingYearRequest.previousPlantingYear);

    const plantingYear: PlantingYear = {
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

export default {
  insertPlantingYear,
  getPlantingYears,
  getPlantingYear,
}
