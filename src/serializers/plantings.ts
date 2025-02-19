import { Request } from 'express';

import { Planting, PlantingRequest, PlantingResponse } from '../services/plantings/types';

export default {
  fromRequest: (req: Request): PlantingRequest => ({
    plantingId: req.body.plantingId,
    plotId: req.body.plotId,
    plantId: req.body.plantId,
    plantingYear: req.body.plantingYear,
    name: req.body.name,
    seedSource: req.body.seedSource,
    lotNumber: req.body.lotNumber,
    leadTimeWeeks: req.body.leadTimeWeeks,
    sowDate: req.body.sowDate ? new Date(req.body.sowDate) : undefined,
    sowType: req.body.sowType,
    numberSown: req.body.numberSown,
    transplantDate: req.body.transplantDate,
    numberTransplanted: req.body.numberTransplanted,
    currentStatus: req.body.currentStatus,
    notes: req.body.notes,
  }),

  toResponse: (planting: Planting): PlantingResponse => ({
    plantingId: planting.plantingId,
    plotId: planting.plotId,
    plantId: planting.plantId,
    plantingYear: planting.plantingYear,
    name: planting.name,
    seedSource: planting.seedSource,
    lotNumber: planting.lotNumber,
    leadTimeWeeks: planting.leadTimeWeeks,
    sowDate: planting.sowDate,
    sowType: planting.sowType,
    numberSown: planting.numberSown,
    transplantDate: planting.transplantDate,
    numberTransplanted: planting.numberTransplanted,
    currentStatus: planting.currentStatus,
    notes: planting.notes,
    dateCreated: planting.dateCreated!,
    dateModified: planting.dateModified!,
  }),
}
