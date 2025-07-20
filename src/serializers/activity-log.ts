import { Request } from 'express';

import { ActivityLogEntry, ActivityLogEntryRequest, ActivityLogEntryResponse } from '../services/activity-log/types';

const activityLogEntries = {
  upsert: {
    fromRequest: (req: Request): ActivityLogEntryRequest => ({
      entryId: req.body.entryId,
      plantingYear: req.body.plantingYear,
      entryDate: new Date(req.body.entryDate),
      activityType: req.body.activityType,
      subType: req.body.subType,
      comments: req.body.comments,
    }),
  },

  getByYear: {
    fromRequest: (req: Request): number => parseInt(req.params.plantingYear!),
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
