import { Request } from 'express';

import {
  Harvest,
  HarvestRequest,
  HarvestResponse,
  HarvestSummary,
  HarvestSummaryRequest, HarvestSummaryResponse
} from '../services/harvests/types';
import { BadRequestError } from '../errors/common';

const harvests = {
  fromRequest: (req: Request): HarvestRequest[] => req.body.harvests.map({
    harvestId: req.body.harvestId,
    plantingId: req.body.plantingId,
    quantity: req.body.quantity,
  }),

  toResponse: (harvest: Harvest): HarvestResponse => ({
    harvestId: harvest.harvestId,
    plantingId: harvest.plantingId,
    quantity: harvest.quantity,
  }),
};

const summary = {
  fromRequest: (req: Request): HarvestSummaryRequest => {
    if (!req.query.plantingYear) {
      throw new BadRequestError('Planting Year required');
    }

    return {
      plantingYear: parseInt(req.query.plantingYear as string),
    };
  },

  toResponse: (harvest: HarvestSummary): HarvestSummaryResponse => ({
    plantingYear: harvest.plantingYear,
    plantingId: harvest.plantingId,
    quantity: harvest.quantity,
  }),
};

export default {
  harvests,
  summary,
}
