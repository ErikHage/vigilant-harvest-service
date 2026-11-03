import { Request } from 'express';

import { PlantingYearRequest, PlantingYear, PlantingYearResponse } from '../services/planting-years/types';
import { UTCDate } from '@date-fns/utc';
import { blankAsMissing, bodyOf, optionalInteger, requiredDate, requiredYear } from '../validation';

export default {
  get: {
    fromRequest(req: Request): number {
      return requiredYear(req.params.plantingYear, 'plantingYear');
    },
  },

  fromRequest: (req: Request): PlantingYearRequest => {
    const body = bodyOf(req);

    return {
      // the app's box for it sends '' when cleared; then nothing is carried forward
      previousPlantingYear: optionalInteger(blankAsMissing(body.previousPlantingYear), 'previousPlantingYear', { min: 1, }),
      plantingYear: requiredYear(body.plantingYear, 'plantingYear'),
      // written as the UTC day, as before; a bare date is that day either way
      lastFrostDate: new UTCDate(requiredDate(body.lastFrostDate, 'lastFrostDate')),
      targetPlantingDate: new UTCDate(requiredDate(body.targetPlantingDate, 'targetPlantingDate')),
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
