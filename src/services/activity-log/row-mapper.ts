import { ActivityLogEntry, ActivityLogEntryRequest, ActivityLogEntryRow } from './types';

import mysqlUtils from '../../database/mysql-utils';

const activityLogEntries = {
  upsert: {
    toParams: function(activityLogEntry: ActivityLogEntryRequest): Array<string | number | null> {
      return [
        activityLogEntry.entryId!,
        activityLogEntry.plantingYear,
        activityLogEntry.entryDate,
        activityLogEntry.activityType,
        activityLogEntry.subType,
        activityLogEntry.comments,
      ];
    },
  },

  fromRow: function(row: ActivityLogEntryRow): ActivityLogEntry {
    return {
      entryId: row.entry_id,
      plantingYear: row.planting_year,
      entryDate: mysqlUtils.toApiDateTime(row.entry_date),
      activityType: row.activity_type,
      subType: row.sub_type,
      comments: row.comments,
      dateCreated: mysqlUtils.toApiAuditTimestamp(row.date_created),
      dateModified: mysqlUtils.toApiAuditTimestamp(row.date_modified),
    }
  },
};

export default {
  activityLogEntries,
}
