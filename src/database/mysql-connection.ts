import mysql2, { Connection } from 'mysql2/promise';

import config from './config';

function getConnection(dbConfig = config.getDbConfig()) {
  return mysql2.createConnection(dbConfig);
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
