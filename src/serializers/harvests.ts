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
import { StatsType, StatsTypeUtils } from '../types/stats-type';
import { requiredYear } from '../validation';

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
        harvestTypeId: parseHarvestTypeId(harvest.harvestTypeId),
      }
    });
  },

  toResponse: (harvest: Harvest): HarvestResponse => ({
    harvestId: harvest.harvestId,
    plantingId: harvest.plantingId,
    quantity: harvest.quantity,
    harvestDate: harvest.harvestDate,
    harvestTypeId: harvest.harvestTypeId,
    harvestType: harvest.harvestType,
  }),
};

const summary = {
  fromRequest: (req: Request): HarvestSummaryRequest => {
    return {
      plantingYear: requiredYear(req.query.plantingYear, 'plantingYear'),
    };
  },

  toResponse: (harvest: HarvestSummary): HarvestSummaryResponse => ({
    plantingYear: harvest.plantingYear,
    plantingId: harvest.plantingId,
    quantity: harvest.quantity,
    harvestTypeId: harvest.harvestTypeId,
    harvestType: harvest.harvestType,
  }),
};

const search = {
  fromRequest: (req: Request): HarvestSearchRequest => {
    return {
      year: requiredYear(req.query.year, 'year'),
    };
  },

  toResponse: (harvest: Harvest): HarvestResponse => {
    return {
      harvestId: harvest.harvestId,
      plantingId: harvest.plantingId,
      quantity: harvest.quantity,
      harvestDate: harvest.harvestDate,
      harvestTypeId: harvest.harvestTypeId,
      harvestType: harvest.harvestType,
    };
  },
};

const stats = {
  fromRequest: (req: Request): HarvestStatsRequest => {
    return {
      type: parseStatsRequestType(req.query.type as string),
      year: requiredYear(req.query.year, 'year'),
    };
  },

  toResponse: (harvestStats: HarvestStats): HarvestStatsResponse => {
    return {
      firstHarvestDate: harvestStats.firstHarvestDate,
      lastHarvestDate: harvestStats.lastHarvestDate,
      numberOfHarvests: harvestStats.numberOfHarvests,
      numberOfDays: harvestStats.numberOfDays,
      statsType: StatsType.Planting,
      stats: [
        ...harvestStats.stats.values(),
      ],
    };
  },
};

// the id is only checked for shape here; the service confirms it is one that exists
function parseHarvestTypeId(rawHarvestTypeId: unknown): number | undefined {
  if (rawHarvestTypeId == null) {
    return undefined;
  }

  const harvestTypeId = Number(rawHarvestTypeId);

  if (!Number.isInteger(harvestTypeId) || harvestTypeId < 1) {
    throw new BadRequestError(`Invalid harvest type id: ${rawHarvestTypeId}`);
  }

  return harvestTypeId;
}

function parseStatsRequestType(rawType: string): StatsType {
  const parsedType = StatsTypeUtils.parse(rawType);
  if (parsedType) {
    return parsedType;
  }
  throw new BadRequestError(`Invalid stats type: ${rawType}`);
}

export default {
  insert,
  summary,
  search,
  stats,
}
