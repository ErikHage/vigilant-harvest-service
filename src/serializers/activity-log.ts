import { Request } from 'express';

import {
  bodyOf,
  optionalString,
  requiredLocalDateTime,
  requiredString,
  requiredYear,
  TEXT_BYTES,
  TIMESTAMP_YEARS
} from '../validation';

import { ActivityLogEntry, ActivityLogEntryRequest, ActivityLogEntryResponse } from '../services/activity-log/types';

const activityLogEntries = {
  upsert: {
    fromRequest: (req: Request): ActivityLogEntryRequest => {
      const body = bodyOf(req);
      return {
        entryId: optionalString(body.entryId, 'entryId', { maxLength: 36, }),
        plantingYear: requiredYear(body.plantingYear, 'plantingYear'),
        // still stored in a TIMESTAMP column, so its years are limited
        entryDate: requiredLocalDateTime(body.entryDate, 'entryDate', { years: TIMESTAMP_YEARS, }),
        activityType: requiredString(body.activityType, 'activityType', { maxLength: 255, }),
        subType: optionalString(body.subType, 'subType', { maxLength: 255, }) ?? null,
        comments: optionalString(body.comments, 'comments', { maxBytes: TEXT_BYTES, }) ?? null,
      };
    },
  },

  getByYear: {
    fromRequest: (req: Request): number => requiredYear(req.params.plantingYear, 'plantingYear'),
  },

  toResponse: (entry: ActivityLogEntry): ActivityLogEntryResponse => ({
    entryId: entry.entryId,
    plantingYear: entry.plantingYear,
    entryDate: entry.entryDate,
    activityType: entry.activityType,
    subType: entry.subType,
    comments: entry.comments,
    dateCreated: entry.dateCreated,
    dateModified: entry.dateModified,
  }),
};

export default {
  activityLogEntries,
}
