import dbMigrate from 'db-migrate';

import { getLogger } from '../logging';
import { ensureError } from '../errors';

const logger = getLogger('schema-utils');

// Outside dev, server.ts waits for the database to start before this runs.
const updateSchema = () => {
  const migration = dbMigrate.getInstance(true, { string: `${__dirname}/../database.json`, });
  return migration.up();
};

const performMigration = async () => {
  try {
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
