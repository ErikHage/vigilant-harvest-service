import { Request } from 'express';

import {
  CreatePlantingRequest,
  PerformActionRequest,
  Planting,
  PlantingRequest,
  PlantingResponse, SowActionData, TransplantActionData
} from '../services/plantings/types';
import { ValidationError } from '../errors/common';
import plantingActions from '../services/plantings/actions/planting-action';

const { actionTypes, } = plantingActions;

const insert = {
  fromRequest: (req: Request): CreatePlantingRequest => ({
    plantId: req.body.plantId,
    plantingYear: req.body.plantingYear,
    name: req.body.name,
    seedSource: req.body.seedSource,
    lotNumber: req.body.lotNumber,
    leadTimeWeeks: req.body.leadTimeWeeks,
  }),
};

const action = {
  fromRequest: (req: Request): PerformActionRequest => {
    const actionType = req.body.actionType
    return {
      plantingId: _parsePlantingId(req.params.plantingId),
      actionType,
      sowActionData: _parseSowActionData(actionType, req),
      transplantActionData: _parseTransplantActionData(actionType, req),
    };
  },
};

const upsert = {
  fromRequest: (req: Request): PlantingRequest => ({
    plantingId: req.body.plantingId,
    plotId: req.body.plotId,
    plantId: req.body.plantId,
    plantingYear: req.body.plantingYear,
    name: req.body.name,
    seedSource: req.body.seedSource,
    lotNumber: req.body.lotNumber,
    leadTimeWeeks: req.body.leadTimeWeeks,
    sowDate: req.body.sowDate ? new Date(req.body.sowDate) : undefined,
    sowType: req.body.sowType,
    numberSown: req.body.numberSown,
    transplantDate: req.body.transplantDate ? new Date(req.body.transplantDate) : undefined,
    numberTransplanted: req.body.numberTransplanted,
    currentStatus: req.body.currentStatus,
    notes: req.body.notes,
  }),
};

function _parsePlantingId(plantingIdInput: string | undefined): string {
  if (!plantingIdInput) {
    throw new ValidationError('Planting Id must be present');
  }
  return plantingIdInput;
}

function _parseSowActionData(actionType: string, req: Request): SowActionData | undefined {
  if (actionType !== actionTypes.sow) {
    return undefined;
  }

  return {
    sowType: req.body.sowType,
    sowDate: new Date(req.body.sowDate),
    numberSown: req.body.numberSown,
    plotId: req.body.plotId,
  };
}

function _parseTransplantActionData(actionType: string, req: Request): TransplantActionData | undefined {
  if (actionType !== actionTypes.transplant) {
    return undefined;
  }

  return {
    transplantDate: new Date(req.body.transplantDate),
    numberTransplanted: req.body.numberTransplanted,
    plotId: req.body.plotId,
  };
}

export default {
  insert,
  action,
  upsert,

  toResponse: (planting: Planting): PlantingResponse => ({
    plantingId: planting.plantingId,
    plotId: planting.plotId,
    plantId: planting.plantId,
    plantingYear: planting.plantingYear,
    name: planting.name,
    seedSource: planting.seedSource,
    lotNumber: planting.lotNumber,
    leadTimeWeeks: planting.leadTimeWeeks,
    sowDate: planting.sowDate,
    sowType: planting.sowType,
    numberSown: planting.numberSown,
    transplantDate: planting.transplantDate,
    numberTransplanted: planting.numberTransplanted,
    currentStatus: planting.currentStatus,
    notes: planting.notes,
    dateCreated: planting.dateCreated!,
    dateModified: planting.dateModified!,
  }),
}
