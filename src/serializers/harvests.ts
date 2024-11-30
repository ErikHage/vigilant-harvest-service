import { Request } from 'express';

import {
  Harvest,
  HarvestRequest,
  HarvestResponse, HarvestSearchRequest, HarvestStats, HarvestStatsRequest, HarvestStatsResponse,
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
    return harvests.map((harvest: any): HarvestRequest => {
      const harvestDate: Date = new Date(harvest.harvestDate);
      harvestDate.setHours(0, 0, 0, 0); // Sets time to 00:00:00

      return {
        harvestId: harvest.harvestId,
        plantingId: harvest.plantingId,
        quantity: Number(harvest.quantity),
        harvestDate,
      }
    });
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
      year: parseInt(req.query.year as string),
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

const stats = {
  fromRequest: (req: Request): HarvestStatsRequest => {
    return {
      year: parseInt(req.query.year as string),
    };
  },

  toResponse: (harvestStats: HarvestStats): HarvestStatsResponse => {
    return {
      numberOfHarvests: harvestStats.numberOfHarvests,
    };
  },
};

export default {
  insert,
  summary,
  search,
  stats,
}
