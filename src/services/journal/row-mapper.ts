import { JournalEntryRow, JournalEntry, JournalEntryRequest } from './types';

import mysqlUtils from '../../database/mysql-utils';

const journalEntries = {
  upsert: {
    toParams: function(journalEntry: JournalEntryRequest): Array<string | number | null> {
      return [
        journalEntry.entryId!,
        journalEntry.plantingYear,
        journalEntry.entry,
        journalEntry.entryDate,
      ];
    },
  },

  fromRow: function(row: JournalEntryRow): JournalEntry {
    return {
      entryId: row.entry_id,
      plantingYear: row.planting_year,
      entry: row.entry,
      entryDate: mysqlUtils.toApiDateTime(row.entry_date),
      dateCreated: mysqlUtils.toApiAuditTimestamp(row.date_created),
      dateModified: mysqlUtils.toApiAuditTimestamp(row.date_modified),
    }
  },
};

export default {
  journalEntries,
}
