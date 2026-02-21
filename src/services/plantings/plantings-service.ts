import { v4 as uuidV4 } from 'uuid';

import actions, { PlantingAction } from './actions/planting-action';
import constants from '../../util/constants';
import { CreatePlantingRequest, PerformActionRequest, Planting, PlantingUpdate, PlantingUpdateRequest } from './types';
import { LifecycleTransitionViolationError } from './errors';

import { ensureError, FeralError } from '../../errors';
import { getStrategy } from './actions/planting-action-factory';
import { ValidationError } from '../../errors/common';
import datasource from './plantings-mysql-datasource';
import plantingValidation from './planting-validation';

async function createPlanting(createPlantingRequest: CreatePlantingRequest): Promise<Planting> {
  try {
    const planting: Planting = {
      plantingId: uuidV4(),
      plantId: createPlantingRequest.plantId,
      currentPlantingYear: createPlantingRequest.plantingYear,
      plantingYears: [ createPlantingRequest.plantingYear, ],
      name: createPlantingRequest.name,
      targetPlantingDate: createPlantingRequest.targetPlantingDate,
      leadTimeWeeks: createPlantingRequest.leadTimeWeeks,
      seedSource: createPlantingRequest.seedSource,
      lotNumber: createPlantingRequest.lotNumber,
      currentStatus: constants.plantings.statuses.created,
    };

    return await datasource.insertPlanting(planting);
  } catch (err) {
    throw new FeralError('Error creating new planting', ensureError(err))
      .withDebugParams({ createPlantingRequest, });
  }
}

async function performAction(plantingActionRequest: PerformActionRequest): Promise<Planting> {
  const currentPlanting: Planting = await datasource.getPlantingById(plantingActionRequest.plantingId);

  _assertLifecycleTransition(currentPlanting, plantingActionRequest);

  const strategy: PlantingAction = getStrategy(plantingActionRequest.actionType);

  try {
    return await strategy.performAction(currentPlanting, plantingActionRequest);
  } catch (err) {
    throw new FeralError('Error performing planting action', ensureError(err))
      .withDebugParams({ plantingActionRequest, });
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

async function updatePlanting(plantingId: string, plantingUpdateRequest: PlantingUpdateRequest): Promise<Planting> {
  try {
    const planting: Planting = await getPlantingById(plantingId);

    plantingValidation.validateUpdateInput(planting.currentStatus, plantingUpdateRequest);

    const plantingUpdate: PlantingUpdate = {
      status: planting.currentStatus,
      name: plantingUpdateRequest.name,
      plantId: plantingUpdateRequest.plantId,
      seedSource: plantingUpdateRequest.seedSource,
      lotNumber: plantingUpdateRequest.lotNumber,
      plotId: plantingUpdateRequest.plotId,
      targetPlantingDate: plantingUpdateRequest.targetPlantingDate,
      leadTimeWeeks: plantingUpdateRequest.leadTimeWeeks,
      sowDate: plantingUpdateRequest.sowDate,
      sowType: plantingUpdateRequest.sowType,
      numberSown: plantingUpdateRequest.numberSown,
      transplantDate: plantingUpdateRequest.transplantDate,
      numberTransplanted: plantingUpdateRequest.numberTransplanted,
      notes: plantingUpdateRequest.notes,
    };

    const updateComment = _buildUpdateComment(plantingUpdateRequest);
    await datasource.updatePlanting(plantingId, plantingUpdate, updateComment);
    return await datasource.getPlantingById(plantingId);
  } catch (err) {
    throw new FeralError('Error updating planting', ensureError(err))
      .withDebugParams({
        plantingId,
        plantingUpdateRequest,
      });
  }
}

function _buildUpdateComment(plantingUpdateRequest: PlantingUpdateRequest): string {
  const filteredObject = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(plantingUpdateRequest).filter(([ _, value, ]) => value !== undefined)
  );
  return `Updated: ${JSON.stringify(filteredObject)}`;
}

async function deletePlantingById(plantingId: string): Promise<void> {
  try {
    await datasource.deletePlantingById(plantingId);
  } catch (err) {
    throw new FeralError('Error deleting planting by id', ensureError(err))
      .withDebugParams({ plantingId, });
  }
}

function _assertLifecycleTransition(planting: Planting, plantingActionRequest: PerformActionRequest) {
  const allowedActions: string[] | undefined = actions.allowedLifecycleTransitions.get(planting.currentStatus);

  if (!allowedActions) {
    throw new ValidationError(`Invalid action type ${plantingActionRequest.actionType}`)
      .withDebugParams({ plantingActionRequest, });
  }

  if (!allowedActions.includes(plantingActionRequest.actionType)) {
    throw new LifecycleTransitionViolationError(planting.currentStatus, plantingActionRequest.actionType)
      .withDebugParams({ planting, plantingActionRequest, });
  }
}

export default {
  createPlanting,
  performAction,
  getPlantingById,
  getPlantingsByYear,
  getPlantings,
  updatePlanting,
  deletePlantingById,
}
