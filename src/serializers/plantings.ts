import { Request } from 'express';

import { Planting, PlantingRequest, PlantingResponse } from '../services/plantings/types';

export default {
  fromRequest: (req: Request): PlantingRequest => ({
    plantingId: req.body.plantingId,
    plantId: req.body.plantId,
    numPlants: req.body.numPlants,
    coordinates: req.body.coordinates,
  }),

  toResponse: (planting: Planting): PlantingResponse => ({
    plantingId: planting.plantingId,
    plantId: planting.plantId,
    numPlants: planting.numPlants,
    coordinates: planting.coordinates,
  }),
}
