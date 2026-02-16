import { Request } from 'express';

import { PlantingYearRequest, PlantingYear, PlantingYearResponse } from '../services/planting-years/types';
import { UTCDate } from '@date-fns/utc';

export default {
  get: {
    fromRequest(req: Request): number {
      return parseInt(req.params.plantingYear!);
    },
  },

  fromRequest: (req: Request): PlantingYearRequest => ({
    previousPlantingYear: req.body.previousPlantingYear,
    plantingYear: req.body.plantingYear,
    lastFrostDate: new UTCDate(req.body.lastFrostDate),
    targetPlantingDate: new UTCDate(req.body.targetPlantingDate),
  }),

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
