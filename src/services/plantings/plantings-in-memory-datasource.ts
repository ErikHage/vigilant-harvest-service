import uuid from 'uuid';

import { Planting, PlantingRequest } from './types';

const plantings = new Map<string, Planting>;

function upsertPlanting(plantingRequest: PlantingRequest): Planting {
  const planting: Planting = {
    plantingId: plantingRequest.plantingId || uuid.v4(),
    plantId: plantingRequest.plantId,
    numPlants: plantingRequest.numPlants,
    coordinates: plantingRequest.coordinates,
  };

  plantings.set(planting.plantingId, planting);
  return planting;
}

export default {
  upsertPlanting,
}
