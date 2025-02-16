import { PlantingYear, PlantingYearRequest } from './types';

import datasource from './planting-years-mysql-datasource';
import { ensureError, FeralError } from '../../errors';

async function insertPlantingYear(plantingYearRequest: PlantingYearRequest): Promise<PlantingYear> {
  try {
    const plantingYear: PlantingYear = {
      plantingYear: plantingYearRequest.plantingYear,
      lastFrostDate: plantingYearRequest.lastFrostDate,
      targetPlantingDate: plantingYearRequest.targetPlantingDate,
    };

    return await datasource.insertPlantingYear(plantingYear);
  } catch (err) {
    throw new FeralError('Error inserting planting year', ensureError(err))
      .withDebugParams(plantingYearRequest);
  }
}

async function getPlantingYears(): Promise<PlantingYear[]> {
  try {
    return await datasource.getPlantingYears();
  } catch (err) {
    throw new FeralError('Error getting all planting years', ensureError(err));
  }
}

export default {
  insertPlantingYear,
  getPlantingYears,
}
