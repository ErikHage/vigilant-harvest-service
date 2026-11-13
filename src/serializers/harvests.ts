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
import {
  bodyOf,
  optionalInteger,
  optionalString,
  requiredList,
  requiredNumber,
  requiredObject,
  requiredLocalDate,
  requiredString,
  requiredYear
} from '../validation';

/** The most a DECIMAL(8,2) column holds. */
const QUANTITY_MAX = 999999.99;

const insert = {
  fromRequest: (req: Request): HarvestRequest[] =>
    requiredList(bodyOf(req).harvests, 'harvests').map((entry, index): HarvestRequest => {
      const field = `harvests[${index}]`;
      const harvest = requiredObject(entry, field);

      return {
        harvestId: optionalString(harvest.harvestId, `${field}.harvestId`, { maxLength: 36, }),
        // only checked for shape here; the service confirms the planting and the type exist
        plantingId: requiredString(harvest.plantingId, `${field}.plantingId`, { maxLength: 36, }),
        // the column is a DECIMAL(8,2): a third decimal place is rounded when it's stored, as MySQL
        // rounds it, and the most it holds is 999999.99
        quantity: requiredNumber(harvest.quantity, `${field}.quantity`, { greaterThan: 0, max: QUANTITY_MAX, }),
        // a harvest is filed by day
        harvestDate: requiredLocalDate(harvest.harvestDate, `${field}.harvestDate`),
        harvestTypeId: optionalInteger(harvest.harvestTypeId, `${field}.harvestTypeId`, { min: 1, }),
      };
    }),

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
      statsType: harvestStats.statsType,
      stats: [
        ...harvestStats.stats.values(),
      ],
    };
  },
};

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
