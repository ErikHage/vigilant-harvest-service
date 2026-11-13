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
  clearable,
  ifSent,
  INT_MAX,
  oneOf,
  optionalInteger,
  optionalLocalDate,
  optionalString,
  requiredInteger,
  requiredList,
  requiredLocalDate,
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
      targetPlantingDate: optionalLocalDate(blankAsMissing(body.targetPlantingDate), 'targetPlantingDate'),
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

    // A field left out keeps what is stored, and one sent empty is cleared. A planting can't be
    // without its name or its plant, so those two can't be sent empty.
    return {
      name: ifSent(body.name, value => requiredString(value, 'name', NAME)),
      plantId: ifSent(body.plantId, value => requiredString(value, 'plantId', ID)),
      seedSource: clearable(body.seedSource, value => optionalString(value, 'seedSource', NAME)),
      lotNumber: clearable(body.lotNumber, value => optionalString(value, 'lotNumber', NAME)),
      plotId: clearable(body.plotId, value => optionalString(value, 'plotId', ID)),
      numberTransplanted: clearable(body.numberTransplanted, value => optionalInteger(value, 'numberTransplanted', COUNT)),
      targetPlantingDate: clearable(body.targetPlantingDate, value => optionalLocalDate(value, 'targetPlantingDate')),
      leadTimeWeeks: clearable(body.leadTimeWeeks, value => optionalInteger(value, 'leadTimeWeeks', COUNT)),
      sowDate: clearable(body.sowDate, value => optionalLocalDate(value, 'sowDate')),
      sowType: clearable(body.sowType, value => optionalString(value, 'sowType', NAME)),
      numberSown: clearable(body.numberSown, value => optionalInteger(value, 'numberSown', COUNT)),
      transplantDate: clearable(body.transplantDate, value => optionalLocalDate(value, 'transplantDate')),
      notes: clearable(body.notes, value => optionalString(value, 'notes', TEXT)),
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
    sowDate: requiredLocalDate(body.sowDate, 'sowDate'),
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
    transplantDate: requiredLocalDate(body.transplantDate, 'transplantDate'),
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
