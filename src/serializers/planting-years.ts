import { Request } from 'express';

import { PlantingYearRequest, PlantingYear, PlantingYearResponse } from '../services/planting-years/types';

export default {
  fromRequest: (req: Request): PlantingYearRequest => ({
    plantingYear: req.body.plantingYear,
  }),

  toResponse: (planting: PlantingYear): PlantingYearResponse => ({
    plantingYear: planting.plantingYear,
  }),
}
