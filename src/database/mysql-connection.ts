import mysql2, { Pool, PoolConnection } from 'mysql2/promise';

import config from './config';
import { getLogger } from '../logging';
import { ensureError } from '../errors';

const logger = getLogger('mysql-connection');

let pool: Pool | undefined;

/**
 * One pool for the process, made on first use, so each query borrows a
 * connection rather than opening its own. mysql2's defaults hold: at most 10
 * connections, and a request waits for one rather than failing.
 *
 * Each connection's session reads TIMESTAMPs in UTC, so audit times come back
 * as the instants they are. It's set once, when the pool opens the connection:
 * that query is queued ahead of any other on it. DATE and DATETIME columns don't
 * depend on the session zone.
 */
function getPool(): Pool {
  if (pool === undefined) {
    pool = mysql2.createPool(config.getDbConfig());
    pool.pool.on('connection', connection => {
      connection.query("SET time_zone = '+00:00'", (err: Error | null) => {
        if (err) {
          // a connection in the server's own zone would answer audit times wrongly
          logger.error(ensureError(err), 'Error setting the session time zone; dropping the connection');
          connection.destroy();
        }
      });
    });
  }
  return pool;
}

async function getConnection(): Promise<PoolConnection> {
  return await getPool().getConnection();
}

/** Hands the connection back to the pool. */
function closeConnection(conn: PoolConnection): void {
  conn.release();
}

/** For shutdown: closes every connection the pool holds, once the ones in use are back. */
async function endPool(): Promise<void> {
  if (pool !== undefined) {
    const ending = pool;
    pool = undefined;
    await ending.end();
  }
}

export default {
  getConnection,
  closeConnection,
  endPool,
}
