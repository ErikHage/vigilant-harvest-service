import { Request } from 'express';

import { PlantingYearRequest, PlantingYear, PlantingYearResponse } from '../services/planting-years/types';
import { BadRequestError } from '../errors/common';
import {
  blankAsMissing,
  bodyOf,
  optionalInteger,
  requiredList,
  requiredLocalDate,
  requiredString,
  requiredYear
} from '../validation';

const ID = { maxLength: 36, };

/**
 * The plantings to carry forward. Required with a previous year, so a client says what it
 * means, even if that is nothing; without one there is nothing to carry, so it may be left out
 * or empty.
 */
function carryForwardPlantingIds(value: unknown, previousPlantingYear: number | undefined): string[] {
  const field = 'carryForwardPlantingIds';

  if (previousPlantingYear === undefined) {
    if (value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0)) {
      throw new BadRequestError(`${field} must be empty without a previousPlantingYear`);
    }
    return [];
  }

  const ids = requiredList(value, field).map((id, index) => requiredString(id, `${field}[${index}]`, ID));

  const repeated = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (repeated.length > 0) {
    throw new BadRequestError(`${field} lists a planting more than once: ${[ ...new Set(repeated), ].join(', ')}`);
  }

  return ids;
}

export default {
  get: {
    fromRequest(req: Request): number {
      return requiredYear(req.params.plantingYear, 'plantingYear');
    },
  },

  fromRequest: (req: Request): PlantingYearRequest => {
    const body = bodyOf(req);

    // the app's box for it sends '' when cleared; then nothing is carried forward
    const previousPlantingYear = optionalInteger(blankAsMissing(body.previousPlantingYear), 'previousPlantingYear', { min: 1, });

    return {
      previousPlantingYear,
      carryForwardPlantingIds: carryForwardPlantingIds(body.carryForwardPlantingIds, previousPlantingYear),
      plantingYear: requiredYear(body.plantingYear, 'plantingYear'),
      lastFrostDate: requiredLocalDate(body.lastFrostDate, 'lastFrostDate'),
      targetPlantingDate: requiredLocalDate(body.targetPlantingDate, 'targetPlantingDate'),
    };
  },

  toResponse: (planting: PlantingYear): PlantingYearResponse => ({
    plantingYear: planting.plantingYear,
    lastFrostDate: planting.lastFrostDate,
    targetPlantingDate: planting.targetPlantingDate,
    details: {
      createdPlantings: planting.details?.createdPlantings ?? 0,
      startedPlantings: planting.details?.startedPlantings ?? 0,
      plantedPlantings: planting.details?.plantedPlantings ?? 0,
      retiredPlantings: planting.details?.retiredPlantings ?? 0,
    },
  }),
}
