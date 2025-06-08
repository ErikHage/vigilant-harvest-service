import { JournalEntryRow, JournalEntry, JournalEntryRequest } from './types';

import mysqlUtils from '../../database/mysql-utils';

const journalEntries = {
  upsert: {
    toParams: function(journalEntry: JournalEntryRequest): Array<string | number> {
      return [
        journalEntry.entryId!,
        journalEntry.plantingYear,
        journalEntry.entry,
        mysqlUtils.dateToDbString(journalEntry.entryDate),
      ];
    },
  },

  fromRow: function(row: JournalEntryRow): JournalEntry {
    return {
      entryId: row.entry_id,
      plantingYear: row.planting_year,
      entry: row.entry,
      entryDate: mysqlUtils.dbDateStringToJsDate(row.entry_date),
      dateCreated: mysqlUtils.dbDateStringToJsDate(row.date_created),
      dateModified: mysqlUtils.dbDateStringToJsDate(row.date_modified),
    }
  },
};

export default {
  journalEntries,
}
