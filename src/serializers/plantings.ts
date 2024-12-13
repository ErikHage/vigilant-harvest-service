import { Request } from 'express';

import { Planting, PlantingRequest, PlantingResponse } from '../services/plantings/types';

export default {
  fromRequest: (req: Request): PlantingRequest => ({
    plantingId: req.body.plantingId,
    plotId: req.body.plotId,
    plantId: req.body.plantId,
    numPlants: req.body.numPlants,
    plantingYear: req.body.plantingYear,
    notes: req.body.notes,
  }),

  toResponse: (planting: Planting): PlantingResponse => ({
    plantingId: planting.plantingId,
    plotId: planting.plotId,
    plantId: planting.plantId,
    numPlants: planting.numPlants,
    plantingYear: planting.plantingYear,
    notes: planting.notes,
  }),
}
