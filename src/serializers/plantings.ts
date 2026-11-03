import { Request } from 'express';

import {
  CreatePlantingRequest,
  PerformActionRequest,
  Planting,
  PlantingResponse,
  PlantingUpdateRequest,
  SowActionData,
  SplitActionData,
  SplitData,
  TransplantActionData
} from '../services/plantings/types';
import { ValidationError } from '../errors/common';
import constants from '../util/constants';
import {
  blankAsMissing,
  bodyOf,
  INT_MAX,
  oneOf,
  optionalDate,
  optionalInteger,
  optionalString,
  requiredDate,
  requiredInteger,
  requiredList,
  requiredObject,
  requiredString,
  requiredYear,
  TEXT_BYTES
} from '../validation';

const { actionTypes, } = constants.plantings;

// the column sizes: ids are VARCHAR(36), names VARCHAR(255), comments and notes TEXT, counts INT
const ID = { maxLength: 36, };
const NAME = { maxLength: 255, };
const TEXT = { maxBytes: TEXT_BYTES, };
const COUNT = { min: 0, max: INT_MAX, };

const insert = {
  fromRequest: (req: Request): CreatePlantingRequest => {
    const body = bodyOf(req);

    return {
      plantId: requiredString(body.plantId, 'plantId', ID),
      plantingYear: requiredYear(body.plantingYear, 'plantingYear'),
      name: requiredString(body.name, 'name', NAME),
      seedSource: optionalString(body.seedSource, 'seedSource', NAME),
      lotNumber: optionalString(body.lotNumber, 'lotNumber', NAME),
      targetPlantingDate: optionalDate(blankAsMissing(body.targetPlantingDate), 'targetPlantingDate'),
      // the app's lead time box sends '' when it's cleared
      leadTimeWeeks: optionalInteger(blankAsMissing(body.leadTimeWeeks), 'leadTimeWeeks', COUNT),
    };
  },
};

const list = {
  /** The year to list, or undefined to list every year. */
  fromRequest: (req: Request): number | undefined =>
    optionalInteger(req.query.plantingYear, 'plantingYear', { min: 1, }),
};

const action = {
  fromRequest: (req: Request): PerformActionRequest => {
    const body = bodyOf(req);
    const actionType = oneOf(body.actionType, 'actionType', Object.values(actionTypes));

    return {
      plantingId: _parsePlantingId(req.params.plantingId),
      actionType,
      sowActionData: actionType === actionTypes.start ? _parseSowActionData(body) : undefined,
      splitActionData: actionType === actionTypes.split ? _parseSplitActionData(body) : undefined,
      transplantActionData: actionType === actionTypes.plant ? _parseTransplantActionData(body) : undefined,
      retireActionData: actionType === actionTypes.retire ? { comment: _comment(body), } : undefined,
      commentActionData: actionType === actionTypes.comment ? { comment: _comment(body), } : undefined,
    };
  },
};

const update = {
  fromRequest: (req: Request): PlantingUpdateRequest => {
    const body = bodyOf(req);
    // An update skips an empty value and keeps the old one (a pinned behaviour, not this check's to
    // change), so '' counts as not sent, as it did for the dates before.
    const sent = (field: string): unknown => blankAsMissing(body[field]);

    return {
      name: optionalString(sent('name'), 'name', NAME),
      plantId: optionalString(sent('plantId'), 'plantId', ID),
      seedSource: optionalString(sent('seedSource'), 'seedSource', NAME),
      lotNumber: optionalString(sent('lotNumber'), 'lotNumber', NAME),
      plotId: optionalString(sent('plotId'), 'plotId', ID),
      numberTransplanted: optionalInteger(sent('numberTransplanted'), 'numberTransplanted', COUNT),
      targetPlantingDate: optionalDate(sent('targetPlantingDate'), 'targetPlantingDate'),
      leadTimeWeeks: optionalInteger(sent('leadTimeWeeks'), 'leadTimeWeeks', COUNT),
      sowDate: optionalDate(sent('sowDate'), 'sowDate'),
      sowType: optionalString(sent('sowType'), 'sowType', NAME),
      numberSown: optionalInteger(sent('numberSown'), 'numberSown', COUNT),
      transplantDate: optionalDate(sent('transplantDate'), 'transplantDate'),
      notes: optionalString(sent('notes'), 'notes', TEXT),
    };
  },
};

function _parsePlantingId(plantingIdInput: string | undefined): string {
  if (!plantingIdInput) {
    throw new ValidationError('Planting Id must be present');
  }
  return plantingIdInput;
}

/** Every action but DELETE takes one; the app sends null when it's left empty. */
function _comment(body: Record<string, unknown>): string {
  return optionalString(body.comment, 'comment', TEXT) ?? '';
}

function _parseSowActionData(body: Record<string, unknown>): SowActionData {
  return {
    sowDate: requiredDate(body.sowDate, 'sowDate'),
    numberSown: optionalInteger(blankAsMissing(body.numberSown), 'numberSown', COUNT),
    comment: _comment(body),
  };
}

function _parseSplitActionData(body: Record<string, unknown>): SplitActionData {
  return {
    sourcePlantingId: optionalString(body.sourcePlantingId, 'sourcePlantingId', ID),
    comment: _comment(body),
    splits: requiredList(body.splits, 'splits').map((entry, index): SplitData => {
      const field = `splits[${index}]`;
      const split = requiredObject(entry, field);

      return {
        name: requiredString(split.name, `${field}.name`, NAME),
        // the app starts each split at 0; the service checks the total against what was sown
        count: requiredInteger(split.count, `${field}.count`, COUNT),
      };
    }),
  };
}

function _parseTransplantActionData(body: Record<string, unknown>): TransplantActionData {
  return {
    // the service checks that it exists; the app sends null when no plot is picked
    plotId: optionalString(body.plotId, 'plotId', ID),
    transplantDate: requiredDate(body.transplantDate, 'transplantDate'),
    numberTransplanted: optionalInteger(blankAsMissing(body.numberTransplanted), 'numberTransplanted', COUNT),
    comment: _comment(body),
  };
}

export default {
  insert,
  list,
  action,
  update,

  toResponse: (planting: Planting): PlantingResponse => ({
    plantingId: planting.plantingId,
    plotId: planting.plotId,
    plantId: planting.plantId,
    currentPlantingYear: planting.currentPlantingYear,
    plantingYears: planting.plantingYears,
    name: planting.name,
    seedSource: planting.seedSource,
    lotNumber: planting.lotNumber,
    targetPlantingDate: planting.targetPlantingDate,
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
