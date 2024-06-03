import { Connection, FieldPacket, QueryResult } from 'mysql2/promise';

import { QueryPayload } from './types';

import mysqlClient from './mysql-connection';
import { ensureError, FeralError } from '../errors';
import { getLogger } from '../logging';

const logger = getLogger('database-index');

async function execQuery<T extends QueryResult>(queryPayload: QueryPayload): Promise<T> {
  const conn: Connection = await mysqlClient.getConnection();

  try {
    const result = await conn.query<T>(queryPayload.sql, queryPayload.params);
    return result[0];
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error performing query');
    throw new MysqlError('Error performing query', { queryPayload, }, ensureError(err));
  } finally {
    await mysqlClient.closeConnection(conn);
  }
}

async function execTransactionQuery<T extends QueryResult>(queriesArray: Array<QueryPayload>) {
  const conn = await mysqlClient.getConnection();
  await conn.beginTransaction();

  try {
    const promises: Promise<[T, FieldPacket[]]>[] = [];
    queriesArray.forEach((queryPayload: QueryPayload) => {
      promises.push(conn.query(queryPayload.sql, queryPayload.params));
    });

    const results = await Promise.all(promises);

    await conn.commit();

    return results;
  } catch (err) {
    await conn.rollback();
    const sql: string[] = queriesArray.map(q => q.sql);
    const error = ensureError(err);
    logger.error(error, 'Error performing queries');
    throw new MysqlError('Error performing transaction query', { sql, }, ensureError(err));
  } finally {
    await mysqlClient.closeConnection(conn);
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
    if (debugParams) {
      this.debugParams = debugParams;
    }
  }
}

export default {
  execQuery,
  execTransactionQuery,
}
