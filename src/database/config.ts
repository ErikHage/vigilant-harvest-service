let dbConfig: object | undefined;

function getDbConfig() {
  if (dbConfig !== undefined) {
    return dbConfig
  }

  dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_RW_USER,
    password: process.env.MYSQL_RW_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    namedPlaceholders: true,
    dateStrings: true,
    multipleStatements: true,
  }

  return dbConfig;
}

export default {
  getDbConfig,
}
