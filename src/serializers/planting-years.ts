import { Request } from 'express';

import { PlantingYearRequest, PlantingYear, PlantingYearResponse } from '../services/planting-years/types';

export default {
  fromRequest: (req: Request): PlantingYearRequest => ({
    plantingYear: req.body.plantingYear,
    lastFrostDate: req.body.lastFrostDate,
    targetPlantingDate: req.body.targetPlantingDate,
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
