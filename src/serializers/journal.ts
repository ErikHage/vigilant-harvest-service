import { Request } from 'express';

import { JournalEntry, JournalEntryRequest, JournalEntryResponse } from '../services/journal/types';

const journalEntries = {
  upsert: {
    fromRequest: (req: Request): JournalEntryRequest => ({
      entryId: req.body.entryId,
      plantingYear: req.body.plantingYear,
      entry: req.body.entry,
      entryDate: new Date(req.body.entryDate),
    }),
  },

  getByYear: {
    fromRequest: (req: Request): number => parseInt(req.params.plantingYear!),
  },

  toResponse: (entry: JournalEntry): JournalEntryResponse => ({
    entryId: entry.entryId,
    plantingYear: entry.plantingYear,
    entry: entry.entry,
    entryDate: entry.entryDate,
    dateCreated: entry.dateCreated,
    dateModified: entry.dateModified,
  }),
};

export default {
  journalEntries,
}
