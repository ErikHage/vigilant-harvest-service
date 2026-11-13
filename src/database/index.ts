import { FieldPacket, PoolConnection, QueryResult } from 'mysql2/promise';

import { CountRow, QueryPayload } from './types';

import mysqlClient from './mysql-connection';
import { ensureError, FeralError } from '../errors';
import { getLogger } from '../logging';

const logger = getLogger('database-index');

// MySQL errors a client caused, by errno, and the status each one answers with
const clientErrors: Map<number, { status: number, reason: string }> = new Map([
  [ 1062, { status: 409, reason: 'duplicate entry', }, ],
  [ 1451, { status: 409, reason: 'row is still referenced', }, ],
  [ 1452, { status: 400, reason: 'referenced row does not exist', }, ],
]);

function toMysqlError(message: string, debugParams: object, err: unknown): MysqlError {
  const errno: unknown = (err as { errno?: unknown } | null)?.errno;
  const clientError = typeof errno === 'number' ? clientErrors.get(errno) : undefined;

  const error = new MysqlError(clientError ? `${message}: ${clientError.reason}` : message, debugParams, ensureError(err));
  if (clientError) {
    error.status = clientError.status;
  }
  return error;
}

async function execQuery<T extends QueryResult>(queryPayload: QueryPayload): Promise<T> {
  const conn: PoolConnection = await mysqlClient.getConnection();

  try {
    const result = await conn.query<T>(queryPayload.sql, queryPayload.params);
    return result[0];
  } catch (err) {
    // logged once, by the error handler, with the driver's message as the cause
    throw toMysqlError('Error performing query', { queryPayload, }, err);
  } finally {
    mysqlClient.closeConnection(conn);
  }
}

// expects a query that selects a single COUNT(*) AS count
async function execCountQuery(queryPayload: QueryPayload): Promise<number> {
  const results = await execQuery<CountRow[]>(queryPayload);
  return Number(results[0]?.count ?? 0);
}

async function execTransactionQuery<T extends QueryResult>(queriesArray: Array<QueryPayload>) {
  const conn = await mysqlClient.getConnection();

  try {
    await conn.beginTransaction();

    const promises: Promise<[T, FieldPacket[]]>[] = [];
    queriesArray.forEach((queryPayload: QueryPayload) => {
      promises.push(conn.query(queryPayload.sql, queryPayload.params));
    });

    const results = await Promise.all(promises);

    await conn.commit();

    return results;
  } catch (err) {
    // a failed rollback must not hide the error that caused it
    await conn.rollback().catch(rollbackErr => logger.error(ensureError(rollbackErr), 'Error rolling back transaction'));
    const sql: string[] = queriesArray.map(q => q.sql);
    throw toMysqlError('Error performing transaction query', { sql, }, err);
  } finally {
    mysqlClient.closeConnection(conn);
  }
}

export class MysqlError extends FeralError {
  constructor(message: string, debugParams?: object, cause?: FeralError) {
    super(message);
    this.name = 'MysqlError';
    this.debugParams = debugParams || {};
    this.cause = cause;
  }
}

export class RowNotFoundError extends FeralError {
  constructor(message: string, debugParams?: object) {
    super(message);
    this.name = 'RowNotFoundError';
    this.status = 404;
    if (debugParams) {
      this.debugParams = debugParams;
    }
  }
}

export default {
  execQuery,
  execCountQuery,
  execTransactionQuery,
}
