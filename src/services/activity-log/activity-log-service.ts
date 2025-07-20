import { v4 as uuidV4 } from 'uuid';

import { ActivityLogEntry, ActivityLogEntryRequest } from './types';

import datasource from './activity-log-mysql-datasource';
import { ensureError, FeralError } from '../../errors';

async function upsertActivityLogEntry(activityLogEntryRequest: ActivityLogEntryRequest): Promise<ActivityLogEntry> {
  try {
    const activityLogEntry: ActivityLogEntryRequest = {
      entryId: activityLogEntryRequest.entryId || uuidV4(),
      plantingYear: activityLogEntryRequest.plantingYear,
      entryDate: activityLogEntryRequest.entryDate,
      activityType: activityLogEntryRequest.activityType,
      subType: activityLogEntryRequest.subType,
      comments: activityLogEntryRequest.comments,
    };

    return await datasource.upsertActivityLogEntry(activityLogEntry);
  } catch (err) {
    throw new FeralError('Error upserting activity log entry', ensureError(err))
      .withDebugParams({ activityLogEntryRequest, });
  }
}

async function getActivityLogEntriesForYear(plantingYear: number): Promise<ActivityLogEntry[]> {
  try {
    return await datasource.getActivityLogEntriesForYear(plantingYear);
  } catch (err) {
    throw new FeralError('Error fetching activity log entries for year', ensureError(err))
      .withDebugParams({ plantingYear, });
  }
}

export default {
  upsertActivityLogEntry,
  getActivityLogEntriesForYear,
}
