import { NewPlantingYear, PlantingYear, PlantingYearRequest, PlantingYearUsage } from './types';

import datasource from './planting-years-mysql-datasource';
import plantingsDatasource from '../plantings/plantings-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import { BadRequestError, ConflictError } from '../../errors/common';

// the client chooses what to carry forward, from the previous year's planted plantings; anything
// else it names is its mistake, reported by id rather than carried
async function checkCarryForward({ previousPlantingYear, carryForwardPlantingIds, }: PlantingYearRequest): Promise<void> {
  if (previousPlantingYear === undefined || carryForwardPlantingIds.length === 0) {
    return;
  }

  const carryable = new Set(
    await plantingsDatasource.getCarryForwardablePlantingIds(previousPlantingYear, carryForwardPlantingIds));
  const notCarryable = carryForwardPlantingIds.filter(id => !carryable.has(id));

  if (notCarryable.length > 0) {
    throw new BadRequestError(
      `Not planted plantings of ${previousPlantingYear}, so can't be carried forward: ${notCarryable.join(', ')}`)
      .withDebugParams({ previousPlantingYear, carryForwardPlantingIds, });
  }
}

async function insertPlantingYear(plantingYearRequest: PlantingYearRequest): Promise<PlantingYear> {
  // outside the try, which would turn the client's mistake into a 500
  await checkCarryForward(plantingYearRequest);

  try {
    const { carryForwardPlantingIds, } = plantingYearRequest;

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
