import { Request } from 'express';

import { Planting, PlantingRequest, PlantingResponse } from '../services/plantings/types';

export default {
  fromRequest: (req: Request): PlantingRequest => ({
    plantingId: req.body.plantingId,
    plantId: req.body.plantId,
    numPlants: req.body.numPlants,
    plantingYear: req.body.plantingYear,
    coordinates: req.body.coordinates || [],
  }),

  toResponse: (planting: Planting): PlantingResponse => ({
    plantingId: planting.plantingId,
    plantId: planting.plantId,
    numPlants: planting.numPlants,
    plantingYear: planting.plantingYear,
    coordinates: planting.coordinates,
  }),
}
