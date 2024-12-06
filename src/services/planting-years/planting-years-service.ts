import { PlantingYear, PlantingYearRequest } from './types';

import datasource from './planting-years-mysql-datasource';

async function insertPlantingYear(plantingYearRequest: PlantingYearRequest): Promise<PlantingYear> {
  try {
    const plantingYear: PlantingYear = {
      plantingYear: plantingYearRequest.plantingYear,
    };

    return await datasource.insertPlantingYear(plantingYear);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlantingYears(): Promise<PlantingYear[]> {
  try {
    return await datasource.getPlantingYears();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

export default {
  insertPlantingYear,
  getPlantingYears,
}
