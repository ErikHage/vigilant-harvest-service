/* eslint-disable no-console, no-await-in-loop */
import dbMigrate from 'db-migrate';

import mysql from '../database/mysql-connection';
import utils from './utilities';
import { getLogger } from '../logging';
import { ensureError } from '../errors';

const logger = getLogger('schema-utils');

const CONNECTION_POLL_DELAY = 5000; // 5 sec
const CONNECTION_POLL_DELAY_MAX = 300000; // 5 min

const waitForConnection = async () => {
  await utils.sleep(1000);

  const conn = await mysql.getConnection();

  let currentDelay = 0;
  /* eslint-disable-next-line */
  while (conn.connecting && currentDelay < CONNECTION_POLL_DELAY_MAX) {
    logger.info({}, 'Waiting for db connection... connection state: [%s]', conn.connected);
    logger.info({}, 'current delay: [%d]', currentDelay);
    await utils.sleep(CONNECTION_POLL_DELAY);
    currentDelay += CONNECTION_POLL_DELAY;
  }

  conn.destroy();

  return currentDelay < CONNECTION_POLL_DELAY_MAX;
};

const updateSchema = () => {
  /* eslint-disable-next-line */
  console.log(__dirname);
  const migration = dbMigrate.getInstance(true, { string: `${__dirname}/../database.json`, });
  return migration.up();
};

const performMigration = async () => {
  try {
    await waitForConnection();
    await updateSchema();
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error during db-migrate up');
    throw err;
  }
};

module.exports = {
  performMigration,
};
