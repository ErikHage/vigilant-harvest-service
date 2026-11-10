import { Request } from 'express';

import { bodyOf, optionalString, requiredLocalDateTime, requiredYear, TEXT_BYTES } from '../validation';

import { JournalEntry, JournalEntryRequest, JournalEntryResponse } from '../services/journal/types';

const journalEntries = {
  upsert: {
    fromRequest: (req: Request): JournalEntryRequest => {
      const body = bodyOf(req);
      return {
        entryId: optionalString(body.entryId, 'entryId', { maxLength: 36, }),
        plantingYear: requiredYear(body.plantingYear, 'plantingYear'),
        entry: optionalString(body.entry, 'entry', { maxBytes: TEXT_BYTES, }) ?? null,
        entryDate: requiredLocalDateTime(body.entryDate, 'entryDate'),
      };
    },
  },

  getByYear: {
    fromRequest: (req: Request): number => requiredYear(req.params.plantingYear, 'plantingYear'),
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
