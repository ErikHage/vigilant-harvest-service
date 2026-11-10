import mysql2, { Connection } from 'mysql2/promise';

import config from './config';

/**
 * A connection whose session reads TIMESTAMPs in UTC, so audit times come back
 * as the instants they are. DATE and DATETIME columns don't depend on the
 * session zone.
 */
async function getConnection(dbConfig = config.getDbConfig()): Promise<Connection> {
  const conn = await mysql2.createConnection(dbConfig);

  try {
    await conn.query("SET time_zone = '+00:00'");
  } catch (err) {
    conn.destroy();
    throw err;
  }

  return conn;
}

async function closeConnection(conn: Connection) {
  try {
    await conn.end();
  } finally {
    conn.destroy();
  }
}

export default {
  getConnection,
  closeConnection,
}
