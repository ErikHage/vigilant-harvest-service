import { QueryPayload } from '../../database/types';
import { JournalEntry, JournalEntryRequest, JournalEntryRow } from './types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';

async function upsertJournalEntry(journalEntry: JournalEntryRequest): Promise<JournalEntry> {
  const query: QueryPayload = {
    sql: queries.journalEntries.upsert,
    params: rowMapper.journalEntries.upsert.toParams(journalEntry),
  }

  await db.execQuery(query);
  return await getJournalEntryById(journalEntry.entryId!);
}

async function getJournalEntryById(entryId: string): Promise<JournalEntry> {
  const query: QueryPayload = {
    sql: queries.journalEntries.getByEntryId,
    params: [ entryId, ],
  };

  const results: JournalEntryRow[] = await db.execQuery<JournalEntryRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Journal Entry not found', { entryId, })
  }

  return rowMapper.journalEntries.fromRow(results[0]!);
}

async function getJournalEntriesForYear(plantingYear: number): Promise<JournalEntry[]> {
  const query: QueryPayload = {
    sql: queries.journalEntries.getByYear,
    params: [ plantingYear, ],
  };

  const results: JournalEntryRow[] = await db.execQuery<JournalEntryRow[]>(query);

  return results.map(rowMapper.journalEntries.fromRow);
}

export default {
  upsertJournalEntry,
  getJournalEntryById,
  getJournalEntriesForYear,
}
