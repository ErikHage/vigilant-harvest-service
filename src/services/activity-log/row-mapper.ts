import { ActivityLogEntry, ActivityLogEntryRequest, ActivityLogEntryRow } from './types';

import mysqlUtils from '../../database/mysql-utils';

const activityLogEntries = {
  upsert: {
    toParams: function(activityLogEntry: ActivityLogEntryRequest): Array<string | number> {
      return [
        activityLogEntry.entryId!,
        activityLogEntry.plantingYear,
        mysqlUtils.dateToDbString(activityLogEntry.entryDate),
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
      entryDate: mysqlUtils.dbDateStringToJsDate(row.entry_date),
      activityType: row.activity_type,
      subType: row.sub_type,
      comments: row.comments,
      dateCreated: mysqlUtils.dbDateStringToJsDate(row.date_created),
      dateModified: mysqlUtils.dbDateStringToJsDate(row.date_modified),
    }
  },
};

export default {
  activityLogEntries,
}
