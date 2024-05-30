import { Request } from 'express';

import { Plant, PlantRequest, PlantResponse } from '../services/plants/types';

export default {
  fromRequest: (req: Request): PlantRequest => ({
    plantId: req.body.plantId,
    family: req.body.family,
    genus: req.body.genus,
    species: req.body.species,
    friendlyName: req.body.friendlyName,
  }),

  toResponse: (plant: Plant): PlantResponse => ({
    plantId: plant.plantId,
    family: plant.family,
    genus: plant.genus,
    species: plant.species,
    friendlyName: plant.friendlyName,
  }),
}
