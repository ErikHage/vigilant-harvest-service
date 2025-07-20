import { QueryPayload } from '../../database/types';
import { ActivityLogEntry, ActivityLogEntryRequest, ActivityLogEntryRow } from './types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';

async function upsertActivityLogEntry(logEntry: ActivityLogEntryRequest): Promise<ActivityLogEntry> {
  const query: QueryPayload = {
    sql: queries.activityLogEntries.upsert,
    params: rowMapper.activityLogEntries.upsert.toParams(logEntry),
  }

  await db.execQuery(query);
  return await getActivityLogEntryById(logEntry.entryId!);
}

async function getActivityLogEntryById(entryId: string): Promise<ActivityLogEntry> {
  const query: QueryPayload = {
    sql: queries.activityLogEntries.getByEntryId,
    params: [ entryId, ],
  };

  const results: ActivityLogEntryRow[] = await db.execQuery<ActivityLogEntryRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Activity Log Entry not found', { entryId, })
  }

  return rowMapper.activityLogEntries.fromRow(results[0]!);
}

async function getActivityLogEntriesForYear(plantingYear: number): Promise<ActivityLogEntry[]> {
  const query: QueryPayload = {
    sql: queries.activityLogEntries.getByYear,
    params: [ plantingYear, ],
  };

  const results: ActivityLogEntryRow[] = await db.execQuery<ActivityLogEntryRow[]>(query);

  return results.map(rowMapper.activityLogEntries.fromRow);
}

export default {
  upsertActivityLogEntry,
  getActivityLogEntryById,
  getActivityLogEntriesForYear,
}
