import { Request } from 'express';

import {
  Harvest,
  HarvestRequest,
  HarvestResponse, HarvestSearchRequest,
  HarvestSummary,
  HarvestSummaryRequest,
  HarvestSummaryResponse
} from '../services/harvests/types';
import { BadRequestError } from '../errors/common';

const insert = {
  fromRequest: (req: Request): HarvestRequest[] => {
    const { harvests, } = req.body;

    // this is the mapper, it won't know what type is coming in from the request object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return harvests.map((harvest: any): HarvestRequest => ({
      harvestId: harvest.harvestId,
      plantingId: harvest.plantingId,
      quantity: harvest.quantity,
      harvestDate: new Date(harvest.harvestDate),
    }));
  },

  toResponse: (harvest: Harvest): HarvestResponse => ({
    harvestId: harvest.harvestId,
    plantingId: harvest.plantingId,
    quantity: harvest.quantity,
    harvestDate: harvest.harvestDate,
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

const search = {
  fromRequest: (req: Request): HarvestSearchRequest => {
    return {
      skip: parseInt(req.query.skip as string),
      limit: parseInt(req.query.limit as string),
    };
  },

  toResponse: (harvest: Harvest): HarvestResponse => {
    return {
      harvestId: harvest.harvestId,
      plantingId: harvest.plantingId,
      quantity: harvest.quantity,
      harvestDate: harvest.harvestDate,
    };
  },
};

export default {
  insert,
  summary,
  search,
}
