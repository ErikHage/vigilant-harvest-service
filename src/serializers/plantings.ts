import { Request } from 'express';

import {
  CommentActionData,
  CreatePlantingRequest,
  PerformActionRequest,
  Planting,
  PlantingRequest,
  PlantingResponse, RetireActionData, SowActionData, TransplantActionData
} from '../services/plantings/types';
import { ValidationError } from '../errors/common';
import constants from '../util/constants';

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
      retireActionData: _parseRetireActionData(actionType, req),
      commentActionData: _parseCommentActionData(actionType, req),
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
  if (actionType !== constants.plantings.actionTypes.start) {
    return undefined;
  }

  return {
    sowDate: new Date(req.body.sowDate),
    numberSown: req.body.numberSown,
    comment: req.body.comment ?? '',
  };
}

function _parseTransplantActionData(actionType: string, req: Request): TransplantActionData | undefined {
  if (actionType !== constants.plantings.actionTypes.plant) {
    return undefined;
  }

  return {
    plotId: req.body.plotId,
    transplantDate: new Date(req.body.transplantDate),
    numberTransplanted: req.body.numberTransplanted,
    comment: req.body.comment ?? '',
  };
}

function _parseRetireActionData(actionType: string, req: Request): RetireActionData | undefined {
  if (actionType !== constants.plantings.actionTypes.retire) {
    return undefined;
  }

  return {
    comment: req.body.comment ?? '',
  };
}

function _parseCommentActionData(actionType: string, req: Request): CommentActionData | undefined {
  if (actionType !== constants.plantings.actionTypes.comment) {
    return undefined;
  }

  return {
    comment: req.body.comment,
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
    statusHistory: planting.statusHistory,
    dateCreated: planting.dateCreated!,
    dateModified: planting.dateModified!,
  }),
}
