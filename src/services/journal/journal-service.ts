import { v4 as uuidV4 } from 'uuid';

import { JournalEntry, JournalEntryRequest } from './types';

import datasource from './journal-mysql-datasource';
import { ensureError, FeralError } from '../../errors';

async function upsertJournalEntry(journalEntryRequest: JournalEntryRequest): Promise<JournalEntry> {
  try {
    const journalEntry: JournalEntryRequest = {
      entryId: journalEntryRequest.entryId || uuidV4(),
      plantingYear: journalEntryRequest.plantingYear,
      entry: journalEntryRequest.entry,
      entryDate: journalEntryRequest.entryDate,
    };

    return await datasource.upsertJournalEntry(journalEntry);
  } catch (err) {
    throw new FeralError('Error upserting journal entry', ensureError(err))
      .withDebugParams({ journalEntryRequest, });
  }
}

async function getJournalEntriesForYear(plantingYear: number): Promise<JournalEntry[]> {
  try {
    return await datasource.getJournalEntriesForYear(plantingYear);
  } catch (err) {
    throw new FeralError('Error fetching journal entries for year', ensureError(err))
      .withDebugParams({ plantingYear, });
  }
}

export default {
  upsertJournalEntry,
  getJournalEntriesForYear,
}
