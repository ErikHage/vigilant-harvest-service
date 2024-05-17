import { Request } from 'express';

import { Harvest, HarvestRequest, HarvestResponse } from '../services/harvests/types';

export default {
  fromRequest: (req: Request): HarvestRequest => ({
    harvestId: req.body.harvestId,
    plantingId: req.body.plantingId,
    quantity: req.body.quantity,
  }),

  toResponse: (harvest: Harvest): HarvestResponse => ({
    harvestId: harvest.harvestId,
    plantingId: harvest.plantingId,
    quantity: harvest.quantity,
  }),
}
