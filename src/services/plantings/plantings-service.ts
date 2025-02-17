import { v4 as uuidV4 } from 'uuid';

import { Planting, PlantingRequest } from './types';

import datasource from './plantings-mysql-datasource';
import { ensureError, FeralError } from '../../errors';

async function upsertPlanting(plantingRequest: PlantingRequest): Promise<Planting> {
  try {
    const planting: Planting = {
      plantingId: plantingRequest.plantingId || uuidV4(),
      plotId: plantingRequest.plotId,
      plantId: plantingRequest.plantId,
      plantingYear: plantingRequest.plantingYear,
      name: plantingRequest.name,
      seedSource: plantingRequest.seedSource,
      lotNumber: plantingRequest.lotNumber,
      leadTimeWeeks: plantingRequest.leadTimeWeeks,
      sowDate: plantingRequest.sowDate,
      sowType: plantingRequest.sowType,
      numberSown: plantingRequest.numberSown,
      transplantDate: plantingRequest.transplantDate,
      numberTransplanted: plantingRequest.numberTransplanted,
      currentStatus: plantingRequest.currentStatus,
      notes: plantingRequest.notes,
    };

    return await datasource.upsertPlanting(planting);
  } catch (err) {
    throw new FeralError('Error upserting planting', ensureError(err))
      .withDebugParams({ plantingRequest, });
  }
}

async function getPlantingById(plantingId: string): Promise<Planting> {
  try {
    return await datasource.getPlantingById(plantingId);
  } catch (err) {
    throw new FeralError('Error fetching planting by id', ensureError(err))
      .withDebugParams({ plantingId, });
  }
}

async function getPlantingsByYear(plantingYear: number): Promise<Planting[]> {
  try {
    return await datasource.getPlantingsByYear(plantingYear);
  } catch (err) {
    throw new FeralError('Error fetching plantings by planting year', ensureError(err))
      .withDebugParams({ plantingYear, });
  }
}

async function getPlantings(): Promise<Planting[]> {
  try {
    return await datasource.getPlantings();
  } catch (err) {
    throw new FeralError('Error fetching all plantings', ensureError(err));
  }
}

async function deletePlantingById(plantingId: string): Promise<void> {
  try {
    await datasource.deletePlantingById(plantingId);
  } catch (err) {
    throw new FeralError('Error deleting planting by id', ensureError(err))
      .withDebugParams({ plantingId, });
  }
}

export default {
  upsertPlanting,
  getPlantingById,
  getPlantingsByYear,
  getPlantings,
  deletePlantingById,
}
